# AGENTS.md

Working notes for AI agents on this repo, covering process conventions and
environment gotchas that aren't already captured in `TASKS.md`,
`CONVENTIONS.md`, or `SOURCES.md`.

## Process conventions established with the project owner

- **Open a PR at the end of every phase** — don't just push to the working
  branch and stop there.
- **CI monitoring**: don't schedule long (~1hr) check-ins to watch a PR.
  Do a short poll (on the order of 60-90s) and once CI is green, merge
  automatically without asking again first.
- **Sourcing ethos**: never fabricate liturgical/scriptural content from
  memory and present it as verified. When a primary source is unreachable,
  either ask the user for a scope tradeoff, or proceed with a real-text
  best-effort reconstruction explicitly flagged `"verified": false` and
  documented in `SOURCES.md` — never silently guess and never hide the gap.
- **Git ritual after every merge**: `git fetch origin main` →
  `git checkout -B <working-branch> origin/main` →
  `git push --force-with-lease`. The working branch is deliberately reset to
  main's tip each time, not accumulated on top of stale history.

## Environment gotchas

- `vite.config.ts` has `resolve.mainFields: ['browser','main','module']`.
  This isn't stylistic — without it, romcal's `moment-recur` dependency
  breaks at runtime (`Cannot set properties of undefined (setting
  'recur')`) because Vite picks romcal's ESM entry over its CJS entry
  instead of the reverse. `tsc`/`vite build` succeed either way; only
  loading the built app in a real browser catches it. Don't remove or
  "clean up" that `mainFields` line.
- The outbound network sandbox only reaches GitHub/npm/PyPI-style hosts.
  `archive.org`, `justus.anglican.org`, `eskimo.com`,
  `catholic-resources.org`, and similar liturgical-text sites are blocked.
  Sourcing work needs to search GitHub (code search across public repos)
  rather than assuming a normal web fetch will work.
- Playwright is **not** a project dependency — it's installed ad hoc per
  session into the scratchpad (`npm install playwright --no-save`) and
  launched with `executablePath: '/opt/pw-browsers/chromium'`. Don't add it
  to `package.json`.
- The app has no URL-param date routing. To smoke-test a specific date in a
  headless browser, `page.fill('#date-picker', 'YYYY-MM-DD')` then dispatch
  a `change` event — don't try to navigate with `?date=`.
- `npm run build` always emits a "chunk larger than 500 kB" warning (a
  single ~5.8 MB JS bundle, no code-splitting). That's pre-existing, not a
  regression to fix incidentally.
- CI is a single combined GitHub Actions check (`validate:data` + `test` +
  `build` in one job) — querying check runs on a PR returns exactly one
  entry, not one per step.
- "Build succeeds" is not proof a change works. Every phase that touches
  runtime behavior should get a real browser smoke test (Playwright against
  the built app, checking for console/page errors) before being called
  done — this was learned the hard way from the romcal bug above, which
  `tsc`/`vite build`/`vitest` all missed.

## Before opening a PR

Run the full local pipeline first:

```
npm run validate:data
npx tsc --noEmit
npx vitest run
npm run build
```
