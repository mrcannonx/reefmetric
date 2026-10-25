// Enumerate calculator CTAs through the shipped affiliate helper, including models
// which do not appear in the initial static HTML. No network requests or writes.
import fs from 'node:fs';
import { transform } from 'esbuild';
const source = fs.readFileSync('src/data/affiliate-config.ts', 'utf8')
  .replaceAll('import.meta.env.BASE_URL', "'/'");
const { code } = await transform(source, { loader: 'ts', format: 'esm' });
const { goHref } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const sets = [
  ['pumps', 'pumps', 'return pump', 'source'],
  ['skimmers', 'skimmers', 'protein skimmer', 'source'],
  ['heaters', 'heaters', 'aquarium heater', 'source'],
  ['wavemakers', 'wavemakers', 'wavemaker', 'source'],
  ['salts', 'salts', 'reef salt', null],
];
const rows = [];
for (const [file, key, suffix, direct] of sets) {
  const data = JSON.parse(fs.readFileSync(`src/data/${file}.json`, 'utf8'));
  if (!Array.isArray(data[key])) throw new Error(`Unknown dataset shape: ${file}.${key}`);
  for (const item of data[key]) {
    const name = item.model || item.product;
    if (!item.brand || !name) throw new Error(`Missing product identity in ${file}`);
    rows.push({ href: goHref(item.retailers || [], `${item.brand} ${name} ${suffix}`, direct ? item[direct] : undefined),
      parent: `src/data/${file}.json: calculator CTA for ${item.brand} ${name}` });
  }
}
console.log(JSON.stringify(rows));
