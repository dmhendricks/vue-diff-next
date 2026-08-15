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
                    :show-line-numbers="showLineNumbers"
                    :fold="item.fold"
                    :meta="item"
                    :scroll-options="scrollOptions"
                    @height="setHeight"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import DiffLine from './DiffLine.vue';
import { useRender } from '../composables/useRender';
import { useVirtualScroll } from '../composables/useVirtualScroll';
import type { FoldMarker, Mode, Theme, VirtualScroll } from '../types';
import { resolveLanguage } from '../core/highlight/languages';
import { missingStylesWarn } from './missingStylesWarn';

defineOptions({ name: 'Diff' });

/**
 * Props and defaults match vue-diff@1.2.4 — including `theme` defaulting to
 * 'dark'. `wrap` and `showLineNumbers` are additive. Named extra palettes are
 * first-class `theme` values; their CSS is a separate import, not `style.css`.
 * See `Theme`.
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
        /**
         * Diff line-number gutter. Not in the original, which always showed
         * numbers — hence the default of `true`. Setting `false` hides the
         * gutter so the code columns use the full row width.
         */
        showLineNumbers?: boolean;
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
        showLineNumbers: true,
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
    `vue-diff-lang-${resolveLanguage(props.language)}`,
    // Wrapping is the default (and the original's only behaviour), so the class
    // marks the opt-out rather than the opt-in.
    { 'vue-diff-nowrap': !props.wrap },
    { 'vue-diff-no-line-numbers': !props.showLineNumbers },
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
    if (!import.meta.env.DEV || import.meta.env.VITEST || missingStylesWarn.warned) return;

    const root = viewer.value?.parentElement;
    if (!root) return;

    // Loaded CSS always defines `--vue-diff-bg` (theme color or the base
    // `transparent`). An empty value means `style.css` was never imported.
    if (getComputedStyle(root).getPropertyValue('--vue-diff-bg').trim()) return;

    missingStylesWarn.warned = true;
    console.warn(
        '[vue-diff-next] Stylesheet not detected. Import "vue-diff-next/style.css" — the component ships unstyled without it.',
    );
});
</script>
