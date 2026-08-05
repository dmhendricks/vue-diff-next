import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { playwright } from '@vitest/browser-playwright';

/**
 * Layout tests, in a real browser.
 *
 * Separate from the main jsdom suite because these assert on *geometry* —
 * `offsetHeight`, wrapping, absolute row positions — and jsdom has no layout
 * engine at all. It reports every element as 0px tall and has no ResizeObserver,
 * so a row-overlap bug is not merely missed there, it is unrepresentable.
 *
 * That gap shipped a real defect: virtual-scrolled rows whose lines wrapped were
 * positioned at one line's height and overlapped each other, while all 233 jsdom
 * tests passed.
 *
 * Kept as its own config, and its own `test:browser` script, so the fast suite
 * stays fast and does not require a browser download to run.
 */
export default defineConfig({
    plugins: [vue()],
    test: {
        include: ['src/**/*.browser-spec.ts'],
        browser: {
            enabled: true,
            provider: playwright(),
            // Headless so it behaves the same locally and in CI.
            headless: true,
            instances: [{ browser: 'chromium' }],
        },
    },
});
