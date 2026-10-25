// Check real hover styles in the served local build; never clicks or submits.
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const browser = await chromium.launch();
const rows = [];
for (const [route, selector] of [['/', '.btn'], ['/', '.btn-ghost'], ['/reviews/best-ato', '.aff'], ['/tools/salt-cost-calculator', '.aff']]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route('**/*cloudflareinsights*', r => r.fulfill({ status: 204, body: '' }));
  await page.goto('http://127.0.0.1:4326' + route);
  await page.locator(selector).first().hover();
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const result = await page.evaluate(async selector => {
    const el = document.querySelector(selector), style = getComputedStyle(el);
    const audit = await axe.run(el, { runOnly: { type: 'rule', values: ['color-contrast'] } });
    return { foreground: style.color, background: style.backgroundColor, violations: audit.violations.map(v => v.id), incomplete: audit.incomplete.map(v => v.id) };
  }, selector);
  assert.equal(result.violations.length, 0);
  assert.equal(result.incomplete.length, 0);
  rows.push({ route, selector, ...result });
  await page.close();
}
await browser.close();
await writeFile('evidence/hover-check.json', JSON.stringify({ method: 'Actual Chromium hover state on rendered buttons, axe color-contrast; no clicks or submissions', rows }, null, 2) + '\n');
console.log(`${rows.length} hover checks passed.`);
