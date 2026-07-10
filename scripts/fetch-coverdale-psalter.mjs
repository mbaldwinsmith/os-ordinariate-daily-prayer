#!/usr/bin/env node
// Pulls the complete Coverdale Psalter (BCP, 1539/1662 tradition) from
// pmachapman/GoTo.Bible's plain-text "Psalm N:V  text" file and reshapes it
// into data/texts/coverdale-psalter.json, keyed by psalm/verse. See
// SOURCES.md for provenance/licensing and how this was cross-checked
// against the previous (Psalms 1-65 only) source before replacing it.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SOURCE_COMMIT = '4631539bf6b03cab4fe52dcb19caaa1719eac557';
const SOURCE_URL = `https://raw.githubusercontent.com/pmachapman/GoTo.Bible/${SOURCE_COMMIT}/GoToBible.Providers/Texts/BCPPSALMS.txt`;
const OUTPUT_PATH = fileURLToPath(new URL('../data/texts/coverdale-psalter.json', import.meta.url));

const VERSE_LINE = /^Psalm (\d+):(\d+)\s+(.*)$/;

// The source is bare psalm text with no doxology. The traditional Gloria
// Patri wording is "Holy Ghost", not "Holy Spirit" - corroborated across
// numerous independent traditional-liturgy sources (see SOURCES.md), so
// this is stated directly rather than left as an open discrepancy.
const GLORIA_PATRI =
  'Glory be to the Father, and to the Son, and to the Holy Ghost; * ' +
  'As it was in the beginning, is now, and ever shall be, world without end. Amen.';

async function main() {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${SOURCE_URL}: ${response.status} ${response.statusText}`);
  }
  const source = await response.text();

  /** @type {Record<string, Record<string, string>>} */
  const psalms = {};
  let verseCount = 0;

  for (const line of source.split('\n')) {
    if (!line.trim()) continue;
    const match = line.match(VERSE_LINE);
    if (!match) throw new Error(`Unparsed line in ${SOURCE_URL}: ${JSON.stringify(line)}`);
    const [, psalmNumber, verseNumber, text] = match;
    (psalms[psalmNumber] ??= {})[verseNumber] = text.trim();
    verseCount += 1;
  }

  const present = Object.keys(psalms).map(Number).sort((a, b) => a - b);
  const missing = [];
  for (let i = 1; i <= 150; i++) if (!present.includes(i)) missing.push(i);

  const output = {
    translation: 'Coverdale Psalter (Book of Common Prayer tradition, 1539)',
    source: {
      repo: 'https://github.com/pmachapman/GoTo.Bible',
      commit: SOURCE_COMMIT,
      file: 'GoToBible.Providers/Texts/BCPPSALMS.txt',
      note:
        'Public domain (per the source repo\'s own bundled-translation metadata), except that ' +
        'printing the BCP text in the United Kingdom is subject to Crown Copyright - see ' +
        'SOURCES.md. Labeled "Coverdale Psalter" with standard Hebrew/Masoretic numbering by ' +
        'the source repo itself (distinct from its separate "BCP (1979) Psalter" and ' +
        '"...KJV/Douay Versification" files, which are not used here).',
    },
    gloriaPatri: GLORIA_PATRI,
    psalmCount: present.length,
    verseCount,
    missing,
    psalms,
  };

  await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`Wrote ${verseCount} verses across ${present.length} psalms to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
