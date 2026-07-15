# personal-daily-prayer

An unofficial, offline-first personal prayer rule published as a GitHub Pages Progressive
Web App. It draws on the structure of the post-1970 Roman Liturgy of the Hours and on
Anglican patrimony, but it is not an authorised liturgical book or an approved edition of
the Divine Office.

## Scope

- A personal five-Hour prayer pattern—Office of Readings, Lauds, Daytime Prayer, Vespers,
  and Compline—using the current Roman four-week psalter as its structural basis.
- **Coverdale Psalter** (Book of Common Prayer, 1662) for psalms and the fixed canticles
  (Benedictus, Magnificat, Nunc Dimittis, Benedicite) — public domain.
- **Douay-Rheims-Challoner** (1899 revision) for scripture readings and variable
  canticles — public domain.
- Calendar, season, and psalter-week logic via [romcal](https://github.com/romcal/romcal).
- No runtime API calls — all texts and calendar logic are bundled at build time so the
  app works fully offline once installed.
- Prayer Book prayers provide an explicitly devotional Anglican-patrimony layer alongside
  every Hour; they are not presented as the Roman Liturgy of the Hours' appointed
  intercessions.

## Status and authority

This project is made for personal devotion. It is not published or authorised by the Holy
See, an episcopal conference, the Personal Ordinariate of Our Lady of Walsingham, or the
Church of England. Verification flags and sourcing notes describe textual confidence;
they do not constitute ecclesiastical approval.

Exact editions used and their provenance will be documented in `SOURCES.md` as texts are
sourced (see `TASKS.md`, Phase 1).

## Status

Deployed offline-capable MVP. Canonical psalter verification is complete; Office of
Readings verification and incremental proper/second-reading coverage remain ongoing.
See `TASKS.md` for the phased plan.

## Development

```sh
npm install
npm run dev      # local dev server
npm run build    # type-check + production build to dist/
```

Pushes to `main` build and deploy `dist/` to GitHub Pages via
`.github/workflows/deploy.yml`.

## Licensing

The application code in this repository is licensed under the GNU General Public
License v3.0 (see `LICENSE`). The Coverdale Psalter and Douay-Rheims-Challoner texts are
public domain in their own right; their specific source editions and any transcription
notes are tracked separately in `SOURCES.md`.
