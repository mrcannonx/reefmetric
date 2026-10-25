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

// Independent fixed examples for every shared calculator. UI coverage and exact
// input/output records are in scripts/audit-calculator-ui.mjs.
import { computeDose } from '../src/utils/dose-calc.ts';
import { computeVolume } from '../src/utils/volume-calc.ts';
import { flowTarget } from '../src/utils/flow-calc.ts';
import { effectiveCapacity } from '../src/utils/skimmer-calc.ts';
import { convertSalinity, correctHydrometerSG } from '../src/utils/salinity-calc.ts';
import { changesNeeded, singleChangeFraction, planFor } from '../src/utils/water-change-calc.ts';
import { costPerGallon, rankSalts } from '../src/utils/salt-cost-calc.ts';
import { parAtHeight } from '../src/utils/light-calc.ts';
import { computeStocking } from '../src/utils/stocking-calc.ts';
import { frictionHeadFt, operatingFlowGPH, pumpFlowAtHead, systemHeadFt } from '../src/utils/pump-calc.ts';
const doseData = JSON.parse(readFileSync(new URL('../src/data/dose-data.json', import.meta.url), 'utf8'));
const near = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

test('every enabled liquid matches its fetched label/example and its own daily limit', () => {
  const cases = [
    ['BRS 2-Part Liquid Soda Ash (Alk)', 'alk', 100, 7.5, 9, 107.1, 2],
    ['BRS 2-Part Liquid Calcium Chloride', 'ca', 100, 400, 420, 102.3, 1],
    ['Red Sea Reef Foundation A (Calcium)', 'ca', 100 / 3.785411784, 400, 402, 1, 1],
    ['Red Sea Reef Foundation B (Alkalinity)', 'alk', 100 / 3.785411784, 8, 8.1, 1, 1],
    ['Red Sea Reef Foundation C (Magnesium)', 'mg', 100 / 3.785411784, 1250, 1300, 50, 5],
  ];
  assert.equal(doseData.additives.filter((a) => a.enabled).length, cases.length);
  for (const [name, param, gallons, current, target, expected, days] of cases) {
    const additive = doseData.additives.find((a) => a.name === name);
    assert.ok(additive.enabled && additive.source, name);
    const result = computeDose({ gallons, current, target, param, additive, safeDailyMax: doseData.safeDailyMax });
    near(result.totalDose, expected);
    assert.equal(result.days, days);
    assert.ok(result.valid);
  }
});

test('dosing refuses empty-volume, negative, disabled, mismatched, and nonfinite inputs', () => {
  const additive = doseData.additives.find((a) => a.enabled && a.parameter === 'alk');
  const base = { gallons: 75, current: 7, target: 9, param: 'alk', additive, safeDailyMax: doseData.safeDailyMax };
  for (const overrides of [{ gallons: 0 }, { gallons: -1 }, { current: -1 }, { target: NaN }, { gallons: Infinity }, { param: 'ca' }, { additive: { ...additive, enabled: false } }, { additive: { ...additive, perUnitPerGallon: NaN } }]) {
    const result = computeDose({ ...base, ...overrides });
    assert.equal(result.valid, false);
    assert.equal(result.totalDose, 0);
  }
});

test('tank volume follows cubic inches, dry-sand bed and rock displacement', () => {
  near(computeVolume(30, 12, 12, 0, 0, 0, 0).trueGal, 4320 / 231);
  const breeder = computeVolume(36, 18, 16, 1, 1, 30, 5);
  near(breeder.trueGal, 648 * 14 / 231 - 2.25 + 5);
  near(breeder.sandLb, 36);
  near(computeVolume(48, 18, 21, 1, 1.5, 60, 15).trueGal, 864 * 18.5 / 231 - 4.5 + 15);
  assert.equal(computeVolume(48, 18, 21, 21, 0, 0, 0).trueGal, 0);
});

test('flow targets subtract delivered return, including a return above the target', () => {
  for (const [g, low, high, ret, expected] of [[40,20,30,200,800], [75,25,40,500,1937.5], [120,40,60,840,5160]]) {
    const r = flowTarget(g, { minTurnover: low, maxTurnover: high }, ret);
    assert.equal(r.powerheadMidGPH, expected);
  }
  assert.equal(flowTarget(40, { minTurnover:20,maxTurnover:30 }, 2000).powerheadMidGPH, 0);
});

test('skimmer uses published bioload values ahead of fallback derating', () => {
  const single = { ratedGallons: 150 };
  assert.equal(effectiveCapacity(single, 'light'), 150);
  assert.equal(effectiveCapacity(single, 'medium'), 105);
  assert.equal(effectiveCapacity(single, 'heavy'), 75);
  assert.equal(effectiveCapacity({ ...single, ratingHeavy: 90 }, 'heavy'), 90);
});

test('pump model solves an independent linear curve and obeys shutoff', () => {
  const pump = { maxFlowGPH: 1000, maxHeadFt: 10, curve: [{headFt:0,flowGPH:1000},{headFt:10,flowGPH:0}] };
  for (const [head, expected] of [[0,1000], [4,600], [8,200]]) {
    const input = { displayGallons:75,turnover:7,staticHeadFt:head,pipeIdInches:1.029,pipeLengthFt:0,elbows:0 };
    near(operatingFlowGPH(pump,input).flowGPH, expected, 1e-6);
  }
  const input = { displayGallons:75,turnover:7,staticHeadFt:10,pipeIdInches:1.029,pipeLengthFt:0,elbows:0 };
  assert.equal(operatingFlowGPH(pump,input).flowGPH, 0);
  // Spears Hazen-Williams: 0.2083*(100/150)^1.852*10^1.852 ft per 100 ft at 1-in ID.
  near(frictionHeadFt(600, 1, 100), 6.99146613182049, 1e-8);
  const real = JSON.parse(readFileSync(new URL('../src/data/pumps.json',import.meta.url),'utf8')).pumps;
  for (const p of real) {
    const i = {...input,staticHeadFt:4,pipeLengthFt:10,elbows:4};
    const op = operatingFlowGPH(p,i);
    near(pumpFlowAtHead(p,systemHeadFt(op.flowGPH,i)),op.flowGPH,1e-6);
  }
});

test('salinity linear reference, reverse units and temperature correction match stated method', () => {
  near(convertSalinity('ppt',35).sg,1.0264);
  near(convertSalinity('sg',1.0264).cond,53);
  near(convertSalinity('cond',53).ppt,35);
  assert.equal(convertSalinity('ppt',0).status,'very-low');
  near(correctHydrometerSG(1.025,25),1.025);
  assert.doesNotMatch(convertSalinity('ppt',37).verdict,/Let some water evaporate/);
});

test('water-change plans satisfy dilution and stop at the first sufficient change', () => {
  for (const [current,target,pct,expected] of [[40,10,50,2],[20,5,25,5],[0.2,0.05,20,7]]) {
    assert.equal(changesNeeded(current,target,pct),expected);
    const plan=planFor(current,target,pct,75);
    assert.ok(plan.levels.at(-1)<=target);
    assert.ok(current*(1-pct/100)**(expected-1)>target);
  }
  assert.equal(singleChangeFraction(40,10),0.75);
  assert.equal(changesNeeded(40,0,20),Infinity);
  assert.equal(changesNeeded(40,0,100),1);
});

test('salt cost converts frequency and ranks by mixed-gallon cost', () => {
  const salt={brand:'Fixture',product:'Fixture',priceUSD:50,gallonsPerBox:200};
  assert.equal(costPerGallon(salt),0.25);
  for(const [g,p,f,expected] of [[75,10,4.3,8.0625],[40,15,2.15,3.225],[120,20,1,6]]) {
    near(rankSalts(g,p,f,[salt]).results[0].monthly,expected);
  }
  assert.equal(rankSalts(75,0,4.3,[salt]).gallonsMonthly,0);
});

test('PAR interpolates only within a single source and returns unknown outside it', () => {
  const light={parCurve:[{heightIn:12,par:1908},{heightIn:18,par:462},{heightIn:24,par:197}]};
  assert.equal(parAtHeight(light,12).par,1908);
  assert.equal(parAtHeight(light,15).par,1185);
  assert.equal(parAtHeight(light,21).par,329.5);
  assert.equal(parAtHeight(light,30).par,null);
  assert.equal(parAtHeight({parCurve:[{heightIn:24,par:100}]},18).par,null);
});

test('stocking score follows its stated relative model and always emits size warnings', () => {
  const fish={name:'Fixture fish',family:'Fixture',adultSizeIn:3,bioloadFactor:1,minTankGal:30,temperament:'peaceful'};
  for(const [g,m,count,expected] of [[40,1,2,27],[75,1,4,28.8],[120,1.3,8,27.692307692307693]]) {
    near(computeStocking(g,m,[{fish,count}]).pct,expected);
  }
  assert.equal(computeStocking(40,1,[]).status,'empty');
  assert.ok(computeStocking(10,1,[{fish,count:1}]).warnings.length>0);
});


test('unlike or unknown salt-yield salinities are not ranked as comparable value', () => {
  const high = {brand:'A',product:'A',gallonsPerBox:200,priceUSD:100,yieldSalinityPpt:null};
  const low = {brand:'B',product:'B',gallonsPerBox:200,priceUSD:50,yieldSalinityPpt:30};
  const result = rankSalts(75,10,4.3,[high,low]);
  assert.equal(result.comparable,false);
  assert.equal(result.results[0].salt.brand,'A');
  const comparable = rankSalts(75,10,4.3,[{...high,yieldSalinityPpt:35},{...low,yieldSalinityPpt:35}]);
  assert.equal(comparable.comparable,true);
  assert.equal(comparable.results[0].salt.brand,'B');
});

test('a bonded pair does not trigger the removed universal odd-shoal rule', () => {
  const fish = {name:'Banggai Cardinalfish',family:'Cardinalfish',adultSizeIn:3,minTankGal:30,bioloadFactor:0.9,temperament:'peaceful',shoaling:true,careNote:'Keep as a single or bonded pair.'};
  const result = computeStocking(75,1,[{fish,count:2}]);
  assert.doesNotMatch(result.warnings.join(' '),/odd group|groups of 2–4/);
});
