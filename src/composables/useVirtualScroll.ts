import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import type { Meta, VirtualScroll } from '../types';

/** Flip `meta.visible` / `top` so only rows near the viewport render. */
export function useVirtualScroll(
    viewer: Ref<HTMLElement | null>,
    scrollOptions: ComputedRef<false | VirtualScroll>,
    meta: Ref<Meta[]>,
) {
    // Unmeasured rows still occupy lineMinHeight — zero would stack later rows.
    function heightOf(item: Meta, lineMinHeight: number): number {
        return Math.max(item.height ?? lineMinHeight, lineMinHeight);
    }

    // Plain ref, not computed: assigning `top` inside a computed is ignored by Vue
    // and leaves wrapped rows overlapping.
    const totalHeight = ref(0);

    const minHeight = computed(() =>
        scrollOptions.value ? `${totalHeight.value}px` : undefined,
    );

    function update(): void {
        const options = scrollOptions.value;
        if (!options) return;

        // Ref may be unset on the first pass; treat as scrollTop 0, not "bail".
        const scrollTop = viewer.value?.scrollTop ?? 0;
        const buffer = options.height * 1.5;
        const min = scrollTop - buffer;
        const max = scrollTop + options.height + buffer;

        const total = meta.value.reduce((offset, item) => {
            const height = heightOf(item, options.lineMinHeight);
            item.visible = offset + height >= min && offset <= max;
            item.top = offset;
            return item.foldable ? offset : offset + height;
        }, 0);

        totalHeight.value = total;
    }

    // Coalesce height reports — the first window measures in one burst.
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

    // Throttle (not debounce) so the window keeps up while scrolling; trailing
    // timer catches the last event that would otherwise be dropped.
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

    // Watch meta array identity from useRender — not inputs or length alone.
    // Inputs fire before the debounced build; length is unchanged when Meta is
    // mutated in place under virtual scroll.
    watch(meta, () => update(), { immediate: true, flush: 'sync' });

    onMounted(() => {
        if (scrollOptions.value) attach();
    });

    onBeforeUnmount(detach);

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
