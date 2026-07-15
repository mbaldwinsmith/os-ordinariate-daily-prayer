# Integrating the refined design

Two files change. The stylesheet is a full drop-in replacement; `main.ts` needs
four small additions. Nothing in your liturgical logic (`office.ts`,
`calendar.ts`, `psalter.ts`, …) is touched.

---

## 1. Replace `src/style.css`

Copy `repo-export/style.css` over `src/style.css`. It reuses every class and
selector the app already renders, so on its own it already gives you the full
type + colour refresh. The two dynamic behaviours below just switch it on.

## 2. Add the fonts (keeps the offline / zero-network policy)

The refresh uses **Cormorant Garamond** (display) and **EB Garamond** (body),
self-hosted so nothing is fetched at runtime.

```sh
npm i -D @fontsource/cormorant-garamond @fontsource/eb-garamond
```

Copy the woff2 files into `public/fonts/` with these names (referenced by the
`@font-face` rules at the top of the stylesheet):

```
public/fonts/cormorant-garamond-500.woff2
public/fonts/cormorant-garamond-600.woff2
public/fonts/cormorant-garamond-500-italic.woff2
public/fonts/eb-garamond-400.woff2
public/fonts/eb-garamond-500.woff2
public/fonts/eb-garamond-600.woff2
public/fonts/eb-garamond-400-italic.woff2
```

(The relevant files live under `node_modules/@fontsource/*/files/…-latin-400-normal.woff2`
etc. — rename as above.) Add them to the service-worker precache list in
`public/sw.js` so they’re available offline. If you skip this step the app
falls back to Palatino/Georgia and still looks good — just less distinctive.

---

## 3. `main.ts` — four additions

### (a) A focus-mode flag, next to the existing module state

```ts
let selectedHour: HourKey = 'lauds';
let currentDate = new Date();
let focusMode = false;               // <-- add
```

### (b) Reflect the selected Hour and focus state on <html>, inside `renderImpl`

Put these two lines at the very top of `renderImpl`, right after
`currentDate = date;`:

```ts
document.documentElement.setAttribute('data-hour', selectedHour);
document.documentElement.toggleAttribute('data-focus', focusMode);
```

`data-hour` drives the per-Hour colour mood (the `:root[data-hour=…]` rules).
`data-focus` drives the reading mode (the `:root[data-focus]` rules).

### (c) A Focus button + a focus bar in the template

Add a Focus toggle to `.header-actions` (before the theme toggle):

```ts
<button id="focus-toggle" class="quiet-button" type="button">Focus</button>
```

Then render the slim focus bar just before the `${dayContent}` line in the
`#app` innerHTML template — it only shows in focus mode via CSS, but we render
it conditionally so the controls exist:

```ts
${focusMode ? `<div class="focus-bar">
  <button id="focus-prev" class="arrow-button" aria-label="Previous hour">←</button>
  <div class="focus-title"><p class="eyebrow">The Daily Office</p><strong>${activeLabel}</strong></div>
  <div class="focus-bar-actions">
    <button id="focus-next" class="arrow-button" aria-label="Next hour">→</button>
    <button id="focus-exit" class="focus-exit" type="button">Done</button>
  </div>
</div>` : ''}
```

### (d) Wire the handlers, next to the other `addEventListener` calls

```ts
const HOUR_KEYS = HOURS.map(([key]) => key);
const stepHour = (delta: number) => {
  const i = HOUR_KEYS.indexOf(selectedHour);
  selectedHour = HOUR_KEYS[(i + delta + HOUR_KEYS.length) % HOUR_KEYS.length];
  render(date);
};

document.querySelector('#focus-toggle')?.addEventListener('click', () => { focusMode = true; render(date); });
document.querySelector('#focus-exit')?.addEventListener('click', () => { focusMode = false; render(date); });
document.querySelector('#focus-prev')?.addEventListener('click', () => stepHour(-1));
document.querySelector('#focus-next')?.addEventListener('click', () => stepHour(1));
```

That’s all. Day/date navigation, theme toggle, and the liturgical data flow are
unchanged.

---

## Colour reference (per-Hour moods)

| Hour               | Mood        | Light accent            |
|--------------------|-------------|-------------------------|
| Office of Readings | vigil       | `oklch(0.47 0.10 292)`  |
| Lauds              | dawn        | `oklch(0.55 0.11 72)`   |
| Daytime Prayer     | midday      | `oklch(0.50 0.085 150)` |
| Vespers            | sunset      | `oklch(0.46 0.125 24)`  |
| Compline           | night       | `oklch(0.46 0.095 268)` |

The header, week strip and controls stay on the constant wine `--brand` so the
app keeps one identity while each Hour’s reading surface carries its own light.
Dark-mode variants are in the stylesheet.
