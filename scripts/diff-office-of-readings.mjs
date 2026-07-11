#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const canonical = JSON.parse(await readFile(`${ROOT}/canonical-office-of-readings.json`, 'utf8'));
let mismatches = 0;
for (const [key, assignment] of Object.entries(canonical.entries)) {
  if (assignment.renderable === false) continue;
  const [season, weekPart, day] = key.split(':');
  for (const year of ['I', 'II']) {
    const actual = JSON.parse(await readFile(`${ROOT}/data/office-of-readings/year${year}/${season}/${weekPart}/${day}.json`, 'utf8'));
    const refs = actual.scriptureReading.refs ?? [actual.scriptureReading.ref];
    if (!actual.verified || JSON.stringify(refs) !== JSON.stringify(assignment.refs)) {
      console.error(`${year}:${key}: expected ${assignment.refs.join('; ')}, got ${refs.join('; ')}`);
      mismatches++;
    }
  }
}
if (mismatches) process.exitCode = 1;
else console.log(`All ${Object.keys(canonical.entries).length * 2} sourced Office of Readings assignments match the canonical dataset.`);
