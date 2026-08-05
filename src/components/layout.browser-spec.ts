import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, ref } from 'vue';
import type { App } from 'vue';
import Diff from './Diff.vue';
import type { Mode } from '../types';
import '../assets/scss/index.scss';

/**
 * Geometry tests for virtual scrolling, in a real browser.
 *
 * Everything here depends on layout the jsdom suite cannot produce: text wrapping,
 * `offsetHeight`, and ResizeObserver. The bug these exist for was invisible to 233
 * passing jsdom tests — rows were absolutely positioned at one line's height while
 * rendering two lines tall, so every row overlapped the one before it.
 *
 * The invariant is deliberately stated as "no row overlaps its predecessor" rather
 * than as expected pixel values, which would encode font metrics and break on any
 * environment with different fonts.
 */

interface Row {
    top: number;
    height: number;
    lineNum: string;
}

let app: App | null = null;
let host: HTMLElement | null = null;

afterEach(() => {
    app?.unmount();
    app = null;
    host?.remove();
    host = null;
});

/**
 * Mount a diff at a fixed width and wait for it to settle.
 *
 * The width matters: it is what decides whether lines wrap, and wrapped rows are
 * the case that broke. Narrow enough here that the sample's lines must wrap.
 */
async function mountDiff(options: {
    mode: Mode;
    width: number;
    lines: number;
    virtualScroll?: boolean | { height: number };
}): Promise<void> {
    host = document.createElement('div');
    host.style.width = `${options.width}px`;
    document.body.appendChild(host);

    const make = (label: string) =>
        Array.from(
            { length: options.lines },
            (_, i) => `const someDescriptiveName${i} = computeSomething(${i}, '${label}');`,
        ).join('\n');

    app = createApp({
        render: () =>
            h(Diff, {
                mode: options.mode,
                language: 'javascript',
                prev: make('alpha'),
                current: make('beta'),
                virtualScroll: options.virtualScroll ?? { height: 400 },
            }),
    });
    app.mount(host);

    // Two frames plus a tick: the first paint mounts rows, the highlighter resolves
    // asynchronously, and ResizeObserver reports the resulting reflow after that.
    await new Promise((resolve) => setTimeout(resolve, 600));
}

/** Every rendered row's position and size, in document order by `top`. */
function readRows(): Row[] {
    const rows = Array.from(host!.querySelectorAll<HTMLElement>('.vue-diff-row'));

    return rows
        .map((row) => {
            const match = /translate3d\(0(?:px)?, ([\d.-]+)px/.exec(row.style.transform);
            return {
                top: match ? parseFloat(match[1]!) : NaN,
                height: row.offsetHeight,
                lineNum: row.querySelector('.vue-diff-line-num')?.textContent?.trim() ?? '',
            };
        })
        .filter((row) => Number.isFinite(row.top))
        .sort((a, b) => a.top - b.top);
}

/** Rows that start before the previous row ends. Allows a sub-pixel tolerance. */
function overlapping(rows: Row[]): Array<{ index: number; top: number; previousBottom: number }> {
    const found: Array<{ index: number; top: number; previousBottom: number }> = [];

    for (let index = 1; index < rows.length; index++) {
        const previous = rows[index - 1]!;
        const current = rows[index]!;
        const previousBottom = previous.top + previous.height;
        if (current.top < previousBottom - 0.5) {
            found.push({ index, top: current.top, previousBottom });
        }
    }

    return found;
}

describe('virtual scroll layout', () => {
    // Split mode is where this broke, because a row's height is driven by the
    // taller of its two cells. Unified was unaffected and is here to stay that way.
    for (const mode of ['split', 'unified'] as const) {
        describe(mode, () => {
            it('wrapped rows do not overlap each other', async () => {
                // 700px forces these lines to wrap in both modes.
                await mountDiff({ mode, width: 700, lines: 300 });

                const rows = readRows();
                expect(rows.length).toBeGreaterThan(1);

                // The bug: rows rendered taller than the step between their tops.
                expect(rows.some((row) => row.height > 0)).toBe(true);
                expect(overlapping(rows)).toEqual([]);
            });

            it('positions each row at the sum of the heights before it', async () => {
                await mountDiff({ mode, width: 700, lines: 300 });

                const rows = readRows();
                // Consecutive rendered rows are contiguous: no gaps, no overlaps.
                for (let index = 1; index < rows.length; index++) {
                    const previous = rows[index - 1]!;
                    expect(rows[index]!.top).toBeCloseTo(previous.top + previous.height, 0);
                }
            });

            it('still does not overlap after scrolling', async () => {
                await mountDiff({ mode, width: 700, lines: 300 });

                const viewer = host!.querySelector<HTMLElement>('.vue-diff-viewer')!;
                viewer.scrollTop = 2000;
                await new Promise((resolve) => setTimeout(resolve, 500));

                const rows = readRows();
                expect(rows.length).toBeGreaterThan(1);
                expect(overlapping(rows)).toEqual([]);
            });
        });
    }

    it('reports real heights rather than the lineMinHeight estimate', async () => {
        // The defect's signature was a row whose recorded height stayed at the
        // seeded estimate while it rendered taller. Asserted through the DOM: the
        // step between rows has to match what the rows actually measure.
        await mountDiff({ mode: 'split', width: 700, lines: 300 });

        const rows = readRows();
        const wrapped = rows.filter((row) => row.height > 24);

        expect(wrapped.length).toBeGreaterThan(0);
        for (const row of wrapped) {
            const next = rows[rows.indexOf(row) + 1];
            if (next) expect(next.top - row.top).toBeCloseTo(row.height, 0);
        }
    });

    it('scrolls the full height of the diff, not just the rendered rows', async () => {
        await mountDiff({ mode: 'split', width: 700, lines: 300 });

        const viewer = host!.querySelector<HTMLElement>('.vue-diff-viewer')!;
        const rendered = host!.querySelectorAll('.vue-diff-row').length;

        // Windowing is doing something: far fewer rows than lines.
        expect(rendered).toBeLessThan(300);
        // And the scrollbar still spans the whole diff.
        expect(viewer.scrollHeight).toBeGreaterThan(viewer.clientHeight * 4);
    });

    // The case that actually shipped broken, and the one a mount-time-only test
    // cannot reach: virtual scroll switched on *after* the rows already exist.
    //
    // Rows mounted while it was off, so their mount-time setup bailed out and never
    // installed a height observer. Turning it on then positioned them absolutely
    // using the seeded one-line estimate while they rendered two or three lines
    // tall, so every row overlapped its predecessor.
    it('measures rows that mounted before virtual scroll was enabled', async () => {
        host = document.createElement('div');
        host.style.width = '700px';
        document.body.appendChild(host);

        const make = (label: string) =>
            Array.from(
                { length: 300 },
                (_, i) => `const someDescriptiveName${i} = computeSomething(${i}, '${label}');`,
            ).join('\n');

        // Reactive so the prop can flip after the rows have mounted.
        const enabled = ref(false);

        app = createApp({
            render: () =>
                h(Diff, {
                    mode: 'split',
                    language: 'javascript',
                    prev: make('alpha'),
                    current: make('beta'),
                    virtualScroll: enabled.value ? { height: 400 } : false,
                }),
        });
        app.mount(host);

        // Let the rows mount and highlight with virtual scroll off.
        await new Promise((resolve) => setTimeout(resolve, 600));
        expect(readRows()).toEqual([]); // not positioned yet: no windowing

        enabled.value = true;
        await new Promise((resolve) => setTimeout(resolve, 800));

        const rows = readRows();
        expect(rows.length).toBeGreaterThan(1);
        expect(rows.some((row) => row.height > 24)).toBe(true);
        expect(overlapping(rows)).toEqual([]);
    });
});
