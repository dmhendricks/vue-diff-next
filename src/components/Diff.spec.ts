import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import Diff from './Diff.vue';
import VueDiffPlugin, { Diff as NamedDiff } from '../index';

/** Let the async highlight settle so rendered markup is final. */
async function settle() {
    await nextTick();
    await Promise.resolve();
    await nextTick();
}

const PREV = 'line one\nline two\nline three\n';
const CURRENT = 'line one\nline TWO\nline three\n';

describe('Diff', () => {
    describe('defaults match vue-diff', () => {
        it('defaults to split mode and the dark theme', async () => {
            // theme defaulting to 'dark' is easy to get wrong and is parity surface.
            const wrapper = mount(Diff, { props: { prev: PREV, current: CURRENT } });
            await settle();

            expect(wrapper.find('.vue-diff-wrapper').exists()).toBe(true);
            expect(wrapper.find('.vue-diff-mode-split').exists()).toBe(true);
            expect(wrapper.find('.vue-diff-theme-dark').exists()).toBe(true);
        });

        it('renders nothing but the shell for empty input', async () => {
            const wrapper = mount(Diff);
            await settle();
            expect(wrapper.find('.vue-diff-wrapper').exists()).toBe(true);
            expect(wrapper.findAll('.vue-diff-row')).toHaveLength(0);
        });
    });

    describe('mode', () => {
        it('renders two cells per row in split mode', async () => {
            const wrapper = mount(Diff, { props: { prev: PREV, current: CURRENT } });
            await settle();
            const firstRow = wrapper.find('.vue-diff-row');
            expect(firstRow.findAll('.vue-diff-line')).toHaveLength(2);
        });

        it('renders one cell per row in unified mode', async () => {
            const wrapper = mount(Diff, {
                props: { mode: 'unified', prev: PREV, current: CURRENT },
            });
            await settle();
            expect(wrapper.find('.vue-diff-mode-unified').exists()).toBe(true);
            expect(wrapper.find('.vue-diff-row').findAll('.vue-diff-line')).toHaveLength(1);
        });
    });

    describe('theme', () => {
        it.each(['dark', 'light'] as const)('applies the %s theme class', async (theme) => {
            const wrapper = mount(Diff, { props: { theme, prev: PREV, current: CURRENT } });
            await settle();
            expect(wrapper.find(`.vue-diff-theme-${theme}`).exists()).toBe(true);
        });

        it('passes through arbitrary custom* themes and ships no styles for them', async () => {
            // The escape hatch: the class lands on the wrapper, the consumer styles it.
            const wrapper = mount(Diff, {
                props: { theme: 'custom-solarized', prev: PREV, current: CURRENT },
            });
            await settle();
            expect(wrapper.find('.vue-diff-theme-custom-solarized').exists()).toBe(true);
        });
    });

    describe('wrap (the one additive prop)', () => {
        it('wraps by default, matching the original which always wrapped', async () => {
            const wrapper = mount(Diff, { props: { prev: PREV, current: CURRENT } });
            await settle();
            expect(wrapper.find('.vue-diff-nowrap').exists()).toBe(false);
        });

        it('marks the opt-out when wrap is false', async () => {
            const wrapper = mount(Diff, { props: { wrap: false, prev: PREV, current: CURRENT } });
            await settle();
            expect(wrapper.find('.vue-diff-nowrap').exists()).toBe(true);
        });
    });

    describe('folding', () => {
        it('hides runs of unchanged lines, keeping the first as context', async () => {
            const prev = ['a', 'b', 'c', 'd', 'e', 'CHANGED', 'g', 'h', 'i'].join('\n') + '\n';
            const current = ['a', 'b', 'c', 'd', 'e', 'changed', 'g', 'h', 'i'].join('\n') + '\n';

            const unfolded = mount(Diff, { props: { prev, current } });
            await settle();
            const before = unfolded.findAll('.vue-diff-row').length;

            const folded = mount(Diff, { props: { prev, current, folding: true } });
            await settle();
            const after = folded.findAll('.vue-diff-row').length;

            expect(after).toBeLessThan(before);
            expect(after).toBeGreaterThan(0);
        });
    });

    describe('null-ish input', () => {
        it.each([
            ['both null', null, null],
            ['prev null', null, 'text\n'],
            ['current null', 'text\n', null],
        ])('tolerates %s without throwing', async (_label, prev, current) => {
            // The original typed these as string; accepting null costs nothing.
            expect(() => mount(Diff, { props: { prev, current } })).not.toThrow();
            await settle();
        });
    });

    describe('identical prev and current', () => {
        it('renders the content rather than an empty view', async () => {
            // Regression guard: some diff viewers blank the view when nothing
            // changed, which breaks read-only content displays.
            const wrapper = mount(Diff, { props: { prev: PREV, current: PREV } });
            await settle();

            const rows = wrapper.findAll('.vue-diff-row');
            expect(rows).toHaveLength(3);
            expect(wrapper.text()).toContain('line two');
        });
    });

    describe('reactivity', () => {
        it('re-renders when prev/current change, with no :key remount hack', async () => {
            // The CMS wrapper had to force remounts via a content-hash :key to
            // work around stale state. Ours must not need that.
            const wrapper = mount(Diff, { props: { prev: 'a\n', current: 'a\n' } });
            await settle();
            expect(wrapper.text()).toContain('a');

            await wrapper.setProps({ prev: 'a\n', current: 'a\nb\nc\n' });
            await settle();

            expect(wrapper.text()).toContain('b');
            expect(wrapper.text()).toContain('c');
            expect(wrapper.findAll('.vue-diff-row').length).toBeGreaterThan(1);
        });

        it('re-renders when mode changes', async () => {
            const wrapper = mount(Diff, { props: { prev: PREV, current: CURRENT } });
            await settle();
            expect(wrapper.find('.vue-diff-row').findAll('.vue-diff-line')).toHaveLength(2);

            await wrapper.setProps({ mode: 'unified' });
            await settle();
            expect(wrapper.find('.vue-diff-row').findAll('.vue-diff-line')).toHaveLength(1);
        });
    });

    describe('inputDelay', () => {
        it('debounces re-rendering by the given delay', async () => {
            vi.useFakeTimers();
            try {
                const wrapper = mount(Diff, {
                    props: { prev: 'a\n', current: 'a\n', inputDelay: 100 },
                });
                await nextTick();

                await wrapper.setProps({ current: 'a\nb\n' });
                await nextTick();
                // Still debounced: the new line must not be rendered yet.
                expect(wrapper.findAll('.vue-diff-row')).toHaveLength(1);

                vi.advanceTimersByTime(100);
                await nextTick();
                expect(wrapper.findAll('.vue-diff-row').length).toBeGreaterThan(1);
            } finally {
                vi.useRealTimers();
            }
        });

        it('renders synchronously when inputDelay is 0 (the default)', async () => {
            const wrapper = mount(Diff, { props: { prev: 'a\n', current: 'a\n' } });
            await nextTick();
            await wrapper.setProps({ current: 'a\nb\n' });
            await nextTick();
            expect(wrapper.findAll('.vue-diff-row').length).toBeGreaterThan(1);
        });
    });

    describe('virtualScroll', () => {
        it('applies the original default height when enabled with true', async () => {
            const wrapper = mount(Diff, {
                props: { virtualScroll: true, prev: PREV, current: CURRENT },
            });
            await settle();
            expect(wrapper.find('.vue-diff-viewer').attributes('style')).toContain('500px');
        });

        it('accepts a partial override', async () => {
            const wrapper = mount(Diff, {
                props: { virtualScroll: { height: 300 }, prev: PREV, current: CURRENT },
            });
            await settle();
            expect(wrapper.find('.vue-diff-viewer').attributes('style')).toContain('300px');
        });

        it('sets no fixed height when disabled', async () => {
            const wrapper = mount(Diff, { props: { prev: PREV, current: CURRENT } });
            await settle();
            const style = wrapper.find('.vue-diff-viewer').attributes('style');
            expect(style ?? '').not.toContain('height');
        });

        it('still renders content when enabled', async () => {
            // Regression guard: enabling virtualScroll used to initialise every
            // row as hidden, and since the windowing composable does not exist
            // yet nothing ever made them visible again — so the whole diff
            // vanished. The earlier tests only checked the container's height,
            // which is why they missed it.
            const wrapper = mount(Diff, {
                props: { prev: PREV, current: CURRENT, virtualScroll: true },
            });
            await settle();

            expect(wrapper.findAll('.vue-diff-row').length).toBeGreaterThan(0);
            expect(wrapper.text()).toContain('line two');
        });

        it.each([
            ['true', true],
            ['an options object', { height: 300 }],
        ])('renders the same rows with virtualScroll as %s', async (_label, virtualScroll) => {
            const off = mount(Diff, { props: { prev: PREV, current: CURRENT } });
            await settle();
            const expected = off.findAll('.vue-diff-row').length;

            const on = mount(Diff, { props: { prev: PREV, current: CURRENT, virtualScroll } });
            await settle();
            expect(on.findAll('.vue-diff-row')).toHaveLength(expected);
        });
    });

    describe('highlighting', () => {
        it('escapes content so markup never goes live', async () => {
            const wrapper = mount(Diff, {
                props: {
                    language: 'html',
                    prev: '<script>alert(1)</script>\n',
                    current: '<script>alert(2)</script>\n',
                },
            });
            await settle();

            expect(wrapper.find('script').exists()).toBe(false);
            expect(wrapper.text()).toContain('alert');
        });

        it('marks word-level changes inside a modified line', async () => {
            const wrapper = mount(Diff, {
                props: { prev: 'the quick fox\n', current: 'the slow fox\n' },
            });
            await settle();
            expect(wrapper.find('.vue-diff-modified').exists()).toBe(true);
        });
    });
});

describe('install paths', () => {
    it('works as a plugin, registering <Diff> by default', async () => {
        const wrapper = mount(
            { template: '<Diff :prev="p" :current="c" />', data: () => ({ p: PREV, c: CURRENT }) },
            { global: { plugins: [VueDiffPlugin] } },
        );
        await settle();
        expect(wrapper.find('.vue-diff-wrapper').exists()).toBe(true);
        expect(wrapper.findAll('.vue-diff-row').length).toBeGreaterThan(0);
    });

    it('honours a custom componentName', async () => {
        const wrapper = mount(
            {
                template: '<VueDiff :prev="p" :current="c" />',
                data: () => ({ p: PREV, c: CURRENT }),
            },
            { global: { plugins: [[VueDiffPlugin, { componentName: 'VueDiff' }]] } },
        );
        await settle();
        expect(wrapper.find('.vue-diff-wrapper').exists()).toBe(true);
    });

    it('works as a direct named import, bypassing the plugin', async () => {
        const wrapper = mount(NamedDiff, { props: { prev: PREV, current: CURRENT } });
        await settle();
        expect(wrapper.find('.vue-diff-wrapper').exists()).toBe(true);
    });
});
