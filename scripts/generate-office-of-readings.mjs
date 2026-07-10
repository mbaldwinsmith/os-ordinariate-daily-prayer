#!/usr/bin/env node
// Generates the Office of Readings' first-reading scripture citations for
// Year I / Ordinary Time (TASKS.md Phase 7, scoped to this slice only -
// Year II and the seasons are deferred). Same approach as Phase 5's
// psalter skeleton: a systematic, real-scripture assignment rather than a
// transcription of the official lectionary, since no GitHub-reachable
// lectionary index exists in this session's network sandbox (see
// SOURCES.md). Every file is marked "verified": false.
//
// Patristic/hagiographic second readings are omitted entirely
// (patristicReading: null) - the pragmatic MVP fallback TASKS.md itself
// suggests, since the DRC text has no patristic content and sourcing one
// is a separate, not-yet-made decision.
import { readFileSync } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DRC_PATH = fileURLToPath(new URL('../data/texts/douay-rheims-challoner.json', import.meta.url));
const BOOK_ABBREVIATIONS_PATH = fileURLToPath(new URL('../data/texts/book-abbreviations.json', import.meta.url));
const OUTPUT_ROOT = fileURLToPath(new URL('../data/office-of-readings/yearI/ordinaryTime', import.meta.url));

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// One Old Testament book per week, 34 weeks - a real, sensible run through
// a broad cross-section of the canon (roughly the shape of how the actual
// Office of Readings First Reading works: continuous OT reading through
// Ordinary Time), not a transcription of the official week-by-week
// assignment. See SOURCES.md.
const WEEK_BOOKS = [
  'Genesis',
  'Exodus',
  'Leviticus',
  'Numbers',
  'Deuteronomy',
  'Joshua',
  'Judges',
  'Ruth',
  'I Samuel',
  'II Samuel',
  'I Kings',
  'II Kings',
  'Tobit',
  'Judith',
  'Job',
  'Proverbs',
  'Ecclesiastes',
  'Song of Solomon',
  'Wisdom',
  'Sirach',
  'Isaiah',
  'Jeremiah',
  'Lamentations',
  'Baruch',
  'Ezekiel',
  'Daniel',
  'Hosea',
  'Joel',
  'Amos',
  'Micah',
  'Habakkuk',
  'Zephaniah',
  'Haggai',
  'Zechariah',
];

async function main() {
  const drc = JSON.parse(readFileSync(DRC_PATH, 'utf8'));
  const bookAbbreviations = JSON.parse(readFileSync(BOOK_ABBREVIATIONS_PATH, 'utf8'));
  // Book name -> abbreviation (the shared file itself maps the other way).
  const abbreviationByBook = Object.fromEntries(Object.entries(bookAbbreviations).map(([abbrev, book]) => [book, abbrev]));

  for (let weekNumber = 1; weekNumber <= WEEK_BOOKS.length; weekNumber++) {
    const book = WEEK_BOOKS[weekNumber - 1];
    const chapterCount = Object.keys(drc.books[book]).length;
    const weekDir = `${OUTPUT_ROOT}/week${weekNumber}`;
    await mkdir(weekDir, { recursive: true });

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      // Wraps around if a book has fewer than 7 chapters (e.g. Ruth, Joel).
      const chapter = (dayIndex % chapterCount) + 1;
      const content = {
        verified: false,
        scriptureReading: { ref: `${abbreviationByBook[book]} ${chapter}` },
        patristicReading: null,
      };
      await writeFile(`${weekDir}/${DAYS[dayIndex]}.json`, JSON.stringify(content, null, 2) + '\n');
    }
  }

  console.log(`Wrote ${WEEK_BOOKS.length * 7} Office of Readings files across data/office-of-readings/yearI/ordinaryTime/.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
