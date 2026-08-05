<template>
    <div class="vue-diff-wrapper" :class="wrapperClass">
        <div
            ref="viewer"
            class="vue-diff-viewer"
            :style="{ height: scrollOptions ? `${scrollOptions.height}px` : undefined }"
        >
            <div class="vue-diff-viewer-inner">
                <DiffLine
                    v-for="item in visibleRows"
                    :key="item.index"
                    :row="rows[item.index]!"
                    :language="language"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import DiffLine from './DiffLine.vue';
import { useRender } from '../composables/useRender';
import type { Mode, Theme, VirtualScroll } from '../types';

defineOptions({ name: 'Diff' });

/**
 * Props and defaults are vue-diff@1.2.4's, verbatim — including `theme`
 * defaulting to 'dark'. `wrap` is the one addition.
 *
 * `prev`/`current` accept null so callers need not normalize; the original typed
 * them as string, but tolerating null costs nothing and prevents a crash.
 */
const props = withDefaults(
    defineProps<{
        mode?: Mode;
        theme?: Theme;
        language?: string;
        prev?: string | null;
        current?: string | null;
        folding?: boolean;
        inputDelay?: number;
        /** `true` uses the original's defaults; an object overrides any subset. */
        virtualScroll?: boolean | Partial<VirtualScroll>;
        /** Soft-wrap long lines. Not in the original. */
        wrap?: boolean;
    }>(),
    {
        mode: 'split',
        theme: 'dark',
        language: 'plaintext',
        prev: '',
        current: '',
        folding: false,
        inputDelay: 0,
        virtualScroll: false,
        wrap: false,
    },
);

const viewer = ref<HTMLElement | null>(null);

/** Defaults the original applies when `virtualScroll` is `true`. */
const DEFAULT_VIRTUAL_SCROLL: VirtualScroll = { height: 500, lineMinHeight: 24, delay: 100 };

const scrollOptions = computed<false | VirtualScroll>(() => {
    if (!props.virtualScroll) return false;
    return props.virtualScroll === true
        ? DEFAULT_VIRTUAL_SCROLL
        : { ...DEFAULT_VIRTUAL_SCROLL, ...props.virtualScroll };
});

const wrapperClass = computed(() => [
    `vue-diff-mode-${props.mode}`,
    `vue-diff-theme-${props.theme}`,
    { 'vue-diff-wrap': props.wrap },
]);

// Normalize null-ish text once, here, so the core never sees it.
const renderProps = {
    get mode() {
        return props.mode;
    },
    get prev() {
        return props.prev ?? '';
    },
    get current() {
        return props.current ?? '';
    },
    get folding() {
        return props.folding;
    },
    get inputDelay() {
        return props.inputDelay;
    },
};

const { rows, visibleRows } = useRender(renderProps, () => scrollOptions.value);

// Referenced so the template ref is retained for phase 2 (virtual scroll needs
// a measurable scroll container).
void toRef(viewer);
</script>
