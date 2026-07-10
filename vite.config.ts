import { defineConfig } from 'vite';

// Relative base so the build works when served from a GitHub Pages
// project subpath (https://<user>.github.io/os-ordinariate-daily-prayer/)
// without hardcoding the repo name.
export default defineConfig({
  base: './',
  // romcal's dependencies (moment-range, moment-recur) are old UMD plugins
  // that mutate a shared `moment.fn` - they break if the bundler gives them
  // a second copy of the `moment` module instead of the same instance.
  resolve: {
    mainFields: ['browser', 'main', 'module'],
  },
});
