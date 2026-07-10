#!/usr/bin/env node
// Pulls the Douay-Rheims-Challoner (DRC) text from scrollmapper/bible_databases
// (MIT-licensed compilation of a public-domain text) and reshapes it into
// data/texts/douay-rheims-challoner.json, keyed by book/chapter/verse for
// direct reference lookup. Pinned to a specific commit so re-runs are
// reproducible; bump SOURCE_COMMIT deliberately to pick up upstream fixes.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SOURCE_COMMIT = '16db66f83c1232146b356a255159b5327398d4dc';
const SOURCE_URL = `https://raw.githubusercontent.com/scrollmapper/bible_databases/${SOURCE_COMMIT}/formats/json/DRC.json`;
const OUTPUT_PATH = fileURLToPath(new URL('../data/texts/douay-rheims-challoner.json', import.meta.url));

// The Vulgate appendix the DRC dataset carries alongside the 73-book Catholic
// canon - none of it is used by the Roman Rite lectionary this app
// implements (see SOURCES.md), and every verse in it is empty in this
// particular source anyway (an upstream transcription gap, not just an
// omission we're choosing to make). Dropped entirely rather than kept as
// dead, invalid-per-schema placeholder data.
const EXCLUDED_APOCRYPHA = new Set(['Prayer of Manasses', 'I Esdras', 'II Esdras', 'Additional Psalm', 'Laodiceans']);

async function main() {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${SOURCE_URL}: ${response.status} ${response.statusText}`);
  }
  const source = await response.json();

  /** @type {Record<string, Record<string, Record<string, string>>>} */
  const books = {};
  let verseCount = 0;

  for (const book of source.books) {
    if (EXCLUDED_APOCRYPHA.has(book.name)) continue;
    const chapters = {};
    for (const chapter of book.chapters) {
      const verses = {};
      for (const verse of chapter.verses) {
        verses[verse.verse] = verse.text;
        verseCount += 1;
      }
      chapters[chapter.chapter] = verses;
    }
    books[book.name] = chapters;
  }

  const output = {
    translation: 'Douay-Rheims Bible, Challoner Revision (as reprinted in the 1899 American edition)',
    source: {
      repo: 'https://github.com/scrollmapper/bible_databases',
      commit: SOURCE_COMMIT,
      file: 'formats/json/DRC.json',
      note: 'Underlying text is public domain; scrollmapper compilation is MIT-licensed. See SOURCES.md.',
    },
    bookCount: Object.keys(books).length,
    verseCount,
    books,
  };

  await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`Wrote ${verseCount} verses across ${Object.keys(books).length} books to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
