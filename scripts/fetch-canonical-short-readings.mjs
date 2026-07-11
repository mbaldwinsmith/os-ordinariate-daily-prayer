#!/usr/bin/env node
// Structural source: the Breviarium open-source Liturgy of the Hours library's
// Spanish-language databases (Apache-2.0). Only citations are extracted here -
// no copyrighted reading text is retained. See SOURCES.md for scope/limitations.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const COMMIT = '9772041f194e6f0c1368042dc21aa8ed7ecc461c';
const RAW = `https://raw.githubusercontent.com/Breviarium-app/breviarium--core/${COMMIT}/databases`;
const OUTPUT = fileURLToPath(new URL('../canonical-short-readings.json', import.meta.url));
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
// Our app models Daytime Prayer as one combined midday hour (CONVENTIONS.md); the
// Breviarium source's "sexta" (Sext) is the hour that matches this app's existing
// Daytime Prayer citations almost exactly, so it's the one used for cross-check.
const SOURCES = { lauds: 'all_laudes', daytimePrayer: 'all_sexta', vespers: 'all_vesperae' };

// Spanish book abbreviation -> this project's abbreviation (data/texts/book-abbreviations.json).
// NOTE: the Spanish abbreviation for Hebrews is "Hb", which collides with this project's
// own abbreviation for Habakkuk ("Hb" = Habakkuk here) - mapped to "Heb" to avoid silently
// mistranslating Hebrews citations as Habakkuk.
const BOOKS = {
  'Gn': 'Gn', 'Ex': 'Ex', 'Lv': 'Lv', 'Nm': 'Nm', 'Dt': 'Dt', 'Jos': 'Jos', 'Jue': 'Jgs', 'Rt': 'Ru',
  '1 S': '1 Sm', '2 S': '2 Sm', '1 R': '1 Kgs', '2 R': '2 Kgs', '1 Cro': '1 Chr', '2 Cro': '2 Chr',
  'Esd': 'Ezr', 'Ne': 'Neh', 'Tb': 'Tb', 'Jdt': 'Jdt', 'Est': 'Est', 'Jb': 'Jb', 'Sal': 'Ps', 'Pr': 'Prv',
  'Qo': 'Eccl', 'Ct': 'Song', 'Sb': 'Wis', 'Eclo': 'Sir', 'Is': 'Is', 'Jr': 'Jer', 'Lm': 'Lam', 'Ba': 'Bar',
  'Ez': 'Ez', 'Dn': 'Dn', 'Os': 'Hos', 'Jl': 'Jl', 'Am': 'Am', 'Ab': 'Ob', 'Jon': 'Jon', 'Mi': 'Mi', 'Na': 'Na',
  'Ha': 'Hb', 'So': 'Zep', 'Ag': 'Hg', 'Za': 'Zec', 'Ml': 'Mal', '1 M': '1 Mc', '2 M': '2 Mc', 'Mt': 'Mt',
  'Mc': 'Mk', 'Lc': 'Lk', 'Jn': 'Jn', 'Hch': 'Acts', 'Rm': 'Rom', '1 Co': '1 Cor', '2 Co': '2 Cor', 'Ga': 'Gal',
  'Ef': 'Eph', 'Flp': 'Phil', 'Col': 'Col', '1 Ts': '1 Thes', '2 Ts': '2 Thes', '1 Tm': '1 Tm', '2 Tm': '2 Tm',
  'Tt': 'Ti', 'Flm': 'Phlm', 'Hb': 'Heb', 'St': 'Jas', '1 P': '1 Pt', '2 P': '2 Pt', '1 Jn': '1 Jn', '2 Jn': '2 Jn',
  '3 Jn': '3 Jn', 'Jds': 'Jude', 'Ap': 'Rv',
};

function stripClause(verse) {
  return verse.replace(/([0-9])[abc]$/i, '$1');
}

function normalizeVerseList(verseList) {
  return verseList.split('.').map((token) => {
    const trimmed = token.trim();
    const range = trimmed.match(/^(\d+)([abc]?)-(\d+)([abc]?)$/i);
    if (range) return `${range[1]}-${stripClause(range[3] + (range[4] || ''))}`;
    return stripClause(trimmed);
  }).join(', ');
}

// Handles cross-chapter refs like "Jb 1,21;2,10b" -> "Jb 1:21, 2:10" and same-chapter
// discontinuous refs like "St 1, 19-20.26" -> "Jas 1:19-20, 26" per CONVENTIONS.md.
function normalizeCita(raw) {
  if (!raw) return null;
  let book = null;
  const parts = [];
  for (const segment of raw.split(';').map((part) => part.trim())) {
    const withBook = segment.match(/^([1-3]?\s?[A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+(\d+)\s*,\s*(.+)$/);
    const withoutBook = segment.match(/^(\d+)\s*,\s*(.+)$/);
    if (withBook) {
      const [, bookEs, chapter, verseList] = withBook;
      book = BOOKS[bookEs] ?? bookEs;
      parts.push(`${book} ${chapter}:${normalizeVerseList(verseList)}`);
    } else if (withoutBook && book) {
      const [, chapter, verseList] = withoutBook;
      parts.push(`${chapter}:${normalizeVerseList(verseList)}`);
    } else parts.push(segment);
  }
  return parts.join(', ');
}

async function fetchJson(name) {
  const response = await fetch(`${RAW}/${name}.json`);
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  return response.json();
}

const citas = await fetchJson('es/commons/lectura_breve_citas');
const citaById = new Map(citas.map((entry) => [entry.id, entry.val]));

const entries = {};
for (const [hour, file] of Object.entries(SOURCES)) {
  const hourData = await fetchJson(file);
  const byId = new Map(hourData.map((entry) => [entry.id, entry]));
  for (let week = 1; week <= 4; week++) {
    for (const day of DAYS) {
      const dayEntry = byId.get(`ordinary_time_${week}_${day}`);
      const raw = dayEntry && citaById.get(dayEntry.lectura_biblica_cita);
      const ref = normalizeCita(raw);
      if (ref) entries[`week${week}:${day}:${hour}`] = ref;
    }
  }
}

const canonical = {
  source: 'https://github.com/Breviarium-app/breviarium--core',
  sourceCommit: COMMIT,
  license: 'Apache-2.0 (attribution: "Based on \'Breviarium\' by Miguel Martínez (miguelms.es)")',
  note: 'Citations only, no reading text retained. Ordinary Time weeks 1-4 stand in for the four-week ferial psalter cycle (weeks 5, 9, 13... were spot-checked identical). Two of the four Sundays are absent from the source database under these generic ids (see SOURCES.md) - a known gap, not a transcription failure.',
  entries,
};
await writeFile(OUTPUT, `${JSON.stringify(canonical, null, 2)}\n`);
console.log(`Wrote ${Object.keys(entries).length} canonical short-reading citations to ${OUTPUT}.`);
