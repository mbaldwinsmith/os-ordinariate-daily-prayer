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
  build: {
    // The app bundles every psalm/reading up front for full offline use (see
    // TASKS.md Phase 11) rather than lazy-loading per-day, so total bytes
    // shipped can't shrink - but splitting the near-static data (the ~5MB
    // Douay-Rheims-Challoner text especially) and romcal into their own
    // chunks means editing app code doesn't force re-downloading them: their
    // content hash, and so the cached file, only changes when the data
    // actually does.
    chunkSizeWarningLimit: 6000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/romcal/')) return 'romcal';
          if (id.includes('/data/texts/douay-rheims-challoner.json')) return 'drc-text';
          if (id.includes('/data/')) return 'liturgical-data';
        },
      },
    },
  },
});
