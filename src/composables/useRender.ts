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

/** Build diff rows and parallel per-row metadata (folding + virtual scroll flags). */
export function useRender(props: RenderProps, scrollOptions: () => false | VirtualScroll) {
    const rows = shallowRef<Lines[]>([]);
    const meta = ref<Meta[]>([]);

    const visibleRows = computed(() =>
        meta.value.filter((item) =>
            props.folding ? !item.foldable && item.visible : item.visible,
        ),
    );

    function build() {
        const next = renderLines(props.mode, props.prev, props.current);
        rows.value = next;

        meta.value.splice(next.length);

        const options = scrollOptions();

        for (let index = 0; index < next.length; index++) {
            const previous = meta.value[index];

            // First equal after a change is not foldable — it survives as context.
            const foldable =
                props.folding &&
                next[index]?.[0]?.type === 'equal' &&
                next[index - 1]?.[0]?.type === 'equal';

            if (options) {
                // Keep Meta object identity — DiffLine reports heights against it.
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

        // New array identity so useVirtualScroll re-windows on same-length edits.
        meta.value = meta.value.slice();
    }

    function annotateFolds(next: Lines[]): void {
        // Clear first: Meta is reused under virtual scroll, so stale fold would stick.
        for (const item of meta.value) {
            if (item) item.fold = undefined;
        }

        if (!props.folding) return;

        for (let index = 0; index < next.length; index++) {
            const item = meta.value[index];
            if (!item || item.foldable) continue;
            if (next[index]?.[0]?.type !== 'equal') continue;

            let end = index + 1;
            while (meta.value[end]?.foldable) end++;

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
