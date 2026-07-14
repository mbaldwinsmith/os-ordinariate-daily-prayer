# Plan: Litanies tab

## Context

Add a sixth, Hour-independent tab for personal-favourite litanies and devotions
(`LITANIES.md`: Alma Redemptoris Mater, Ave Regina Caelorum, Litany of the Blessed
Virgin Mary, Litany of Humility, Litany of the Most Holy Name of Jesus, Litany of the
Most Precious Blood of Jesus, Regina Caeli, Salve Regina, Litany of St. Joseph, St.
Michael the Archangel's Prayer, St. Patrick's Breastplate, Litany of the Sacred Heart
of Jesus, Litany of the Saints).

These don't fit under "Readings" (strictly the Office of Readings' Scripture +
patristic reading) and don't warrant a separate app (would fragment the offline/PWA
shell, theming, and data-verification tooling already built here). They're closest in
spirit to the existing **Prayer Book supplement** (`src/prayerBook.ts`,
`data/texts/prayerBookPrayers.json`, documented in `CONVENTIONS.md`) except they
aren't tied to a specific Hour or day — the user wants to browse them freely.

## Confirmed decisions

- Layout: a compact titles list (table of contents) + single selected item shown at a
  time, not one long scrolling page.
- Flat list, no categories, in `LITANIES.md`'s own order.
- `LITANIES.md` as currently drafted uses plain alternating lines (petition line, then
  response line) rather than the originally-proposed `V./R.` prefix convention. Next
  step (before touching app code): annotate a copy of `LITANIES.md` with my best-guess
  `V.`/`R.` markup for every call-and-response litany, for the user to review/correct,
  since several of these have real ambiguity (the opening Kyrie eleison block, and the
  Litany of Humility's "etc." shorthand which implies a repeating response the file
  doesn't spell out for every line) that's worth eyeballing before it's baked into
  JSON. Once confirmed, converting into data is mechanical.

## Data model

**`schema/litanies.schema.json`** — same item shape as `prayer-book-prayers.schema.json`'s
`$defs.item` (title, kind, verified, sourceRef, text?, responses?), but the top-level
schema only needs `items` + a flat `order` array (no `assignments`/`litanyDays` — these
aren't Hour- or day-linked). `text` is widened to `string | string[]` (array of
paragraphs/stanzas) so multi-stanza works (the Breastplate) get proper paragraph breaks
— an additive divergence from the Prayer Book schema, not a change to it.

**`data/texts/litanies.json`** — `items` map (`title`, `kind: 'prayer'|'versicles'|'litany'`,
`verified`, `sourceRef`, `text` or `responses`) plus `order: string[]` controlling
display order.

**`src/litanies.ts`** — mirrors `src/prayerBook.ts`:
```ts
import data from '../data/texts/litanies.json';
export interface LitanyItem { title: string; kind: 'prayer' | 'versicles' | 'litany'; verified: true; sourceRef: string; text?: string | string[]; responses?: { leader: string; people: string }[]; }
export function listLitanies(): LitanyItem[] // data.order.map(id => items[id])
```
No preference/toggle needed — it's an always-visible tab, not an injected supplement.

**`scripts/validate-data.mjs`** — add `litanies` to `validators`, add
`data/texts/litanies.json` to `singleFileTargets`, and a cross-check block (mirroring
the existing `prayerBookPath` block) verifying every `order` id resolves in `items`.

## UI changes (`src/main.ts`, `src/style.css`)

1. Keep `selectedHour: HourKey` unchanged (still drives Office rendering/focus
   mode/stepHour cycling). Add `let view: 'office' | 'litanies' = 'office';` and
   `let selectedLitanyId: string | null = null;`.
2. Extend the `.hour-tabs` tablist with a sixth "Litanies" button. Clicking an Hour
   button sets `view = 'office'`; clicking Litanies sets `view = 'litanies'`.
3. When `view === 'litanies'`: hide date controls, week nav, day heading, focus
   toggle, and Prayer Book toggle (all Office-specific/date-bound); render
   `renderLitanies()` instead of `dayContent`.
4. `renderLitanies()`: titles list + selected item's content, reusing a generalized
   `renderPrayerBookItem` → `renderDevotionalItem(item)` (shared by `PrayerBookItem`
   and `LitanyItem`, which have the same shape; `text` handling accepts `string[]`).
   Default to the first item selected so the panel isn't empty on first visit.
5. CSS: `.hour-tabs` grid is hardcoded `repeat(5, 1fr)` (`style.css` line 161, and the
   mobile override at line 238) — bump both to `repeat(6, 1fr)`. Add `.litany-list`
   (styled like `.day-button`/`.hour-tabs button`) and rename `.prayer-book-item` to a
   generic `.devotional-item` for reuse.

## Documentation

- `CONVENTIONS.md`: short "Litanies & personal devotions" section (mirrors the Prayer
  Book section) — standalone, Hour-independent tab, user-curated, not claiming
  liturgical authority.
- `TASKS.md`: `## Phase 16 — Litanies & Personal Devotions`.

## Tests

`src/litanies.test.ts` (mirrors `src/prayerBook.test.ts`): every `order` id resolves,
`listLitanies()` returns items in `order` sequence, every item has `text` or
`responses`, plus spot-check assertions once real content lands.

## Verification

- `npm run validate:data`, `npm test`, `npm run build`
- Manual: `npm run dev`, click the new tab, confirm titles list + selected item render,
  6-tab grid isn't cramped on mobile, switching back to any Hour tab still works.

## Status

Implemented: `LITANIES.md` annotated with `V./R.` markup, converted into
`data/texts/litanies.json` (13 items) against `schema/litanies.schema.json`, resolved via
`src/litanies.ts`, wired into `src/main.ts`/`src/style.css` as a sixth "Litanies" tab, and
documented in `CONVENTIONS.md`/`TASKS.md` (Phase 16). Verified via `npm run validate:data`,
`npx tsc --noEmit`, `npx vitest run`, `npm run build`, and a scripted Playwright pass
against the dev server (tab switching, default selection, V./R. rendering, Office chrome
hidden while on the tab, mobile tab-bar scrollability, zero console errors).
