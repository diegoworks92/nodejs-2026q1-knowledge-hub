import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts', '**/*.test.ts'],
    exclude: ['test/**/*.spec.ts', 'node_modules'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 90,
        branches: 85,
      },
    },
  },

  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
