// The email version of the Reef Gear Cheat Sheet, emitted at build time as a complete,
// email-safe HTML document (tables + inline styles, absolute URLs, no external CSS).
// The factory API's /v1/subscribe/reefmetric endpoint fetches this file from the live
// site and sends it verbatim via Resend — so the email always matches the site's own
// current picks with zero server-side content to maintain.
import type { APIRoute } from 'astro';
import { SITE } from '../consts';
import { buildCheatSheet, money } from '../utils/cheat-sheet';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const abs = (path: string) => new URL(path, SITE.url).href;

export const GET: APIRoute = () => {
  const { rows, dataDate } = buildCheatSheet();

  const pickRow = (label: string, p: { name: string; price: number | null; note: string } | null) =>
    p
      ? `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #e2ebec;font-size:14px;color:#16262f;line-height:1.45">
            <strong>${esc(label)}</strong> — ${esc(p.name)}<br>
            <span style="color:#5c6f78;font-size:12px">${esc(p.note)}</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #e2ebec;font-size:14px;color:#16262f;text-align:right;white-space:nowrap;vertical-align:top">${esc(money(p.price))}</td>
        </tr>`
      : '';

  const sections = rows
    .map(
      (r) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2ebec;border-radius:12px;margin:0 0 14px">
        <tr><td style="padding:18px 20px">
          <h2 style="margin:0 0 6px;font-size:18px;color:#0d1b26">${esc(r.label)}</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${pickRow('Return pump', r.pump)}
            ${pickRow('Protein skimmer', r.skimmer)}
            ${pickRow('Light', r.light)}
            <tr>
              <td style="padding:10px 0 2px;font-size:14px;color:#0d1b26"><strong>Full build estimate</strong> <span style="color:#5c6f78;font-size:12px">(all gear, mid tier)</span></td>
              <td style="padding:10px 0 2px;font-size:14px;color:#0d1b26;text-align:right;white-space:nowrap"><strong>$${r.upfrontLow.toLocaleString()}–$${r.upfrontHigh.toLocaleString()}</strong></td>
            </tr>
            <tr>
              <td style="padding:2px 0;font-size:12px;color:#5c6f78">Monthly running cost</td>
              <td style="padding:2px 0;font-size:12px;color:#5c6f78;text-align:right;white-space:nowrap">$${r.monthlyLow}–$${r.monthlyHigh}/mo</td>
            </tr>
          </table>
        </td></tr>
      </table>`
    )
    .join('');

  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>The Reef Gear Cheat Sheet</title></head>
<body style="margin:0;padding:0;background:#f5f8f8;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f8f8">
    <tr><td align="center" style="padding:28px 14px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <tr><td style="padding:0 0 18px">
          <span style="font-size:22px;font-weight:700;color:#0d1b26">Reef<span style="color:#12a3a0">Metric</span></span>
        </td></tr>
        <tr><td style="padding:0 0 6px">
          <h1 style="margin:0;font-size:24px;line-height:1.2;color:#0d1b26">The Reef Gear Cheat Sheet.</h1>
        </td></tr>
        <tr><td style="padding:0 0 18px;font-size:14px;color:#5c6f78;line-height:1.5">
          The right-size pick per category for five tank sizes — the smallest gear that honestly does the job, computed
          with the same math as our calculators (spec data updated ${esc(dataDate)}). Cost ranges are mid-tier, mixed-reef estimates.
        </td></tr>
        <tr><td>${sections}</td></tr>
        <tr><td style="padding:6px 0 18px;font-size:14px;color:#16262f;line-height:1.5">
          These picks assume typical plumbing. Your head height and pipe run change the pump answer — run your real numbers with the
          <a href="${abs('/tools/return-pump-calculator')}?utm_source=cheatsheet" style="color:#0c7d7b">Return Pump Calculator</a>,
          <a href="${abs('/tools/protein-skimmer-calculator')}?utm_source=cheatsheet" style="color:#0c7d7b">Skimmer Sizer</a>, or the
          <a href="${abs('/tools/reef-build-cost-calculator')}?utm_source=cheatsheet" style="color:#0c7d7b">Build Cost Estimator</a>.
          The web version of this sheet lives at
          <a href="${abs('/cheat-sheet')}?utm_source=cheatsheet" style="color:#0c7d7b">${esc(SITE.url.replace(/^https?:\/\//, ''))}/cheat-sheet</a>.
        </td></tr>
        <tr><td style="border-top:1px solid #e2ebec;padding:14px 0 0;font-size:12px;color:#7f9a9c;line-height:1.5">
          You're getting this one email because you asked for the cheat sheet at reefmetric.com — there's no list yet, and
          if we ever start one you'll be able to opt out first. Picks are computed from spec data, never sponsored.
          Questions? Just reply. · <a href="${abs('/privacy')}" style="color:#7f9a9c">Privacy</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
};
