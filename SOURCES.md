# SOURCES.md

Provenance, licensing, and known gaps for the two public-domain texts this app uses. See
`CONVENTIONS.md` for the reference format and data-key conventions these scripts produce.

## Douay-Rheims-Challoner (scripture readings, variable canticles)

- **Text**: Douay-Rheims Bible, Challoner Revision, as commonly reprinted in the 1899
  American edition. Public domain.
- **Acquired via**: [`scrollmapper/bible_databases`](https://github.com/scrollmapper/bible_databases),
  commit `16db66f83c1232146b356a255159b5327398d4dc`, file `formats/json/DRC.json`. That
  repository's own compilation/tooling is MIT-licensed; the Bible text itself is public
  domain independent of that license.
- **Ingestion script**: `scripts/fetch-douay-rheims.mjs` → `data/texts/douay-rheims-challoner.json`
  (37,255 verses across 78 books — the 73-book Catholic canon plus a 5-book apocryphal
  appendix the Vulgate traditionally carries: Prayer of Manasses, I/II Esdras, an
  "Additional Psalm" [151], and Laodiceans. None of the appendix is used by the Roman Rite
  lectionary this app implements).
- **Normalization note**: the scrollmapper dataset normalizes book names/numbering to a
  common scheme shared across its ~140 translations for cross-referencing, so it uses
  "I Samuel"/"I Kings"/"II Kings" rather than the traditional Douay "1 Kings"/"3 Kings"/
  "4 Kings", and "Song of Solomon"/"Sirach"/"Revelation of John" rather than "Canticle of
  Canticles"/"Ecclesiasticus"/"Apocalypse". This affects internal storage keys only (see
  `CONVENTIONS.md`); citation headers shown to users in Phase 10 can still say "a reading
  from the book of Ecclesiasticus" etc. if that's the desired lectionary style.
- **Verification status**: not yet spot-checked verse-by-verse against a second source.
  Flagged for the accuracy pass in Phase 7/Phase 6-equivalent for scripture readings.

## Coverdale Psalter (psalms, fixed canticles)

- **Text**: the Psalter from the 1662 Book of Common Prayer (Church of England) — Miles
  Coverdale's translation as carried into the Great Bible and thence the BCP, pointed for
  singing/recitation. Public domain.
- **Acquired via**: [`santeyio/st-andrews-psalter`](https://github.com/santeyio/st-andrews-psalter),
  commit `680dd72f800fe7c43a99c74fb094ec953ae33bdf`, file `src/psalms/psalms.js`. That repo
  is a personal chant-pointing PWA project with **no declared license** for its own
  transcription/HTML formatting. Only the underlying plain public-domain wording was
  extracted here — all Gregorian-tone assignments and `<u>`-tag chant-pointing markup were
  stripped by `scripts/fetch-coverdale-psalter.mjs` before anything was committed to this
  repo, so no copyrightable expression from that project is retained.
- **Ingestion script**: `scripts/fetch-coverdale-psalter.mjs` → `data/texts/coverdale-psalter.json`.

### Known gap — INCOMPLETE, needs finishing

The upstream source is itself an unfinished transcription: **only Psalms 1-65 of 150 are
present** (977 verses), and it has no canticle text at all. This was a deliberate,
user-approved tradeoff to get Phase 1 moving rather than block on it — see the `missing`
array in `data/texts/coverdale-psalter.json` for the exact list (66-150).

This session's network sandbox blocks direct access to the usual full-text sources for this
psalter (`eskimo.com`, `archive.org`, `justus.anglican.org`, Project Gutenberg's full-text
pages all rejected by the outbound proxy's allowlist) — only GitHub/npm/PyPI-style hosts are
reachable. Completing the psalter requires one of:

1. A future session with broader network access, to pull from one of the fuller sources
   identified during research (`eskimo.com/~lhowell/bcp1662/psalter/`, an OCR'd 1662 BCP on
   archive.org, or EEBO-TCP's TEI-XML transcription of an actual 17th-century printing).
2. Someone pasting/uploading the missing text directly.
3. Manual transcription from a physical or PDF copy, verse-checked against `CONVENTIONS.md`.

Whichever path is used, extend `scripts/fetch-coverdale-psalter.mjs` (or add a second
ingestion step) rather than hand-editing the generated JSON, so the pipeline stays
reproducible.

### Wording discrepancy to verify

The Gloria Patri extracted from the source reads "...and to the Holy **Spirit**..."; the
traditional 1662 wording is "...and to the Holy **Ghost**...". This may be a modernization
introduced by the upstream project rather than the authentic 1662 text. Needs checking
against a primary source before this ships — tracked here rather than silently "corrected"
from memory.

### Verification status

Spot-checked Psalms 1 and 22 against known text during ingestion (matched exactly once
formatting artifacts were stripped); the rest of Psalms 1-65 has not been individually
verified. Full verification is Phase 6's job ("spot-check a sample of transcribed psalms
against the source for accuracy").
