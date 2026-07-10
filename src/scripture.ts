// Resolves a scripture reference (see CONVENTIONS.md) to its actual
// Douay-Rheims-Challoner text. Supports a whole chapter ("Gn 1"), a single
// verse ("Rom 1:1"), a range, or the cross-chapter/discontiguous forms
// documented in CONVENTIONS.md (for example "1 Cor 12:31-13:8, 13:13").
import bookAbbreviations from '../data/texts/book-abbreviations.json';
import drc from '../data/texts/douay-rheims-challoner.json';

const SCRIPTURE_REF_PATTERN = /^([A-Za-z0-9 ]+?) (\d+)(?::(.+))?$/;

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
  const [, abbrev, firstChapter, verseExpression] = match;

  const book = abbreviations[abbrev];
  if (!book) throw new Error(`Unknown book abbreviation: ${abbrev} (ref: ${ref})`);

  const wholeChapter = books[book]?.[firstChapter];
  if (!wholeChapter) throw new Error(`No text for ${book} chapter ${firstChapter} (ref: ${ref})`);
  if (!verseExpression) return { ref, verses: wholeChapter };

  type Range = { startChapter: number; startVerse: number; endChapter: number; endVerse: number };
  const ranges: Range[] = [];
  let currentChapter = Number(firstChapter);
  for (const rawSegment of verseExpression.split(',')) {
    const segment = rawSegment.trim();
    const segmentMatch = segment.match(/^(?:(\d+):)?(\d+)(?:-(?:(\d+):)?(\d+))?$/);
    if (!segmentMatch) throw new Error(`Invalid scripture reference segment: ${segment} (ref: ${ref})`);
    const [, explicitChapter, startVerse, endChapter, endVerse] = segmentMatch;
    const startChapter = explicitChapter ? Number(explicitChapter) : currentChapter;
    const finishChapter = endChapter ? Number(endChapter) : startChapter;
    ranges.push({
      startChapter,
      startVerse: Number(startVerse),
      endChapter: finishChapter,
      endVerse: Number(endVerse ?? startVerse),
    });
    currentChapter = startChapter;
  }

  const multipleChapters = new Set(ranges.flatMap((range) => [range.startChapter, range.endChapter])).size > 1;
  const verses: Record<string, string> = {};
  for (const range of ranges) {
    for (let chapterNumber = range.startChapter; chapterNumber <= range.endChapter; chapterNumber++) {
      const chapter = books[book]?.[String(chapterNumber)];
      if (!chapter) throw new Error(`No text for ${book} chapter ${chapterNumber} (ref: ${ref})`);
      const start = chapterNumber === range.startChapter ? range.startVerse : 1;
      const chapterEnd = Math.max(...Object.keys(chapter).map(Number));
      const end = chapterNumber === range.endChapter ? range.endVerse : chapterEnd;
      for (let verseNumber = start; verseNumber <= end; verseNumber++) {
        const text = chapter[String(verseNumber)];
        if (text === undefined) throw new Error(`${book} ${chapterNumber} has no verse ${verseNumber} (ref: ${ref})`);
        verses[multipleChapters ? `${chapterNumber}:${verseNumber}` : String(verseNumber)] = text;
      }
    }
  }
  return { ref, verses };
}
