// Reads/writes the user's light/dark theme preference. The initial choice
// (an explicit prior choice, else system preference, else light) is already
// applied synchronously by the inline script in index.html before this
// module loads, to avoid a flash of the wrong theme on load - this module
// only handles the toggle button and reacting to a later system-preference
// change.
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const THEME_COLOR: Record<Theme, string> = { light: '#6b1220', dark: '#1b1512' };

export function getTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Privacy modes that block storage just won't persist the choice across visits.
  }
}

function hasExplicitPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/** Keeps following the OS theme live, but only until the user picks one explicitly via the toggle. */
export function watchSystemTheme(onChange: () => void): void {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    if (hasExplicitPreference()) return;
    setTheme(event.matches ? 'dark' : 'light');
    onChange();
  });
}
