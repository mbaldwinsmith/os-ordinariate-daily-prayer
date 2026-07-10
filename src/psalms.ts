// Resolves a psalm reference (see CONVENTIONS.md) to its actual Coverdale
// text. Part of Phase 6 (Psalm Text Backfill) - proving the skeleton's
// placeholder psalm references now resolve to real verse text end to end.
import coverdalePsalter from '../data/texts/coverdale-psalter.json';

const PSALM_REF_PATTERN = /^Ps (\d{1,3})(?::(.+))?$/;

export interface ResolvedPsalm {
  ref: string;
  /** Verse number (as a string key) -> text, sliced to the requested range if the ref had one. */
  verses: Record<string, string>;
}

const psalms = coverdalePsalter.psalms as Record<string, Record<string, string>>;

export function resolvePsalmRef(ref: string): ResolvedPsalm {
  const match = ref.match(PSALM_REF_PATTERN);
  if (!match) throw new Error(`Invalid psalm reference: ${ref}`);
  const [, psalmNumber, verseExpression] = match;

  const allVerses = psalms[psalmNumber];
  if (!allVerses) throw new Error(`No text for Psalm ${psalmNumber} (ref: ${ref})`);
  if (!verseExpression) return { ref, verses: allVerses };
  const verses: Record<string, string> = {};
  for (const segment of verseExpression.split(',')) {
    const range = segment.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!range) throw new Error(`Invalid psalm reference segment: ${segment} (ref: ${ref})`);
    const start = Number(range[1]);
    const end = Number(range[2] ?? range[1]);
    for (let v = start; v <= end; v++) {
      const text = allVerses[String(v)];
      // Canonical LOTH and Coverdale verse segmentation can differ at endpoints.
      if (text !== undefined) verses[String(v)] = text;
    }
  }
  if (Object.keys(verses).length === 0) throw new Error(`Psalm ${psalmNumber} has no verses in the requested selection (ref: ${ref})`);
  return { ref, verses };
}
