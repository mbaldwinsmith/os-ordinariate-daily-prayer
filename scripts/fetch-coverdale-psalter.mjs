#!/usr/bin/env node
// Pulls the Coverdale Psalter (BCP 1662) text out of santeyio/st-andrews-psalter
// (a chant-pointing PWA whose src/psalms/psalms.js embeds the plain psalter
// text inside HTML/chant markup) and reshapes it into
// data/texts/coverdale-psalter.json, keyed by psalm/verse.
//
// IMPORTANT: that source repo is itself an INCOMPLETE transcription — only
// Psalms 1-65 of 150 are present, no canticles. This script ingests exactly
// what's there and records the gap; it does not invent the missing psalms.
// See SOURCES.md for the plan to complete the remaining 85 psalms and the
// four fixed canticles.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SOURCE_COMMIT = '680dd72f800fe7c43a99c74fb094ec953ae33bdf';
const SOURCE_URL = `https://raw.githubusercontent.com/santeyio/st-andrews-psalter/${SOURCE_COMMIT}/src/psalms/psalms.js`;
const OUTPUT_PATH = fileURLToPath(new URL('../data/texts/coverdale-psalter.json', import.meta.url));

const GLORIA_MARKER = 'Glory be to the Father';

function stripMarkup(line) {
  return line
    .replace(/<\/?u>/g, '')
    .replace(/&nbsp;/g, '')
    .trim();
}

/** Collapses stray spaces left by the source's small-caps LORD spacing markup. */
function tidyPunctuation(text) {
  return text.replace(/\s+([;:,.!?])/g, '$1').replace(/\s{2,}/g, ' ');
}

/** Turns one psalm's raw template-literal body into an ordered array of verse strings. */
function parseVerses(rawText) {
  const lines = rawText.split('<br/>').map(stripMarkup);
  const verses = [];
  let current = null;

  for (const line of lines) {
    if (line === '') continue;
    const verseStart = line.match(/^(\d+)\s+(.*)$/);
    if (verseStart) {
      if (current !== null) verses.push(current);
      current = verseStart[2];
    } else if (current === null) {
      current = line;
    } else {
      current += ' ' + line;
    }
  }
  if (current !== null) verses.push(current);

  // The final "verse" has the Gloria Patri run on with no numbered marker
  // of its own (this source doesn't number it) - split it back off.
  let gloriaPatri = null;
  const last = verses[verses.length - 1];
  const gloriaIndex = last.indexOf(GLORIA_MARKER);
  if (gloriaIndex !== -1) {
    verses[verses.length - 1] = last.slice(0, gloriaIndex).trim();
    gloriaPatri = last.slice(gloriaIndex).trim();
  }

  const tidiedVerses = verses.map(tidyPunctuation);
  const tidiedGloria = gloriaPatri ? tidyPunctuation(gloriaPatri) : null;
  return { verses: tidiedVerses, gloriaPatri: tidiedGloria };
}

async function main() {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${SOURCE_URL}: ${response.status} ${response.statusText}`);
  }
  const source = await response.text();

  const entryPattern = /'(\d+)':\s*\{\s*tone:\s*'[^']*',\s*text:\s*`([\s\S]*?)`,\s*\},/g;
  /** @type {Record<string, Record<string, string>>} */
  const psalms = {};
  let gloriaPatri = null;
  let verseCount = 0;
  let match;

  while ((match = entryPattern.exec(source)) !== null) {
    const [, number, rawText] = match;
    const { verses, gloriaPatri: thisGloria } = parseVerses(rawText);
    if (thisGloria) gloriaPatri = thisGloria;

    /** @type {Record<string, string>} */
    const verseMap = {};
    verses.forEach((text, i) => {
      verseMap[i + 1] = text;
      verseCount += 1;
    });
    // A handful of psalms appear twice in the source under alternate chant
    // tones; last one wins, same as the JS object literal it came from.
    psalms[number] = verseMap;
  }

  const present = Object.keys(psalms).map(Number).sort((a, b) => a - b);
  const missing = [];
  for (let i = 1; i <= 150; i++) if (!present.includes(i)) missing.push(i);

  const output = {
    translation: 'Coverdale Psalter, Book of Common Prayer (1662)',
    source: {
      repo: 'https://github.com/santeyio/st-andrews-psalter',
      commit: SOURCE_COMMIT,
      file: 'src/psalms/psalms.js',
      note:
        'Underlying text is the public-domain 1662 BCP Psalter. This source repo carries no ' +
        'declared license for its own transcription/formatting; only the plain public-domain ' +
        'wording was extracted here, with all chant-pointing markup and Gregorian tone ' +
        'assignments stripped. See SOURCES.md for caveats, including an INCOMPLETE upstream ' +
        'transcription (only Psalms 1-65 of 150; see "missing" below) and a wording ' +
        'discrepancy in the Gloria Patri ("Holy Spirit" vs. the traditional 1662 "Holy Ghost") ' +
        'that needs checking against a primary source.',
    },
    gloriaPatri,
    psalmCount: present.length,
    verseCount,
    missing,
    psalms,
  };

  await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(
    `Wrote ${verseCount} verses across ${present.length} psalms to ${OUTPUT_PATH} ` +
      `(${missing.length} psalms still missing: ${missing[0]}-${missing[missing.length - 1]})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
