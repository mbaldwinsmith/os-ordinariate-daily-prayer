import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <h1>Ordinariate Daily Prayer</h1>
  <p>Scaffolding in progress — see TASKS.md for the build-out plan.</p>
`;

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js');
  });
}
