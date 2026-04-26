import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'src/main.ts',
        'src/prisma/**',
        '**/*.module.ts',
        '**/*.dto.ts',
        '**/*.decorator.ts',
        'test/**',
      ],
      thresholds: {
        lines: 90,
        branches: 80,
      },
    },
  },
  plugins: [swc.vite()],
});
