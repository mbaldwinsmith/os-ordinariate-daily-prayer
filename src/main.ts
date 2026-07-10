import './style.css';
import { getOfficeDay, type DayOfWeek } from './calendar';
import { resolveDay, type HourView } from './office';

const DAY_LABELS: Record<DayOfWeek, string> = {
  sunday: 'Sun',
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
};

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

function renderPsalmodyItem(item: HourView['psalmody'][number]): string {
  if (item.type === 'psalm') {
    const text = Object.values(item.verses).join(' ');
    return `<p><strong>${item.ref}</strong><br/>${text}</p>`;
  }
  if ('scriptureRef' in item) {
    return `<p><strong>${item.name ?? 'Canticle'}</strong> (${item.scriptureRef}) <em>- text not yet resolved, see TASKS.md Phase 7</em></p>`;
  }
  return '<p><strong>Benedicite</strong> <em>- see below</em></p>';
}

function renderHour(label: string, hour: HourView): string {
  const psalmody = hour.psalmody.map(renderPsalmodyItem).join('');

  const gospelCanticle = hour.gospelCanticle
    ? `<p><strong>${hour.gospelCanticle.name}</strong><br/>${hour.gospelCanticle.verses['1']}</p>`
    : '';

  return `
    <h2>${label}</h2>
    ${psalmody}
    ${gospelCanticle}
  `;
}

function renderWeekNav(selected: Date): string {
  const sunday = new Date(selected);
  sunday.setDate(selected.getDate() - selected.getDay());

  const buttons = Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + offset);
    const dateKey = toDateKey(day);
    const isSelected = dateKey === toDateKey(selected);
    return `<button data-date="${dateKey}" ${isSelected ? 'aria-current="date"' : ''}>${DAY_LABELS[getOfficeDay(day).dayOfWeek]} ${day.getDate()}</button>`;
  }).join('');

  return `<nav aria-label="Week">${buttons}</nav>`;
}

function render(date: Date): void {
  const officeDay = getOfficeDay(date);
  const day = resolveDay(officeDay);

  const dayContent = day
    ? `
        ${day.verified ? '' : '<p role="alert">⚠ This day\'s psalter content is an unverified best-effort reconstruction - see SOURCES.md.</p>'}
        ${renderHour('Office of Readings', day.officeOfReadings)}
        ${renderHour('Lauds', day.lauds)}
        ${renderHour('Daytime Prayer', day.daytimePrayer)}
        ${renderHour('Vespers', day.vespers)}
        ${renderHour('Compline', day.compline)}
      `
    : '<p role="alert">The Easter octave\'s special psalter isn\'t implemented yet (Phase 5 scope is the four-week skeleton only).</p>';

  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <h1>Ordinariate Daily Prayer</h1>
    <p>Scaffolding in progress — see TASKS.md for the build-out plan.</p>
    <p>
      <label>Date: <input type="date" id="date-picker" value="${toDateKey(date)}" /></label>
    </p>
    ${renderWeekNav(date)}
    <p>
      ${officeDay.date} — ${officeDay.celebrationName}<br/>
      Season: ${officeDay.season}${officeDay.weekOfSeason ? `, week ${officeDay.weekOfSeason}` : ''}<br/>
      Rank: ${officeDay.rank}<br/>
      Psalter week: ${officeDay.psalterWeek}<br/>
      Office of Readings: Year ${officeDay.officeYear}<br/>
      Sunday cycle: Year ${officeDay.sundayCycle}
    </p>
    ${dayContent}
  `;

  document.querySelector<HTMLInputElement>('#date-picker')!.addEventListener('change', (event) => {
    render(parseDateKey((event.target as HTMLInputElement).value));
  });

  document.querySelectorAll<HTMLButtonElement>('nav[aria-label="Week"] button').forEach((button) => {
    button.addEventListener('click', () => render(parseDateKey(button.dataset.date!)));
  });
}

render(new Date());

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js');
  });
}
