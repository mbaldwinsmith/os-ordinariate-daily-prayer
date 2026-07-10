#!/usr/bin/env node
// Validates every data file under data/ against its schema in schema/.
// Run via `npm run validate:data`; wired into CI so malformed data files
// can't merge. See TASKS.md Phase 3.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const schemaDir = join(root, 'schema');
const dataDir = join(root, 'data');

// Our schemas declare "$schema": draft/2020-12, which the plain `Ajv` export
// doesn't recognize (it only ships draft-07 support out of the box).
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

function loadSchema(name) {
  const schema = JSON.parse(readFileSync(join(schemaDir, name), 'utf8'));
  return ajv.compile(schema);
}

const validators = {
  scripture: loadSchema('scripture.schema.json'),
  psalms: loadSchema('psalms.schema.json'),
  fixedCanticles: loadSchema('fixed-canticles.schema.json'),
  bookAbbreviations: loadSchema('book-abbreviations.schema.json'),
  psalterDay: loadSchema('psalter-day.schema.json'),
  officeOfReadingsDay: loadSchema('office-of-readings-day.schema.json'),
  proper: loadSchema('proper.schema.json'),
};

/** Recursively finds .json files under a directory (empty array if the directory is absent). */
function findJsonFiles(dir) {
  if (!existsSync(dir)) return [];
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...findJsonFiles(full));
    } else if (entry.endsWith('.json')) {
      results.push(full);
    }
  }
  return results;
}

let failures = 0;
let checked = 0;

function validateFile(path, validate, { ignoredErrorPaths = new Set() } = {}) {
  checked += 1;
  const data = JSON.parse(readFileSync(path, 'utf8'));
  if (validate(data)) return;

  const realErrors = (validate.errors ?? []).filter((err) => !ignoredErrorPaths.has(err.instancePath));
  const ignoredCount = (validate.errors?.length ?? 0) - realErrors.length;
  if (ignoredCount > 0) {
    console.warn(`\n${path}: ${ignoredCount} documented, non-fatal gap(s) - see SOURCES.md`);
  }
  if (realErrors.length === 0) return;

  failures += 1;
  console.error(`\nINVALID: ${path}`);
  for (const err of realErrors) {
    console.error(`  ${err.instancePath || '(root)'} ${err.message}`);
  }
}

// The 12 empty verses documented in SOURCES.md as a known upstream gap in the
// DRC dataset (every one is the last verse of its chapter/book - looks like a
// systematic truncation bug, not a random omission). Tracked explicitly here
// so validation still fails on any *other* empty verse.
const KNOWN_SCRIPTURE_GAPS = new Set(
  [
    'II Samuel/13/39',
    'I Kings/17/19',
    'Psalms/150/6',
    'Proverbs/30/29',
    'Sirach/29/35',
    'Isaiah/46/13',
    'Baruch/6/37',
    'John/11/57',
    'II Corinthians/1/24',
    'I Thessalonians/4/18',
    'II Thessalonians/2/17',
    'III John/1/15',
  ].map((ref) => `/books/${ref}`),
);

const singleFileTargets = [
  [join(dataDir, 'texts', 'douay-rheims-challoner.json'), validators.scripture, { ignoredErrorPaths: KNOWN_SCRIPTURE_GAPS }],
  [join(dataDir, 'texts', 'coverdale-psalter.json'), validators.psalms, {}],
  [join(dataDir, 'texts', 'fixedCanticles.json'), validators.fixedCanticles, {}],
  [join(dataDir, 'texts', 'book-abbreviations.json'), validators.bookAbbreviations, {}],
];

for (const [path, validate, options] of singleFileTargets) {
  if (existsSync(path)) validateFile(path, validate, options);
}

for (const path of findJsonFiles(join(dataDir, 'psalter'))) {
  validateFile(path, validators.psalterDay);
}

for (const path of findJsonFiles(join(dataDir, 'office-of-readings'))) {
  validateFile(path, validators.officeOfReadingsDay);
}

for (const dir of ['proper-of-seasons', 'proper-of-saints']) {
  for (const path of findJsonFiles(join(dataDir, dir))) {
    validateFile(path, validators.proper);
  }
}

// Semantic checks a JSON Schema alone can't express: cross-references
// between data files actually resolve.
const bookAbbreviationsPath = join(dataDir, 'texts', 'book-abbreviations.json');
const drcPath = join(dataDir, 'texts', 'douay-rheims-challoner.json');
if (existsSync(bookAbbreviationsPath) && existsSync(drcPath)) {
  const bookAbbreviations = JSON.parse(readFileSync(bookAbbreviationsPath, 'utf8'));
  const drc = JSON.parse(readFileSync(drcPath, 'utf8'));

  for (const [abbrev, book] of Object.entries(bookAbbreviations)) {
    checked += 1;
    if (!drc.books[book]) {
      failures += 1;
      console.error(`\nINVALID: ${bookAbbreviationsPath}\n  "${abbrev}" -> "${book}" is not a book in ${drcPath}`);
    }
  }

  const scriptureRefPattern = /^([A-Za-z0-9 ]+?) (\d+)(?::(.+))?$/;

  function checkScriptureRef(path, fieldPath, ref) {
    checked += 1;
    const match = ref?.match(scriptureRefPattern);
    if (!match) {
      failures += 1;
      console.error(`\nINVALID: ${path}\n  ${fieldPath} "${ref}" doesn't match the expected reference syntax`);
      return;
    }
    const [, abbrev, chapter] = match;
    const book = bookAbbreviations[abbrev];
    if (!book || !drc.books[book]?.[chapter]) {
      failures += 1;
      console.error(`\nINVALID: ${path}\n  ${fieldPath} "${ref}" does not resolve in the DRC text`);
    }
  }

  for (const path of findJsonFiles(join(dataDir, 'office-of-readings'))) {
    const { scriptureReading } = JSON.parse(readFileSync(path, 'utf8'));
    checkScriptureRef(path, 'scriptureReading.ref', scriptureReading?.ref);
  }

  for (const path of findJsonFiles(join(dataDir, 'psalter'))) {
    const day = JSON.parse(readFileSync(path, 'utf8'));
    for (const [hourName, hour] of Object.entries(day)) {
      if (hourName !== 'verified' && hour.shortReading) {
        checkScriptureRef(path, `${hourName}.shortReading.ref`, hour.shortReading.ref);
      }
    }
  }

  for (const dir of ['proper-of-seasons', 'proper-of-saints']) {
    for (const path of findJsonFiles(join(dataDir, dir))) {
      const { firstReading, hours } = JSON.parse(readFileSync(path, 'utf8'));
      if (firstReading) checkScriptureRef(path, 'firstReading.ref', firstReading.ref);
      for (const [hourName, hour] of Object.entries(hours ?? {})) {
        if (hour.shortReading) checkScriptureRef(path, `hours.${hourName}.shortReading.ref`, hour.shortReading.ref);
      }
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures}/${checked} data file(s) failed schema validation.`);
  process.exitCode = 1;
} else {
  console.log(`All ${checked} data file(s) passed schema validation.`);
}
