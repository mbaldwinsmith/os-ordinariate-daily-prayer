// Resolves a scripture reference (see CONVENTIONS.md) to its actual
// Douay-Rheims-Challoner text. Supports a whole chapter ("Gn 1"), a single
// verse ("Rom 1:1"), or a verse range within one chapter ("Rom 1:1-7") -
// not yet the cross-chapter or discontiguous forms CONVENTIONS.md also
// allows (e.g. "2 Cor 4:16-5:10", "1 Cor 12:31-13:8, 13:13"), since no
// reading generated so far needs them.
import bookAbbreviations from '../data/texts/book-abbreviations.json';
import drc from '../data/texts/douay-rheims-challoner.json';

const SCRIPTURE_REF_PATTERN = /^([A-Za-z0-9 ]+?) (\d+)(?::(\d+)(?:-(\d+))?)?$/;

export interface ResolvedScripture {
  ref: string;
  /** Verse number (as a string key) -> text. */
  verses: Record<string, string>;
}

const books = drc.books as Record<string, Record<string, Record<string, string>>>;
const abbreviations = bookAbbreviations as Record<string, string>;

export function resolveScriptureRef(ref: string): ResolvedScripture {
  const match = ref.match(SCRIPTURE_REF_PATTERN);
  if (!match) throw new Error(`Invalid scripture reference: ${ref}`);
  const [, abbrev, chapterNumber, startVerse, endVerse] = match;

  const book = abbreviations[abbrev];
  if (!book) throw new Error(`Unknown book abbreviation: ${abbrev} (ref: ${ref})`);

  const chapter = books[book]?.[chapterNumber];
  if (!chapter) throw new Error(`No text for ${book} chapter ${chapterNumber} (ref: ${ref})`);

  if (!startVerse) return { ref, verses: chapter };

  const start = Number(startVerse);
  const end = endVerse ? Number(endVerse) : start;
  const verses: Record<string, string> = {};
  for (let v = start; v <= end; v++) {
    const text = chapter[String(v)];
    if (text === undefined) throw new Error(`${book} ${chapterNumber} has no verse ${v} (ref: ${ref})`);
    verses[String(v)] = text;
  }
  return { ref, verses };
}
