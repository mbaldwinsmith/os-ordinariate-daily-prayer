#!/usr/bin/env node
// Pulls the four fixed canticles from blocher/dailyoffice2019 (MIT-licensed),
// the traditional-language texts of the 2019 ACNA Book of Common Prayer, and
// reshapes them into data/texts/fixedCanticles.json. See SOURCES.md for why
// this isn't literally the 1662 BCP text and what that means.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SOURCE_COMMIT = '53e4a3a09418324b590d3f636ad9d6678b245e16';
const RAW_BASE = `https://raw.githubusercontent.com/blocher/dailyoffice2019/${SOURCE_COMMIT}/site/office/api/texts`;
const OUTPUT_PATH = fileURLToPath(new URL('../data/texts/fixedCanticles.json', import.meta.url));

const CANTICLES = [
  {
    id: 'benedictus',
    name: 'Benedictus (Song of Zechariah)',
    scriptureRef: 'Lk 1:68-79',
    file: 'mp3_traditional.csv',
  },
  {
    id: 'magnificat',
    name: 'Magnificat (Song of Mary)',
    scriptureRef: 'Lk 1:46-55',
    file: 'ep1_traditional.csv',
  },
  {
    id: 'nuncDimittis',
    name: 'Nunc Dimittis (Song of Simeon)',
    scriptureRef: 'Lk 2:29-32',
    file: 'ep2_traditional.csv',
  },
  {
    id: 'benedicite',
    name: 'Benedicite, omnia opera Domini (A Song of Creation)',
    scriptureRef: 'Song of the Three Young Men 35-65 (Vulgate numbering; the Greek addition to Daniel 3 - confirm exact DRC reference during Phase 8)',
    file: 's10_traditional.csv',
  },
];

/** Minimal quote-aware CSV row parser - just enough for this source's simple rows. */
function parseCsvLine(line) {
  const fields = [];
  let i = 0;
  while (i < line.length) {
    while (line[i] === ' ') i++;
    if (line[i] === '"') {
      i++;
      let value = '';
      while (i < line.length && line[i] !== '"') {
        value += line[i];
        i++;
      }
      i++; // closing quote
      fields.push(value);
    } else {
      let value = '';
      while (i < line.length && line[i] !== ',') {
        value += line[i];
        i++;
      }
      fields.push(value.trim());
    }
    while (line[i] === ' ') i++;
    if (line[i] === ',') i++;
  }
  return fields;
}

/**
 * Every verse in this source is printed as two half-lines split around the
 * mediation mark ("*"). The "hangingIndent"/"indent" style tags are meant to
 * mark that (first half/second half), but are applied inconsistently in
 * practice (some verses tag both halves "hangingIndent") - so pair
 * consecutive congregation rows two at a time instead of trusting the style
 * field. "subheading" rows are editorial section labels (e.g. "I. The
 * Cosmic Order"), not canticle text, and are dropped entirely.
 */
function parseVerses(csvText) {
  const lines = csvText
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => parseCsvLine(line))
    .filter(([, role]) => role === 'congregation')
    .map(([text]) => text);

  if (lines.length % 2 !== 0) {
    throw new Error(`Expected an even number of half-lines, got ${lines.length}`);
  }

  const verses = [];
  for (let i = 0; i < lines.length; i += 2) {
    verses.push(`${lines[i]} ${lines[i + 1]}`);
  }
  return verses;
}

async function main() {
  const output = {};

  for (const canticle of CANTICLES) {
    const url = `${RAW_BASE}/${canticle.file}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    const csvText = await response.text();
    const verseList = parseVerses(csvText);

    const verses = {};
    verseList.forEach((text, i) => {
      // The source is American-English (2019 ACNA BCP); normalize the one
      // spelling this project's 1662 British-English register requires.
      // This is a mechanical spelling fix only - no wording is touched, and
      // any other discrepancy is left alone and flagged in SOURCES.md rather
      // than silently "corrected" from memory.
      verses[i + 1] = text.replace(/\bSavior\b/g, 'Saviour');
    });

    output[canticle.id] = {
      name: canticle.name,
      scriptureRef: canticle.scriptureRef,
      verses,
    };
  }

  await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`Wrote ${CANTICLES.length} canticles to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
