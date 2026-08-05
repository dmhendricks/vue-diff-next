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
                // Carry height/top so a future useVirtualScroll has somewhere to
                // record measurements. Rows stay visible: until that composable
                // exists nothing would ever flip them back on, and starting
                // hidden renders an empty view.
                meta.value[index] = {
                    index,
                    foldable,
                    visible: previous?.visible ?? true,
                    top: previous?.top,
                    height: previous?.height ?? options.lineMinHeight,
                };
            } else {
                meta.value[index] = { index, foldable, visible: true };
            }
        }
    }

    useDebouncedWatch(
        [() => props.mode, () => props.prev, () => props.current, () => props.folding],
        build,
        { delay: props.inputDelay, immediate: true },
    );

    return { rows, meta, visibleRows };
}
