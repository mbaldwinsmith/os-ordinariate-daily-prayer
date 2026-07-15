#!/usr/bin/env node
// Generates proper-of-seasons short-reading overrides for ordinary Advent and Lent ferial
// days, distinct from the Ordinary Time "complementary psalmody" cycle in data/psalter/week{N}
// - see SOURCES.md, "Cross-check witness: Breviarium" for how this was discovered
// (Advent/Lent Breviarium witnesses disagreed with Ordinary Time ones for the same nominal
// psalter-week/day, and it was specifically the Ordinary Time witness that matched this app's
// existing ferial citations).
//
// Written as bare `hours.<hour>.shortReading` overrides with NO `psalmody` - src/office.ts
// already falls back to the ferial four-week skeleton's psalmody whenever a proper entry
// doesn't supply its own (see resolveDay), so these files change only the short reading, not
// the psalms/canticles.
//
// Single-sourced from Breviarium (no second independent witness the way the ferial cross-check
// had 5-8 corroborating Ordinary Time cycles per slot), so every entry here is
// "verified": false - the same standing as this app's other single-page-sourced short readings
// (see SOURCES.md, "Short Scripture reading assignments").
//
// Deliberately does NOT cover Dec 17-24 (the O Antiphon stretch): the romcal version this app
// depends on gives those days an ordinary week-based celebration key (e.g.
// "wednesdayOfThe4thWeekOfAdvent") that is NOT stable year to year - which week number Dec
// 17-24 falls under shifts depending on where Christmas lands - while Breviarium models these
// eight days as fixed dates independent of week number (its own ids are
// "advent_december_17".."advent_december_24"). That stretch is instead covered by
// scripts/generate-december-short-readings.mjs -> data/texts/decemberShortReadings.json,
// resolved by calendar date via src/decemberShortReadings.ts (the same way src/oAntiphon.ts
// already resolves the O Antiphons themselves by date rather than by key) rather than by
// mapping onto this script's unstable-across-years celebrationKey files.
//
// Also deliberately omits `vespers` on Saturday files: in this app, Advent/Lent Saturdays
// always resolve their Vespers as First Vespers of the following Sunday
// (src/office.ts's saturdayBeginsSunday), which reads the SUNDAY proper's `hours.firstVespers`,
// not the Saturday file's own `hours.vespers` - so a Saturday `vespers` entry here would just
// be dead data never consulted. Sunday's own First Vespers isn't populated either: Breviarium's
// Saturday-keyed entry is Saturday's OWN Vespers, not necessarily the same text as Sunday's
// First Vespers, and conflating the two without a way to verify that risks a wrong assignment -
// left for future work.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fetchBreviariumJson, parseSpanishCitation } from './breviarium.mjs';

const OUTPUT_DIR = fileURLToPath(new URL('../data/proper-of-seasons', import.meta.url));

const ORDINAL = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th' };
const DAY_LABEL = {
  sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday',
};
const SEASON_LABEL = { advent: 'Advent', lent: 'Lent' };
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const HOUR_FILES = { lauds: 'all_laudes.json', daytimePrayer: 'all_sexta.json', vespers: 'all_vesperae.json' };
// Advent week 4 weekdays are excluded here - Breviarium only models advent_4_sunday for week 4
// (the rest of week 4 is the Dec 17-24 stretch handled separately, see header note above).
const SEASON_MAX_WEEK = { advent: 3, lent: 5 };

function celebrationKey(season, week, day) {
  if (day === 'sunday') return `${ORDINAL[week]}SundayOf${SEASON_LABEL[season]}`;
  return `${day}OfThe${ORDINAL[week]}WeekOf${SEASON_LABEL[season]}`;
}

function celebrationName(season, week, day) {
  if (day === 'sunday') return `${ORDINAL[week]} Sunday of ${SEASON_LABEL[season]}`;
  return `${DAY_LABEL[day]} of the ${ORDINAL[week]} week of ${SEASON_LABEL[season]}`;
}

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

async function writeEntry(season, week, day) {
  const id = `${season}_${week}_${day}`;
  const hours = {};
  for (const hour of Object.keys(HOUR_FILES)) {
    if (day === 'saturday' && hour === 'vespers') continue; // dead data - see header note
    const reading = resolveHourReading(hour, id);
    if (reading) hours[hour] = { shortReading: reading };
  }
  if (Object.keys(hours).length === 0) return false;
  const key = celebrationKey(season, week, day);
  const entry = { key, verified: false, name: celebrationName(season, week, day), hours };
  await writeFile(`${OUTPUT_DIR}/${key}.json`, `${JSON.stringify(entry, null, 2)}\n`, 'utf8');
  console.log(`  wrote ${key}.json`);
  return true;
}

let written = 0;
for (const [season, maxWeek] of Object.entries(SEASON_MAX_WEEK)) {
  for (let week = 1; week <= maxWeek; week++) {
    for (const day of DAYS) {
      if ((await writeEntry(season, week, day))) written++;
    }
  }
}
// Advent's 4th Sunday - the only week-4 day Breviarium models outside the Dec 17-24 stretch.
if (await writeEntry('advent', 4, 'sunday')) written++;

console.log(`\nWrote ${written} proper-of-seasons files.`);
