#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { normalizePsalmRef, normalizeScriptureRef } from './psalter-reference.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const canonical = JSON.parse(await readFile(`${ROOT}/canonical-psalter-skeleton.json`, 'utf8'));
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const psalm = (ref) => ({ type: 'psalm', ref: normalizePsalmRef(ref) });
const reading = (ref, verified = false) => ({ ref: normalizeScriptureRef(ref), verified });

function canticle(ref) {
  const normalized = normalizeScriptureRef(ref);
  if (normalized === 'Dn 3:57-88, 56') return { type: 'canticle', fixedId: 'benedicite' };
  return { type: 'canticle', scriptureRef: normalized };
}

function eveningPrayer(source, lent = false) {
  return { psalmody: [psalm(source.psalm1), psalm(source.psalm2), canticle(lent && source.ntCanticleLent ? source.ntCanticleLent : source.ntCanticle)] };
}

async function previousReadings(week, day) {
  try {
    const old = JSON.parse(await readFile(`${ROOT}/data/psalter/week${week}/${day}.json`, 'utf8'));
    return Object.fromEntries(['lauds', 'daytimePrayer', 'vespers'].map((hour) => [hour, old[hour]?.shortReading]).filter(([, value]) => value));
  } catch { return {}; }
}

for (let week = 1; week <= 4; week++) {
  const dir = `${ROOT}/data/psalter/week${week}`;
  await mkdir(dir, { recursive: true });
  for (const day of DAYS) {
    const source = canonical[`week${week}`][day];
    const old = await previousReadings(week, day);
    const officeOfReadings = Array.isArray(source.officeOfReadings)
      ? { psalmody: source.officeOfReadings.map(psalm) }
      : {
          strongSeasons: { psalmody: source.officeOfReadings['advent-christmas-lent-easter'].map(psalm) },
          ordinaryTime: { psalmody: source.officeOfReadings['ordinary-time'].map(psalm) },
        };
    const result = {
      verified: !(week === 4 && day === 'thursday'),
      officeOfReadings,
      lauds: { psalmody: [psalm(source.morningPrayer.psalm1), canticle(source.morningPrayer.otCanticle), psalm(source.morningPrayer.psalm2)], ...(old.lauds && { shortReading: old.lauds }) },
      daytimePrayer: { psalmody: source.daytimePrayer.map(psalm), ...(old.daytimePrayer && { shortReading: old.daytimePrayer }) },
      vespers: day === 'sunday' ? eveningPrayer(source.eveningPrayer2) : day === 'saturday' ? { psalmody: [] } : eveningPrayer(source.eveningPrayer),
      ...(day === 'sunday' && { firstVespers: eveningPrayer(source.eveningPrayer1) }),
    };
    if (day !== 'saturday' && old.vespers) result.vespers.shortReading = old.vespers;
    if (day === 'saturday') delete result.vespers;
    await writeFile(`${dir}/${day}.json`, `${JSON.stringify(result, null, 2)}\n`);
  }
}

const compline = {
  invitatory: { default: normalizePsalmRef(canonical.invitatory.default), alternatives: canonical.invitatory.alternatives.map(normalizePsalmRef) },
  days: Object.fromEntries(DAYS.map((day) => [day, { psalmody: canonical.nightPrayer[day].psalms.map(psalm), shortReading: reading(canonical.nightPrayer[day].shortReading, true) }])),
};
await writeFile(`${ROOT}/data/psalter/compline.json`, `${JSON.stringify(compline, null, 2)}\n`);
console.log('Generated the four-week psalter and weekly Compline from canonical-psalter-skeleton.json.');
