#!/usr/bin/env python3
"""Read-only, curl-based site/link audit. No credentials or paid APIs.

Visits every sitemap URL and linked internal document (including query variants),
checks fragments, resolves ReefMetric's /go links from the live script constants,
then fetches every distinct outbound href. --data-sources also checks product
source/price URLs from the checked-out JSON datasets; these are labelled separately.
HTTP failures from bot-protected retailers are unresolved, not proof of dead URLs.
"""
import argparse
import concurrent.futures
import datetime
import html
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import tempfile
import urllib.parse as U
import xml.etree.ElementTree as ET


class Document(HTMLParser):
    def __init__(self, body):
        super().__init__(convert_charrefs=True)
        self.links, self.ids, self.texts, self.headings, self.images = [], set(), [], [], []
        self.title, self.h1, self.meta, self.canonical = '', [], {}, ''
        self.skip, self.in_title, self.in_h1, self.in_head = 0, False, False, False
        self.feed(body)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'): self.ids.add(a['id'])
        if tag == 'a' and a.get('href'): self.links.append({'href': a['href'], 'rel': a.get('rel', '')})
        if tag == 'head': self.in_head = True
        # SVG icons also contain <title>; they are not the document's title.
        if tag == 'title' and self.in_head: self.in_title = True
        if tag == 'h1': self.in_h1 = True
        if tag in ('script', 'style'): self.skip += 1
        if tag == 'meta': self.meta[a.get('name', a.get('property', ''))] = a.get('content', '')
        if tag == 'link' and a.get('rel') == 'canonical': self.canonical = a.get('href', '')
        if tag == 'img': self.images.append(a)

    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
        if tag == 'head': self.in_head = False
        if tag == 'h1': self.in_h1 = False
        if tag in ('script', 'style'): self.skip = max(0, self.skip - 1)

    def handle_data(self, data):
        t = ' '.join(data.split())
        if self.in_title: self.title += t
        if self.in_h1 and t: self.h1.append(t)
        if not self.skip and t: self.texts.append(t)


def fetch(url):
    # Curl's redirect result, not a HEAD response. Temp files are managed by Python.
    with tempfile.TemporaryFile() as body, tempfile.TemporaryFile() as headers:
        cmd = ['curl', '--location', '--silent', '--show-error', '--compressed',
               '--connect-timeout', '10', '--max-time', '35', '--max-redirs', '8',
               '--user-agent', 'Mozilla/5.0 (compatible; ReefMetricLinkAudit/1.0)',
               '--dump-header', '/dev/fd/' + str(headers.fileno()),
               '--output', '/dev/fd/' + str(body.fileno()),
               '--write-out', '%{http_code}\n%{url_effective}\n%{content_type}\n%{size_download}', url]
        run = subprocess.run(cmd, capture_output=True, text=True,
                             pass_fds=(body.fileno(), headers.fileno()))
        body.seek(0)
        raw = body.read().decode('utf-8', errors='replace')
        fields = run.stdout.splitlines()
        fields += [''] * (4 - len(fields))
        d = Document(raw) if 'html' in fields[2] or '<html' in raw[:1000].lower() else None
        status = int(fields[0] or 0)
        title = d.title if d else ''
        blocked = status in (401, 403, 429) or bool(re.search(r'just a moment|access denied|robot check|attention required|pardon our interruption|verifying your connection', title, re.I))
        unverified_html = bool(d and 200 <= status < 300 and not title.strip())
        if d and 200 <= status < 300 and U.urlsplit(url).hostname == 'www.amazon.com' and '/dp/' in url and title.strip() == 'Amazon.com':
            unverified_html = True
        result = {'url': url, 'status': status, 'final_url': fields[1], 'content_type': fields[2],
                  'checked_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                  'body_sha256': hashlib.sha256(raw.encode()).hexdigest(),
                  'download_bytes': int(float(fields[3] or 0)), 'title': title,
                  'classification': 'blocked/unresolved' if blocked or unverified_html else 'http-error' if status >= 400 else 'fetch-error' if run.returncode else 'ok',
                  'curl_exit': run.returncode, 'error': run.stderr.strip()}
        if unverified_html:
            result['validation_note'] = 'HTTP success but document title was missing or generic; product identity could not be verified.'
        return result, raw, d


def go_destination(raw, url):
    constants = re.search(r'const searchTemplate = (.*?);const fallback = (.*?);const allowedDomain = (.*?);', raw)
    if not constants:
        constants = re.search(r'var searchTemplate = (.*?);var fallback = (.*?);var allowedDomain = (.*?);', raw)
    if not constants:
        values = []
        for name in ['searchTemplate', 'fallback', 'allowedDomain']:
            m = re.search(r'(?:const|var|let)\s+' + name + r'\s*=\s*("(?:[^"\\]|\\.)*")', raw)
            if not m: return None
            values.append(json.loads(m[1]))
    else:
        values = [json.loads(v) for v in constants.groups()]
    template, fallback, domain = values
    q = U.parse_qs(U.urlsplit(url).query)
    direct = q.get('u', [''])[0]
    target = U.urlsplit(direct)
    if direct and target.scheme == 'https' and (target.hostname == domain or (target.hostname or '').endswith('.' + domain)):
        return direct
    query = q.get('q', [''])[0]
    return template.replace('__Q__', U.quote(query, safe="~()*!.'-")) if query else fallback


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--origin', default='https://reefmetric.com')
    ap.add_argument('--output', default='evidence/live-links')
    ap.add_argument('--data-sources', action='store_true')
    ap.add_argument('--capture-outbound-text', action='store_true', help='Private factual review only; do not publish copied retailer bodies')
    ap.add_argument('--workers', type=int, default=6)
    args = ap.parse_args()
    origin = args.origin.rstrip('/')
    origin_host = U.urlsplit(origin).netloc
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    pending, fetched, parents, external, fragments, pages = {origin + '/'}, {}, {}, {}, [], []
    if args.data_sources:
        run = subprocess.run(['node', 'scripts/audit-affiliate-links.mjs'], capture_output=True, text=True, check=True)
        for row in json.loads(run.stdout):
            target = U.urljoin(origin + '/', row['href'])
            pending.add(target)
            parents.setdefault(target, set()).add(row['parent'])
    sitemap_result, sitemap_raw, _ = fetch(origin + '/sitemap.xml')
    sitemap_results = [sitemap_result]
    try:
        tree = ET.fromstring(sitemap_raw)
        locs = [x.text for x in tree.iter() if x.tag.endswith('loc')]
        for loc in locs:
            loc = loc.replace('https://reefmetric.com', origin, 1)
            if loc.endswith('.xml'):
                r, raw, _ = fetch(loc)
                sitemap_results.append(r)
                child = ET.fromstring(raw)
                pending.update(x.text.replace('https://reefmetric.com', origin, 1) for x in child.iter() if x.tag.endswith('loc'))
            else: pending.add(loc)
    except ET.ParseError:
        pass
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        while pending:
            batch = sorted(pending - fetched.keys())
            pending.clear()
            for url, (r, raw, d) in zip(batch, pool.map(fetch, batch)):
                fetched[url] = (r, d)
                if not d: continue
                if '/go/' in U.urlsplit(url).path:
                    dest = go_destination(raw, url)
                    if dest:
                        external.setdefault(dest, set()).add(url)
                        r['affiliate_destination'] = dest
                    else: r['redirect_resolution_error'] = True
                pages.append({'url': url, 'title': d.title, 'h1': d.h1, 'meta': d.meta,
                              'canonical': d.canonical, 'word_count': len(' '.join(d.texts).split()),
                              'has_paid_disclosure': any('Paid links:' in s for s in d.texts),
                              'has_email_capture': 'email' in ' '.join(d.texts).lower(),
                              'images': d.images, 'text': '\n'.join(d.texts)})
                for link in d.links:
                    absolute = U.urljoin(url, link['href'])
                    p = U.urlsplit(absolute)
                    if p.scheme not in ('http', 'https'): continue
                    if p.netloc in (origin_host, 'reefmetric.com', 'www.reefmetric.com'):
                        normalized = U.urlunsplit((U.urlsplit(origin).scheme, origin_host, p.path or '/', p.query, ''))
                        parents.setdefault(normalized, set()).add(url)
                        if p.fragment: fragments.append({'parent': url, 'target': normalized, 'fragment': U.unquote(p.fragment)})
                        if normalized not in fetched: pending.add(normalized)
                    else:
                        target = U.urlunsplit((p.scheme, p.netloc, p.path, p.query, ''))
                        external.setdefault(target, set()).add(url)
            print(f'Internal fetched: {len(fetched)}, pending: {len(pending)}, outbound found: {len(external)}', flush=True)
        if args.data_sources:
            def visit(value, location):
                if isinstance(value, dict):
                    for key, v in value.items():
                        if isinstance(v, str) and v.startswith(('https://', 'http://')) and key != 'imageUrl':
                            external.setdefault(v, set()).add(location + ':' + key)
                        else: visit(v, location + ':' + key)
                elif isinstance(value, list):
                    for i, v in enumerate(value): visit(v, location + ':' + str(i))
            for f in sorted(Path('src/data').glob('*.json')): visit(json.loads(f.read_text()), str(f))
        outbound = []
        for index, (url, (r, raw, d)) in enumerate(zip(sorted(external), pool.map(fetch, sorted(external)))):
            r['parents'] = sorted(external[url])
            # A factual review can inspect the exact returned text without assuming
            # that a successful status proves product identity or current price.
            if d and args.capture_outbound_text: r['visible_text'] = '\n'.join(d.texts)[:120000]
            outbound.append(r)
            if (index + 1) % 25 == 0: print(f'Outbound fetched: {index + 1}/{len(external)}', flush=True)
    internal = [dict(r, parents=sorted(parents.get(url, []))) for url, (r, _) in sorted(fetched.items())]
    fragment_results = []
    for f in fragments:
        d = fetched.get(f['target'], (None, None))[1]
        f['valid'] = bool(d and f['fragment'] in d.ids)
        fragment_results.append(f)
    result = {'checked_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'origin': origin, 'method': 'curl GET with redirects; HTML title/body parsing; /go script constants resolved; no login',
              'sitemaps': sitemap_results, 'internal': internal, 'fragments': fragment_results, 'outbound': outbound}
    output.with_suffix('.json').write_text(json.dumps(result, indent=2))
    output.with_name(output.name + '-pages.json').write_text(json.dumps(pages, indent=2))
    counts = {'internal_urls': len(internal), 'internal_bad': sum(r['classification'] != 'ok' for r in internal),
              'fragment_links': len(fragment_results), 'fragment_bad': sum(not f['valid'] for f in fragment_results),
              'outbound_urls': len(outbound), 'outbound_ok': sum(r['classification'] == 'ok' for r in outbound),
              'outbound_unresolved': sum(r['classification'] == 'blocked/unresolved' for r in outbound),
              'outbound_http_errors': sum(r['classification'] == 'http-error' for r in outbound),
              'outbound_fetch_errors': sum(r['classification'] == 'fetch-error' for r in outbound)}
    output.with_name(output.name + '-summary.json').write_text(json.dumps(counts, indent=2))
    print(json.dumps(counts, indent=2))


if __name__ == '__main__': main()
