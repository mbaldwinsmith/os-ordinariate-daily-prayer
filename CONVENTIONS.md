# CONVENTIONS.md

Reference and data-key conventions for this project, fixed before any further transcription
so all later data entry is consistent. See `SOURCES.md` for where the underlying texts come
from.

## The five Hours

This app implements five Hours per day: Office of Readings, Lauds, Daytime Prayer, Vespers,
Compline. **Daytime Prayer is a single combined midday hour**, not the full Terce/Sext/None
of the monastic/clerical observance - this matches how most laity actually pray the modern
Liturgy of the Hours, and it matches Anglican patrimony's simpler daily-office pattern (the
BCP has no separate Terce/Sext/None). This was an explicit decision (user-confirmed), not a
default assumed to save effort - it fixes the hour keys used throughout `schema/` and
`data/psalter/`.

## Psalm numbering

All psalms and the four fixed canticles in this app come from the **Coverdale Psalter (BCP
1662)**, which uses **Hebrew/Masoretic numbering** (Psalms 1-150, same numbering as any
modern English Bible). Every `Ps N` reference anywhere in this project — code, data, docs —
means Hebrew numbering.

The Douay-Rheims-Challoner text (`data/texts/douay-rheims-challoner.json`) uses **Vulgate/
Septuagint numbering** for its own Psalms book (e.g. its "Psalm 23" is the Hebrew-numbered
Psalm 24, "The earth is the Lord's"). We do not use the DRC Psalms book to source any psalm
text in this app — psalms always come from the Coverdale data. If a scripture reading or
patristic text ever needs to cite a psalm by number, the citation must say explicitly which
numbering it uses.

## Scripture references

Format: `<Book> <chapter>:<verse>[-<verse>][, <chapter>:<verse>[-<verse>]]*`

- Single verse: `Rom 1:1`
- Verse range within a chapter: `Rom 1:1-7`
- Range crossing a chapter boundary: `2 Cor 4:16-5:10`
- Discontiguous pericope (common in Office of Readings second readings): comma-separated
  segments, e.g. `1 Cor 12:31-13:8, 13:13`

Book abbreviations (also machine-readable at `data/texts/book-abbreviations.json`, the
single source of truth both `scripts/generate-office-of-readings.mjs` and
`src/scripture.ts` read from - keep that file and this table in sync if either changes;
the canonical full names below are what's actually used as JSON keys in
`data/texts/douay-rheims-challoner.json`, produced by
`scripts/fetch-douay-rheims.mjs` — that source repo normalizes book names/numbering to a
common cross-translation scheme, so e.g. it says "I Samuel"/"I Kings" rather than the
traditional Douay "1 Kings"/"3 Kings", and "Song of Solomon"/"Sirach"/"Revelation of John"
rather than "Canticle of Canticles"/"Ecclesiasticus"/"Apocalypse". Lectionary-facing UI text
may still want to display the traditional Douay titles — that's a rendering concern for
Phase 10, not a storage-key concern):

| Abbreviation | Full book name (JSON key) | | Abbreviation | Full book name (JSON key) |
|---|---|---|---|---|
| Gn | Genesis | | Na | Nahum |
| Ex | Exodus | | Hb | Habakkuk |
| Lv | Leviticus | | Zep | Zephaniah |
| Nm | Numbers | | Hg | Haggai |
| Dt | Deuteronomy | | Zec | Zechariah |
| Jos | Joshua | | Mal | Malachi |
| Jgs | Judges | | 1 Mc | I Maccabees |
| Ru | Ruth | | 2 Mc | II Maccabees |
| 1 Sm | I Samuel | | Mt | Matthew |
| 2 Sm | II Samuel | | Mk | Mark |
| 1 Kgs | I Kings | | Lk | Luke |
| 2 Kgs | II Kings | | Jn | John |
| 1 Chr | I Chronicles | | Acts | Acts |
| 2 Chr | II Chronicles | | Rom | Romans |
| Ezr | Ezra | | 1 Cor | I Corinthians |
| Neh | Nehemiah | | 2 Cor | II Corinthians |
| Tb | Tobit | | Gal | Galatians |
| Jdt | Judith | | Eph | Ephesians |
| Est | Esther | | Phil | Philippians |
| Jb | Job | | Col | Colossians |
| Ps | Psalms (Coverdale only — see above) | | 1 Thes | I Thessalonians |
| Prv | Proverbs | | 2 Thes | II Thessalonians |
| Eccl | Ecclesiastes | | 1 Tm | I Timothy |
| Song | Song of Solomon | | 2 Tm | II Timothy |
| Wis | Wisdom | | Ti | Titus |
| Sir | Sirach | | Phlm | Philemon |
| Is | Isaiah | | Heb | Hebrews |
| Jer | Jeremiah | | Jas | James |
| Lam | Lamentations | | 1 Pt | I Peter |
| Bar | Baruch | | 2 Pt | II Peter |
| Ez | Ezekiel | | 1 Jn | I John |
| Dn | Daniel | | 2 Jn | II John |
| Hos | Hosea | | 3 Jn | III John |
| Jl | Joel | | Jude | Jude |
| Am | Amos | | Rv | Revelation of John |
| Ob | Obadiah | | | |
| Jon | Jonah | | | |
| Mi | Micah | | | |

(The DRC dataset also carries `Prayer of Manasses`, `I Esdras`, `II Esdras`, `Additional
Psalm`, and `Laodiceans` as an apocryphal appendix. None of these are part of the Roman Rite
lectionary this app implements; no abbreviation is defined for them.)

## Structured data key shape

Both scripture and psalm text are stored as plain nested objects keyed by number-as-string,
for O(1) reference lookup without a parsing step at render time:

```jsonc
// data/texts/douay-rheims-challoner.json
{ "books": { "Romans": { "1": { "1": "Paul, a servant...", "2": "..." } } } }

// data/texts/coverdale-psalter.json
{ "psalms": { "23": { "1": "The Lord is my shepherd...", "2": "..." } } }
```

Full JSON Schemas for every data file shape (including the ones below, not yet populated)
live under `schema/` and are enforced by `npm run validate:data` (wired into CI).

## Data file layout for later phases

- `data/psalter/week<N>/<day>.json` (`N` 1-4, `day` a lowercase weekday name): one file per
  day of the four-week psalter. See `schema/psalter-day.schema.json` - Phase 5 populates
  these.
- `data/office-of-readings/<yearI|yearII>/<season>/week<N>/<day>.json`: one file per day,
  for the seasons that actually have a numbered week: `ordinaryTime`, `advent`, `lent`
  (only its 5 numbered weeks - see below), and `easter`. **Not** `christmas` or
  `triduum` - both have no week number at all (`weekOfSeason` is always `null` for them -
  see `src/calendar.ts`), so their Office of Readings content lives under
  `proper-of-seasons/` instead, like the Triduum always did. See
  `schema/office-of-readings-day.schema.json`; `src/officeOfReadings.ts` dispatches between
  the two sources. The two year directories are compatibility paths and intentionally
  contain the same canonical one-year cycle printed in the current Liturgy of the Hours;
  they must not be made different without an authoritative optional two-year supplement.
  A `scriptureReading.refs` array represents the rare appointed pericope that crosses a
  biblical-book boundary.
- `data/proper-of-seasons/<key>.json` and `data/proper-of-saints/<key>.json`: one file per
  overridden celebration/date, filename matching the `key` field inside the file. For the
  Triduum (`holyThursday`/`goodFriday`/`holySaturday`) and Christmas season days, `key`
  matches romcal's own celebration key directly - reliable for these since nothing of
  lower rank displaces them, **except** a handful of low-rank Christmas-season ferias
  (the "before/after Epiphany" days) that an optional memorial can occasionally occupy
  instead; those days' Office of Readings just isn't populated in years where that
  happens, rather than resolving to the wrong content. For the four days between Ash
  Wednesday and the first Sunday of Lent, `key` is a synthetic identifier
  (`ashWednesday`/`thursdayAfterAshWednesday`/`fridayAfterAshWednesday`/`saturdayAfterAshWednesday`)
  looked up by day-of-week rather than by romcal's key, because that key is even less
  stable there (an occasional commemoration can occupy the Saturday). `proper-of-seasons`
  is for moveable/seasonal overrides; `proper-of-saints` is for fixed-date solemnities/
  feasts/memorials. Phase 8 wires `src/proper.ts` (shared by `src/office.ts` and
  `src/officeOfReadings.ts`) to check both before falling back to the ferial psalter/
  weekN, and populates `proper-of-saints` for the first time. A `hours` object (see
  `schema/proper.schema.json`) can override some or all of the five Hours' psalmody for a
  celebration; anything not listed there falls back to the ferial psalter skeleton, which
  is why most solemnities only carry a `firstReading` override and let the ferial
  psalmody stand. The one exception is the Easter octave (`easter` through
  `divineMercySunday`): the four-week psalter skeleton has no entry at all for
  `psalterWeek: 'easter'` (see `src/psalter.ts`), so those 8 days need a full `hours`
  override covering every Hour, not a partial one.

## Canticle identifiers

The four fixed canticles use plain string ids, not scripture references, since they're
Psalter-adjacent rather than sliced out of the DRC text:

- `benedictus` (Song of Zechariah, Lk 1:68-79)
- `magnificat` (Song of Mary, Lk 1:46-55)
- `nuncDimittis` (Song of Simeon, Lk 2:29-32)
- `benedicite` (Song of the Three Young Men / Benedicite Omnia Opera)

**Benedictus/Magnificat/Nunc Dimittis are hour-invariant** - prayed at the end of every
Lauds/Vespers/Compline respectively regardless of the day, so `src/office.ts` attaches them
directly and they never appear in a day's own `data/psalter/` file. **Benedicite is
different**: despite being grouped with the other three as one of the "four fixed
canticles" (it's fixed *text*, not composed fresh), it is NOT prayed daily - it's the
Sunday Lauds canticle specifically, standing in the same slot that an ordinary weekday's
variable Old Testament canticle would occupy. So it's referenced from within a day's own
psalmody (`{ "type": "canticle", "fixedId": "benedicite" }`), not hour-invariantly attached
like the other three - see `schema/psalter-day.schema.json`.

Other variable Old/New Testament canticles used at Lauds/Vespers are sourced as ordinary
scripture excerpts via the reference syntax above, not given special ids.

## Short readings at the Hours

Lauds, Daytime Prayer, Vespers, and Compline each carry a `shortReading` after the
psalmody. Office of Readings keeps its separate long first/second-reading model. A proper
may override a short reading independently of psalmody; otherwise resolution falls back
to the four-week ferial assignment. The app does not insert ordinary Gospel readings:
the Benedictus, Magnificat, and Nunc Dimittis are Gospel canticles, while the Gospels are
normally reserved for Mass (GILH 144).

Source references sometimes select only part of a verse (`a`/`b`). Because the DRC JSON
is keyed at whole-verse granularity, these are deliberately expanded to the complete
verse and stored without the clause suffix (for example `Am 5:8, 9b` becomes
`Am 5:8-9`). Discontiguous and cross-chapter references use the comma-separated syntax
documented above.

## Prayer Book prayer supplement

The Prayer Book layer is an Anglican-patrimony devotional supplement, not the appointed
Roman `preces`. Its data, resolver (`src/prayerBook.ts`), and `includePrayerBookPrayers`
local-storage preference (`src/prayerBookPreference.ts`) remain in the codebase and under
test, but the UI toggle and its render call in `src/main.ts` were removed — this is a
private, single-user app and the layer isn't wanted, so it's currently dormant rather than
deleted outright. Prayer texts and assignments live in `data/texts/prayerBookPrayers.json`
and resolve separately from the underlying Office.

Lauds uses the BCP Suffrages, morning Collect for Peace, and Collect for Grace; Vespers
uses the Suffrages, evening Collect for Peace, and Collect for Aid against All Perils.
Office of Readings uses the Prayer of St John Chrysostom, Daytime Prayer uses “Prevent
us, O Lord,” and Compline uses the Collect for Aid against All Perils. The abbreviated
Litany is added to Lauds on Sundays, Wednesdays, and Fridays. Royal and state petitions
are deliberately omitted because the application is not bound to one civil jurisdiction.
No Collect of the Day is supplied: mapping the BCP temporal calendar onto the modern
Roman calendar would risk presenting the wrong collect as appointed.

## Litanies & personal devotions

The Litanies tab (`LITANIES.md` as the human-reviewed source, `data/texts/litanies.json`
as the schema-validated data, `src/litanies.ts` as the resolver) is a standalone,
Hour-independent collection of personal-favourite litanies and devotions: Marian
antiphons, several traditional litanies, and a couple of standalone prayers. It is not
tied to a specific Hour or day of the psalter, does not claim liturgical authority or
appointed status, and is always visible as its own tab rather than being injected into
the Office rendering. Items are shown in a flat list, in `LITANIES.md`'s own order, with
no categorisation.

Versicle/response material is modelled the same way as the Prayer Book supplement's
(`leader`/`people` pairs), including litanies whose source text repeats the same words
for both the leader and the people (the threefold Kyrie eleison found at the head of
several of these litanies). Multi-stanza works (for example St Patrick's Breastplate)
use an array of paragraph/stanza strings rather than a single flattened block of text.

## Canonical psalter structure

`canonical-psalter-skeleton.json` is the single structural source for the four-week
psalter. `scripts/generate-psalter-skeleton.mjs` normalizes its references into the
project conventions and generates `data/psalter/week1` through `week4`; direct edits to
those generated assignments are rejected by `npm run diff:psalter`.

Psalmody arrays are ordered liturgical slots: Lauds is psalm, Old Testament canticle,
psalm; Vespers is psalm, psalm, New Testament canticle. Sunday stores both First and
Second Vespers. Ordinary Saturday Vespers resolves to the following Sunday's First
Vespers, including that Sunday's season, psalter week, proper, and short reading. A
solemnity falling on Saturday retains its Second Vespers unless the following Sunday is
in Advent, Lent, or Easter; this conservative collision rule is explicit pending fuller
local-calendar and transfer support. The selected civil date does not change. Compline
after First Vespers remains the Saturday entry in the seven-day cycle, following the
traditional Night Prayer I pattern rather than inheriting Sunday's civil-day entry.
Compline is stored once as a seven-day cycle in `data/psalter/compline.json`, together
with the default invitatory Psalm 95 and its permitted alternatives (100, 67, and 24).
The four canonical seasonal Office-of-Readings forks select their strong-season branch
outside Ordinary Time. Sunday Second Vespers substitutes `1 Pt 2:21-24` for the usual
Revelation canticle during Lent.

Canonical source references containing verse-part suffixes (`a`/`b`/`c`) are expanded
to whole Coverdale/DRC verses, since both local text datasets have whole-verse keys.
Discontiguous psalm selections use the same comma-separated convention as Scripture,
for example `Ps 110:1-5, 7`.
Where the canonical table and the Coverdale source segment a psalm differently at a
range endpoint, the canonical reference remains the structural identifier and the
renderer includes every locally keyed Coverdale verse falling within that selection.

## Antiphons

TASKS.md Phase 9 originally omitted antiphons entirely for MVP, for lack of a usable
source. Revisiting that search turned up three distinct, contained antiphon systems -
not the full per-psalm daily antiphon cycle a Roman monastic breviary carries (no
public-domain, appropriately-licensed source for *that* has been found), but three real,
traditional pieces that are genuinely part of the Anglican daily office's own patrimony:

- **The Invitatory antiphon** (`data/texts/invitatoryAntiphons.json`, `src/invitatory.ts`):
  said before the Venite/Jubilate at the start of the day's first Hour. Real practice
  says it before whichever Hour a person prays first (Office of Readings or Lauds); this
  app always attaches it to Office of Readings specifically (the first Hour in `HOURS`'
  own listed order) as a deliberate simplification, documented rather than hidden. A day's
  antiphon is resolved by celebration key first (a specific solemnity/feast override),
  then season (with the Christmas season further split at Epiphany, Jan 6, since the
  antiphon changes there even though this app's own `Season` enum doesn't), then a
  three-way weekday rotation as the Ordinary Time default.
- **The "O Antiphons"** (`data/texts/oAntiphons.json`, `src/oAntiphon.ts`): attached to
  the Magnificat at Vespers, Dec 16-23. This app follows the **Sarum/English tradition of
  8 antiphons** (adding "O Virgo virginum" for Dec 23) rather than the Roman tradition's 7
  (Dec 17-23) - a deliberate choice given this app's Anglican Ordinariate audience, not an
  oversight.
- **The four seasonal Marian antiphons** (`data/texts/marianAntiphons.json`,
  `src/complineAntiphon.ts`): said at the end of Compline. Alma Redemptoris Mater (Advent
  through Feb 1), Ave Regina Caelorum (Feb 2/Candlemas through Holy Saturday), Regina
  Caeli (the Easter season), Salve Regina (Trinity Sunday through the eve of Advent).
  Resolved against actual calendar dates, not just this app's `Season` enum, since the
  Feb 1/2 boundary falls in the middle of what this app calls `'ordinaryTime'`. **Every
  entry is `"verified": false`** - see SOURCES.md for why this one (unlike the other two)
  doesn't carry the same sourcing confidence.
