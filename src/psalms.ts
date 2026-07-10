// Resolves a psalm reference (see CONVENTIONS.md) to its actual Coverdale
// text. Part of Phase 6 (Psalm Text Backfill) - proving the skeleton's
// placeholder psalm references now resolve to real verse text end to end.
import coverdalePsalter from '../data/texts/coverdale-psalter.json';

const PSALM_REF_PATTERN = /^Ps (\d{1,3})(?::(\d{1,3})(?:-(\d{1,3}))?)?$/;

export interface ResolvedPsalm {
  ref: string;
  /** Verse number (as a string key) -> text, sliced to the requested range if the ref had one. */
  verses: Record<string, string>;
}

const psalms = coverdalePsalter.psalms as Record<string, Record<string, string>>;

export function resolvePsalmRef(ref: string): ResolvedPsalm {
  const match = ref.match(PSALM_REF_PATTERN);
  if (!match) throw new Error(`Invalid psalm reference: ${ref}`);
  const [, psalmNumber, startVerse, endVerse] = match;

  const allVerses = psalms[psalmNumber];
  if (!allVerses) throw new Error(`No text for Psalm ${psalmNumber} (ref: ${ref})`);
  if (!startVerse) return { ref, verses: allVerses };

  const start = Number(startVerse);
  const end = endVerse ? Number(endVerse) : start;
  const verses: Record<string, string> = {};
  for (let v = start; v <= end; v++) {
    const text = allVerses[String(v)];
    if (text === undefined) throw new Error(`Psalm ${psalmNumber} has no verse ${v} (ref: ${ref})`);
    verses[String(v)] = text;
  }
  return { ref, verses };
}
