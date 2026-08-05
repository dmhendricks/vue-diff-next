import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import Diff from './Diff.vue';
import type { FoldMarker, Mode, Theme } from '../types';

/**
 * Rendered-output snapshots.
 *
 * The rest of the suite asserts on counts and types — how many rows, which
 * classes, what text. That is blind to a whole class of defect: markup that is
 * structurally plausible but wrong. Folding silently dropping the rows it
 * collapsed, and a hunk header appearing on one side of a split, both passed
 * every existing test and were caught by eye instead.
 *
 * These snapshots capture the shape of the output so those changes have to be
 * looked at. A diff here is not automatically a failure — it means the rendered
 * result changed, and the diff has to be read before `--update` is run.
 */

/** Let the async highlight settle so the captured markup is final. */
async function settle(): Promise<void> {
    await nextTick();
    await Promise.resolve();
    await nextTick();
}

/**
 * Reduce a rendered viewer to a readable, stable outline.
 *
 * Raw `.html()` would technically work but changes for reasons nobody cares
 * about — attribute order, indentation, a wrapper gaining a class. This keeps
 * what a reader of the diff actually needs: per row, the cells, their change
 * type, line number, and text.
 *
 * Syntax spans are deliberately reduced to their token classes rather than kept
 * verbatim. Grammar updates in @speed-highlight/core would otherwise churn every
 * snapshot; losslessness and composition are already covered by their own tests.
 */
function outline(html: Element): string {
    const rows = [...html.querySelectorAll('.vue-diff-row')];

    return rows
        .map((row) => {
            const cells = [...row.children].map((cell) => {
                const classes = [...cell.classList];
                const isGutter = classes.includes('vue-diff-line-num');
                // Skip `vue-diff-line-num` itself, or every gutter would report
                // its type as "num" and a lost added/removed tint would not show.
                const kind =
                    classes.find(
                        (c) => c.startsWith('vue-diff-line-') && c !== 'vue-diff-line-num',
                    ) ?? '?';
                const type = kind.replace('vue-diff-line-', '');

                if (isGutter) {
                    const num = cell.textContent?.trim() ?? '';
                    return `[${type}${num ? ' ' + num : ''}]`;
                }

                const hunk = cell.querySelector('.vue-diff-fold-hunk');
                if (hunk) return `{hunk ${hunk.textContent?.trim()}}`;

                const code = cell.querySelector('.vue-diff-code');
                if (!code) return `{${type} —}`;

                // Token classes only, in order, so grammar tweaks don't churn.
                const tokens = [...code.querySelectorAll('span')]
                    .map((s) =>
                        [...s.classList]
                            .map((c) => c.replace('shj-syn-', '').replace('vue-diff-', ''))
                            .join('.'),
                    )
                    .join(' ');

                const text = code.textContent ?? '';
                return `{${type} ${JSON.stringify(text)}${tokens ? ' <' + tokens + '>' : ''}}`;
            });

            return cells.join(' ');
        })
        .join('\n');
}

interface Case {
    name: string;
    prev: string;
    current: string;
    language?: string;
    folding?: boolean;
    foldMarker?: FoldMarker;
}

const CASES: Case[] = [
    {
        name: 'a modified line word-diffs against its counterpart',
        prev: 'const greeting = "Hello";\n',
        current: 'const greeting = "Goodbye";\n',
        language: 'js',
    },
    {
        name: 'an addition pads the other side',
        prev: 'a\n',
        current: 'a\nb\n',
    },
    {
        name: 'a removal pads the other side',
        prev: 'a\nb\n',
        current: 'a\n',
    },
    {
        name: 'identical input still renders every line',
        prev: 'a\nb\n',
        current: 'a\nb\n',
    },
    {
        name: 'a multi-line replacement expands to the longer side',
        prev: 'one\ntwo\nthree\n',
        current: 'ONE\n',
    },
    {
        name: 'markup in content is escaped, not rendered',
        prev: '<script>alert(1)</script>\n',
        current: '<script>alert(2)</script>\n',
        language: 'html',
    },
];

const FOLD_CASES: Case[] = [
    {
        name: 'collapsed runs are marked with dots',
        prev:
            ['head', ...Array.from({ length: 8 }, (_, i) => `same ${i}`), 'OLD'].join('\n') + '\n',
        current:
            ['head', ...Array.from({ length: 8 }, (_, i) => `same ${i}`), 'NEW'].join('\n') + '\n',
        folding: true,
    },
    {
        name: 'collapsed runs are marked with a hunk header',
        prev:
            ['head', ...Array.from({ length: 8 }, (_, i) => `same ${i}`), 'OLD'].join('\n') + '\n',
        current:
            ['head', ...Array.from({ length: 8 }, (_, i) => `same ${i}`), 'NEW'].join('\n') + '\n',
        folding: true,
        foldMarker: 'hunk',
    },
];

async function render(mode: Mode, testCase: Case, theme: Theme = 'dark'): Promise<string> {
    const wrapper = mount(Diff, {
        props: {
            mode,
            theme,
            prev: testCase.prev,
            current: testCase.current,
            language: testCase.language ?? 'plaintext',
            folding: testCase.folding ?? false,
            foldMarker: testCase.foldMarker ?? 'dots',
        },
        attachTo: document.body,
    });
    await settle();
    const result = outline(wrapper.element as Element);
    wrapper.unmount();
    return result;
}

describe('rendered output', () => {
    for (const mode of ['split', 'unified'] as Mode[]) {
        describe(mode, () => {
            for (const testCase of [...CASES, ...FOLD_CASES]) {
                it(testCase.name, async () => {
                    expect(await render(mode, testCase)).toMatchSnapshot();
                });
            }
        });
    }

    /**
     * The theme only changes a class on the wrapper — it must not alter row
     * structure. Asserting equality rather than snapshotting both keeps the
     * snapshot file from doubling to prove something a comparison states better.
     */
    it('renders identical structure in every theme', async () => {
        const testCase = CASES[0]!;
        const dark = await render('split', testCase, 'dark');
        const light = await render('split', testCase, 'light');
        const custom = await render('split', testCase, 'custom-solarized');

        expect(light).toBe(dark);
        expect(custom).toBe(dark);
    });
});
