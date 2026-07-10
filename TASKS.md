# TASKS.md — Current Liturgy of the Hours PWA (Coverdale/Douay-Rheims edition)

A static, offline-first, GitHub Pages PWA implementing the current (post-1970) four-week
Liturgy of the Hours, using the **Coverdale Psalter** (BCP 1662, public domain) for psalms
and fixed canticles, and the **Douay-Rheims-Challoner** (1899, public domain) for scripture
readings and variable canticles. Calendar/season logic via **romcal**. No runtime API calls.

Work through phases in order. Each task should be its own commit/PR where practical.

---

## Phase 0 — Repo & Project Scaffolding

- [x] Create new GitHub repo, add MIT or CC0 license for the *code* (text sources are PD in
      their own right; state their attribution separately — see Phase 1) — repo already
      carries a GPLv3 license; kept as-is rather than relicensing without sign-off
- [x] Decide static site tooling (plain Vite + vanilla JS/TS recommended for lightness;
      avoid a framework unless you already want one for the PWA shell) — Vite + vanilla TS
- [x] Set up `npm init`, add `romcal` as the sole runtime dependency
- [x] Configure GitHub Pages deployment (Actions workflow: build then deploy `dist/`)
- [x] Add basic PWA scaffolding: `manifest.json`, service worker (cache-first, since all
      content is static/bundled), app icons
- [x] Set up a `data/` directory convention: `data/psalter/`, `data/office-of-readings/`,
      `data/texts/`, `data/proper-of-seasons/`
- [x] Write a minimal `README.md` stating sources, licensing, and scope (current Roman
      Rite Liturgy of the Hours; Coverdale psalms; Douay-Rheims-Challoner readings)

---

## Phase 1 — Source Text Acquisition & Attribution

- [x] Source a clean, verified full-text Coverdale Psalter (1662 BCP) and note provenance
      in `SOURCES.md` — complete as of Phase 6: all 150 psalms/2,507 verses, sourced from
      `pmachapman/GoTo.Bible` (superseding the initial Psalms-1-65-only source from
      `santeyio/st-andrews-psalter` used to get this phase moving)
- [x] Source a clean, verified full-text Douay-Rheims-Challoner Bible and note provenance
      in `SOURCES.md` — complete, 35,817 verses/73 books (apocryphal appendix excluded in
      Phase 3 - see that phase's notes)
- [x] Write `SOURCES.md` documenting exact editions used, public-domain status, and any
      transcription corrections made
- [x] Decide verse-numbering/reference convention up front (e.g. `Rom 1:1-7`,
      `Ps 24` vs `Ps 24:1-6`) and write it down in `CONVENTIONS.md` before transcribing
      anything, so all later data entry is consistent
- [x] Build (or find) a script to pull the full Douay-Rheims text into a single structured
      JSON keyed by book/chapter/verse, so later tasks can slice ranges programmatically
      rather than hand-copying every reading
- [x] Do the same for the Coverdale Psalter (structured JSON keyed by psalm/verse) — script
      is complete and reusable; now pulls all 150 psalms (see above)

---

## Phase 2 — Calendar Engine (romcal integration)

- [x] Bundle `romcal` and confirm it works fully offline once built (no CDN fetch at
      runtime) — required a fix: see note below, romcal actually threw at runtime once
      bundled until `vite.config.ts` was adjusted
- [x] Write a thin wrapper module `calendar.js` (implemented as `src/calendar.ts`) that,
      given a JS `Date`, returns:
  - liturgical season (advent, christmas, ordinary time, lent, triduum, easter)
  - week-of-season number
  - rank (solemnity, feast, memorial, optional memorial, weekday)
  - **psalter week** (1-4) — romcal exposes this directly as `data.meta.psalterWeek`;
    used as-is, no derivation needed
  - **Office of Readings year** (I or II, odd/even calendar year rule)
  - **Sunday Mass cycle letter** (A/B/C) — romcal exposes this directly too, as
    `data.meta.cycle`
- [x] Write unit tests for `calendar.js` against known dates (confirm psalter week resets
      correctly at the start of Ordinary Time, confirm Year I/II boundary) — 10 tests in
      `src/calendar.test.ts`, run via `npm test`
- [x] Decide and document how season transitions interact with the 4-week psalter cycle
      (verify against a real breviary or reliable secondary source before hardcoding
      assumptions) — spot-checked romcal's output against known breviary checkpoints
      (2nd Sunday of Ordinary Time = Week II, Ash Wednesday = Week IV, Palm Sunday =
      Week II, Easter Octave through Divine Mercy Sunday = special "Easter" psalter);
      documented as code comments in `src/calendar.ts` and test descriptions

**Bundler note:** romcal's dependencies `moment-range`/`moment-recur` are old UMD plugins
that mutate a shared `moment.fn`. Vite's default module resolution (preferring romcal's
`module` field, i.e. its raw ES6 source) broke this - the app built fine but threw
`TypeError: Cannot set properties of undefined (setting 'recur')` at runtime in the
browser (only caught by an actual browser smoke test, not by `tsc`/`vite build`
succeeding). Fixed in `vite.config.ts` by preferring romcal's `main` field (its
Babel-transpiled CJS build) instead: `resolve.mainFields: ['browser', 'main', 'module']`.

---

## Phase 3 — Data Model & Schema

- [x] Finalise JSON schema for `psalter/weekN/day.json` (hour to psalm ids + canticle id) —
      `schema/psalter-day.schema.json`; also required deciding the Midday Hour question
      flagged below (combined Daytime Prayer, not Terce/Sext/None - see CONVENTIONS.md)
- [x] Finalise JSON schema for `texts/scripture.json` (reference to Douay-Rheims text) —
      `schema/scripture.schema.json`, validates the actual `data/texts/douay-rheims-challoner.json`
      (file renamed from the generic `scripture.json` in TASKS.md's original wording for
      clarity now that Phase 1 built it)
- [x] Finalise JSON schema for `texts/psalms.json` (psalm id/verse-range to Coverdale text) —
      `schema/psalms.schema.json`, validates `data/texts/coverdale-psalter.json`
- [x] Finalise JSON schema for `texts/fixedCanticles.json` (the four fixed canticles:
      Benedictus, Magnificat, Nunc Dimittis, Benedicite) — `schema/fixed-canticles.schema.json`
      (the data file itself doesn't exist yet - Phase 4 populates it)
- [x] Finalise JSON schema for `office-of-readings/yearI/` and `yearII/` (season to week to
      day to { patristic reading ref/title, scripture reading ref }) —
      `schema/office-of-readings-day.schema.json`; directory path convention documented in
      CONVENTIONS.md
- [x] Finalise JSON schema for `proper-of-seasons/` and `proper-of-saints/` overrides —
      `schema/proper.schema.json` (also added the missing `data/proper-of-saints/` directory,
      which Phase 0 had omitted)
- [x] Write a schema validation script that runs in CI to catch malformed data files
      before merge — `scripts/validate-data.mjs` (`npm run validate:data`), wired into a new
      `.github/workflows/ci.yml` alongside `npm test` and `npm run build`. Running it against
      the real Phase 1 data caught a genuine upstream data defect: 1,450 empty verses in the
      DRC dataset. 1,438 were in the unused apocryphal appendix (now excluded from ingestion
      entirely); the remaining 12 are real gaps in canonical books, documented in
      `SOURCES.md` and tracked as an explicit non-fatal allowlist in the validator so CI
      stays green without hiding the problem.

---

## Phase 4 — Fixed Canticles (small, do early — unblocks daily rendering)

- [~] Transcribe full Benedictus (Coverdale), verify against source — PARTIAL: sourced from
      the 2019 ACNA BCP's traditional-language text (`blocher/dailyoffice2019`), not
      literally 1662; same network-sandbox limitation as the Psalter (Phase 1). Not yet
      verified line-by-line against a primary 1662 source - see `SOURCES.md`
- [~] Transcribe full Magnificat (Coverdale), verify against source — same caveat as above
- [~] Transcribe full Nunc Dimittis (Coverdale), verify against source — same caveat as above
- [~] Transcribe full Benedicite in full (all ~32 verses) from a verified BCP source — same
      caveat as above (34 verses as segmented from the source, including the Invocation and
      Doxology; scripture reference into the DRC text unconfirmed, see `SOURCES.md`)
- [x] Wire these into the render pipeline so Lauds/Vespers/Compline render correctly with
      placeholder psalms, proving the daily-rotation skeleton end-to-end — `src/office.ts`
      (`resolveDay`), wired into `src/main.ts`; verified both via `src/office.test.ts` and a
      real browser smoke test (not just a successful build) rendering today's Lauds/Vespers/
      Compline canticles with zero console errors

---

## Phase 5 — Psalter Skeleton (structure before content)

- [x] Build the full 28-day (4 week x 7 day) skeleton JSON with correct hour structure
      per day, psalm-number placeholders only (no text yet) — `scripts/generate-psalter-skeleton.mjs`
      → `data/psalter/week{1,2,3,4}/*.json`; also fixed a real gap this surfaced in the
      Phase 3 schema (Lauds/Vespers need two distinct canticle slots - a variable OT/NT
      canticle plus the fixed Gospel canticle - not one, see `schema/psalter-day.schema.json`
      and `src/office.ts`)
- [~] Confirm the skeleton against an authoritative structural reference for the current
      four-week psalter (which psalms fall on which day/hour) — cross-check against a
      published breviary index or similar — NOT DONE: no GitHub-reachable index exists in
      this session's network sandbox (same limitation as Phases 1/4); every generated file
      is marked `"verified": false` and surfaces a visible warning in the UI rather than
      silently presenting the reconstruction as authoritative. See `SOURCES.md` for exactly
      which parts are solid vs. still need checking. This is Phase 6's remaining job.
- [x] Render the full 28-day skeleton in the UI with placeholders, confirm navigation
      (today / arbitrary date / week view) works before any real psalm text is added —
      `src/main.ts`; verified via a real browser smoke test: today's view, week-nav clicks,
      and date-picker jumps (including to Ash Wednesday, confirming psalter week 4) all
      render correctly with zero console errors

---

## Phase 6 — Psalm Text Backfill (Coverdale)

- [x] Week 1: transcribe/verify all psalm text referenced across all 7 days x 5 hours
- [x] Week 2: same
- [x] Week 3: same
- [x] Week 4: same

  All four weeks done together: `scripts/fetch-coverdale-psalter.mjs` now sources the
  complete 150-psalm Coverdale Psalter (see `SOURCES.md` - superseded the Phase 1 partial
  source), so every psalm reference the Phase 5 skeleton generates resolves. `src/psalms.ts`
  (`resolvePsalmRef`) does the resolution, including verse-range slicing; wired into
  `src/office.ts`/`src/main.ts` and verified with a real browser smoke test rendering full
  psalm text for today, not just references.
- [x] Cross-check verse divisions where a single Coverdale psalm is split across multiple
      hours (e.g. Ps 119) against your `CONVENTIONS.md` reference format — Ps 119's 176
      verses divide evenly into the skeleton generator's 22 eight-verse Daytime Prayer
      sections (22 x 8 = 176 exactly, no partial section); confirmed via
      `src/psalms.test.ts`
- [x] Spot-check a sample of transcribed psalms against the source for accuracy —
      Psalms 1, 22, and 51 cross-checked word-for-word against the Phase 1 source before
      switching (see `SOURCES.md`); Psalms 100 and 150 spot-checked against well-known text.
      The remaining ~145 psalms are not individually re-verified against a second source -
      this is real, not-yet-closed residual risk, same category as the psalter skeleton's
      own unverified day/hour assignment (Phase 5)

---

## Phase 7 — Office of Readings (biggest data-entry phase — sequence deliberately)

- [x] Build Year I / Ordinary Time first (most-used, most days), week by week —
      `scripts/generate-office-of-readings.mjs` → 238 files (34 weeks x 7 days, later
      regenerated with an improved continuous-chapter algorithm, see below). Same caveat as
      the Phase 5 psalter skeleton: no GitHub-reachable lectionary index exists in this
      session's network sandbox, so this is a real-scripture but unverified week-to-book
      reconstruction (user-approved), not a transcription of the official assignment.
      Every file is `"verified": false`. See `SOURCES.md`.
- [x] Build Year II / Ordinary Time — 238 more files, a deliberately different book list
      from Year I (remaining OT books + the full NT) so the two-year cycle isn't a repeat
- [x] Build Year I & II / Advent — 28 files/year (4 weeks); Isaiah (Year I) vs. minor
      prophets + Romans (Year II)
- [x] Build Year I & II / Christmas season — proper-based, not week-based (Christmas has no
      week number - see `CONVENTIONS.md`); `scripts/generate-office-of-readings-proper.mjs`
      → 19 `data/proper-of-seasons/*.json` files keyed by romcal's celebration key, not
      split by year (matches `schema/proper.schema.json`, which has no year concept)
- [x] Build Year I & II / Lent — 35 files/year for the 5 numbered weeks (Deuteronomy/
      Jeremiah vs. II Corinthians/Hebrews); the 4-day Ash-Wednesday-to-Saturday stub before
      the numbered weeks begin is proper-based like Christmas, keyed by day-of-week rather
      than romcal key (that key isn't stable there either - see `SOURCES.md`)
- [x] Build Year I & II / Triduum + Easter Octave — Triduum done as 3 proper files
      (`holyThursday`/`goodFriday`/`holySaturday`; Good Friday = Isaiah 52, Holy Thursday =
      Exodus 12, Holy Saturday = Lamentations 3). Easter Octave still open: it needs the
      psalter skeleton's `psalterWeek: 'easter'` case, which Phase 5 didn't build either -
      genuinely out of scope for this pass, not overlooked
- [x] Build Year I & II / Easter season — 49 files/year for weeks 1-7 (Acts + I John +
      Revelation vs. Acts + I Peter + Revelation - Acts appears both years deliberately,
      it's the standard Easter reading in real practice)
- [x] For each: scripture reading resolves via reference into `texts/scripture.json`,
      extending that file incrementally rather than bundling the whole Bible up front —
      `src/scripture.ts` (`resolveScriptureRef`), wired into `src/office.ts`/`src/main.ts`
      via `src/officeOfReadings.ts` (which dispatches between the week-based files and the
      proper-based ones). Verified with a real browser smoke test across both years and
      every season - Ordinary Time, Advent, Christmas, the Ash-Wednesday stub, the Triduum,
      and Easter all render real, thematically correct scripture text (e.g. Isaiah 52 on
      Good Friday, Exodus 12 on Holy Thursday) with zero console errors. Extracted the
      book-abbreviation table out of `CONVENTIONS.md` into a schema-validated
      `data/texts/book-abbreviations.json` so the generators and the runtime resolver can't
      drift apart; `scripts/validate-data.mjs` now also cross-checks that every generated
      `scriptureReading.ref`/`firstReading.ref` actually resolves in the DRC text, not just
      that the JSON is schema-shaped
- [x] Patristic/hagiographic second readings: decide sourcing separately — Douay-Rheims
      doesn't cover these; identify a public-domain source (e.g. early Church Fathers
      texts) or, as a pragmatic MVP fallback, omit second readings initially and note as
      a known gap — took the MVP fallback: `patristicReading: null` throughout, surfaced
      visibly in the UI rather than silently blank. Sourcing a real patristic source
      remains open for whenever Year II/the seasons are built out.

---

## Phase 8 — Proper of Seasons & Proper of Saints (overrides)

- [x] Identify every solemnity/major feast that overrides the ferial psalter across the
      year (fixed dates + moveable dates via romcal)
- [x] For each, populate proper psalms/antiphons/readings where they differ from the
      ferial cycle — done for a representative set (see below); the rest is ongoing.
- [x] Wire override logic into the day-resolution function: check proper-of-seasons and
      proper-of-saints before falling back to psalter/weekN (src/proper.ts, used by
      src/office.ts and src/officeOfReadings.ts)
- [x] Treat as ongoing/incremental; do not block MVP launch on full coverage — a sensible
      fallback (ferial psalter) should always render even if a feast's proper text isn't
      yet populated

Populated this phase: the Easter octave (full Hours override, since psalterWeek 'easter'
has no skeleton entry at all - the one true gap Phase 8 needed to close), 6 other moveable
solemnities and 7 fixed-date solemnities (first-reading-only overrides, data/proper-of-saints/
populated for the first time). All ~180 remaining memorials/feasts, and full Hours coverage
for the 13 non-Easter-octave solemnities above, remain future incremental work.

---

## Phase 9 — Antiphons (flagged earlier as a gap)

- [x] Decide sourcing/authorship approach: omit antiphons entirely for MVP rather than
      write original quasi-liturgical text. This keeps the app's sourced-text boundary
      clear: psalms, canticles, and scripture are real public-domain texts; antiphons are
      a known absent layer, not silently invented content.
- [x] If writing original antiphons, draft a short style guide (tone, length, scriptural
      allusion conventions) before starting — not applicable for MVP, since the chosen
      approach is omission rather than composition.
- [x] Treat as post-MVP enhancement; do not block launch. Future antiphon work should
      either source official/public-domain antiphons or clearly document any original
      devotional text as non-official before it is added.

**Revisited post-launch**: a second search turned up three real, contained antiphon
systems (not the full per-psalm daily cycle a Roman monastic breviary carries, for which
no adequately-licensed source has been found) -

- [x] The Invitatory antiphon (before the Venite/Jubilate at the day's first Hour) - full
      season/weekday/solemnity-driven cycle, sourced from `blocher/dailyoffice2019` (the
      same MIT-licensed repo already used for the fixed canticles)
- [x] The "O Antiphons" attached to the Magnificat at Vespers, Dec 16-23 - the Sarum/
      English 8-antiphon tradition, same source
- [x] The four seasonal Marian antiphons said at the end of Compline - sourced from
      `DivinumOfficium/divinum-officium`, explicitly `"verified": false` throughout since
      that source's English-translation licensing is unclear (see SOURCES.md)
- [x] Schema, resolver modules (`src/invitatory.ts`, `src/oAntiphon.ts`,
      `src/complineAntiphon.ts`), rendering, tests, and docs for all three

---

## Phase 10 — Rendering & UI

- [x] Build the day-resolution function: Date -> resolved hour contents (psalm text,
      canticle, reading text, antiphon-if-present), combining calendar.js + psalter data
      + office-of-readings data + proper overrides
- [x] Build hour views: Office of Readings, Lauds, Midday (or Terce/Sext/None as
      preferred), Vespers, Compline
- [x] Build simple day/week navigation
- [x] Decide typography/visual design — a restrained breviary-inspired visual language:
      warm paper, oxblood accents, serif reading text, compact sans-serif navigation,
      responsive hour tabs, and accessible focus states
- [x] Build "today" default view plus date picker for arbitrary days

Phase 10 completion pass: the five offices now render as focused tabbed views rather than
one long page; previous/next, today, date-picker, and week navigation are all available.
Psalm, fixed canticle, variable biblical canticle, and Office of Readings texts resolve in
full with verse-level typography. Liturgical metadata and sourcing warnings remain visible
without interrupting the prayer text.

### Phase 10 follow-up — Short Scripture readings at each Hour

The ordinary Roman Liturgy of the Hours assigns a short Scripture reading after the
psalmody at Lauds, Daytime Prayer, Vespers, and Compline. These are not daily Gospel
readings: the Gospels are ordinarily reserved for Mass, apart from the optional extended
vigil on Sundays and solemnities (GILH 73, 144). The Benedictus, Magnificat, and Nunc
Dimittis remain the Hours' Gospel canticles.

- [~] Identify and document a verified, legally usable source for the appointed short
      readings; record its edition, provenance, public-domain/licensing status, and any
      transcription caveats in `SOURCES.md` before populating data — references were
      cross-sourced from a page-referenced breviary dataset and published Divine Office
      pages, but the underlying approved printed edition remains unreachable; assignments
      are therefore explicitly `"verified": false`, and only factual citations (not source
      prose) are retained
- [x] Extend the psalter-day and proper schemas to model a short-reading reference for
      Lauds, Daytime Prayer, Vespers, and Compline, keeping Office of Readings' longer
      first and second readings structurally distinct
- [x] Decide and document in `CONVENTIONS.md` how seasonal, Sunday, solemnity, feast, and
      saint-specific short readings override the four-week ferial cycle
- [x] Populate the complete four-week ferial short-reading cycle for all four applicable
      Hours, marking every unverified assignment `"verified": false` rather than silently
      reconstructing or guessing it
- [x] Populate Proper of Seasons and representative Proper of Saints overrides, with a
      reliable ferial fallback wherever a proper short reading is not yet available —
      Christmas, sourced Easter-octave Hours, and the Assumption are populated; coverage
      remains incremental and unavailable Easter Daytime readings stay visibly absent
- [x] Resolve every short-reading reference through the existing Douay-Rheims-Challoner
      text, including discontinuous or cross-chapter references where required
- [x] Render the short reading after psalmody and before the Gospel canticle at Lauds and
      Vespers, and in the corresponding liturgical position at Daytime Prayer and Compline;
      include the reference, verse text, and visible verification warning where applicable
- [x] Add schema and unit tests covering all 28 ferial days, proper precedence, fallback
      behaviour, reference resolution, and the absence of an invented ordinary Gospel
      reading
- [x] Extend the production-browser smoke test across representative ferial, seasonal,
      solemnity, and saint dates, checking all four applicable Hours and zero runtime errors

---

## Phase 11 — PWA & Offline

- [x] Service worker: cache all static JSON/text assets on install for full offline use —
      all liturgical text is bundled into the JS build at compile time (see the bundle-size
      note below), so "cache every asset" reduces to caching the build's own JS/CSS output;
      `public/sw.js` now discovers the actual content-hashed asset URLs from the built
      `index.html` at install time and precaches them via `cache.addAll` (previously it only
      opportunistically cached whatever a user happened to fetch, so a device could go
      offline before ever loading, say, the Easter octave's data and find it missing)
- [x] Test full offline functionality (airplane mode) across the year boundary (Year I/II
      flip) and season boundaries — verified with a real browser against a build actually
      served once, then had its HTTP server shut down entirely (not just a simulated
      "offline" network condition, which behaved inconsistently under headless-browser
      automation in this environment): reloading and navigating to Dec 31/Jan 1 (Year I/II
      flip), Ash Wednesday, Easter Sunday, and the 1st Sunday of Advent all rendered
      correctly with zero console/request errors
- [x] Add to home screen / manifest icons / splash screens — `manifest.webmanifest` has
      192/512 "any" icons plus a 512 maskable icon (safe-zone padding confirmed visually);
      Chrome's own installability check (`Page.getInstallabilityErrors`) reports zero issues
      other than the incognito-context restriction Playwright's default browser context
      trips (a Chrome policy, not an app defect). Bespoke per-device iOS splash-screen
      images were *not* generated - modern iOS (16.4+) synthesizes a splash screen from the
      manifest/apple-touch-icon automatically, and hand-drawing the older per-device
      `apple-touch-startup-image` set is disproportionate effort for this app's scope
- [x] Confirm bundle size is reasonable (full Douay-Rheims + Coverdale text is not small,
      consider lazy-loading per-day text vs. bundling everything at build time) — decided to
      keep bundling everything rather than lazy-loading per-day text: this app's whole point
      is working fully offline from first load (including dates a user has never visited
      before), which lazy-loading would undermine unless the service worker eagerly
      precached every lazy chunk anyway - at which point lazy-loading buys nothing but
      complexity. Total payload (~5.8MB, dominated by the ~5MB Douay-Rheims-Challoner text)
      is reasonable for a book-length reference text cached once and reused daily. Instead,
      split the build via `vite.config.ts`'s `manualChunks` into separate cache-friendly
      chunks (app code, romcal, the DRC text, the rest of the liturgical data), so a future
      app-code change doesn't force re-downloading the ~5MB Bible text - only the small,
      frequently-changing app chunk gets a new content hash.

---

## Phase 12 — Launch MVP

- [x] MVP scope checkpoint: Phases 0-6 plus Phase 10 (skeleton, fixed canticles, full
      psalm text, basic UI) constitute a genuinely usable daily prayer rule even before
      Office of Readings and Propers are complete — confirm this is an acceptable v1 scope —
      superseded in practice: Phases 7-9 and 11 are also complete (Office of Readings for
      both years/all seasons, a representative set of Proper overrides, the antiphon-scope
      decision, and full offline/PWA support), so the shipped app already exceeds this
      original minimum bar
- [x] Deploy to GitHub Pages — `.github/workflows/deploy.yml` runs on every push to `main`
      and has completed successfully for every merge so far, including this phase's own
      commit (confirmed via the Actions API); the repo is public with Pages enabled and
      `homepage` set to `https://mbaldwinsmith.github.io/os-ordinariate-daily-prayer/`.
      Not independently browser-verified from this session, though - this sandbox's
      outbound network policy blocks `*.github.io` generally (confirmed via the proxy's own
      status log, unrelated to this repo), so a human visit to confirm the live site
      actually loads is worth doing before calling this fully closed
- [ ] Dogfood: use it for actual daily prayer for a period, log gaps/errors as issues — this
      one is inherently a human task, not something to check off from a coding session;
      genuinely ongoing
- [ ] Iterate on Phases 7-9 post-launch as ongoing content work — also genuinely ongoing,
      not a one-time task; see SOURCES.md for the specific content gaps already tracked
      (remaining solemnities/memorials, patristic second readings, antiphons if the scope
      decision in Phase 9 is ever revisited)

# TASKS.md addendum — Phase 13: Psalter Verification & Correction

Append to the existing TASKS.md. Context: a user-observed mismatch between the app's
Lauds psalms and the Universalis app confirmed that the Phase 5 psalter skeleton
(generated without an authoritative index, all files `"verified": false`) diverges
from the real four-week psalter. An authoritative structural source has now been
identified and transcribed: Fr. Felix Just, S.J.'s hour-by-hour Four-Week Psalter
table (catholic-resources.org/LoH/Psalter-Hours.html), captured as
`canonical-psalter-skeleton.json`, with a diff script `diff-psalter.mjs`.

Psalm-to-day/hour assignments are factual liturgical structure (not copyrightable
text), so the canonical dataset can be committed to the repo freely.

---

## Phase 13 — Psalter Verification & Correction

### 13.1 — Adopt the canonical dataset

- [x] Commit `canonical-psalter-skeleton.json` to the repo (suggested location:
      `data/canonical/`), and record its provenance in `SOURCES.md`: source URL,
      compiler (Fr. Felix Just, S.J.), page-last-updated date, transcription date,
      and the fact that it captures structural assignments only, no copyrighted text
- [x] Record the one known uncertainty in `SOURCES.md`: Week 4 Thursday's Office of
      Readings (Ps 44) duplicates Week 2 Thursday in the source table — plausible
      but unconfirmed; do not mark that single day verified until spot-checked
      against a printed breviary or the Universalis app (a human task, since this
      requires a second independent source)
- [x] Commit `diff-psalter.mjs` to `scripts/` and add an npm script
      (`npm run diff:psalter`)

### 13.2 — First diff run & schema adaptation

- [x] Run the diff script once and triage the output into three buckets:
      (a) unextractable hours — the script guessed the generated schema's field
      names and may have guessed wrong; fix `HOUR_KEY_CANDIDATES` /
      `REF_FIELD_CANDIDATES` in the script until zero hours are unextractable,
      (b) missing files/hours, (c) genuine content mismatches
- [x] Re-run until the report reflects only genuine content mismatches, then commit
      the raw report output (or a summary) to the repo as a record of the
      pre-correction state — useful honesty artifact given the app is already
      deployed

### 13.3 — Close the structural gaps the canonical data exposes

These are schema/model changes, not just data corrections. Each was invisible to the
original generator and at least one is the likely cause of the observed Lauds
mismatch:

- [x] **Lauds slot order**: model Morning Prayer as psalm → OT canticle → psalm
      (the canticle sits BETWEEN the psalms). Verify the schema and renderer both
      preserve slot order rather than treating psalmody as an unordered list
- [x] **Vespers slot order**: psalm → psalm → NT canticle. Same order-preservation
      requirement
- [x] **EP-I / EP-II**: Saturday evening is First Evening Prayer of the following
      Sunday, with its own psalms; Sunday has two distinct Vespers entries.
      Restructure the six Saturday files (and Sunday files) accordingly, and update
      the day-resolution logic in `src/office.ts` so a request for Saturday Vespers
      resolves to the following Sunday's EP-I
- [x] **Seasonal Office of Readings forks**: Sat wk1, Sat wk2, Fri wk4, Sat wk4 each
      need two psalm sets (Advent/Christmas/Lent/Easter vs. Ordinary Time, per
      GILH 130). Extend the psalter-day schema to model the fork and the resolver
      to pick the right branch from the calendar engine's season output
- [x] **Lent NT-canticle substitution**: Sunday EP-II uses 1 Pet 2:21-24 in place of
      Rev 19:1-7 during Lent, all four weeks. Model and resolve this
- [x] **Compline is a one-week cycle**: restructure Night Prayer data as a 7-day
      cycle (with Saturday's Compline following EP-I of Sunday), not a 4-week one.
      Remove any duplicated per-week Compline data
- [x] **Ps 119 divisions**: replace the generator's mechanical 22×8-verse division
      with the actual assignments (specific sections on specific days, interleaved
      with other psalms; some days use none). Update `resolvePsalmRef`/tests that
      encoded the mechanical assumption — the existing Phase 6 test asserting the
      even division is now known-wrong and should be replaced, not appeased
- [x] **Invitatory alternatives**: model Ps 95 as default with Ps 100/67/24 as
      permitted alternatives (rendering can stay Ps 95-only for now, but the data
      shouldn't preclude the alternatives)

### 13.4 — Regenerate, don't patch

- [x] Rewrite `scripts/generate-psalter-skeleton.mjs` to generate the 28-day
      skeleton FROM `canonical-psalter-skeleton.json` rather than from its own
      internal reconstruction — the canonical file becomes the single source of
      truth and the old reconstruction logic is deleted
- [x] Map the canonical file's reference format (`Ps 110:1-5, 7`) onto the app's
      CONVENTIONS.md reference format in one documented normalisation function,
      shared between the generator and the diff script so they can't drift
- [x] Regenerate all 28 day files; confirm `npm run diff:psalter` reports zero
      mismatches
- [x] Flip `"verified": true` on all regenerated files EXCEPT Week 4 Thursday
      (pending the human spot-check in 13.1); remove the corresponding UI warning
      for verified days
- [x] Update `SOURCES.md`: the psalter skeleton's status changes from "unverified
      reconstruction" to "generated from canonical structural source", with the
      Week 4 Thursday exception noted

### 13.5 — Regression protection

- [x] Wire `npm run diff:psalter` into `.github/workflows/ci.yml` alongside the
      schema validator, so any future edit to the psalter data that diverges from
      the canonical file fails CI
- [x] Add unit tests for each structural gap closed in 13.3 (EP-I resolution,
      seasonal fork selection, Lent canticle substitution, Compline weekly cycle,
      Lauds/Vespers slot order) — these encode the liturgical rules independently
      of the data files
- [x] Re-run the production-browser smoke test (the one open Phase 10 checkbox)
      across dates chosen to exercise the new logic: an Ordinary Time Saturday
      (seasonal fork, ordinary branch), a Lent Saturday (strong-season branch),
      a Lent Sunday (EP-II canticle substitution), and a plain ferial day

### 13.6 — Human verification pass (not automatable)

- [ ] Spot-check Week 4 Thursday Office of Readings against a printed breviary or
      Universalis; flip its `verified` flag accordingly
- [ ] Compare one full day per week (4 days total) hour-by-hour against the
      Universalis app as an end-to-end sanity check that the original mismatch is
      gone — structural agreement, not textual (translations legitimately differ:
      Coverdale/DRC here vs. Grail/Jerusalem there)
- [ ] Log any residual discrepancies as issues rather than fixing ad hoc, so each
      fix goes through the canonical file + regeneration path

---

## Phase 14 — Office of Readings Verification (successor to the same problem)

The Phase 7 Office of Readings cycle has the identical defect one layer up: a
real-scripture but unverified week-to-book reconstruction, all files
`"verified": false`. The psalter fix (Phase 13) does not touch this. Closing it
fully is a much larger transcription job than the psalter, so sequence it:

- [ ] Identify an authoritative structural source for the two-year Office of
      Readings lectionary cycle (candidates: Fr. Just's related pages at
      catholic-resources.org/LoH, a published breviary's lectionary tables, or the
      Breviarium open-source library's data files as a secondary witness) and
      record it in `SOURCES.md`
- [ ] Transcribe it into a canonical dataset (`canonical-office-of-readings.json`
      or per-season files) in the same spirit as Phase 13.1 — references only,
      no copyrighted text
- [ ] Write/extend a diff script for the OoR files against the canonical dataset
- [ ] Regenerate the OoR data from the canonical source, replacing the
      continuous-chapter reconstruction; flip `verified` flags; update the UI
      warnings and `SOURCES.md`
- [ ] Wire into CI as with the psalter
- [ ] If no single complete structural source can be found, fall back to
      incremental verification (Ordinary Time first, seasons after), keeping
      per-file `verified` flags honest about exactly which days are checked
- [ ] Revisit short readings (the Phase 10 follow-up) against the same source
      once found — the canonical psalter file already provides verified Compline
      short readings as a starting point


---

## Notes / Open Questions to Resolve Early

- Confirm exactly how the 4-week psalter cycle behaves across Lent/Easter/Advent — worth
  getting right before building 28 days of skeleton on a wrong assumption.
- Decide Midday Hour convention (one combined "Daytime Prayer" vs. full Terce/Sext/None)
  — affects schema shape in Phase 3.
- Decide second-reading (patristic) sourcing before Phase 7 rather than during it.
- Keep `SOURCES.md` and `CONVENTIONS.md` updated as living documents — they're the two
  files most likely to save time when picking this back up after a gap.
