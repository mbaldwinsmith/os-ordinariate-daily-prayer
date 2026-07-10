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

- [~] Source a clean, verified full-text Coverdale Psalter (1662 BCP) and note provenance
      in `SOURCES.md` — PARTIAL: only Psalms 1-65/150 available from a reachable source in
      this session (network sandbox blocks eskimo.com/archive.org/justus.anglican.org); gap
      documented in `SOURCES.md` with a plan to complete it
- [x] Source a clean, verified full-text Douay-Rheims-Challoner Bible and note provenance
      in `SOURCES.md` — complete, 37,255 verses/78 books
- [x] Write `SOURCES.md` documenting exact editions used, public-domain status, and any
      transcription corrections made
- [x] Decide verse-numbering/reference convention up front (e.g. `Rom 1:1-7`,
      `Ps 24` vs `Ps 24:1-6`) and write it down in `CONVENTIONS.md` before transcribing
      anything, so all later data entry is consistent
- [x] Build (or find) a script to pull the full Douay-Rheims text into a single structured
      JSON keyed by book/chapter/verse, so later tasks can slice ranges programmatically
      rather than hand-copying every reading
- [x] Do the same for the Coverdale Psalter (structured JSON keyed by psalm/verse) — script
      is complete and reusable; upstream data it pulls from is only 65/150 psalms (see above)

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

- [ ] Transcribe full Benedictus (Coverdale), verify against source
- [ ] Transcribe full Magnificat (Coverdale), verify against source
- [ ] Transcribe full Nunc Dimittis (Coverdale), verify against source
- [ ] Transcribe full Benedicite in full (all ~32 verses) from a verified BCP source
- [ ] Wire these into the render pipeline so Lauds/Vespers/Compline render correctly with
      placeholder psalms, proving the daily-rotation skeleton end-to-end

---

## Phase 5 — Psalter Skeleton (structure before content)

- [ ] Build the full 28-day (4 week x 7 day) skeleton JSON with correct hour structure
      per day, psalm-number placeholders only (no text yet)
- [ ] Confirm the skeleton against an authoritative structural reference for the current
      four-week psalter (which psalms fall on which day/hour) — cross-check against a
      published breviary index or similar
- [ ] Render the full 28-day skeleton in the UI with placeholders, confirm navigation
      (today / arbitrary date / week view) works before any real psalm text is added

---

## Phase 6 — Psalm Text Backfill (Coverdale)

- [ ] Week 1: transcribe/verify all psalm text referenced across all 7 days x 5 hours
- [ ] Week 2: same
- [ ] Week 3: same
- [ ] Week 4: same
- [ ] Cross-check verse divisions where a single Coverdale psalm is split across multiple
      hours (e.g. Ps 119) against your `CONVENTIONS.md` reference format
- [ ] Spot-check a sample of transcribed psalms against the source for accuracy

---

## Phase 7 — Office of Readings (biggest data-entry phase — sequence deliberately)

- [ ] Build Year I / Ordinary Time first (most-used, most days), week by week
- [ ] Build Year II / Ordinary Time
- [ ] Build Year I & II / Advent
- [ ] Build Year I & II / Christmas season
- [ ] Build Year I & II / Lent
- [ ] Build Year I & II / Triduum + Easter Octave
- [ ] Build Year I & II / Easter season
- [ ] For each: scripture reading resolves via reference into `texts/scripture.json`,
      extending that file incrementally rather than bundling the whole Bible up front
- [ ] Patristic/hagiographic second readings: decide sourcing separately — Douay-Rheims
      doesn't cover these; identify a public-domain source (e.g. early Church Fathers
      texts) or, as a pragmatic MVP fallback, omit second readings initially and note as
      a known gap

---

## Phase 8 — Proper of Seasons & Proper of Saints (overrides)

- [ ] Identify every solemnity/major feast that overrides the ferial psalter across the
      year (fixed dates + moveable dates via romcal)
- [ ] For each, populate proper psalms/antiphons/readings where they differ from the
      ferial cycle
- [ ] Wire override logic into the day-resolution function: check proper-of-seasons and
      proper-of-saints before falling back to psalter/weekN
- [ ] Treat as ongoing/incremental; do not block MVP launch on full coverage — a sensible
      fallback (ferial psalter) should always render even if a feast's proper text isn't
      yet populated

---

## Phase 9 — Antiphons (flagged earlier as a gap)

- [ ] Decide sourcing/authorship approach: write original Coverdale-register antiphons
      vs. omit entirely for MVP
- [ ] If writing original antiphons, draft a short style guide (tone, length, scriptural
      allusion conventions) before starting
- [ ] Treat as post-MVP enhancement; do not block launch

---

## Phase 10 — Rendering & UI

- [ ] Build the day-resolution function: Date -> resolved hour contents (psalm text,
      canticle, reading text, antiphon-if-present), combining calendar.js + psalter data
      + office-of-readings data + proper overrides
- [ ] Build hour views: Office of Readings, Lauds, Midday (or Terce/Sext/None as
      preferred), Vespers, Compline
- [ ] Build simple day/week navigation
- [ ] Decide typography/visual design (tie in with existing Kathisma Psalter PWA visual
      language if continuity is desired)
- [ ] Build "today" default view plus date picker for arbitrary days

---

## Phase 11 — PWA & Offline

- [ ] Service worker: cache all static JSON/text assets on install for full offline use
- [ ] Test full offline functionality (airplane mode) across the year boundary (Year I/II
      flip) and season boundaries
- [ ] Add to home screen / manifest icons / splash screens
- [ ] Confirm bundle size is reasonable (full Douay-Rheims + Coverdale text is not small,
      consider lazy-loading per-day text vs. bundling everything at build time)

---

## Phase 12 — Launch MVP

- [ ] MVP scope checkpoint: Phases 0-6 plus Phase 10 (skeleton, fixed canticles, full
      psalm text, basic UI) constitute a genuinely usable daily prayer rule even before
      Office of Readings and Propers are complete — confirm this is an acceptable v1 scope
- [ ] Deploy to GitHub Pages
- [ ] Dogfood: use it for actual daily prayer for a period, log gaps/errors as issues
- [ ] Iterate on Phases 7-9 post-launch as ongoing content work

---

## Notes / Open Questions to Resolve Early

- Confirm exactly how the 4-week psalter cycle behaves across Lent/Easter/Advent — worth
  getting right before building 28 days of skeleton on a wrong assumption.
- Decide Midday Hour convention (one combined "Daytime Prayer" vs. full Terce/Sext/None)
  — affects schema shape in Phase 3.
- Decide second-reading (patristic) sourcing before Phase 7 rather than during it.
- Keep `SOURCES.md` and `CONVENTIONS.md` updated as living documents — they're the two
  files most likely to save time when picking this back up after a gap.
