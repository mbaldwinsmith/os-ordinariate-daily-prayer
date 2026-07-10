import './style.css';
import { getOfficeDay } from './calendar';
import { resolveDay, type HourView } from './office';

const today = getOfficeDay(new Date());
const day = resolveDay(today);

function renderHour(label: string, hour: HourView): string {
  return `
    <h2>${label}</h2>
    <p>Psalm(s): ${hour.psalms.join(', ')} <em>(placeholder - Phase 5 builds the real psalter skeleton)</em></p>
    <p><strong>${hour.canticle.name}</strong><br/>${hour.canticle.verses['1']}</p>
  `;
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <h1>Ordinariate Daily Prayer</h1>
  <p>Scaffolding in progress — see TASKS.md for the build-out plan.</p>
  <p>
    ${today.date} — ${today.celebrationName}<br/>
    Season: ${today.season}${today.weekOfSeason ? `, week ${today.weekOfSeason}` : ''}<br/>
    Rank: ${today.rank}<br/>
    Psalter week: ${today.psalterWeek}<br/>
    Office of Readings: Year ${today.officeYear}<br/>
    Sunday cycle: Year ${today.sundayCycle}
  </p>
  ${renderHour('Lauds', day.lauds)}
  ${renderHour('Vespers', day.vespers)}
  ${renderHour('Compline', day.compline)}
`;

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js');
  });
}
