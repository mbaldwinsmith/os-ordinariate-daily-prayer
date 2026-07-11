#!/usr/bin/env node
// Flips shortReading.verified to true wherever data/psalter/weekN/<day>.json exactly
// matches the independent Breviarium cross-check (canonical-short-readings.json).
// Does NOT change any `ref` value: where the two sources disagree, the existing
// citation is left untouched and unverified pending human reconciliation (see
// SOURCES.md and diff-short-readings.mjs). Idempotent - safe to re-run after
// refreshing the canonical dataset.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const canonical = JSON.parse(await readFile(`${ROOT}/canonical-short-readings.json`, 'utf8'));
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const HOURS = ['lauds', 'daytimePrayer', 'vespers'];

let flipped = 0;
for (let week = 1; week <= 4; week++) {
  for (const day of DAYS) {
    const path = `${ROOT}/data/psalter/week${week}/${day}.json`;
    const data = JSON.parse(await readFile(path, 'utf8'));
    let changed = false;
    for (const hour of HOURS) {
      const shortReading = data[hour]?.shortReading;
      if (!shortReading || shortReading.verified) continue;
      const expected = canonical.entries[`week${week}:${day}:${hour}`];
      if (expected && shortReading.ref === expected) {
        shortReading.verified = true;
        changed = true;
        flipped++;
      }
    }
    if (changed) await writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
  }
}
console.log(`Flipped ${flipped} short reading(s) to verified: true.`);
