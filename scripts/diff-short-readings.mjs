#!/usr/bin/env node
// Cross-checks data/psalter/weekN/<day>.json shortReading citations (Lauds, Daytime
// Prayer, Vespers) against the independent Breviarium structural source. Unlike
// diff-psalter.mjs/diff-office-of-readings.mjs, this is NOT a single authoritative
// source (see SOURCES.md): Lauds/Vespers show frequent genuine verse-boundary
// disagreement with the app's existing citations, so this script only hard-fails on
// a regression in an already-`verified: true` entry. Everything else is reported for
// visibility, not enforced - the open disagreements are Phase 14's documented,
// not-yet-humanly-reconciled residual gap.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const canonical = JSON.parse(await readFile(`${ROOT}/canonical-short-readings.json`, 'utf8'));
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const HOURS = ['lauds', 'daytimePrayer', 'vespers'];

let verifiedMatches = 0;
let openMatches = 0;
let openMismatches = 0;
let missing = 0;
const regressions = [];

for (let week = 1; week <= 4; week++) {
  const data = {};
  for (const day of DAYS) data[day] = JSON.parse(await readFile(`${ROOT}/data/psalter/week${week}/${day}.json`, 'utf8'));
  for (const day of DAYS) {
    for (const hour of HOURS) {
      const shortReading = data[day][hour]?.shortReading;
      if (!shortReading) continue; // e.g. Saturday has no `vespers` key (see CONVENTIONS.md)
      const expected = canonical.entries[`week${week}:${day}:${hour}`];
      if (!expected) { missing++; continue; }
      const matches = shortReading.ref === expected;
      if (shortReading.verified) {
        if (matches) verifiedMatches++;
        else regressions.push(`week${week}/${day} ${hour}: verified ref "${shortReading.ref}" no longer matches canonical "${expected}"`);
      } else if (matches) openMatches++;
      else openMismatches++;
    }
  }
}

console.log(`${verifiedMatches} verified short readings confirmed against the Breviarium cross-check.`);
console.log(`${openMatches} additional matches available to flip verified (run the regeneration step).`);
console.log(`${openMismatches} open, documented disagreements pending human reconciliation (see SOURCES.md).`);
console.log(`${missing} slots have no Breviarium citation to compare against.`);

if (regressions.length) {
  console.error('\nRegressions in previously-confirmed short readings:');
  console.error(regressions.join('\n'));
  process.exitCode = 1;
}
