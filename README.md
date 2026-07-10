# os-ordinariate-daily-prayer

A static, offline-first, GitHub Pages Progressive Web App implementing the current
(post-1970) four-week Liturgy of the Hours, suitable for use in the Personal Ordinariate
of Our Lady of Walsingham.

## Scope

- The current Roman Rite Liturgy of the Hours (Office of Readings, Lauds, Daytime Prayer,
  Vespers, Compline) across its four-week psalter cycle.
- **Coverdale Psalter** (Book of Common Prayer, 1662) for psalms and the fixed canticles
  (Benedictus, Magnificat, Nunc Dimittis, Benedicite) — public domain.
- **Douay-Rheims-Challoner** (1899 revision) for scripture readings and variable
  canticles — public domain.
- Calendar, season, and psalter-week logic via [romcal](https://github.com/romcal/romcal).
- No runtime API calls — all texts and calendar logic are bundled at build time so the
  app works fully offline once installed.

Exact editions used and their provenance will be documented in `SOURCES.md` as texts are
sourced (see `TASKS.md`, Phase 1).

## Status

Early scaffolding — see `TASKS.md` for the phased build-out plan.

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
