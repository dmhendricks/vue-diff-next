import { describe, it, expect, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import Diff from './Diff.vue';
import VueDiffPlugin, { Diff as NamedDiff } from '../index';
import type { FoldMarker, Mode, Theme, VirtualScroll } from '../types';

/** Let the async highlight settle so rendered markup is final. */
async function settle() {
    await nextTick();
    await Promise.resolve();
    await nextTick();
}

/**
 * Diff's public props.
 *
 * `wrapper.setProps` is typed from `$props`, and under Volar that often collapses
 * to attrs-only for `<script setup>` SFCs — so a direct `setProps({ virtualScroll })`
 * fails typecheck even though runtime and `mount({ props })` are fine. This helper
 * keeps the callsites honest without casting at every use.
 */
type DiffProps = {
    mode?: Mode;
    theme?: Theme;
    language?: string;
    prev?: string | null;
    current?: string | null;
    folding?: boolean;
    foldMarker?: FoldMarker;
    inputDelay?: number;
    virtualScroll?: boolean | Partial<VirtualScroll>;
    wrap?: boolean;
    showLineNumbers?: boolean;
};

function setDiffProps(wrapper: VueWrapper, props: Partial<DiffProps>) {
    return wrapper.setProps(props as never);
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
        it.each([
            'dark',
            'light',
            'monokai-dark',
            'visual-studio-dark',
            'visual-studio-light',
            'atom-dark',
            'atom-light',
            'github-dark',
            'github-light',
            'coral-dark',
            'coral-light',
        ] as const)('applies the %s theme class', async (theme) => {
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

        it('tags the wrapper with the resolved language class', async () => {
            const wrapper = mount(Diff, {
                props: { language: 'javascript', prev: PREV, current: CURRENT },
            });
            await settle();
            expect(wrapper.find('.vue-diff-lang-js').exists()).toBe(true);
        });
    });

    describe('wrap (additive)', () => {
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

    describe('showLineNumbers (additive)', () => {
        it('renders the gutter by default, matching the original', async () => {
            const wrapper = mount(Diff, { props: { prev: PREV, current: CURRENT } });
            await settle();
            expect(wrapper.find('.vue-diff-line-num').exists()).toBe(true);
            expect(wrapper.find('.vue-diff-no-line-numbers').exists()).toBe(false);
            expect(wrapper.find('.vue-diff-line-num').text()).toMatch(/\d/);
        });

        it('hides the gutter when showLineNumbers is false', async () => {
            const wrapper = mount(Diff, {
                props: { showLineNumbers: false, prev: PREV, current: CURRENT },
            });
            await settle();
            expect(wrapper.find('.vue-diff-line-num').exists()).toBe(false);
            expect(wrapper.find('.vue-diff-no-line-numbers').exists()).toBe(true);
            expect(wrapper.findAll('.vue-diff-line').length).toBeGreaterThan(0);
        });

        it('hides the gutter in unified mode too', async () => {
            const wrapper = mount(Diff, {
                props: {
                    mode: 'unified',
                    showLineNumbers: false,
                    prev: PREV,
                    current: CURRENT,
                },
            });
            await settle();
            expect(wrapper.find('.vue-diff-line-num').exists()).toBe(false);
            expect(wrapper.find('.vue-diff-row').findAll('.vue-diff-line')).toHaveLength(1);
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

        it('marks each collapsed run instead of dropping it silently', async () => {
            // Two separate unchanged runs around one change, so a reader needs two
            // markers to know content was skipped in both places.
            const lines = (mid: string) =>
                ['a', 'b', 'c', 'd', 'e', mid, 'g', 'h', 'i', 'j'].join('\n') + '\n';

            const wrapper = mount(Diff, {
                props: { prev: lines('CHANGED'), current: lines('changed'), folding: true },
            });
            await settle();

            const folds = wrapper.findAll('.vue-diff-line-fold');
            expect(folds.length).toBeGreaterThan(0);

            // The placeholder must carry no text of its own — the markers are CSS,
            // so nothing here can be word-diffed or highlighted.
            for (const fold of folds) expect(fold.text()).toBe('');
        });

        it('does not mark anything when folding is off', async () => {
            const prev = ['a', 'b', 'c', 'CHANGED', 'e', 'f'].join('\n') + '\n';
            const current = ['a', 'b', 'c', 'changed', 'e', 'f'].join('\n') + '\n';

            const wrapper = mount(Diff, { props: { prev, current } });
            await settle();

            expect(wrapper.find('.vue-diff-line-fold').exists()).toBe(false);
        });

        it('marks folds in unified mode too', async () => {
            const prev = ['a', 'b', 'c', 'd', 'CHANGED', 'f', 'g', 'h'].join('\n') + '\n';
            const current = ['a', 'b', 'c', 'd', 'changed', 'f', 'g', 'h'].join('\n') + '\n';

            const wrapper = mount(Diff, {
                props: { prev, current, folding: true, mode: 'unified' },
            });
            await settle();

            expect(wrapper.findAll('.vue-diff-line-fold').length).toBeGreaterThan(0);
        });

        it('renders a hunk header when foldMarker is hunk', async () => {
            const lines = (mid: string) =>
                ['a', 'b', 'c', 'd', 'e', 'f', mid, 'h', 'i', 'j'].join('\n') + '\n';

            const wrapper = mount(Diff, {
                props: {
                    prev: lines('OLD'),
                    current: lines('NEW'),
                    folding: true,
                    foldMarker: 'hunk',
                },
            });
            await settle();

            const hunk = wrapper.find('.vue-diff-fold-hunk');
            expect(hunk.exists()).toBe(true);
            // `@@ -start,count +start,count @@`
            expect(hunk.text()).toMatch(/^@@ -\d+,\d+ \+\d+,\d+ @@$/);
        });

        it('renders no hunk header under the default dots marker', async () => {
            const lines = (mid: string) =>
                ['a', 'b', 'c', 'd', 'e', 'f', mid, 'h', 'i'].join('\n') + '\n';

            const wrapper = mount(Diff, {
                props: { prev: lines('OLD'), current: lines('NEW'), folding: true },
            });
            await settle();

            expect(wrapper.find('.vue-diff-fold-hunk').exists()).toBe(false);
            expect(wrapper.find('.vue-diff-line-fold').exists()).toBe(true);
        });

        it('counts the collapsed lines in the hunk header', async () => {
            // 12 identical lines between two changes: the header must report the
            // span, not a constant.
            const middle = Array.from({ length: 12 }, (_, i) => `same ${i}`);
            const prev = ['OLD', ...middle, 'tail'].join('\n') + '\n';
            const current = ['NEW', ...middle, 'tail'].join('\n') + '\n';

            const wrapper = mount(Diff, {
                props: { prev, current, folding: true, foldMarker: 'hunk' },
            });
            await settle();

            const text = wrapper.find('.vue-diff-fold-hunk').text();
            const count = Number(/-\d+,(\d+)/.exec(text)?.[1]);
            expect(count).toBeGreaterThan(1);
        });

        it('keeps changed lines visible alongside the markers', async () => {
            const prev = ['a', 'b', 'c', 'd', 'e', 'OLD', 'g', 'h', 'i'].join('\n') + '\n';
            const current = ['a', 'b', 'c', 'd', 'e', 'NEW', 'g', 'h', 'i'].join('\n') + '\n';

            const wrapper = mount(Diff, { props: { prev, current, folding: true } });
            await settle();

            // Folding must never hide the change itself.
            expect(wrapper.text()).toContain('OLD');
            expect(wrapper.text()).toContain('NEW');
        });

        it('renders an isolated equal line as content, not a fold marker', async () => {
            // One unchanged line between two changes: nothing to collapse, so the
            // row must keep its text rather than becoming hollow dots.
            const wrapper = mount(Diff, {
                props: {
                    prev: 'OLD\nsame\nTAIL\n',
                    current: 'NEW\nsame\nTAIL2\n',
                    folding: true,
                },
            });
            await settle();

            expect(wrapper.find('.vue-diff-line-fold').exists()).toBe(false);
            expect(wrapper.text()).toContain('same');
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
        it('re-renders when prev/current change without remounting', async () => {
            // Prop updates must refresh the rows in place — consumers should not
            // need a :key remount to clear stale state.
            const wrapper = mount(Diff, { props: { prev: 'a\n', current: 'a\n' } });
            await settle();
            expect(wrapper.text()).toContain('a');

            await setDiffProps(wrapper, { prev: 'a\n', current: 'a\nb\nc\n' });
            await settle();

            expect(wrapper.text()).toContain('b');
            expect(wrapper.text()).toContain('c');
            expect(wrapper.findAll('.vue-diff-row').length).toBeGreaterThan(1);
        });

        it('re-renders when mode changes', async () => {
            const wrapper = mount(Diff, { props: { prev: PREV, current: CURRENT } });
            await settle();
            expect(wrapper.find('.vue-diff-row').findAll('.vue-diff-line')).toHaveLength(2);

            await setDiffProps(wrapper, { mode: 'unified' });
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

                await setDiffProps(wrapper, { current: 'a\nb\n' });
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
            await setDiffProps(wrapper, { current: 'a\nb\n' });
            await nextTick();
            expect(wrapper.findAll('.vue-diff-row').length).toBeGreaterThan(1);
        });

        it('picks up inputDelay changes after mount', async () => {
            // Regression: delay used to be snapshotted once in useDebouncedWatch,
            // so raising inputDelay later still re-rendered synchronously.
            vi.useFakeTimers();
            try {
                const wrapper = mount(Diff, {
                    props: { prev: 'a\n', current: 'a\n', inputDelay: 0 },
                });
                await nextTick();

                await setDiffProps(wrapper, { inputDelay: 100 });
                await nextTick();

                await setDiffProps(wrapper, { current: 'a\nb\n' });
                await nextTick();
                expect(wrapper.findAll('.vue-diff-row')).toHaveLength(1);

                vi.advanceTimersByTime(100);
                await nextTick();
                expect(wrapper.findAll('.vue-diff-row').length).toBeGreaterThan(1);
            } finally {
                vi.useRealTimers();
            }
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
            // Regression guard: enabling virtualScroll once initialised every row
            // as hidden with nothing to make them visible again, so the whole
            // diff vanished. The tests above only check the container's height,
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
        ])(
            'renders a short diff in full with virtualScroll as %s',
            async (_label, virtualScroll) => {
                // A diff shorter than the viewport must not be windowed at all.
                const off = mount(Diff, { props: { prev: PREV, current: CURRENT } });
                await settle();
                const expected = off.findAll('.vue-diff-row').length;

                const on = mount(Diff, { props: { prev: PREV, current: CURRENT, virtualScroll } });
                await settle();
                expect(on.findAll('.vue-diff-row')).toHaveLength(expected);
            },
        );

        it('reserves scroll height for every row, including absent ones', async () => {
            // The container must span the whole diff even when most rows are not
            // in the DOM, or the scrollbar misreports how much there is to read.
            const lines = Array.from({ length: 200 }, (_, i) => `line ${i}`).join('\n') + '\n';
            const wrapper = mount(Diff, {
                props: {
                    prev: lines,
                    current: lines,
                    virtualScroll: { height: 500, lineMinHeight: 24 },
                },
            });
            await settle();

            const style = wrapper.find('.vue-diff-viewer-inner').attributes('style') ?? '';
            // 200 rows at the 24px default, before any real measurement.
            expect(style).toContain('min-height: 4800px');
        });

        it('positions rows absolutely so absent ones leave no gap', async () => {
            const wrapper = mount(Diff, {
                props: { prev: PREV, current: CURRENT, virtualScroll: true },
            });
            await settle();

            const style = wrapper.find('.vue-diff-row').attributes('style') ?? '';
            expect(style).toContain('position: absolute');
            expect(style).toContain('translate3d');
        });

        it('leaves rows in normal flow when disabled', async () => {
            const wrapper = mount(Diff, { props: { prev: PREV, current: CURRENT } });
            await settle();

            const style = wrapper.find('.vue-diff-row').attributes('style') ?? '';
            expect(style).not.toContain('position: absolute');
        });

        it('windows out rows far below the viewport', async () => {
            // jsdom reports offsetHeight as 0, so heights never converge from the
            // DOM. Drive the metadata directly instead: with real heights, rows
            // past the buffer must drop out.
            const lines = Array.from({ length: 400 }, (_, i) => `line ${i}`).join('\n') + '\n';
            const wrapper = mount(Diff, {
                props: {
                    prev: lines,
                    current: lines,
                    virtualScroll: { height: 200, lineMinHeight: 24 },
                },
                attachTo: document.body,
            });
            await settle();

            const rendered = wrapper.findAll('.vue-diff-row').length;
            // 200px viewport, 1.5x buffer each side, 24px rows => ~34 rows, well
            // short of 400. The exact count is an implementation detail; that it
            // is a small fraction is the contract.
            expect(rendered).toBeGreaterThan(0);
            expect(rendered).toBeLessThan(100);
        });

        it('renders every row again when virtualScroll is turned off', async () => {
            const lines = Array.from({ length: 400 }, (_, i) => `line ${i}`).join('\n') + '\n';
            const wrapper = mount(Diff, {
                props: {
                    prev: lines,
                    current: lines,
                    virtualScroll: { height: 200, lineMinHeight: 24 },
                },
                attachTo: document.body,
            });
            await settle();
            const windowed = wrapper.findAll('.vue-diff-row').length;

            await setDiffProps(wrapper, { virtualScroll: false });
            await settle();

            expect(wrapper.findAll('.vue-diff-row').length).toBeGreaterThan(windowed);
            expect(wrapper.findAll('.vue-diff-row')).toHaveLength(400);
        });

        it('re-windows after a same-length content edit', async () => {
            // Regression: useRender mutates Meta in place under virtual scroll, so
            // meta.length stays put when the line count does not change. Windowing
            // must still recompute — foldable layout (and therefore scroll height)
            // can change with no length delta.
            const equal = Array.from({ length: 100 }, () => 'same').join('\n') + '\n';
            const changed =
                Array.from({ length: 100 }, (_, i) => (i === 50 ? 'DIFF' : 'same')).join('\n') +
                '\n';

            const wrapper = mount(Diff, {
                props: {
                    prev: equal,
                    current: equal,
                    folding: true,
                    virtualScroll: { height: 500, lineMinHeight: 24 },
                },
            });
            await settle();

            const before = wrapper.find('.vue-diff-viewer-inner').attributes('style') ?? '';
            expect(before).toContain('min-height: 24px');

            await setDiffProps(wrapper, { current: changed });
            await settle();

            const after = wrapper.find('.vue-diff-viewer-inner').attributes('style') ?? '';
            const match = /min-height:\s*([\d.]+)px/.exec(after);
            expect(match).not.toBeNull();
            expect(Number(match![1])).toBeGreaterThan(24);
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

        it('marks word-level changes in unified mode too', async () => {
            const wrapper = mount(Diff, {
                props: {
                    mode: 'unified',
                    prev: 'the quick fox\n',
                    current: 'the slow fox\n',
                },
            });
            await settle();
            expect(wrapper.findAll('.vue-diff-modified').length).toBeGreaterThan(0);
            expect(wrapper.find('.vue-diff-line-removed .vue-diff-modified').exists()).toBe(true);
            expect(wrapper.find('.vue-diff-line-added .vue-diff-modified').exists()).toBe(true);
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
