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

## Office of Readings — all seasons, both years

- **Status: UNVERIFIED, best-effort reconstruction throughout.** No GitHub-reachable
  authoritative lectionary index exists in this session's network sandbox (same limitation
  as the Psalter and psalter skeleton above), so none of this is a transcription of the
  official assignment. Every file is `"verified": false`, surfaced visibly in the UI.
- **Patristic/hagiographic second readings: omitted entirely** (`patristicReading`/
  `secondReading`: `null` throughout) - the pragmatic MVP fallback TASKS.md itself suggests,
  since the DRC text has no patristic content and sourcing one is a separate decision not
  made yet.

### Week-based seasons (Ordinary Time, Advent, Lent's 5 numbered weeks, Easter)

- **Generated by**: `scripts/generate-office-of-readings.mjs` (`npm run generate:office-of-readings`)
  → `data/office-of-readings/year{I,II}/{ordinaryTime,advent,lent,easter}/week<N>/<day>.json`
  (700 files: (34+4+5+7) weeks x 2 years x 7 days).
- **Approach**: each season/year gets a list of real books (`SEASONS` in the generation
  script); the generator concatenates every chapter of every listed book in order into one
  flat day-by-day sequence, then cycles back to the start of the list if the season runs
  longer than the list's total chapter count. Reading continues seamlessly across week
  (and even book) boundaries rather than restarting at chapter 1 each week - a correction
  from this script's first version (which only ever read a book's first 7 chapters
  regardless of length, wasting most long books' content); Year I Ordinary Time was
  regenerated with the corrected algorithm for consistency, using the same book list as
  originally shipped.
- **Book lists, deliberately different Year I vs. Year II** (so the two-year cycle isn't
  just a repeat) and thematically matched to season where reasonable:
  - Ordinary Time Year I: Genesis through Zechariah (the OT, front-to-back).
  - Ordinary Time Year II: the remaining OT books (Chronicles/Ezra/Nehemiah/Esther/
    Malachi/1 Maccabees, front-loaded so they're guaranteed to appear) followed by the
    full NT (epistles, Gospels, Acts) - 34 weeks can't fit the entire NT either, which is
    fine/realistic; the list is ordered so shorter books aren't crowded out by longer ones.
  - Advent Year I: Isaiah (continuous) - the quintessential Advent book.
  - Advent Year II: Micah, Zephaniah, Haggai, Zechariah, Malachi, then Romans - messianic
    prophecy plus Pauline anticipation, distinct from Year I's Isaiah focus.
  - Lent Year I: Deuteronomy, then Jeremiah - covenant/penitential themes.
  - Lent Year II: II Corinthians, then Hebrews - cross/priesthood/suffering themes.
  - Easter Year I: Acts, then I John, then Revelation of John.
  - Easter Year II: Acts, then I Peter, then Revelation of John. (Acts appears both years
    deliberately - it genuinely is the standard Easter-season reading in real practice.)
- **Verification status**: spot-checked via a real browser smoke test across all four
  seasons and both years (see below) - confirmed real, coherent scripture text renders,
  not that the specific week/book pairing is correct.

### Proper (non-week-numbered) content: Triduum, Christmas season, Ash-Wednesday stub

- **Generated by**: `scripts/generate-office-of-readings-proper.mjs` →
  `data/proper-of-seasons/<key>.json` (26 files). **Not** split Year I/II - `schema/proper.schema.json`
  has no year concept, matching how this content doesn't really vary by year in common
  practice either (the Triduum especially is the same every year in real breviaries).
- **A few choices here carry real traditional grounding**, unlike the systematic week-cycling
  above - specifically: **Joel 2** for Ash Wednesday ("Rend your hearts"), **Isaiah 52-53**
  for Good Friday (the Suffering Servant - about as universal a Good Friday association as
  exists across Christian traditions), **Isaiah 9** for Christmas ("unto us a child is
  born"), **Isaiah 60** for Epiphany ("Arise, shine"), and **Jeremiah 31** for Holy
  Innocents ("Rachel weeping for her children", directly quoted in Matthew's own account of
  the event). Still marked `"verified": false` since none of it has been checked against a
  primary lectionary text, but these specific picks are a cut above the generic
  systematic-cycling approach used everywhere else.
- **Exodus 12** (the Passover institution) for Holy Thursday and **Lamentations 3** for
  Holy Saturday are more ordinary systematic-but-thematic picks, not as strongly
  established as the ones above.
- **Christmas season keying caveat**: most Christmas-season days are keyed reliably by
  romcal's own celebration key (solemnities/feasts are never displaced), but the lower-rank
  "before/after Epiphany" ferial days can occasionally be occupied by an optional memorial
  in a given year - those specific days just won't resolve that year rather than showing
  wrong content. See `CONVENTIONS.md`.
- **Ash-Wednesday-stub keying caveat**: unlike the Triduum, this 4-day stretch's romcal key
  is *not* reliably stable year to year (a commemoration can occupy the Saturday), so
  `src/officeOfReadings.ts` maps these by day-of-week instead of by romcal key - see
  `CONVENTIONS.md`.

### Phase 8: solemnity/proper-of-saints overrides

- **Generated by**: the same `scripts/generate-office-of-readings-proper.mjs`, extended with
  three more entry lists → 14 more `data/proper-of-seasons/<key>.json` files (6 moveable
  solemnities + the 8-day Easter octave) and the first 7 `data/proper-of-saints/<key>.json`
  files. All still `"verified": false`.
- **The Easter octave** (`easter`, `easterMonday`…`easterSaturday`, `divineMercySunday`) is
  the one true gap Phase 8 needed to close: `psalterWeek` is `'easter'` for these 8 days
  (confirmed against romcal for 2025: April 20-27), and the four-week psalter skeleton
  (`src/psalter.ts`) has no entry for that value at all - unlike every other solemnity,
  which can fall back to the ferial psalter for its Hours. So these 8 files carry a full
  `hours` override (all five Hours) rather than just a `firstReading`. The psalms/canticles
  are a best-effort curated selection of traditionally Easter-associated texts - Psalm 118
  ("This is the day the Lord has made") for Easter Sunday, the Canticle of Moses at the Red
  Sea (Exodus 15) for Easter Sunday Lauds, Benedicite for Divine Mercy Sunday's Lauds
  (matching the ferial skeleton's own Sunday-Lauds convention) - not a transcription of an
  official breviary. **Compline is the one exception**: instead of inventing new Compline
  psalms for the octave, each day just reuses the same day-of-week Compline psalm the
  ferial skeleton already assigns (`Ps 91`/`86`/`143`/`31`/`16`/`88`/`4`+`134` for
  Sun-Sat), since Compline is a fixed weekly cycle independent of psalter week/season in the
  real breviary too.
- **First readings for the Easter octave** follow Acts of the Apostles (Acts 1-6 across the
  weekdays), the traditional Office of Readings book for this week, plus 1 Corinthians 15
  (the resurrection chapter) for Easter Sunday itself and John 20 (the Doubting Thomas
  narrative, the Gospel always proclaimed at Mass that day) for Divine Mercy Sunday.
- **Other moveable solemnities** (`ascension`, `pentecostSunday`, `trinitySunday`,
  `corpusChristi`, `sacredHeartOfJesus`, `christTheKing`) and **fixed-date solemnities**
  (`josephHusbandOfMary`, `annunciation`, `birthOfJohnTheBaptist`, `peterAndPaulApostles`,
  `assumption`, `allSaints`, `immaculateConception`, in the newly-populated
  `data/proper-of-saints/`) get **first-reading-only** overrides - a systematically
  thematic scripture chapter for each (e.g. Acts 2 for Pentecost, Revelation 12 "a woman
  clothed with the sun" for the Assumption), with no `hours` override at all. Lauds,
  Vespers, and the other Hours fall back to the ferial psalter skeleton on these days, which
  is the fallback behavior TASKS.md Phase 8 explicitly calls for rather than a corner cut.
- **This is a representative slice, not exhaustive coverage.** The ~180 remaining
  memorials/feasts across the year, and full Hours-level proper psalmody for the 13
  non-Easter-octave solemnities listed above, remain genuinely ongoing/incremental work per
  TASKS.md - the day-resolution function (`src/office.ts`) always renders a sensible ferial
  fallback for anything not yet populated here.

### Shared infrastructure

- **`data/texts/book-abbreviations.json`**: extracted the book-abbreviation table from
  `CONVENTIONS.md` into a shared, schema-validated data file so the generation scripts and
  the runtime resolver (`src/scripture.ts`) can't drift out of sync. `scripts/validate-data.mjs`
  cross-checks every abbreviation resolves to a real book in the DRC text, and every
  generated `scriptureReading.ref`/`firstReading.ref` actually resolves - not just that the
  JSON is schema-shaped.
- **`OfficeDay.celebrationKey`** (`src/calendar.ts`): exposes romcal's own stable celebration
  key directly, used to look up `proper-of-seasons`/`proper-of-saints` files by key rather
  than re-deriving one. See the reliability caveats above and in `CONVENTIONS.md`.

## Antiphons

- **MVP status: omitted entirely.** The app does not currently include antiphons for
  psalms, canticles, Office of Readings, seasons, saints, or propers.
- **Reason for omission**: no public-domain official antiphon source has been identified
  and verified for this project, and the project owner chose omission for MVP rather than
  composing original Coverdale-register antiphons. This keeps the sourced-text boundary
  explicit instead of presenting newly written devotional text as though it were part of
  the official Liturgy of the Hours.
- **Future work**: antiphons may be added later if they are sourced from an appropriate
  public-domain text, or if original non-official devotional antiphons are intentionally
  designed, labelled, and documented before use.

## Short Scripture reading assignments (Phase 10 follow-up)

- **Lauds and Vespers reference assignments**: factual citations transcribed from the
  four-week psalter JSON in `rosangmin-code/divine-office` at commit
  `4919f89575594db6330d39a054ac2937ec4ffd33`. That project records page numbers against a
  Mongolian Catholic breviary transcription. No Mongolian prose is copied into this app.
- **Daytime Prayer reference assignments**: factual `READING` citations from the 28
  published `ord-w0N-<day>-dp2-current` Midday Prayer pages at `divineoffice.org`, one for
  every day of the four-week psalter. Only citations were retained.
- **Representative proper overrides**: Christmas and the Easter octave use the same
  page-referenced seasonal dataset. The Assumption uses the factual citations from the
  published Divine Office pages for Morning Prayer, Midday Prayer, and Evening Prayer II
  (`Is 61:10`, `Rv 12:1`, and `1 Cor 15:22-23`). Proper coverage remains incremental;
  anything absent falls back to the ferial assignment where a four-week psalter exists.
- **Compline reference assignments**: factual citations from
  `rosangmin-code/divine-office/src/data/loth/ordinarium/compline.json` at the commit above.
- **Displayed text**: every citation resolves locally into the public-domain
  Douay-Rheims-Challoner dataset already documented in this file; no source translation
  from either assignment index is redistributed.
- **Verification status**: every assignment is `"verified": false`. The GitHub dataset is
  page-referenced and the Divine Office pages agree with known breviary placements, but
  the underlying approved printed edition was not independently reachable for a
  line-by-line check. Clause-level `a`/`b` references are expanded to whole DRC verses as
  documented in `CONVENTIONS.md`.
