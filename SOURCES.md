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
  (35,817 verses across 73 books — the Catholic canon only. The source dataset also carries
  a 5-book Vulgate apocryphal appendix - Prayer of Manasses, I/II Esdras, an "Additional
  Psalm" [151], and Laodiceans - which the ingestion script deliberately excludes: none of
  it is used by the Roman Rite lectionary this app implements, and in this particular
  source every verse in that appendix is empty anyway, so keeping it would just be dead,
  invalid-per-schema placeholder data).
- **Normalization note**: the scrollmapper dataset normalizes book names/numbering to a
  common scheme shared across its ~140 translations for cross-referencing, so it uses
  "I Samuel"/"I Kings"/"II Kings" rather than the traditional Douay "1 Kings"/"3 Kings"/
  "4 Kings", and "Song of Solomon"/"Sirach"/"Revelation of John" rather than "Canticle of
  Canticles"/"Ecclesiasticus"/"Apocalypse". This affects internal storage keys only (see
  `CONVENTIONS.md`); citation headers shown to users in Phase 10 can still say "a reading
  from the book of Ecclesiasticus" etc. if that's the desired lectionary style.
- **Known gap - 12 empty verses within the Catholic canon**: `schema/scripture.schema.json`
  requires non-empty verse text, and validating the ingested file against it turned up 12
  verses that are empty strings in the upstream source. Every one of them is the *last*
  verse of its chapter or book, which looks like a systematic off-by-one truncation bug in
  however scrollmapper originally built `DRC.json`, not a random gap:
  `2 Sm 13:39`, `1 Kgs 17:19`, `Ps 150:6`, `Prv 30:29`, `Sir 29:35`, `Is 46:13`, `Bar 6:37`,
  `Jn 11:57`, `2 Cor 1:24`, `1 Thes 4:18`, `2 Thes 2:17`, `3 Jn 1:15`. `scripts/validate-data.mjs`
  treats exactly these 12 references as a documented, non-fatal warning (not a build
  failure) so CI doesn't block on a known, narrow, already-tracked issue - but it still
  fails on any *other* empty verse, to catch new regressions. These 12 need their correct
  Challoner-revision wording sourced and patched in during Phase 7 (do not fill them in
  from memory - the whole point of tracking this here is to source them properly).
- **Verification status**: not yet spot-checked verse-by-verse against a second source
  beyond the empty-verse check above. Flagged for the accuracy pass in Phase 7/Phase
  6-equivalent for scripture readings.

## Coverdale Psalter (psalms)

- **Text**: the Coverdale Psalter (Miles Coverdale's translation, 1539, as carried into the
  Great Bible and thence every English Book of Common Prayer), standard Hebrew/Masoretic
  numbering. Public domain (Crown Copyright applies to printing the BCP text specifically
  in the United Kingdom - see
  [Cambridge University Press's rights and permissions page](https://www.cambridge.org/universitypress/bibles/about/rights-and-permissions) -
  not relevant to this project's use).
- **Acquired via**: [`pmachapman/GoTo.Bible`](https://github.com/pmachapman/GoTo.Bible),
  commit `4631539bf6b03cab4fe52dcb19caaa1719eac557`, file
  `GoToBible.Providers/Texts/BCPPSALMS.txt` (LGPL-2.1-licensed repo; the bundled BCP text
  itself is called out as public domain in the repo's own translation metadata,
  independent of that license). Plain "`Psalm N:V  text`" format, all 150 psalms, no markup
  to strip.
- **Ingestion script**: `scripts/fetch-coverdale-psalter.mjs` → `data/texts/coverdale-psalter.json`
  (2,507 verses across all 150 psalms - complete, no gaps).
- **Superseded source**: Phase 1 initially used
  [`santeyio/st-andrews-psalter`](https://github.com/santeyio/st-andrews-psalter), which was
  only Psalms 1-65 of 150 (an unfinished upstream transcription) and required stripping
  chant-pointing markup. Before switching, the two sources' wording was cross-checked
  against each other for Psalms 1, 22, and 51: matched exactly aside from expected
  typographic normalization (this project's `*` mediation mark vs. the new source's `:`,
  and small-caps `LORD` vs. plain `Lord` - both just different printing conventions, not
  wording differences) plus a handful of genuine minor textual variants consistent with
  different BCP printings over the centuries (e.g. "He trusted in the LORD" vs. "He trusted
  in God" at Ps 22:8). Given that, switching entirely to the new source for all 150 psalms
  - rather than keeping a two-source hybrid - was the safer choice for internal consistency,
  even though it means Psalms 1-65 are no longer verbatim what shipped in the Phase 1 PR.
- **Gloria Patri wording resolved**: Phase 1 flagged "Holy Spirit" (from the old source) as
  a possible modernization of the traditional "Holy Ghost", but didn't have primary-source
  backing to correct it. A GitHub code search across many independent traditional-liturgy
  sources (Anglican, Roman Breviary, and general English prayer-book texts) turned up
  "Holy Ghost" overwhelmingly and consistently - including `dailyoffice2019`'s own
  translation-mapping file explicitly treating "Holy Ghost" as the traditional form that
  "Holy Spirit" modernizes. Corrected to "Holy Ghost" in `scripts/fetch-coverdale-psalter.mjs`
  with that evidence noted, rather than left as an open discrepancy or "silently" changed
  from memory alone.
- **Verification status**: cross-checked against the previous source for Psalms 1, 22, and
  51 (see above); Psalm 100 and 150 spot-checked against well-known text during ingestion.
  The remaining ~145 psalms have not been individually verified against a second primary
  source. Full verification remains Phase 6's job ("spot-check a sample of transcribed
  psalms against the source for accuracy").

## Fixed canticles (Benedictus, Magnificat, Nunc Dimittis, Benedicite)

- **Text**: the traditional-language canticle texts of the 2019 ACNA (Anglican Church in
  North America) Book of Common Prayer, **not** literally the 1662 BCP text — this session's
  network sandbox couldn't reach a primary 1662 source for these (same restriction noted
  under the Psalter above), and no GitHub-hosted 1662-specific source turned up. The 2019
  ACNA "traditional" track deliberately preserves historic Cranmerian/Coverdale-lineage
  wording, and what was pulled matches known 1662 wording closely (spot-checked against the
  Benedictus and Magnificat's well-known opening/closing lines), but it has not been
  verified line-by-line against a genuine 1662 print and may carry small differences from
  a later prayer-book revision. Needs a verification pass against a primary 1662 source.
- **Acquired via**: [`blocher/dailyoffice2019`](https://github.com/blocher/dailyoffice2019),
  commit `53e4a3a09418324b590d3f636ad9d6678b245e16`, files
  `site/office/api/texts/{mp3,ep1,ep2,s10}_traditional.csv`. MIT-licensed.
- **Ingestion script**: `scripts/fetch-fixed-canticles.mjs` → `data/texts/fixedCanticles.json`.
  Editorial section-heading rows the source adds for readability (e.g. "I. The Cosmic
  Order" within the Benedicite) are structural additions from the 2019 ACNA edition, not
  part of the 1662 text itself, and are dropped entirely during ingestion - only the actual
  canticle wording is kept. The one American-English spelling found (Savior) was mechanically
  normalized to the British spelling this project's register requires (Saviour); no other
  wording was touched.
- **Gloria Patri**: not included per-canticle - reuses the same `gloriaPatri` string already
  captured once in `data/texts/coverdale-psalter.json`, recited after canticles the same way
  it's recited after psalms.
- **Benedicite's scripture reference is unconfirmed**: it's part of the Greek addition to
  Daniel 3 (the Song of the Three Young Men), which may or may not be present at the
  expected reference in `data/texts/douay-rheims-challoner.json`'s `Daniel` book - needs
  checking during Phase 8 rather than assumed now.
- **Verification status**: not yet spot-checked verse-by-verse against a primary 1662
  source. Flagged for the accuracy pass in Phase 4/6.

## Four-week psalter skeleton (which psalms/canticles fall on which day/hour)

- **Status: UNVERIFIED, best-effort reconstruction.** The standard reference for this
  (e.g. `catholic-resources.org/LoH/Psalter-Index.html`) is not reachable from this
  session's network sandbox - same restriction as the Psalter text and canticles above -
  and no GitHub-hosted structural index turned up either. User-approved tradeoff: proceed
  using general knowledge of the reformed Liturgy of the Hours rather than block Phase 5.
- **Generated by**: `scripts/generate-psalter-skeleton.mjs` (`npm run generate:psalter-skeleton`)
  → `data/psalter/week{1,2,3,4}/{sunday,...,saturday}.json`. Every generated file carries
  `"verified": false`, and `src/office.ts`/`src/main.ts` surface a visible warning banner
  for any unverified day, rather than silently presenting the reconstruction as authoritative.
- **What's solid vs. what needs checking**:
  - Solid: the whole 150-psalm Psalter (minus Psalms 58, 83, 109, which the 1971 reform
    omits entirely) is prayed exactly once across the four weeks - a well-established fact.
    Psalm 119's 22 eight-verse sections are spread across Daytime Prayer. Compline uses a
    single fixed *weekly* (not four-weekly) rotation, not the four-week cycle.
  - Solid-ish: the specific set of Old Testament canticles used at weekday Lauds and New
    Testament canticles at Vespers (`OT_CANTICLES`/`NT_CANTICLES` in the generation script)
    are the real canticles the reformed Liturgy of the Hours actually draws on - not
    fabricated - but their assignment to a *specific* week/day is a systematic cycle through
    that list, not a transcription of the official pairing.
  - Needs verification (Phase 6, "confirm the skeleton against an authoritative structural
    reference"): the exact day-to-day pairing of which psalm/canticle falls on which
    specific day of which specific week. The generation script assigns psalms by cycling
    sequentially through the usable-psalm list rather than the official assignment, so
    while every psalm/canticle reference in the skeleton is real and valid, *which day it's
    assigned to* is not verified against the official breviary.
  - Benedicite is used as the Sunday Lauds canticle across all four weeks (see
    `CONVENTIONS.md`) - this specific placement is fairly well-established, higher
    confidence than the general weekday canticle cycling above.
