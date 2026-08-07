<template>
    <div class="vue-diff-wrapper" :class="wrapperClass">
        <div
            ref="viewer"
            class="vue-diff-viewer"
            :style="{ height: scrollOptions ? `${scrollOptions.height}px` : undefined }"
        >
            <div class="vue-diff-viewer-inner" :style="{ minHeight }">
                <DiffLine
                    v-for="item in visibleRows"
                    :key="item.index"
                    :row="rows[item.index]!"
                    :language="language"
                    :fold-marker="foldMarker"
                    :fold="item.fold"
                    :meta="item"
                    :scroll-options="scrollOptions"
                    @height="setHeight"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
/** One warn per page load — multiple Diff instances should not spam the console. */
let warnedMissingStyles = false;
</script>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import DiffLine from './DiffLine.vue';
import { useRender } from '../composables/useRender';
import { useVirtualScroll } from '../composables/useVirtualScroll';
import type { FoldMarker, Mode, Theme, VirtualScroll } from '../types';

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
        foldMarker?: FoldMarker;
        inputDelay?: number;
        /** `true` uses the original's defaults; an object overrides any subset. */
        virtualScroll?: boolean | Partial<VirtualScroll>;
        /**
         * Soft-wrap long lines. Not in the original, which always wrapped —
         * hence the default of `true`. Setting `false` lets lines scroll
         * horizontally instead.
         */
        wrap?: boolean;
    }>(),
    {
        mode: 'split',
        theme: 'dark',
        language: 'plaintext',
        prev: '',
        current: '',
        folding: false,
        foldMarker: 'dots',
        inputDelay: 0,
        virtualScroll: false,
        wrap: true,
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
    // Wrapping is the default (and the original's only behaviour), so the class
    // marks the opt-out rather than the opt-in.
    { 'vue-diff-nowrap': !props.wrap },
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

const { rows, meta, visibleRows } = useRender(renderProps, () => scrollOptions.value);

const { minHeight, setHeight } = useVirtualScroll(viewer, scrollOptions, meta);

onMounted(() => {
    // Skip Vitest: component specs mount without the stylesheet on purpose.
    if (!import.meta.env.DEV || import.meta.env.VITEST || warnedMissingStyles) return;

    const root = viewer.value?.parentElement;
    if (!root) return;

    // Loaded CSS always defines `--vue-diff-bg` (theme color or the base
    // `transparent`). An empty value means `style.css` was never imported.
    if (getComputedStyle(root).getPropertyValue('--vue-diff-bg').trim()) return;

    warnedMissingStyles = true;
    console.warn(
        '[vue-diff-next] Stylesheet not detected. Import "vue-diff-next/style.css" — the component ships unstyled without it.',
    );
});
</script>
