import { defineConfig } from 'vite';

// Relative base so the build works when served from a GitHub Pages
// project subpath (https://<user>.github.io/os-ordinariate-daily-prayer/)
// without hardcoding the repo name.
export default defineConfig({
  base: './',
});
