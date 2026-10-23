#!/usr/bin/env python3
"""Check the actual Astro build, using only Python's standard library.

Run after `npm run build`. --table prints the per-page review table.
No requests, writes, submissions, or paid services are used.
"""

import argparse
from collections import Counter, deque
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
SITE = "https://reefmetric.com"
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}
SKIP = {"script", "style", "svg", "template"}


class Node:
    def __init__(self, tag="", attrs=(), parent=None):
        self.tag, self.attrs, self.parent = tag, dict(attrs), parent
        self.children = []

    def text(self, useful=False):
        if self.tag in SKIP or "hidden" in self.attrs or self.attrs.get("aria-hidden") == "true":
            return ""
        if re.search(r"display\s*:\s*none", self.attrs.get("style", "")):
            return ""
        if useful and (self.tag in {"form", "select", "button", "textarea", "nav"} or "data-page-meta" in self.attrs or "capture" in self.attrs.get("class", "").split()):
            return ""
        return " ".join(c.text(useful) if isinstance(c, Node) else c for c in self.children)

    def raw(self):
        return "".join(c.raw() if isinstance(c, Node) else c for c in self.children)

    def find(self, tag=None):
        for child in self.children:
            if isinstance(child, Node):
                if tag is None or child.tag == tag:
                    yield child
                yield from child.find(tag)


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.current = self.root
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs, self.current)
        self.current.children.append(node)
        if tag not in VOID:
            self.current = node

    def handle_startendtag(self, tag, attrs):
        self.current.children.append(Node(tag, attrs, self.current))

    def handle_endtag(self, tag):
        node = self.current
        while node.parent is not None:
            if node.tag == tag:
                self.current = node.parent
                return
            node = node.parent

    def handle_data(self, data):
        self.current.children.append(data)


def normal(text):
    return " ".join(text.split())


def canonical_for(path):
    return SITE if path == "/" else SITE + path


def walk_json(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk_json(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_json(child)


def route(file):
    relative = file.relative_to(DIST).as_posix()
    if relative == "index.html":
        return "/"
    # The email API deliberately emits an .html URL rather than an Astro page.
    if relative == "cheat-sheet-email.html":
        return "/" + relative
    return "/" + relative.removesuffix(".html")


def audit():
    if not DIST.is_dir():
        raise ValueError("dist/ is missing; run npm run build first")
    pages, errors = {}, []
    for file in sorted(DIST.rglob("*.html")):
        tree = Document(file.read_text()).root
        nodes = list(tree.find())
        meta = {n.attrs.get("name", n.attrs.get("property")): n.attrs.get("content", "") for n in nodes if n.tag == "meta"}
        main = next(tree.find("main"), next(tree.find("body"), tree))
        path = route(file)
        canonical = [n.attrs.get("href", "") for n in nodes if n.tag == "link" and n.attrs.get("rel") == "canonical"]
        schema = []
        for n in tree.find("script"):
            if n.attrs.get("type") == "application/ld+json":
                try:
                    schema.extend(walk_json(json.loads(n.raw())))
                except json.JSONDecodeError as exc:
                    errors.append((path, "invalid JSON-LD: " + str(exc)))
        pages[path] = {"tree": tree, "nodes": nodes, "meta": meta, "main": main, "canonical": canonical,
                       "title": normal(next(tree.find("title"), Node()).text()), "schema": schema,
                       "indexable": "noindex" not in meta.get("robots", "").lower() and path != "/404",
                       "words": len(re.findall(r"\b[\w’'-]+\b", main.text(useful=True)))}
    if not pages:
        raise ValueError("No built HTML pages found")

    def fail(path, message):
        errors.append((path, message))

    def internal(href, source):
        parsed = urlsplit(urljoin(SITE + source, href))
        return parsed if parsed.netloc == urlsplit(SITE).netloc and parsed.scheme in {"https", "http"} else None

    links = {path: set() for path in pages}
    for path, page in pages.items():
        for a in page["tree"].find("a"):
            href = a.attrs.get("href", "")
            dest = internal(href, path)
            if not href or dest is None:
                continue
            target = unquote(dest.path) or "/"
            if target in pages:
                links[path].add(target)
                if dest.fragment and unquote(dest.fragment) not in {n.attrs.get("id") for n in pages[target]["nodes"]}:
                    fail(path, "missing link fragment: " + href)
            elif not (DIST / target.lstrip("/")).is_file():
                fail(path, "broken internal link: " + href)
            if target != "/" and target.endswith("/"):
                fail(path, "trailing slash in internal page link: " + href)

    depths, queue = {}, deque([("/", 0)])
    while queue:
        path, depth = queue.popleft()
        if path in depths:
            continue
        depths[path] = depth
        queue.extend((p, depth + 1) for p in links.get(path, ()))

    sitemap_urls = []
    try:
        index = DIST / "sitemap-index.xml"
        alias = DIST / "sitemap.xml"
        if alias.read_bytes() != index.read_bytes():
            fail("/sitemap.xml", "alias differs from generated sitemap index")
        for loc in ET.parse(index).findall(".//{*}loc"):
            parsed = urlsplit(loc.text)
            if parsed.scheme != "https" or parsed.netloc != "reefmetric.com":
                fail("/sitemap-index.xml", "invalid child sitemap URL: " + loc.text)
            child = DIST / parsed.path.lstrip("/")
            sitemap_urls.extend(loc.text for loc in ET.parse(child).findall(".//{*}loc"))
    except (OSError, ET.ParseError) as exc:
        fail("/sitemap.xml", str(exc))
        # Keep auditing all pages when the alias is missing on a baseline build.
        for child in sorted(DIST.glob("sitemap-[0-9]*.xml")):
            sitemap_urls.extend(loc.text for loc in ET.parse(child).findall(".//{*}loc"))

    expected = {canonical_for(path) for path, p in pages.items() if p["indexable"]}
    for missing in sorted(expected - set(sitemap_urls)):
        fail("/sitemap-0.xml", "missing canonical URL: " + missing)
    for extra in sorted(set(sitemap_urls) - expected):
        fail("/sitemap-0.xml", "noncanonical, excluded, or nonexistent URL: " + extra)
    if len(sitemap_urls) != len(set(sitemap_urls)):
        fail("/sitemap-0.xml", "duplicate URLs")

    titles = Counter(p["title"] for p in pages.values() if p["indexable"])
    descriptions = Counter(p["meta"].get("description") for p in pages.values() if p["indexable"])
    for path, page in pages.items():
        tree, meta, schema, main = page["tree"], page["meta"], page["schema"], page["main"]
        if path == "/404" and "noindex" not in meta.get("robots", ""):
            fail(path, "404 is missing noindex")
        if path.startswith("/cheat-sheet") or path.startswith("/go/"):
            if "noindex" not in meta.get("robots", ""):
                fail(path, "utility/redirect is missing noindex")
        if not page["indexable"]:
            continue
        if not page["title"] or len(page["title"]) >= 60:
            fail(path, "title length: " + str(len(page["title"])))
        if titles[page["title"]] > 1:
            fail(path, "duplicate title")
        description = meta.get("description", "")
        if not description or len(description) >= 155:
            fail(path, "description length: " + str(len(description)))
        if descriptions[description] > 1:
            fail(path, "duplicate description")
        h1s = list(main.find("h1"))
        if len(h1s) != 1:
            fail(path, "expected one H1, got " + str(len(h1s)))
        if page["canonical"] != [canonical_for(path)] or canonical_for(path) not in sitemap_urls:
            fail(path, "canonical must match sitemap exactly: " + str(page["canonical"]))
        if depths.get(path, 99) > 3:
            fail(path, "orphan or more than three clicks from home")
        if page["words"] < 300:
            fail(path, "fewer than 300 useful main-content words: " + str(page["words"]))
        for key, value in {"og:title": page["title"], "twitter:title": page["title"], "og:description": description,
                           "twitter:description": description, "og:url": canonical_for(path), "twitter:card": "summary_large_image"}.items():
            if meta.get(key) != value:
                fail(path, "missing or inconsistent " + key)
        for key in ("og:site_name", "og:type", "og:image", "og:image:width", "og:image:height", "og:image:alt", "twitter:image", "twitter:image:alt"):
            if not meta.get(key):
                fail(path, "missing " + key)
        for key in ("og:image", "twitter:image"):
            if not meta.get(key, "").startswith("https://"):
                fail(path, key + " must be absolute HTTPS")
        for img in tree.find("img"):
            if "alt" not in img.attrs:
                fail(path, "image without alt")
            if not all(re.fullmatch(r"[1-9]\d*", img.attrs.get(k, "")) for k in ("width", "height")):
                fail(path, "image without width/height")
        if path != "/" and not any(s.get("@type") == "BreadcrumbList" for s in schema):
            fail(path, "missing BreadcrumbList")
        if path.startswith(("/guides/", "/reviews/", "/compare/")) and not any(s.get("@type") == "Article" for s in schema):
            fail(path, "missing Article")
        if path.startswith("/tools/") and not any(s.get("@type") == "WebApplication" for s in schema):
            fail(path, "missing WebApplication")
        visible = normal(main.text())
        if re.search(r"\b[0-5](?:\.\d+)?\s*(?:/\s*5\b|[★⭐])", visible):
            fail(path, "numerical star/rating claim needs real review evidence")
        for obj in schema:
            if "aggregateRating" in obj or "reviewRating" in obj:
                fail(path, "rating requires real source evidence; none is recorded for this audit")
            for key in ("dateModified", "datePublished"):
                if key in obj and not re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)", obj[key]):
                    fail(path, key + " must be a full DateTime with timezone")
            if obj.get("@type") == "Article":
                if len(h1s) != 1 or obj.get("headline") != normal(h1s[0].text()):
                    fail(path, "Article headline differs from visible H1")
                if obj.get("dateModified") not in {n.attrs.get("datetime") for n in main.find("time")}:
                    fail(path, "Article dateModified differs from visible time")
            if obj.get("@type") == "Question":
                for text in (obj.get("name", ""), obj.get("acceptedAnswer", {}).get("text", "")):
                    if not text or normal(Document(text).root.text()) not in visible:
                        fail(path, "FAQ text differs from visible content: " + text[:60])
        if path == "/" or path.startswith(("/tools", "/reviews", "/guides", "/compare")):
            prose_links = []
            for block in main.find():
                if block.tag in {"p", "li"}:
                    prose_links.extend(a.attrs.get("href", "") for a in block.find("a"))
            if not any((dest := internal(h, path)) and dest.path.startswith(("/reviews/", "/compare/", "/tools/")) and dest.path != path for h in prose_links):
                fail(path, "missing contextual link to a money page")
    return pages, depths, sitemap_urls, errors


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--table", action="store_true")
    args = parser.parse_args()
    try:
        pages, depths, urls, errors = audit()
    except (ValueError, OSError, ET.ParseError) as exc:
        raise SystemExit(str(exc))
    if args.table:
        print("| Page | Title chars | Description chars | Useful words | Clicks | Indexable |")
        print("|---|---:|---:|---:|---:|---|")
        for path, page in pages.items():
            print(f'| `{path}` | {len(page["title"])} | {len(page["meta"].get("description", ""))} | {page["words"]} | {depths.get(path, "—")} | {"yes" if page["indexable"] else "no"} |')
    for path, message in sorted(set(errors)):
        print(f"FAIL {path}: {message}")
    print(f'{len(pages)} HTML documents; {sum(p["indexable"] for p in pages.values())} indexable; {len(urls)} sitemap URLs; {len(set(errors))} failures.')
    raise SystemExit(1 if errors else 0)
