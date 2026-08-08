import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createApp, nextTick } from 'vue';

/**
 * Guards the README's quick-start examples.
 *
 * A README that does not compile is worse than none, and these are the first
 * things a new user copies. Import forms and prop names are asserted exactly as
 * documented.
 */
async function settle() {
    await nextTick();
    await Promise.resolve();
    await nextTick();
}

describe('README examples', () => {
    it('named import: import { Diff } from "vue-diff-next"', async () => {
        const { Diff } = await import('./index');
        expect(Diff).toBeDefined();

        const wrapper = mount(Diff, {
            props: {
                mode: 'split',
                theme: 'dark',
                language: 'javascript',
                prev: 'const a = 1;\n',
                current: 'const a = 2;\n',
            },
        });
        await settle();
        expect(wrapper.find('.vue-diff-wrapper').exists()).toBe(true);
    });

    it('default import is the plugin: app.use(VueDiff)', async () => {
        const VueDiff = (await import('./index')).default;
        const app = createApp({ template: '<div />' });
        app.use(VueDiff);
        expect(app.component('Diff')).toBeDefined();
    });

    it('componentName option renames the global component', async () => {
        const VueDiff = (await import('./index')).default;
        const app = createApp({ template: '<div />' });
        app.use(VueDiff, { componentName: 'VueDiff' });
        expect(app.component('VueDiff')).toBeDefined();
    });

    it('exports folding types for consumers', async () => {
        // Type-only re-exports are erased at runtime, so assert the entry's
        // public `export type` list still names the folding surface.
        const { readFileSync } = await import('node:fs');
        const { dirname, join } = await import('node:path');
        const { fileURLToPath } = await import('node:url');
        const source = readFileSync(
            join(dirname(fileURLToPath(import.meta.url)), 'index.ts'),
            'utf8',
        );
        const exported = source.match(/export type \{([^}]+)\}/s)?.[1] ?? '';
        expect(exported).toMatch(/\bFoldMarker\b/);
        expect(exported).toMatch(/\bFoldRange\b/);
    });

    it('documents every prop the component actually accepts', async () => {
        const { Diff } = await import('./index');
        const documented = [
            'mode',
            'theme',
            'language',
            'prev',
            'current',
            'folding',
            'foldMarker',
            'inputDelay',
            'virtualScroll',
            'wrap',
        ].sort();

        const actual = Object.keys(
            (Diff as unknown as { props: Record<string, unknown> }).props,
        ).sort();

        expect(actual).toEqual(documented);
    });

    it('documents the defaults correctly, including theme: dark', async () => {
        const { Diff } = await import('./index');
        const props = (Diff as unknown as { props: Record<string, { default?: unknown }> }).props;

        expect(props.mode?.default).toBe('split');
        expect(props.theme?.default).toBe('dark');
        expect(props.language?.default).toBe('plaintext');
        expect(props.folding?.default).toBe(false);
        expect(props.inputDelay?.default).toBe(0);
        expect(props.virtualScroll?.default).toBe(false);
        // Differs from the original, which had no such prop and always wrapped.
        expect(props.wrap?.default).toBe(true);
    });
});
