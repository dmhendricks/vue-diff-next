import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import type { Meta, VirtualScroll } from '../types';

/**
 * Window the rendered rows to what is near the viewport.
 *
 * A large diff's cost is DOM size, not diffing — a few thousand rows lay out and
 * paint slowly even though computing them is fast. This flips `visible` on the
 * metadata array so only rows near the viewport render, while every row still
 * contributes its height to the container. The scrollbar therefore reflects the
 * whole diff and scrolling swaps which rows exist.
 *
 * Nothing here touches row content, which is why the render path did not need to
 * change: `useRender` already iterates a filtered view of this array.
 *
 * Heights are measured rather than assumed, because a wrapped line can be any
 * height. Until a row has been measured it counts as `lineMinHeight`, so the
 * container starts approximately right and converges as rows report in.
 */
export function useVirtualScroll(
    viewer: Ref<HTMLElement | null>,
    scrollOptions: ComputedRef<false | VirtualScroll>,
    meta: Ref<Meta[]>,
) {
    /**
     * Total height of every row, so the container scrolls the full distance even
     * though most rows are absent from the DOM.
     *
     * Assigning `top` here as a side effect of the reduce mirrors the original:
     * the same pass that totals the height also records where each row sits.
     */
    /**
     * A row's height for layout purposes.
     *
     * Falling back to `lineMinHeight` rather than 0 is essential: a row that has
     * not reported yet still occupies space on screen, so treating it as zero
     * stacks every later row on top of it. The fallback is also the floor, because
     * `minHeight` on the row means a measurement below it cannot be what renders.
     */
    function heightOf(item: Meta, lineMinHeight: number): number {
        return Math.max(item.height ?? lineMinHeight, lineMinHeight);
    }

    /**
     * Total height of every row, so the container scrolls the full distance even
     * though most rows are absent from the DOM.
     *
     * Plain state rather than a computed, and `update()` is what maintains it.
     *
     * It used to be a computed that assigned each row's `top` as a side effect of
     * totalling the height. That looked economical and was subtly broken: Vue
     * deliberately ignores reactive writes performed while a computed is
     * evaluating, so the new `top` values never invalidated the rows that read
     * them. The heights were correct and the positions were stale, which stacked
     * wrapped rows on top of each other. Positioning has to happen in an effect,
     * not in a getter.
     */
    const totalHeight = ref(0);

    const minHeight = computed(() =>
        scrollOptions.value ? `${totalHeight.value}px` : undefined,
    );

    /**
     * Recompute which rows are visible, and where each one sits.
     *
     * The window extends 1.5 viewport heights beyond each edge — the original's
     * margin. Scrolling within that buffer needs no re-render, so a fast scroll
     * does not leave blank space behind while the next batch mounts.
     */
    function update(): void {
        const options = scrollOptions.value;
        if (!options) return;

        // The first pass runs before the template ref is populated, so a missing
        // viewer means "not scrolled yet" rather than "cannot compute". Bailing
        // here instead would leave every row hidden until the first scroll.
        const scrollTop = viewer.value?.scrollTop ?? 0;
        const buffer = options.height * 1.5;
        const min = scrollTop - buffer;
        const max = scrollTop + options.height + buffer;

        const total = meta.value.reduce((offset, item) => {
            const height = heightOf(item, options.lineMinHeight);
            // Compare the row's whole extent, not just its start: a tall row whose
            // top sits above the window can still occupy most of the viewport.
            item.visible = offset + height >= min && offset <= max;
            item.top = offset;
            return item.foldable ? offset : offset + height;
        }, 0);

        totalHeight.value = total;
    }

    /**
     * Record a row's measured height, and reflow if it changed.
     *
     * The reflow is coalesced to the next microtask. Rows report their heights
     * individually but arrive in a burst — the whole first window measures in one
     * tick — and reflowing per report would position later rows using the earlier
     * rows' estimates, which is exactly the state that leaves the first paint
     * overlapped. Batching means one pass over already-measured heights.
     */
    let pending = false;

    function setHeight(index: number, height: number): void {
        const item = meta.value[index];
        if (!item || item.height === height) return;
        item.height = height;

        if (pending) return;
        pending = true;
        void Promise.resolve().then(() => {
            pending = false;
            update();
        });
    }

    // Throttle rather than debounce for scrolling: a debounce would leave the
    // view blank until the user stopped, whereas a throttle keeps up with them.
    let last = 0;
    let trailing: ReturnType<typeof setTimeout> | undefined;

    function onScroll(): void {
        const delay = scrollOptions.value ? scrollOptions.value.delay : 0;
        const now = Date.now();
        const remaining = delay - (now - last);

        if (remaining <= 0) {
            last = now;
            update();
            return;
        }

        // Always schedule a trailing run, or the last scroll event before the
        // user stops could be dropped and leave stale rows on screen.
        if (trailing === undefined) {
            trailing = setTimeout(() => {
                trailing = undefined;
                last = Date.now();
                update();
            }, remaining);
        }
    }

    function attach(): void {
        viewer.value?.addEventListener('scroll', onScroll, { passive: true });
    }

    function detach(): void {
        viewer.value?.removeEventListener('scroll', onScroll);
        if (trailing !== undefined) {
            clearTimeout(trailing);
            trailing = undefined;
        }
    }

    // Window on the row count rather than on the inputs.
    //
    // Watching the inputs looks equivalent but is not: this composable's
    // immediate run would fire before useRender's debounced watcher had populated
    // `meta`, so it would window an empty array and nothing would ever become
    // visible. Keying on the array's length instead means the first real pass
    // happens as soon as there are rows to window, whatever order the watchers
    // were registered in.
    watch(
        () => meta.value.length,
        () => update(),
        { immediate: true, flush: 'sync' },
    );

    onMounted(() => {
        if (scrollOptions.value) attach();
    });

    onBeforeUnmount(detach);

    // Toggling the prop at runtime has to add or remove the listener, and a
    // freshly disabled viewer must not keep rows hidden.
    watch(scrollOptions, (value, previous) => {
        if (!previous && value) {
            attach();
            update();
        } else if (previous && !value) {
            detach();
            for (const item of meta.value) item.visible = true;
        }
    });

    return { minHeight, setHeight, update };
}
