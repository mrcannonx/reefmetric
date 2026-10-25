import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeSaltMix } from '../src/utils/salt-mix-calc.ts';
const input = { mode: 'batch', volume: 5, volumeUnit: 'gal', changePercent: 20, gramsPerUnit: 150, rateUnit: 'g/gal' };
test('small gallon batch: a supplied 150 g/gal recipe uses 750 g for 5 US gal', () => {
  assert.equal(computeSaltMix(input).grams, 750);
});
test('metric batch: a supplied 38 g/L recipe uses 760 g for 20 L', () => {
  assert.equal(computeSaltMix({ ...input, volume: 20, volumeUnit: 'L', gramsPerUnit: 38, rateUnit: 'g/L' }).grams, 760);
});
test('water change: 20 percent of 75 US gal needs 2250 g at a supplied 150 g/gal', () => {
  assert.equal(computeSaltMix({ ...input, mode: 'change', volume: 75 }).grams, 2250);
});
test('cross-unit label rates use US gallons rather than Imperial gallons', () => {
  assert.ok(Math.abs(computeSaltMix({ ...input, gramsPerUnit: 40, rateUnit: 'g/L' }).grams - 757.0823568) < 1e-8);
  assert.ok(Math.abs(computeSaltMix({ ...input, volume: 18.92705892, volumeUnit: 'L' }).grams - 750) < 1e-8);
});
test('zero water and zero percent produce no salt, while a full change uses the whole amount', () => {
  assert.equal(computeSaltMix({ ...input, volume: 0 }).grams, 0);
  assert.equal(computeSaltMix({ ...input, mode: 'change', changePercent: 0 }).grams, 0);
  assert.equal(computeSaltMix({ ...input, mode: 'change', changePercent: 100 }).grams, 750);
});
test('bad inputs and unknown modes or units cannot become plausible recipes', () => {
  for (const key of ['volume', 'gramsPerUnit']) for (const value of [-1, NaN, Infinity]) {
    assert.throws(() => computeSaltMix({ ...input, [key]: value }), RangeError);
  }
  assert.throws(() => computeSaltMix({ ...input, gramsPerUnit: 0 }), RangeError);
  for (const changePercent of [-1, 101, NaN, Infinity]) assert.throws(() => computeSaltMix({ ...input, mode: 'change', changePercent }), RangeError);
  for (const key of ['mode', 'volumeUnit', 'rateUnit']) assert.throws(() => computeSaltMix({ ...input, [key]: 'unknown' }), RangeError);
  assert.throws(() => computeSaltMix({ ...input, volume: 1e308, gramsPerUnit: 1e308 }), RangeError);
});

import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const html = readFileSync(new URL('../dist/tools/salt-mixing-calculator.html', import.meta.url), 'utf8');
const builtScript = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
  .filter((m) => m[1].includes('type="module"'))
  .map((m) => {
    const src = m[1].match(/src="([^"]+)"/)?.[1];
    return src ? readFileSync(new URL('../dist' + src, import.meta.url), 'utf8') : m[2];
  }).find((s) => s.includes('smMode'));
assert.ok(builtScript, 'Must execute the actual generated salt mixing code');
function mount(script = builtScript) {
  const nodes = new Map();
  for (const [id, value] of Object.entries({ smMode: 'batch', smVolume: '5', smVolumeUnit: 'gal', smPercent: '20', smRate: '', smRateUnit: 'g/gal' })) {
    nodes.set(id, { value, textContent: '', innerHTML: '', hidden: false, disabled: false, listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; } });
  }
  for (const id of ['sm-summary', 'sm-results', 'sm-percent-label', 'sm-volume-label', 'sm-form']) nodes.set(id, { textContent: '', innerHTML: '', hidden: false, listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; } });
  runInNewContext(script, { document: { getElementById: (id) => nodes.get(id) } });
  return { nodes, change(id, value) { nodes.get(id).value = value; nodes.get(id).listeners.input(); }, result() { return nodes.get('sm-summary').textContent; } };
}
test('built page handles three realistic cases, zero water, bad input and recovery', () => {
  const ui = mount();
  assert.match(ui.result(), /Enter a water amount/);
  assert.equal(ui.nodes.get('sm-results').innerHTML, '');
  ui.change('smRate', '150');
  assert.match(ui.result(), /750 g \(0.75 kg\)/);
  ui.change('smMode', 'change');
  ui.change('smVolume', '75');
  assert.equal(ui.nodes.get('smPercent').disabled, false);
  assert.equal(ui.nodes.get('sm-percent-label').hidden, false);
  assert.match(ui.result(), /2,250 g \(2.25 kg\)/);
  ui.change('smMode', 'batch');
  ui.change('smVolumeUnit', 'L');
  ui.change('smRateUnit', 'g/L');
  ui.change('smVolume', '20');
  ui.change('smRate', '38');
  assert.match(ui.result(), /760 g \(0.76 kg\)/);
  ui.change('smVolume', '0');
  assert.match(ui.result(), /No water to prepare/);
  ui.change('smVolume', '-1');
  assert.match(ui.result(), /water amount of zero or more/);
  assert.equal(ui.nodes.get('sm-results').innerHTML, '');
  ui.change('smVolume', '20');
  assert.match(ui.result(), /760 g/);
  ui.change('smRate', '');
  assert.match(ui.result(), /Enter a water amount/);
});
test('negative control proves the built-output check catches a wrong gallon conversion', () => {
  assert.ok(builtScript.includes('3.785411784'));
  const broken = mount(builtScript.replace('3.785411784', '4'));
  broken.change('smRateUnit', 'g/L');
  broken.change('smRate', '40');
  assert.throws(() => assert.match(broken.result(), /757\.08 g/), assert.AssertionError);
  const actual = mount();
  actual.change('smRateUnit', 'g/L');
  actual.change('smRate', '40');
  assert.match(actual.result(), /757\.08 g/);
});

// Optional real-browser layer. Reproduce evidence with:
// SALT_MIX_BROWSER_URL=http://127.0.0.1:4326 node --experimental-strip-types --test scripts/check-salt-mix.mjs
if (process.env.SALT_MIX_BROWSER_URL) test('served salt mixer accepts real browser input and recovers from errors', async () => {
  const { chromium } = await import('playwright');
  const { writeFile } = await import('node:fs/promises');
  const origin = process.env.SALT_MIX_BROWSER_URL;
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    await page.route('**/*', async route => {
      const request = route.request();
      if (!request.url().startsWith(origin + '/') || request.method() !== 'GET') return route.fulfill({ status: 204, body: '' });
      await route.continue();
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/tools/salt-mixing-calculator');
    const rows = [];
    async function record(name, expected) {
      const result = await page.locator('#sm-summary').textContent();
      assert.match(result, expected);
      rows.push({ name, result, inputs: await page.locator('#sm-form input,#sm-form select').evaluateAll(elements => Object.fromEntries(elements.map(element => [element.id, element.value]))) });
    }
    await record('blank label rate gives an honest empty state', /Enter a water amount/);
    await page.locator('#smVolume').fill('5');
    await page.locator('#smRateUnit').selectOption('g/gal');
    await page.locator('#smRate').fill('150');
    await record('5 US gal at supplied 150 g/gal', /750 g \(0.75 kg\)/);
    await page.locator('#smMode').selectOption('change');
    await page.locator('#smVolume').fill('75');
    await page.locator('#smPercent').fill('20');
    await record('20% of 75 US gal at supplied 150 g/gal', /2,250 g \(2.25 kg\)/);
    await page.locator('#smMode').selectOption('batch');
    await page.locator('#smVolume').fill('20');
    await page.locator('#smVolumeUnit').selectOption('L');
    await page.locator('#smRateUnit').selectOption('g/L');
    await page.locator('#smRate').fill('38');
    await record('20 L at supplied 38 g/L', /760 g \(0.76 kg\)/);
    await page.locator('#smVolume').fill('0');
    await record('zero water edge', /No water to prepare/);
    await page.locator('#smVolume').fill('-1');
    await record('negative water rejected', /water amount of zero or more/);
    await page.locator('#smVolume').fill('20');
    await record('valid input recovers', /760 g/);
    const widths = [];
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const measured = await page.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      assert.equal(measured.viewport, width);
      assert.ok(measured.scroll <= measured.client + 1);
      widths.push(measured);
      await page.screenshot({ path: `evidence/salt-mixing-calculator-${width}.png`, fullPage: true });
    }
    assert.deepEqual(errors, []);
    await writeFile('evidence/salt-mix-browser.json', JSON.stringify({ browser: 'Playwright Chromium, headless', origin, rows, widths, errors }, null, 2) + '\n');
  } finally { await browser.close(); }
});
