import './style.css';
import { getOfficeDay, type DayOfWeek } from './calendar';
import { resolveDay, type DayView, type HourView, type ReadingsView } from './office';
import { getTheme, setTheme, watchSystemTheme } from './theme';
import { listLitanies } from './litanies';

const DAY_LABELS: Record<DayOfWeek, string> = {
  sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat',
};

const HOURS = [
  ['officeOfReadings', 'Readings'],
  ['lauds', 'Lauds'],
  ['daytimePrayer', 'Daytime'],
  ['vespers', 'Vespers'],
  ['compline', 'Compline'],
] as const;
type HourKey = (typeof HOURS)[number][0];

let selectedHour: HourKey = 'lauds';
let currentDate = new Date();
let focusMode = false;
let view: 'office' | 'litanies' = 'office';
let selectedLitanyId: string | null = null;

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function shiftDate(date: Date, days: number): Date {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}

function renderVerses(verses: Record<string, string>): string {
  return `<div class="verses">${Object.entries(verses)
    .map(([number, text]) => `<p><span class="verse-number">${number}</span>${text}</p>`)
    .join('')}</div>`;
}

function renderPsalmodyItem(item: HourView['psalmody'][number]): string {
  const kind = item.type === 'psalm' ? 'Psalm' : 'Canticle';
  const name = item.type === 'canticle' ? item.name : undefined;
  return `<section class="text-section">
    <header><p class="eyebrow">${kind}</p><h3>${name ?? item.ref}</h3>${name ? `<p class="reference">${item.ref}</p>` : ''}</header>
    ${renderVerses(item.verses)}
  </section>`;
}

function renderReadings(readings: ReadingsView | null): string {
  if (!readings) return '<p class="notice">No Office of Readings text is available for this day.</p>';
  const patristic = readings.patristicReading
    ? `<section class="text-section"><p class="eyebrow">Second reading</p><h3>${readings.patristicReading.title}</h3><p>${readings.patristicReading.sourceRef ?? ''}</p></section>`
    : '<p class="notice">The patristic second reading is intentionally omitted in this edition.</p>';
  return `<section class="text-section">
      <p class="eyebrow">First reading</p><h3>${readings.scriptureReading.title ?? readings.scriptureReading.ref}</h3>
      ${readings.scriptureReading.title ? `<p class="reference">${readings.scriptureReading.ref}</p>` : ''}
      ${renderVerses(readings.scriptureReading.verses)}
    </section>${patristic}`;
}

interface DevotionalItem {
  title: string;
  kind: 'prayer' | 'versicles' | 'litany';
  verified: true;
  sourceRef: string;
  text?: string | string[];
  responses?: { leader: string; people: string }[];
}

function renderDevotionalItem(item: DevotionalItem): string {
  const responses = item.responses
    ? `<div class="responses">${item.responses.map(({ leader, people }) => `<p><span class="speaker">V.</span>${leader}</p><p><span class="speaker">R.</span>${people}</p>`).join('')}</div>`
    : '';
  const text = item.text ? (Array.isArray(item.text) ? item.text : [item.text]).map((paragraph) => `<p>${paragraph}</p>`).join('') : '';
  return `<section class="devotional-item"><h4>${item.title}</h4>${responses}${text}</section>`;
}

function renderLitanies(): string {
  const litanies = listLitanies();
  const selected = litanies.find((item) => item.title === selectedLitanyId) ?? litanies[0];
  const list = litanies
    .map((item) => `<button class="litany-list-item" data-litany="${item.title}" aria-current="${item === selected}">${item.title}</button>`)
    .join('');
  return `<div class="litany-layout" id="litanies-panel" role="tabpanel">
    <nav class="litany-list" aria-label="Litanies and devotions">${list}</nav>
    ${renderDevotionalItem(selected)}
  </div>`;
}

function renderHour(label: string, hour: HourView, day: DayView): string {
  const hourLabel = hour.vespersKind === 'first'
    ? `First Vespers of ${hour.effectiveDay.celebrationName}`
    : hour.vespersKind === 'second' ? `Second ${label}` : label;
  const invitatory =
    selectedHour === 'officeOfReadings'
      ? `<section class="text-section antiphon"><p class="eyebrow">Invitatory antiphon</p><p>${day.invitatory.firstLine}<br/>${day.invitatory.secondLine}</p></section>`
      : '';
  const oAntiphon =
    selectedHour === 'vespers' && day.oAntiphon
      ? `<section class="text-section antiphon"><p class="eyebrow">O Antiphon</p><p>${day.oAntiphon.english}</p><p class="reference">${day.oAntiphon.citation}</p></section>`
      : '';
  const shortReading = hour.shortReading
    ? `<section class="text-section short-reading"><p class="eyebrow">Short reading</p><h3>${hour.shortReading.ref}</h3>${hour.shortReading.verified ? '' : '<p class="verification-note">Assignment awaiting verification against an authoritative breviary.</p>'}${renderVerses(hour.shortReading.verses)}</section>`
    : selectedHour === 'officeOfReadings' ? '' : '<p class="notice">No short reading is available for this Hour yet.</p>';
  const gospelCanticle = hour.gospelCanticle
    ? `<section class="text-section gospel-canticle"><p class="eyebrow">Gospel canticle</p><h3>${hour.gospelCanticle.name}</h3><p class="reference">${hour.gospelCanticle.scriptureRef}</p>${renderVerses(hour.gospelCanticle.verses)}</section>`
    : '';
  const complineAntiphon =
    selectedHour === 'compline'
      ? `<section class="text-section antiphon"><p class="eyebrow">Marian antiphon</p><h3>${day.complineAntiphon.name}</h3><p class="verification-note">Awaiting a source with clearer licensing - see SOURCES.md.</p><p>${day.complineAntiphon.english}</p></section>`
      : '';
  return `<article class="office"><header class="office-heading"><p class="eyebrow">The Daily Office</p><h2>${hourLabel}</h2></header>
    ${invitatory}${hour.psalmody.map(renderPsalmodyItem).join('')}
    ${selectedHour === 'officeOfReadings' ? renderReadings(day.readings) : shortReading}${oAntiphon}${gospelCanticle}${complineAntiphon}
  </article>`;
}

function renderWeekNav(selected: Date): string {
  const sunday = shiftDate(selected, -selected.getDay());
  const buttons = Array.from({ length: 7 }, (_, offset) => {
    const day = shiftDate(sunday, offset);
    const key = toDateKey(day);
    return `<button class="day-button" data-date="${key}" ${key === toDateKey(selected) ? 'aria-current="date"' : ''}>
      <span>${DAY_LABELS[getOfficeDay(day).dayOfWeek]}</span><strong>${day.getDate()}</strong>
    </button>`;
  }).join('');
  return `<nav class="week-nav" aria-label="Select a day">${buttons}</nav>`;
}

function renderImpl(date: Date): void {
  currentDate = date;
  document.documentElement.setAttribute('data-hour', selectedHour);
  document.documentElement.toggleAttribute('data-focus', focusMode);
  const officeDay = getOfficeDay(date);
  const day = resolveDay(officeDay);
  const activeLabel = HOURS.find(([key]) => key === selectedHour)![1];
  const hourTabs = HOURS.map(([key, label]) => `<button role="tab" data-hour="${key}" aria-selected="${view === 'office' && key === selectedHour}" aria-controls="office-panel">${label}</button>`).join('');
  const litaniesTab = `<button role="tab" class="litanies-tab" data-view="litanies" aria-selected="${view === 'litanies'}" aria-controls="litanies-panel" aria-label="Litanies and devotions" title="Litanies and devotions">🙏</button>`;
  const dayContent = day
    ? `${day.verified ? '' : '<aside class="source-warning">This psalter assignment is an unverified best-effort reconstruction. See SOURCES.md.</aside>'}
       <div id="office-panel" role="tabpanel">${renderHour(activeLabel, day[selectedHour], day)}</div>`
    : '<p role="alert" class="notice">This day is not populated yet.</p>';
  const officeControls = view === 'office'
    ? `<section class="date-controls" aria-label="Date navigation">
        <button id="previous-day" class="arrow-button" aria-label="Previous day">←</button>
        <label><span>Choose date</span><input type="date" id="date-picker" value="${toDateKey(date)}" /></label>
        <button id="next-day" class="arrow-button" aria-label="Next day">→</button>
      </section>
      ${renderWeekNav(date)}
      <header class="day-heading"><p>${new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)}</p>
        <h2>${officeDay.celebrationName}</h2>
        <div class="metadata"><span>${officeDay.season}${officeDay.weekOfSeason ? ` · Week ${officeDay.weekOfSeason}` : ''}</span><span>${officeDay.rank}</span><span>Psalter ${officeDay.psalterWeek}</span><span>Year ${officeDay.officeYear}</span></div>
      </header>`
    : '';

  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <header class="site-header"><div><p class="site-kicker">Unofficial personal prayer rule</p><h1>Personal Daily Prayer</h1></div>
      <div class="header-actions">
        ${view === 'office' ? `<button id="focus-toggle" class="quiet-button" type="button">Focus</button>` : ''}
        <button id="theme-toggle" class="quiet-button icon-button" type="button" aria-label="Switch to ${getTheme() === 'dark' ? 'light' : 'dark'} theme" aria-pressed="${getTheme() === 'dark'}">${getTheme() === 'dark' ? '🌛' : '🌞'}</button>
        <button id="today-button" class="quiet-button">Today</button>
      </div></header>
    <main>
      ${officeControls}
      <nav class="hour-tabs" role="tablist" aria-label="Hours of prayer and litanies"><div class="hour-tabs-grid">${hourTabs}</div>${litaniesTab}</nav>
      ${view === 'office' && focusMode ? `<div class="focus-bar">
        <button id="focus-prev" class="arrow-button" aria-label="Previous hour">←</button>
        <div class="focus-title"><p class="eyebrow">The Daily Office</p><strong>${activeLabel}</strong></div>
        <div class="focus-bar-actions">
          <button id="focus-next" class="arrow-button" aria-label="Next hour">→</button>
          <button id="focus-exit" class="focus-exit" type="button">Done</button>
        </div>
      </div>` : ''}
      ${view === 'office' ? dayContent : renderLitanies()}
    </main>
    <footer><strong>For personal devotion.</strong> This is not an authorised liturgical book.<br/>Texts: Coverdale Psalter and Douay-Rheims-Challoner Bible.</footer>`;

  document.querySelector<HTMLInputElement>('#date-picker')?.addEventListener('change', (event) => render(parseDateKey((event.target as HTMLInputElement).value)));
  document.querySelector('#theme-toggle')!.addEventListener('click', () => {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    render(date);
  });
  document.querySelector('#today-button')!.addEventListener('click', () => render(new Date()));
  document.querySelector('#previous-day')?.addEventListener('click', () => render(shiftDate(date, -1)));
  document.querySelector('#next-day')?.addEventListener('click', () => render(shiftDate(date, 1)));
  document.querySelectorAll<HTMLButtonElement>('[data-date]').forEach((button) => button.addEventListener('click', () => render(parseDateKey(button.dataset.date!))));
  document.querySelectorAll<HTMLButtonElement>('.hour-tabs [data-hour]').forEach((button) => button.addEventListener('click', () => {
    selectedHour = button.dataset.hour as HourKey;
    view = 'office';
    render(date);
  }));
  document.querySelector<HTMLButtonElement>('.hour-tabs [data-view=litanies]')?.addEventListener('click', () => {
    view = 'litanies';
    render(date);
  });
  document.querySelectorAll<HTMLButtonElement>('.litany-list [data-litany]').forEach((button) => button.addEventListener('click', () => {
    selectedLitanyId = button.dataset.litany!;
    render(date);
  }));

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
}

// Cross-fades the previous view into the next one (day/hour navigation) using
// the View Transitions API where supported. Falls back to an instant swap on
// unsupported browsers and whenever the user prefers reduced motion - this is
// a progressive enhancement, not something any rendering logic depends on.
function render(date: Date): void {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion || typeof document.startViewTransition !== 'function') {
    renderImpl(date);
    return;
  }
  document.startViewTransition(() => renderImpl(date));
}

render(new Date());
watchSystemTheme(() => render(currentDate));

if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
