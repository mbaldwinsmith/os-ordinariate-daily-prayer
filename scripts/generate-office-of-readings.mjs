#!/usr/bin/env node
// Generates the Office of Readings' first-reading scripture citations for
// every week-numbered season/year combination (TASKS.md Phase 7): Year I &
// II Ordinary Time, Advent, Lent (the 5 numbered weeks only - Ash
// Wednesday through the following Saturday has no week number and is
// handled by scripts/generate-office-of-readings-proper.mjs instead), and
// Easter season. Same approach as Phase 5's psalter skeleton: a
// systematic, real-scripture assignment rather than a transcription of the
// official lectionary, since no GitHub-reachable lectionary index exists
// in this session's network sandbox (see SOURCES.md). Every file is
// marked "verified": false.
//
// Each day gets one book/chapter, reading straight through every book in
// a season's list in order (not restarting at chapter 1 each week) before
// cycling back to the start of the list if the season runs longer than
// the list's total chapter count. This is a meaningful improvement over
// this script's first version (which wasted most of a long book's content
// by only ever reading its first 7 chapters) - applied here to Year I
// Ordinary Time too, regenerating it for consistency with everything else.
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
const OUTPUT_BASE = fileURLToPath(new URL('../data/office-of-readings', import.meta.url));

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// One real-scripture reading list per year/season. Deliberately different
// between Year I and Year II so the two-year cycle isn't just a repeat -
// see SOURCES.md for the reasoning behind each list's shape.
const SEASONS = [
  {
    year: 'I',
    season: 'ordinaryTime',
    weekCount: 34,
    books: [
      'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
      'I Samuel', 'II Samuel', 'I Kings', 'II Kings', 'Tobit', 'Judith', 'Job', 'Proverbs',
      'Ecclesiastes', 'Song of Solomon', 'Wisdom', 'Sirach', 'Isaiah', 'Jeremiah', 'Lamentations',
      'Baruch', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Micah', 'Habakkuk', 'Zephaniah',
      'Haggai', 'Zechariah',
    ],
  },
  {
    year: 'II',
    season: 'ordinaryTime',
    weekCount: 34,
    // Shorter/remaining-canon books front-loaded so they're guaranteed to
    // appear even though the longer NT books at the end may get truncated
    // (34 weeks can't fit the entire NT either - that's fine/realistic).
    books: [
      'I Chronicles', 'II Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Malachi', 'I Maccabees',
      'Philemon', 'III John', 'II John', 'Jude', 'James', 'I Peter', 'II Peter', 'I John', 'Titus',
      'II Timothy', 'I Timothy', 'Galatians', 'Ephesians', 'Philippians', 'Colossians',
      'I Thessalonians', 'II Thessalonians', 'Hebrews', 'Romans', 'I Corinthians', 'II Corinthians',
      'Revelation of John', 'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    ],
  },
  { year: 'I', season: 'advent', weekCount: 4, books: ['Isaiah'] },
  { year: 'II', season: 'advent', weekCount: 4, books: ['Micah', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Romans'] },
  { year: 'I', season: 'lent', weekCount: 5, books: ['Deuteronomy', 'Jeremiah'] },
  { year: 'II', season: 'lent', weekCount: 5, books: ['II Corinthians', 'Hebrews'] },
  { year: 'I', season: 'easter', weekCount: 7, books: ['Acts', 'I John', 'Revelation of John'] },
  { year: 'II', season: 'easter', weekCount: 7, books: ['Acts', 'I Peter', 'Revelation of John'] },
];

/** Concatenates every chapter of every book in order, then cycles/truncates to exactly `dayCount` entries. */
function assignDays(books, drc, dayCount) {
  const flat = [];
  for (const book of books) {
    const chapterCount = Object.keys(drc.books[book]).length;
    for (let chapter = 1; chapter <= chapterCount; chapter++) flat.push({ book, chapter });
  }
  return Array.from({ length: dayCount }, (_, i) => flat[i % flat.length]);
}

async function main() {
  const drc = JSON.parse(readFileSync(DRC_PATH, 'utf8'));
  const bookAbbreviations = JSON.parse(readFileSync(BOOK_ABBREVIATIONS_PATH, 'utf8'));
  const abbreviationByBook = Object.fromEntries(Object.entries(bookAbbreviations).map(([abbrev, book]) => [book, abbrev]));

  let totalFiles = 0;

  for (const { year, season, weekCount, books } of SEASONS) {
    const days = assignDays(books, drc, weekCount * 7);
    const outputRoot = `${OUTPUT_BASE}/year${year}/${season}`;

    for (let weekNumber = 1; weekNumber <= weekCount; weekNumber++) {
      const weekDir = `${outputRoot}/week${weekNumber}`;
      await mkdir(weekDir, { recursive: true });

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const { book, chapter } = days[(weekNumber - 1) * 7 + dayIndex];
        const content = {
          verified: false,
          scriptureReading: { ref: `${abbreviationByBook[book]} ${chapter}` },
          patristicReading: null,
        };
        await writeFile(`${weekDir}/${DAYS[dayIndex]}.json`, JSON.stringify(content, null, 2) + '\n');
        totalFiles += 1;
      }
    }
  }

  console.log(`Wrote ${totalFiles} Office of Readings files across data/office-of-readings/year{I,II}/.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
