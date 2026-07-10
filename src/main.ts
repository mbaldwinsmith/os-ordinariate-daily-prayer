import './style.css';
import { getOfficeDay, type DayOfWeek } from './calendar';
import { resolveDay, type HourView, type ReadingsView } from './office';

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

function renderHour(label: string, hour: HourView, readings: ReadingsView | null): string {
  const shortReading = hour.shortReading
    ? `<section class="text-section short-reading"><p class="eyebrow">Short reading</p><h3>${hour.shortReading.ref}</h3>${hour.shortReading.verified ? '' : '<p class="verification-note">Assignment awaiting verification against an authoritative breviary.</p>'}${renderVerses(hour.shortReading.verses)}</section>`
    : selectedHour === 'officeOfReadings' ? '' : '<p class="notice">No short reading is available for this Hour yet.</p>';
  const gospelCanticle = hour.gospelCanticle
    ? `<section class="text-section gospel-canticle"><p class="eyebrow">Gospel canticle</p><h3>${hour.gospelCanticle.name}</h3><p class="reference">${hour.gospelCanticle.scriptureRef}</p>${renderVerses(hour.gospelCanticle.verses)}</section>`
    : '';
  return `<article class="office"><header class="office-heading"><p class="eyebrow">The Daily Office</p><h2>${label}</h2></header>
    ${hour.psalmody.map(renderPsalmodyItem).join('')}
    ${selectedHour === 'officeOfReadings' ? renderReadings(readings) : shortReading}${gospelCanticle}
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

function render(date: Date): void {
  const officeDay = getOfficeDay(date);
  const day = resolveDay(officeDay);
  const activeLabel = HOURS.find(([key]) => key === selectedHour)![1];
  const hourTabs = HOURS.map(([key, label]) => `<button role="tab" data-hour="${key}" aria-selected="${key === selectedHour}" aria-controls="office-panel">${label}</button>`).join('');
  const dayContent = day
    ? `${day.verified ? '' : '<aside class="source-warning">This psalter assignment is an unverified best-effort reconstruction. See SOURCES.md.</aside>'}
       <div id="office-panel" role="tabpanel">${renderHour(activeLabel, day[selectedHour], day.readings)}</div>`
    : '<p role="alert" class="notice">This day is not populated yet.</p>';

  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <header class="site-header"><div><p class="site-kicker">Coverdale · Douay-Rheims</p><h1>Ordinariate Daily Prayer</h1></div>
      <button id="today-button" class="quiet-button">Today</button></header>
    <main>
      <section class="date-controls" aria-label="Date navigation">
        <button id="previous-day" class="arrow-button" aria-label="Previous day">←</button>
        <label><span>Choose date</span><input type="date" id="date-picker" value="${toDateKey(date)}" /></label>
        <button id="next-day" class="arrow-button" aria-label="Next day">→</button>
      </section>
      ${renderWeekNav(date)}
      <header class="day-heading"><p>${new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)}</p>
        <h2>${officeDay.celebrationName}</h2>
        <div class="metadata"><span>${officeDay.season}${officeDay.weekOfSeason ? ` · Week ${officeDay.weekOfSeason}` : ''}</span><span>${officeDay.rank}</span><span>Psalter ${officeDay.psalterWeek}</span><span>Year ${officeDay.officeYear}</span></div>
      </header>
      <nav class="hour-tabs" role="tablist" aria-label="Hours of prayer">${hourTabs}</nav>
      ${dayContent}
    </main>
    <footer>Texts: Coverdale Psalter and Douay-Rheims-Challoner Bible.</footer>`;

  document.querySelector<HTMLInputElement>('#date-picker')!.addEventListener('change', (event) => render(parseDateKey((event.target as HTMLInputElement).value)));
  document.querySelector('#today-button')!.addEventListener('click', () => render(new Date()));
  document.querySelector('#previous-day')!.addEventListener('click', () => render(shiftDate(date, -1)));
  document.querySelector('#next-day')!.addEventListener('click', () => render(shiftDate(date, 1)));
  document.querySelectorAll<HTMLButtonElement>('[data-date]').forEach((button) => button.addEventListener('click', () => render(parseDateKey(button.dataset.date!))));
  document.querySelectorAll<HTMLButtonElement>('[data-hour]').forEach((button) => button.addEventListener('click', () => {
    selectedHour = button.dataset.hour as HourKey;
    render(date);
  }));
}

render(new Date());

if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
