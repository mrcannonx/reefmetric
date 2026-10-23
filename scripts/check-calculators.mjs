import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as costs from '../src/utils/cost-calc.ts';
import { setupTotal } from '../src/data/setup-budgets.ts';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

test('a 100 W aquarium running all day uses 72 kWh in 30 days', () => {
  const result = costs.estimateElectricity({ watts: 100, hoursPerDay: 24, days: 30, kwhRate: 0.20 });
  assert.ok(Math.abs(result.kwh - 72) < 1e-9);
  assert.ok(Math.abs(result.cost - 14.4) < 1e-9);
});

test('a timed light uses its actual daily hours', () => {
  const result = costs.estimateElectricity({ watts: 150, hoursPerDay: 8, days: 30, kwhRate: 0.20 });
  assert.equal(result.kwh, 36);
  assert.equal(result.cost, 7.2);
});

test('zero rate, watts, hours, or days stays zero', () => {
  for (const key of ['watts', 'hoursPerDay', 'days', 'kwhRate']) {
    const input = { watts: 100, hoursPerDay: 24, days: 30, kwhRate: 0.20, [key]: 0 };
    assert.equal(costs.estimateElectricity(input).cost, 0, key);
  }
});

test('invalid energy inputs cannot produce a plausible bill', () => {
  const input = { watts: 100, hoursPerDay: 24, days: 30, kwhRate: 0.20 };
  for (const key of Object.keys(input)) {
    for (const invalid of [-1, NaN, Infinity]) {
      assert.throws(() => costs.estimateElectricity({ ...input, [key]: invalid }), RangeError);
    }
  }
  assert.throws(() => costs.estimateElectricity({ ...input, hoursPerDay: 25 }), RangeError);
});

test('the build estimate exposes electricity separately and honors a free rate', () => {
  const input = { gallons: 75, tier: 'mid', hasSump: true, coral: 'mixed', kwhRate: 0.17 };
  const paid = costs.estimateCost(input);
  const free = costs.estimateCost({ ...input, kwhRate: 0 });
  assert.equal(paid.avgWatts, 143);
  assert.ok(Math.abs(paid.electricityKwhMonthly - 102.96) < 1e-9);
  assert.ok(Math.abs(paid.electricityMonthly - 17.5032) < 1e-9);
  assert.equal(free.electricityMonthly, 0);
  assert.equal(free.electricityKwhMonthly, paid.electricityKwhMonthly);
  assert.ok(free.monthlyLow < paid.monthlyLow);
});

test('size-guide totals match the carried-over itemized budgets', () => {
  assert.deepEqual(setupTotal(30, 'budget'), [640, 1290]);
  assert.deepEqual(setupTotal(30, 'mid'), [1290, 2490]);
  assert.deepEqual(setupTotal(120, 'budget'), [2690, 4660]);
  assert.deepEqual(setupTotal(120, 'mid'), [4660, 9300]);
});

test('generated cost-page script updates results, accepts zero rates, and recovers from bad input', () => {
  const html = readFileSync(new URL('../dist/tools/reef-build-cost-calculator.html', import.meta.url), 'utf8');
  const script = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter((m) => m[1].includes('type="module"'))
    .map((m) => {
      const src = m[1].match(/src="([^"]+)"/)?.[1];
      return src ? readFileSync(new URL('../dist' + src, import.meta.url), 'utf8') : m[2];
    }).find((s) => s.includes('eWatts'));
  assert.ok(script, 'Test must execute the actual generated calculator script');
  const elements = new Map();
  const node = (value = '') => ({ value, innerHTML: '', textContent: '', listeners: {}, addEventListener(event, handler) { this.listeners[event] = handler; } });
  for (const [id, value] of Object.entries({ cGallons: '75', cTier: 'mid', cCoral: 'mixed', cSump: 'yes', cKwh: '0.17', eWatts: '100', eHours: '24', eDays: '30', eRate: '0.17' })) elements.set(id, node(value));
  for (const id of ['cost-totals', 'cost-table', 'electricity-result', 'electricity-form']) elements.set(id, node());
  // Minimal DOM harness, not a browser/layout check. Exercise the shipped code's
  // event handlers; the form check models the built input constraints.
  elements.get('electricity-form').checkValidity = () => ['eWatts', 'eHours', 'eDays', 'eRate'].every((id) => {
    const text = elements.get(id).value;
    const n = Number(text);
    return text !== '' && Number.isFinite(n) && n >= 0 && (id !== 'eHours' || n <= 24);
  });
  runInNewContext(script, { document: { getElementById: (id) => elements.get(id) ?? null } });
  assert.match(elements.get('cost-totals').innerHTML, /\$17\.50 electricity/);
  assert.match(elements.get('electricity-result').textContent, /72\.00 kWh · \$12\.24/);
  elements.get('cKwh').value = '0';
  elements.get('cKwh').listeners.input();
  assert.match(elements.get('cost-totals').innerHTML, /\$0\.00 electricity/);
  elements.get('cKwh').value = '';
  elements.get('cKwh').listeners.input();
  assert.match(elements.get('cost-totals').textContent, /Enter at least/);
  assert.equal(elements.get('cost-table').innerHTML, '');
  elements.get('cKwh').value = '0.17';
  elements.get('cGallons').value = '1e308';
  elements.get('cGallons').listeners.input();
  assert.match(elements.get('cost-totals').textContent, /too large/);
  elements.get('eRate').value = '0';
  elements.get('electricity-form').listeners.input();
  assert.match(elements.get('electricity-result').textContent, /\$0\.00/);
  elements.get('eHours').value = '25';
  elements.get('electricity-form').listeners.input();
  assert.match(elements.get('electricity-result').textContent, /no more than 24/);
  elements.get('eHours').value = '8';
  elements.get('eRate').value = '0.20';
  elements.get('electricity-form').listeners.input();
  assert.match(elements.get('electricity-result').textContent, /24\.00 kWh · \$4\.80/);
});
