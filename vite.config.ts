import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true,
    watch: {
      // Playwright profiles and screenshots must not trigger the dev watcher.
      ignored: ['**/shots/**'],
    },
  },
});
