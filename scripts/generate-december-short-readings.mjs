#!/usr/bin/env node
// Generates the Dec 17-24 ("greater ferias"/O Antiphon stretch) short-reading overrides that
// scripts/generate-advent-lent-short-readings.mjs deliberately left out - see its header
// comment and SOURCES.md, "Advent/Lent proper short readings" for why: the romcal version
// this app depends on assigns those 8 days an ordinary week-based celebration key that isn't
// stable year to year, while Breviarium models them as fixed dates ("advent_december_17"..
// "advent_december_24"). Rather than a celebrationKey-keyed proper-of-seasons file, this
// writes a single date-keyed data file (data/texts/decemberShortReadings.json, same shape as
// data/texts/oAntiphons.json) that src/decemberShortReadings.ts resolves by calendar date -
// the same way src/oAntiphon.ts resolves the O Antiphons themselves.
//
// Single-sourced from Breviarium, so every entry is "verified": false - same standing as the
// Advent/Lent proper short readings.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fetchBreviariumJson, parseSpanishCitation } from './breviarium.mjs';

const OUTPUT_PATH = fileURLToPath(new URL('../data/texts/decemberShortReadings.json', import.meta.url));

const HOUR_FILES = { lauds: 'all_laudes.json', daytimePrayer: 'all_sexta.json', vespers: 'all_vesperae.json' };

const citas = await fetchBreviariumJson('es/commons/lectura_breve_citas.json');
const citasById = new Map(citas.map((c) => [c.id, c.val]));

const hourEntries = {};
for (const [hour, file] of Object.entries(HOUR_FILES)) {
  const entries = await fetchBreviariumJson(file);
  hourEntries[hour] = new Map(entries.map((e) => [e.id, e]));
}

function resolveHourReading(hour, id) {
  const entry = hourEntries[hour].get(id);
  if (!entry) return null;
  const raw = citasById.get(entry.lectura_biblica_cita);
  if (raw === undefined) return null;
  const parsed = parseSpanishCitation(raw);
  if (parsed.error) {
    console.warn(`  WARN ${hour} ${id}: ${parsed.error}`);
    return null;
  }
  return { ref: parsed.citation, verified: false };
}

const result = {};
for (let day = 17; day <= 24; day++) {
  const id = `advent_december_${day}`;
  const hours = {};
  for (const hour of Object.keys(HOUR_FILES)) {
    const reading = resolveHourReading(hour, id);
    if (reading) hours[hour] = reading;
  }
  if (Object.keys(hours).length > 0) result[String(day)] = hours;
}

await writeFile(OUTPUT_PATH, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(`Wrote ${Object.keys(result).length} date entries to ${OUTPUT_PATH}`);
