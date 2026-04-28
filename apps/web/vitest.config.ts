import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Playwright owns *.spec.ts in e2e/ — keep vitest scoped to unit tests.
    exclude: ['node_modules/', '.next/', 'e2e/**'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', '.next/', 'tests/', 'e2e/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
