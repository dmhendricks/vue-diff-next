import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    test: {
        // Component specs need a DOM; core/ specs do not, but a single
        // environment keeps config simple and jsdom startup is cheap.
        environment: 'jsdom',
        include: ['src/**/*.spec.ts'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.{ts,vue}'],
            exclude: ['src/**/*.spec.ts', 'src/types/**', 'src/index.ts'],
            thresholds: {
                // Enforced on the pure logic that carries the real risk.
                'src/core/**': {
                    statements: 90,
                    branches: 85,
                    functions: 90,
                    lines: 90,
                },
            },
        },
    },
});
