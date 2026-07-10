#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { normalizePsalmRef, normalizeScriptureRef } from './psalter-reference.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const canonical = JSON.parse(await readFile(`${ROOT}/canonical-psalter-skeleton.json`, 'utf8'));
const refs = (items) => items.map((item) => item.ref ?? item.scriptureRef ?? item.fixedId);
const expectedCanticle = (ref) => normalizeScriptureRef(ref) === 'Dn 3:57-88, 56' ? 'benedicite' : normalizeScriptureRef(ref);
const failures = [];
const compare = (label, actual, expected) => { if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); };

for (let week = 1; week <= 4; week++) for (const day of Object.keys(canonical[`week${week}`])) {
  const source = canonical[`week${week}`][day];
  const actual = JSON.parse(await readFile(`${ROOT}/data/psalter/week${week}/${day}.json`, 'utf8'));
  const expectedOffice = Array.isArray(source.officeOfReadings) ? source.officeOfReadings.map(normalizePsalmRef) : null;
  if (expectedOffice) compare(`week${week}/${day} Office`, refs(actual.officeOfReadings.psalmody), expectedOffice);
  else {
    compare(`week${week}/${day} Office ordinary`, refs(actual.officeOfReadings.ordinaryTime.psalmody), source.officeOfReadings['ordinary-time'].map(normalizePsalmRef));
    compare(`week${week}/${day} Office strong`, refs(actual.officeOfReadings.strongSeasons.psalmody), source.officeOfReadings['advent-christmas-lent-easter'].map(normalizePsalmRef));
  }
  compare(`week${week}/${day} Lauds`, refs(actual.lauds.psalmody), [normalizePsalmRef(source.morningPrayer.psalm1), expectedCanticle(source.morningPrayer.otCanticle), normalizePsalmRef(source.morningPrayer.psalm2)]);
  compare(`week${week}/${day} Daytime`, refs(actual.daytimePrayer.psalmody), source.daytimePrayer.map(normalizePsalmRef));
  if (day === 'sunday') {
    compare(`week${week}/${day} EP-I`, refs(actual.firstVespers.psalmody), [source.eveningPrayer1.psalm1, source.eveningPrayer1.psalm2, normalizeScriptureRef(source.eveningPrayer1.ntCanticle)].map(normalizePsalmRef));
    compare(`week${week}/${day} EP-II`, refs(actual.vespers.psalmody), [source.eveningPrayer2.psalm1, source.eveningPrayer2.psalm2, normalizeScriptureRef(source.eveningPrayer2.ntCanticle)].map(normalizePsalmRef));
  } else if (day !== 'saturday') compare(`week${week}/${day} Vespers`, refs(actual.vespers.psalmody), [source.eveningPrayer.psalm1, source.eveningPrayer.psalm2, normalizeScriptureRef(source.eveningPrayer.ntCanticle)].map(normalizePsalmRef));
}

const weekly = JSON.parse(await readFile(`${ROOT}/data/psalter/compline.json`, 'utf8'));
for (const [day, source] of Object.entries(canonical.nightPrayer)) {
  compare(`Compline ${day}`, refs(weekly.days[day].psalmody), source.psalms.map(normalizePsalmRef));
  compare(`Compline ${day} reading`, weekly.days[day].shortReading.ref, normalizeScriptureRef(source.shortReading));
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log('Psalter data matches canonical-psalter-skeleton.json.');
