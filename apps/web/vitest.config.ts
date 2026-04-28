import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Keep vitest scoped to unit tests in this app. We must re-list the
    // default ignores explicitly because providing `exclude` overrides them
    // (notably `**/node_modules/**`), which would otherwise pull in tests
    // shipped inside zod/next/etc. on CI.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/.next/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'e2e/**',
    ],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['**/node_modules/**', '**/.next/**', 'tests/', 'e2e/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
