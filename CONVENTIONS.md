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

Book abbreviations (used in reference strings; the canonical full names below are what's
actually used as JSON keys in `data/texts/douay-rheims-challoner.json`, produced by
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
- `data/office-of-readings/<yearI|yearII>/<season>/week<N>/<day>.json`: one file per day.
  `season` is one of `advent`/`christmas`/`ordinaryTime`/`lent`/`easter` (no `triduum` -
  the Triduum's Office of Readings is always proper, handled under `proper-of-seasons/`
  instead). See `schema/office-of-readings-day.schema.json` - Phase 7 populates these.
- `data/proper-of-seasons/<celebrationKey>.json` and `data/proper-of-saints/<celebrationKey>.json`:
  one file per overridden celebration, filename matching the same `key` used inside the
  file and matching romcal's own celebration key (e.g. `assumption.json`, `holyThursday.json`)
  so the day-resolution function can look an override up directly by key rather than
  scanning a directory. `proper-of-seasons` is for moveable/seasonal overrides (Ash
  Wednesday, Holy Week, etc.); `proper-of-saints` is for fixed-date solemnities/feasts/
  memorials. See `schema/proper.schema.json` - Phase 8 populates these.

## Canticle identifiers

The four fixed canticles use plain string ids, not scripture references, since they're
Psalter-adjacent rather than sliced out of the DRC text:

- `benedictus` (Song of Zechariah, Lk 1:68-79)
- `magnificat` (Song of Mary, Lk 1:46-55)
- `nuncDimittis` (Song of Simeon, Lk 2:29-32)
- `benedicite` (Song of the Three Young Men / Benedicite Omnia Opera)

Variable Old Testament canticles used at Lauds are sourced as ordinary scripture excerpts via
the reference syntax above, not given special ids.
