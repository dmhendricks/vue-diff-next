import { computed, ref, shallowRef } from 'vue';
import { renderLines } from '../core/diff/lines';
import { useDebouncedWatch } from './useDebouncedWatch';
import type { Lines, Meta, Mode, VirtualScroll } from '../types';

export interface RenderProps {
    mode: Mode;
    prev: string;
    current: string;
    folding: boolean;
    inputDelay: number;
}

/**
 * Build the diff rows and the per-row metadata array beside them.
 *
 * The metadata array is the structural decision the whole render path rests on.
 * The template iterates a *filtered* view of it, never the raw rows, so folding
 * (here) and virtual scrolling (phase 2) both work by flipping flags rather than
 * touching the rendered content. Skipping this layer would make phase 2 a
 * rewrite instead of an addition.
 */
export function useRender(props: RenderProps, scrollOptions: () => false | VirtualScroll) {
    // shallowRef: rows are replaced wholesale and never mutated in place, so
    // deep reactivity would only cost traversal on every diff.
    const rows = shallowRef<Lines[]>([]);
    const meta = ref<Meta[]>([]);

    /**
     * What actually renders. With folding on, foldable rows drop out; `visible`
     * is always true until virtual scroll starts managing it.
     */
    const visibleRows = computed(() =>
        meta.value.filter((item) =>
            props.folding ? !item.foldable && item.visible : item.visible,
        ),
    );

    function build() {
        const next = renderLines(props.mode, props.prev, props.current);
        rows.value = next;

        // Drop metadata for rows that no longer exist.
        meta.value.splice(next.length);

        const options = scrollOptions();

        for (let index = 0; index < next.length; index++) {
            const previous = meta.value[index];

            // Foldable only when this row *and* the one before it are unchanged,
            // so the first equal row after a change survives as context. Matches
            // the original's rule exactly.
            const foldable =
                props.folding &&
                next[index]?.[0]?.type === 'equal' &&
                next[index - 1]?.[0]?.type === 'equal';

            if (options) {
                // Mutate in place when the row already exists, rather than
                // replacing the object.
                //
                // Identity matters here: DiffLine captures its own `meta` object at
                // mount and reports measured heights against it. This watcher is
                // debounced, so it runs *after* those mounts — replacing the object
                // would discard the measurement and reseed the estimate, and since
                // the row is already mounted nothing would ever measure it again.
                // Wrapped rows stayed at lineMinHeight forever and overlapped.
                //
                // Start hidden and let useVirtualScroll decide: it runs
                // immediately, so the first paint is already windowed rather
                // than mounting every row and then removing most of them.
                //
                // An unmeasured row counts as lineMinHeight so the container's
                // height starts approximately right and converges as the
                // ResizeObserver reports real heights.
                if (previous) {
                    previous.foldable = foldable;
                    previous.height ??= options.lineMinHeight;
                } else {
                    meta.value[index] = {
                        index,
                        foldable,
                        visible: false,
                        height: options.lineMinHeight,
                    };
                }
            } else {
                meta.value[index] = { index, foldable, visible: true };
            }
        }

        annotateFolds(next);

        // Publish a new array identity after every rebuild.
        //
        // When virtual scroll is on we mutate existing Meta objects in place so
        // DiffLine's height measurements survive. That means a same-length edit
        // leaves `meta.length` unchanged — useVirtualScroll keys on the array
        // reference so it can still re-window and recompute tops.
        meta.value = meta.value.slice();
    }

    /**
     * Record what each surviving marker row stands in for.
     *
     * A row is foldable only when the row before it is also unchanged, so the
     * first unchanged row after a change always survives filtering — that
     * survivor is the marker, and the foldable rows immediately after it are what
     * it hides.
     */
    function annotateFolds(next: Lines[]): void {
        if (!props.folding) return;

        for (let index = 0; index < next.length; index++) {
            const item = meta.value[index];
            if (!item || item.foldable) continue;
            if (next[index]?.[0]?.type !== 'equal') continue;

            let end = index + 1;
            while (meta.value[end]?.foldable) end++;

            // A marker with nothing collapsed after it is just an unchanged line.
            if (end === index + 1) continue;

            const last = next[end - 1];
            item.fold = {
                count: end - index,
                prevStart: numberOf(next[index], 0),
                currentStart: numberOf(next[index], next[index]!.length > 1 ? 1 : 0),
                prevEnd: numberOf(last, 0),
                currentEnd: numberOf(last, last && last.length > 1 ? 1 : 0),
            };
        }
    }

    /** The line number on one side of a row, if that side has one. */
    function numberOf(row: Lines | undefined, side: number): number | undefined {
        return row?.[side]?.lineNum;
    }

    useDebouncedWatch(
        [() => props.mode, () => props.prev, () => props.current, () => props.folding],
        build,
        { delay: () => props.inputDelay, immediate: true },
    );

    return { rows, meta, visibleRows };
}
