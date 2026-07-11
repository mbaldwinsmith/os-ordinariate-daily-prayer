#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SOURCE = 'https://catholic-resources.org/LoH/OfficeOfReadings-Biblical.html';
const OUTPUT = fileURLToPath(new URL('../canonical-office-of-readings.json', import.meta.url));
const DAYS = { Sunday: 'sunday', Monday: 'monday', Tuesday: 'tuesday', Wednesday: 'wednesday', Thursday: 'thursday', Friday: 'friday', Saturday: 'saturday' };
const UNRENDERABLE = new Set([
  'Ex 40:16-38', 'Nm 12:16-13:3, 17-33', 'Hos 2:4, 10-25', 'Dt 10:12-11:9, 26-28',
  'Jer 42:1-46, 43:4-7', 'Jer 37:21, 38:14-28', 'Ez 2:8-3:11, 17-21', 'Mal 3:1-24',
  'Wis 1:16-2:1, 10-24', 'Jb 42:7-17',
]);
const BOOKS = {
  Gen: 'Gn', Exod: 'Ex', Lev: 'Lv', Num: 'Nm', Deut: 'Dt', Josh: 'Jos', Judg: 'Jgs',
  '1 Sam': '1 Sm', '2 Sam': '2 Sm', '1 Kings': '1 Kgs', '2 Kings': '2 Kgs',
  '1 Chron': '1 Chr', '2 Chron': '2 Chr', Job: 'Jb', Prov: 'Prv', Isa: 'Is', Ezek: 'Ez', Dan: 'Dn',
  Joel: 'Jl', Amos: 'Am', Mic: 'Mi', Hab: 'Hb', Zeph: 'Zep', Hag: 'Hg', Zech: 'Zec',
  '1 Mac': '1 Mc', '2 Mac': '2 Mc', Matt: 'Mt', '1 Tim': '1 Tm', '2 Tim': '2 Tm',
  '1 Thess': '1 Thes', '2 Thess': '2 Thes', Titus: 'Ti', '1 Pet': '1 Pt', '2 Pet': '2 Pt',
  '1 John': '1 Jn', '2 John': '2 Jn', '3 John': '3 Jn', Rev: 'Rv',
};

function text(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&mdash;/g, '—').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizePart(part, inheritedBook) {
  let value = part.trim().replace(/—/g, '-').replace(/(\d)[abc](?=\D|$)/g, '$1');
  const book = Object.keys(BOOKS).sort((a, b) => b.length - a.length).find((candidate) => value === candidate || value.startsWith(`${candidate} `))
    ?? value.match(/^([1-3]? ?[A-Za-z]+) /)?.[1];
  if (book) {
    const normalizedBook = BOOKS[book] ?? book;
    let selection = value.slice(book.length).trim();
    if (['2 Jn', '3 Jn', 'Jude'].includes(normalizedBook)) selection = selection ? `1:${selection}` : '1';
    if (normalizedBook === 'Jl' && selection.startsWith('4:')) selection = `3:${selection.slice(2)}`;
    return { ref: `${normalizedBook} ${selection}`, book: normalizedBook };
  }
  return { ref: `${inheritedBook} ${value}`, book: inheritedBook };
}

function normalizeRefs(raw) {
  const parts = raw.split(';');
  const refs = [];
  let book = '';
  for (const part of parts) {
    const normalized = normalizePart(part, book);
    book = normalized.book;
    if (refs.length && refs.at(-1).startsWith(`${book} `) && !/^[1-3]? ?[A-Za-z]+ /.test(part.trim())) {
      refs[refs.length - 1] += `, ${normalized.ref.slice(book.length + 1)}`;
    } else refs.push(normalized.ref);
  }
  return refs;
}

function slot(label) {
  let match = label.match(/^(\d+)(?:st|nd|rd|th) Sunday of (Advent|Lent|Easter)$/);
  if (match) return { season: match[2].toLowerCase(), week: Number(match[1]), day: 'sunday' };
  match = label.match(/^(\d+)(?:st|nd|rd|th) Week of (Advent|Lent|Easter)[:,] (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)$/);
  if (match) return { season: match[2].toLowerCase(), week: Number(match[1]), day: DAYS[match[3]] };
  match = label.match(/^(\d+)(?:st|nd|rd|th) Sunday in Ord\. Time$/);
  if (match) return { season: 'ordinaryTime', week: Number(match[1]), day: 'sunday' };
  match = label.match(/^(\d+)(?:st|nd|rd|th) Week in Ord\. Time, (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)$/);
  if (match) return { season: 'ordinaryTime', week: Number(match[1]), day: DAYS[match[2]] };
  return null;
}

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
const html = await response.text();
const entries = {};
for (const row of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
  const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => text(match[1]));
  if (cells.length < 2) continue;
  const location = slot(cells[0]);
  if (!location) continue;
  const key = `${location.season}:week${location.week}:${location.day}`;
  const refs = normalizeRefs(cells[1]);
  entries[key] = { refs, sourceLabel: cells[0], ...(refs.some((ref) => UNRENDERABLE.has(ref)) && { renderable: false }) };
}

const canonical = { source: SOURCE, sourceUpdated: '2025-10-19', cycle: 'one-year printed Liturgy of the Hours', entries };
await writeFile(OUTPUT, `${JSON.stringify(canonical, null, 2)}\n`);
console.log(`Wrote ${Object.keys(entries).length} canonical week/day assignments to ${OUTPUT}.`);
