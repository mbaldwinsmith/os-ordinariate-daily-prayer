import './style.css';
import { getOfficeDay } from './calendar';

const today = getOfficeDay(new Date());

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
`;

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js');
  });
}
