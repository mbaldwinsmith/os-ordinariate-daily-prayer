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

**Current canonical source:** Fr. Felix Just, S.J., “The Liturgy of the Hours:
Psalter for the Four-Week Cycle,”
`https://catholic-resources.org/LoH/Psalter-Hours.html`, page last updated
2024-11-13 and transcribed 2026-07-10 into `canonical-psalter-skeleton.json`.
The dataset contains factual structural assignments and references only, not
copyrighted liturgical prose. It is the generator and CI diff target.

All generated days are now `"verified": true` except Week IV Thursday. Its Office of
Readings assignment (Psalm 44) duplicates Week II Thursday in the source table. This is
plausible but remains `"verified": false` pending a human check against a printed
breviary or Universalis. The pre-correction generator is preserved in Git history; the
Phase 13 canonical diff showed broad genuine assignment mismatches, not isolated errors.

The paragraphs below describe the superseded Phase 5 reconstruction and are retained as
historical provenance for what was previously deployed.

- **Superseded status: UNVERIFIED, best-effort reconstruction.** The standard reference for this
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

## Office of Readings — canonical printed one-year cycle

- **Structural source**: Fr. Felix Just, S.J.'s *Office of Readings: Biblical First
  Readings* table, compiled from the four-volume US *Liturgy of the Hours* with volume and
  page references: `https://catholic-resources.org/LoH/OfficeOfReadings-Biblical.html`
  (source page updated 2025-10-19). Only factual Scripture citations and day assignments
  are retained; none of the source edition's copyrighted biblical prose is copied.
- **Cycle correction**: the current printed breviary contains a one-year biblical cycle.
  GILH 145 also describes an optional two-year supplement, but the former generated Year
  I/II distinction was an invented reconstruction rather than that supplement. Both app
  year directories now intentionally contain the same sourced printed cycle.
- **Canonical pipeline**: `scripts/fetch-canonical-office-of-readings.mjs` transcribes the
  HTML table into `canonical-office-of-readings.json` (331 week/day slots),
  `scripts/generate-office-of-readings.mjs` generates both compatibility directories, and
  `scripts/diff-office-of-readings.mjs` prevents sourced assignments drifting in CI.
- **Coverage**: 642 of 700 generated files are verified. Nineteen liturgical slots per
  directory are not expressed as generic week/day rows in the source (principally
  date-dependent late Advent and proper-day substitutions). Ten sourced pericopes per
  directory cannot be rendered faithfully against the local DRC dataset because of
  versification or missing-verse differences. Those 58 files remain honestly
  `"verified": false` with a renderable whole-chapter fallback; the exact source citation
  remains in the canonical dataset for a future text/versification repair.
- **Patristic/hagiographic second readings: omitted entirely** (`patristicReading`/
  `secondReading`: `null` throughout) - the pragmatic MVP fallback TASKS.md itself suggests,
  since the DRC text has no patristic content and sourcing one is a separate decision not
  made yet.

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

Phase 9 originally omitted antiphons entirely - see the note below on why that decision
still holds for the *full* per-psalm daily antiphon cycle. A second search turned up three
contained, real antiphon systems that don't require that fuller apparatus, generated by
`scripts/fetch-antiphons.mjs` into `data/texts/invitatoryAntiphons.json`,
`data/texts/oAntiphons.json`, and `data/texts/marianAntiphons.json`. See `CONVENTIONS.md`
for how each is resolved.

### Invitatory antiphon and the "O Antiphons"

- **Source**: `blocher/dailyoffice2019` (MIT-licensed), commit
  `53e4a3a09418324b590d3f636ad9d6678b245e16` - the same repository/commit already used for
  `data/texts/fixedCanticles.json`. Transcribed directly from
  `site/office/morning_prayer.py`'s `MPInvitatory.antiphon` (the full season/weekday/
  solemnity-driven Invitatory antiphon cycle) and `site/office/evening_prayer.py`'s
  `EPCanticle1.get_antiphon` (the "O Antiphons", Dec 16-23 - the Sarum/English 8-antiphon
  tradition rather than the Roman tradition's 7, since this source targets the same
  Anglican patrimony as this app).
- **Verification status**: same standing as the fixed canticles - a real, traceable,
  MIT-licensed source, but the traditional-language text is the 2019 ACNA BCP's, not
  verified line-by-line against a primary 1662-tradition print. No `"verified"` field is
  set on these two files, matching how `fixedCanticles.json` itself is handled.

### The four seasonal Marian antiphons

- **Source**: `DivinumOfficium/divinum-officium`, commit
  `e52d8ba49ef3f6b3aaf73e190c5f9f51add2a535`, file
  `web/www/horas/English/Psalterium/Mariaant.txt`.
- **Why this one is different**: unlike the two sources above, this repository carries no
  explicit license file at all. More importantly, even a clearly-licensed repository
  wouldn't settle this on its own - a repo's license covers *its own* code/compilation, not
  necessarily the copyright status of a translated liturgical text it happens to host,
  which is a separate question from the ancient Latin originals' undisputed public-domain
  status. The specific English wording transcribed here (e.g. "Hail, holy Queen, Mother of
  Mercy, our life, our sweetness, and our hope...") does match long-attested traditional
  English translations found in many older hymnals and missals - but that's corroboration,
  not verification of *this specific source's* rights to it.
- **Verification status**: all four antiphons are explicitly `"verified": false` in
  `data/texts/marianAntiphons.json` (enforced by `schema/marian-antiphons.schema.json`,
  which requires the field to be `false`), and the UI surfaces a visible warning wherever
  they render. Future work: replace with a source that has clearer provenance for the
  English translation specifically, not just the Latin original.

### What's still not attempted: the full per-psalm antiphon cycle

The above are three specific, well-defined antiphons - not the full apparatus a Roman
monastic breviary carries, where nearly every psalm/canticle at every Hour has its own
antiphon that changes daily across an 8-week (or, in the modern four-week Liturgy of the
Hours, 4-week) psalter cycle. No public-domain, appropriately-licensed source for *that*
fuller system has been found, and composing original Coverdale-register antiphons for it
remains explicitly out of scope (see Phase 9's original decision) - it would cross the
sourced-text boundary this app otherwise holds firmly, presenting newly written devotional
text as though it were part of the official Liturgy of the Hours.

## Short Scripture reading assignments (Phase 10 follow-up)

- **Lauds and Vespers reference assignments**: factual citations transcribed from the
  four-week psalter JSON in `rosangmin-code/divine-office` at commit
  `4919f89575594db6330d39a054ac2937ec4ffd33`. That project records page numbers against a
  Mongolian Catholic breviary transcription. No Mongolian prose is copied into this app.
- **Daytime Prayer reference assignments**: factual `READING` citations from the 28
  published `ord-w0N-<day>-dp2-current` Midday Prayer pages at `divineoffice.org`, one for
  every day of the four-week psalter. Only citations were retained.
- **Sunday First Vespers reference assignments**: factual `READING` citations from the
  published Divine Office Evening Prayer I pages: `Dt 6:4-7`, `Col 1:2-6`,
  `Heb 13:20-21`, and `2 Pt 1:19-21` for Weeks I-IV. Clause-level endpoints were expanded
  to whole Douay-Rheims-Challoner verses under the project convention below.
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
- **Verification status**: every assignment started as `"verified": false`. The GitHub
  dataset is page-referenced and the Divine Office pages agree with known breviary
  placements, but the underlying approved printed edition was not independently reachable
  for a line-by-line check. Clause-level `a`/`b` references are expanded to whole DRC
  verses as documented in `CONVENTIONS.md`.

### Phase 14 cross-check: Breviarium

Fr. Just's site (the structural source for the psalter skeleton and Office of Readings,
Phases 13-14) has no equivalent table for these four short readings, so a second
independent structural source was used instead: the **Breviarium** open-source Liturgy of
the Hours library, `https://github.com/Breviarium-app/breviarium--core` at commit
`9772041f194e6f0c1368042dc21aa8ed7ecc461c` (Apache-2.0; attribution: "Based on 'Breviarium'
by Miguel Martínez (miguelms.es)"). Only its Spanish-language citation identifiers were
extracted (`scripts/fetch-canonical-short-readings.mjs` → `canonical-short-readings.json`,
diffed by `scripts/diff-short-readings.mjs`) - no reading text, Spanish or otherwise, is
retained or displayed.

- **Which Breviarium hour matches this app's Daytime Prayer**: this app models Daytime
  Prayer as one combined midday hour rather than separate Terce/Sext/None
  (`CONVENTIONS.md`). Cross-checking against all three of Breviarium's minor hours showed
  its **Sext** (`all_sexta.json`) is the one this app's existing Daytime Prayer citations
  already followed (25 of 26 comparable days matched exactly before any correction), so
  Sext is the one used.
- **Result**: 41 of the 78 comparable ferial citations (Lauds + Daytime Prayer + Vespers
  across the four weeks, Saturday excepted since it has no `vespers` entry - see
  `CONVENTIONS.md`) matched exactly and were flipped to `"verified": true` by
  `scripts/generate-short-readings-verification.mjs`. No `ref` values were changed by this
  pass - only citations Breviarium independently confirmed letter-for-letter were touched.
- **The other 33 (mostly Lauds and Vespers) disagree** with Breviarium on the exact verse
  boundary, almost always because this app's existing citation is the *wider* of the two
  (e.g. this app has `Rom 12:13-21`, Breviarium has `Rom 12:14-16`). The pattern is
  systematic rather than random, which could mean either source is right: this app's
  existing citations may carry padding from an imprecise original transcription, or
  Breviarium's edition may trim to a tighter selection than the US four-volume *Liturgy of
  the Hours*/*Christian Prayer* uses. Two of Tobit's/Judith's disagreements (`Tb 4:15-16,
  18-19` vs. `Tb 4:16-17, 19-20`; `Jdt 8:25-27` vs. `Jdt 8:21-23`) look like the deuterocanonical
  versification differences already documented elsewhere in this file, not a citation
  error either way. These 33 are left exactly as they were (`ref` unchanged,
  `"verified": false`) rather than silently adopting either source - a genuine open
  question for the still-outstanding human verification pass (see Phase 13.6/14 in
  `TASKS.md`), not a transcription failure.
- **Known gap in the cross-check source itself**: Breviarium's dataset omits a ferial
  Sunday entry for two of the four psalter weeks under the generic
  `ordinary_time_<N>_sunday` id (`N` = 1 and 3) - most likely because, in whatever specific
  calendar year that dataset was generated against, an actual solemnity displaced those
  particular Sundays and the generic ferial content was never populated for them. This
  affects 6 of the 84 possible day/hour slots (2 Sundays × 3 hours); those 6 remain
  unverified with no second source to check against yet.
- **Not used for First Vespers**: Breviarium does carry a `vespers` entry for
  `ordinary_time_<N>_saturday`, but its four weeks' values do not line up with this app's
  existing First-Vespers-of-Sunday citations at any consistent week offset, so it's
  unclear whether it represents the same liturgical unit (First Vespers of the following
  Sunday) or something else (e.g. a generic "Saturday's own Vespers" that doesn't survive
  in actual practice). Left uninvestigated rather than guessed at; `firstVespers` citations
  are untouched by this pass.

### Cross-check witness: Breviarium

- **What it is**: [`Breviarium-app/breviarium--core`](https://github.com/Breviarium-app/breviarium--core),
  a Spanish-language open-source Liturgy of the Hours library (`npm` package `breviarium`).
  Its per-hour data files (`databases/all_laudes.json`, `all_tertia.json`, `all_sexta.json`,
  `all_nona.json`, `all_vesperae.json`) each carry a `lectura_biblica_cita`/`lectura_biblica`
  numeric-ID pair per day that resolves through `databases/es/commons/lectura_breve_citas.json`
  / `lectura_breve_textos.json` - confirmed by cross-referencing IDs (e.g. `all_laudes.json`'s
  `advent_1_friday` cita `175` → `lectura_breve_citas.json` id 175 = "Jr 30, 21-22"; `all_vesperae.json`'s
  `advent_1_friday` cita `3464` exists only in `lectura_breve_citas.json`, not in the separate
  `lecturas_referencia.json` table used for longer Mass-style readings). So Lauds, Terce, Sext,
  None, and Vespers all genuinely draw their one reading from a dedicated short-reading table,
  despite the generic field name. `databases/all_officium.json` (Office of Readings) correctly
  uses a different two-reading structure instead (`lectura_biblica_*` + `lectura_patristica_*`),
  and there is no Compline/Completorium file in the repo at all.
- **License**: `LICENSE` file is Apache License 2.0 (copyright 2025 Miguel Martínez); GitHub's
  own license detector reports "Other/NOASSERTION" only because the file contains the short
  Apache 2.0 notice text rather than the full canonical license body, not because the terms are
  actually ambiguous. The `NOTICE` file requests attribution: "Based on 'Breviarium' by Miguel
  Martínez (miguelms.es)" for derivative use. The README's license badge says MIT, which appears
  to just be stale/incorrect - the LICENSE file governs.
- **Scope caveat**: the license covers the code/repository; the `databases/` directory also
  bundles actual translated liturgical prose (`lectura_breve_textos.json`, `salmos_textos.json`,
  `himnos.json`, etc.), almost certainly official Spanish Episcopal Conference translations,
  whose rights Miguel Martínez may not be positioned to relicense independent of his own repo
  license. That risk doesn't attach to citation IDs, though: only the `lectura_breve_citas.json`
  chapter/verse citations (not the `_textos` prose) would be used here, matching this project's
  existing "citations only, never source prose" convention used throughout this file.
- **Cross-check performed**: `scripts/verify-short-readings-breviarium.mjs` fetches Breviarium's
  `all_laudes.json`/`all_sexta.json`/`all_vesperae.json` (Daytime Prayer is compared against
  Sext specifically, matching this app's existing `divineoffice.org` "dp2" sourcing), resolves
  each day's citation ID through `lectura_breve_citas.json`, converts the Spanish (CEE-style)
  book abbreviations and punctuation to this project's citation convention, and compares against
  the existing `data/psalter/week{1-4}/<day>.json` `shortReading.ref` values. Only
  `ordinary_time_*` entries are used as witnesses (see the important caveat below); each
  comparison is corroborated by 5-8 independent Ordinary Time weeks that all cycle back to the
  same psalter week (via `romcal`, cross-validated across 2024-2029 so only stable
  season/week/day → psalter-week mappings are trusted). A citation is only marked `verified: true`
  if every witness agrees with each other **and** exactly matches the existing local citation -
  no value is ever invented or overwritten, only confirmed.
- **Result**: of 84 ferial short readings compared (Lauds/Daytime Prayer/Vespers across the four
  psalter weeks), 42 were confirmed and flipped to `"verified": true`. 34 remain `"verified":
  false` because Breviarium's citation, while clearly the same underlying reading,
  covers a narrower verse range than this app's existing citation - almost always Breviarium's
  range is a strict subset of the local one (e.g. local `Rom 8:35-39` vs. Breviarium `Rom 8:35, 37`;
  local `1 Pt 5:5-11` vs. Breviarium `1 Pt 5:5-7`). This is a consistent enough pattern across
  independent cases that it looks like a real difference between how the `rosangmin-code`/
  `divineoffice.org` source and the Spanish CEE breviary delimit the same reading, not noise -
  worth a closer look before deciding which range is authoritative, but deliberately left
  unverified rather than guessed at. A handful of remaining Saturday-Vespers slots have no local
  `shortReading` to compare (correct: Saturday's own second Vespers is superseded by Sunday's
  First Vespers in the real office). One citation (`1 Cor 1:7-9`) is marked `(cfr.)` in the
  source - an explicit "approximate, not exact" flag - and is skipped rather than compared, per
  the parsing rule below.
- **Parsing note**: `scripts/breviarium.mjs` (shared by this script and the Advent/Lent
  generator below) rejects any citation containing `(cfr.)`/`(Cfr)` outright rather than
  attempting to parse it - that annotation is the source's own signal that the reference is a
  paraphrase, not a word-for-word citation, so resolving it against this app's DRC text would
  misrepresent it.
- **Important caveat discovered along the way, now acted on (see below)**: Advent and Lent turn
  out to have their own *proper* short readings in the real Liturgy of the Hours, genuinely
  different from the Ordinary Time ferial cycle this app's `data/psalter/week{N}` files encode -
  confirmed empirically (Advent/Lent/Ordinary-Time witnesses for the same nominal
  psalter-week+day routinely disagreed, and it was specifically the `ordinary_time` witness that
  matched this app's existing citations). The script logs all 168 Advent/Lent citations it
  found (to stdout only, not written anywhere by this script) as a lead for a proper-of-seasons short-
  reading phase, distinct from and complementary to this ferial cross-check.

### Advent/Lent proper short readings (acted on the caveat above)

- **Generated by**: `scripts/generate-advent-lent-short-readings.mjs` → 56 new
  `data/proper-of-seasons/<celebrationKey>.json` files, keyed by romcal's own stable
  `${day}OfThe${N}WeekOf{Advent,Lent}` / `${N}SundayOf{Advent,Lent}` celebration keys (the same
  lookup `src/proper.ts` already uses for every other proper-of-seasons entry - no code changes
  were needed). Each file overrides only `hours.<hour>.shortReading`, with no `psalmody` key, so
  `src/office.ts` continues falling back to the ferial four-week skeleton's psalms/canticles
  unchanged - only the short reading differs from the ferial cycle.
- **Coverage**: Advent weeks 1-3 (all 7 days) plus all 4 Advent Sundays; Lent weeks 1-5 (all 7
  days). 56 files total. Confirmed picked up correctly at runtime by `resolveDay` (see
  `src/shortReadings.test.ts`), not just schema-valid in isolation.
- **Dec 17-24 (the O Antiphon stretch) - resolved by date, not celebration key**: the version
  of `romcal` this app depends on assigns those 8 days an ordinary week-based celebration key
  (e.g. `wednesdayOfThe4thWeekOfAdvent`) that is **not stable year to year** - which week number
  Dec 17-24 falls under shifts depending on where Christmas lands in a given year (confirmed by
  diffing 2026 vs. 2027: Dec 22 was `tuesdayOfThe4thWeekOfAdvent` in one year and
  `wednesdayOfThe4thWeekOfAdvent` in the other). Breviarium, by contrast, models these as fixed
  dates (`advent_december_17`..`advent_december_24`) independent of week number, so mapping its
  citations onto romcal's unstable week-based key would have silently mis-assigned them in some
  years. Resolved instead with `scripts/generate-december-short-readings.mjs` →
  `data/texts/decemberShortReadings.json`, a single date-keyed file (day-of-December `"17"`..
  `"24"` → up to `lauds`/`daytimePrayer`/`vespers`), read by `src/decemberShortReadings.ts`
  the same way `src/oAntiphon.ts` already resolves the O Antiphons themselves by date rather
  than by key. `src/office.ts` gives this override priority over both the celebrationKey-based
  proper and the ferial skeleton for every non-Sunday day in the range. Sunday is deliberately
  excluded: a Sunday landing in this range is still that Sunday's own celebration (e.g. the 3rd
  or 4th Sunday of Advent), so it keeps its own proper-of-seasons file rather than being
  overridden here - romcal's stable Sunday keys were never the problem. Of the 24 possible
  citations (8 dates x 3 hours), 2 (Dec 19 Daytime Prayer, Dec 20 Vespers) were marked
  `(cfr.)`/approximate in the source and skipped per the existing parsing rule, leaving 22
  populated. Every entry is `"verified": false` - single-sourced from Breviarium, same standing
  as the Advent/Lent proper short readings above. A Saturday's own Vespers in this range still
  correctly does not receive the override, since it's superseded by First Vespers of the
  following Sunday (`src/office.ts`'s `saturdayBeginsSunday`) - unaffected by this change, and
  still an open gap (see "Deliberately omits `vespers` on Saturday files" below).
- **Deliberately omits `vespers` on Saturday files**: in this app, Advent/Lent Saturdays always
  resolve their Vespers as First Vespers of the following Sunday
  (`src/office.ts`'s `saturdayBeginsSunday`), which reads the Sunday proper's
  `hours.firstVespers`, not the Saturday file's own `hours.vespers` - so a Saturday `vespers`
  entry would be dead data. Sunday's own First Vespers isn't populated either: Breviarium's
  Saturday-keyed entry is Saturday's own Vespers, not necessarily the same text as Sunday's
  First Vespers, and conflating the two without a way to verify that risks a wrong assignment -
  left for future work, same as the ferial First Vespers gap noted above.
- **Verification status**: every entry is `"verified": false` - single-sourced from Breviarium
  with no second independent witness the way the ferial cross-check had 5-8 corroborating
  Ordinary Time cycles per slot (Advent/Lent each occur once a year, so there's no equivalent
  repetition to cross-validate against within the source itself). Same standing as this app's
  other single-page-sourced short readings.

## Prayer Book prayers and intercessions

- **Primary text**: *The Book of Common Prayer* (1662), cross-checked against the
  Baskerville 1762 scan preserved by the Smithsonian Libraries and the Church of
  England's online BCP Morning and Evening Prayer implementation.
- **Primary scan**: `https://doi.org/10.5479/sil.391524.39088006511620`, explicitly
  identified by the Smithsonian as public domain/CC0. The convenient facsimile used for
  page inspection is `https://justus.anglican.org/resources/bcp/1662/Baskerville.pdf`.
- **Online witnesses**: `https://daily.commonworship.com/daily.cgi?book=bcp&today_mp=1`
  and `?today_ep=1` for the Suffrages and fixed collects; the online implementation itself
  has a modern copyright notice, so it is used as a checking witness rather than the
  source of legal status for the historic text.
- **Litany witness**: `https://www.mylectionary.com/bcp/litany`, checked against the
  public-domain facsimile. The app carries a deliberately abbreviated selection and omits
  petitions for the Sovereign, Royal Family, Council, nobility, and magistrates because
  it is not jurisdiction-specific. This editorial omission is explicit in the data.
- **Assignments**: Morning and Evening Prayer retain their native BCP positions. Office
  of Readings, Daytime Prayer, and Compline do not exist as such in 1662; their assigned
  prayers are a documented devotional adaptation, not an authorised BCP rubric or Roman
  Liturgy of the Hours assignment.
- **Verification status**: all included historic texts are `"verified": true`; no newly
  composed prayer prose is present.
