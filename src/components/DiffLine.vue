<template>
    <div ref="element" class="vue-diff-row" :style="rowStyle">
        <template v-for="(cell, index) in cells" :key="index">
            <!--
              A collapsed run of unchanged lines. The gutter and code markers are
              supplied by CSS so the placeholder holds no text a word-diff or
              highlighter could act on.
            -->
            <template v-if="isFold">
                <div v-if="showLineNumbers" class="vue-diff-line-num vue-diff-line-fold"></div>
                <div class="vue-diff-line vue-diff-line-fold">
                    <!--
                      The hunk header is real text because it carries the line
                      numbers, whereas the dots marker is a CSS ::before. It goes
                      in every cell so split mode reads the same on both sides —
                      rendering it once would leave the other side showing dots.
                    -->
                    <span v-if="hunkHeader" class="vue-diff-fold-hunk">{{ hunkHeader }}</span>
                </div>
            </template>
            <template v-else>
                <div
                    v-if="showLineNumbers"
                    class="vue-diff-line-num"
                    :class="`vue-diff-line-${cell.type ?? 'disabled'}`"
                >
                    {{ cell.lineNum ?? '' }}
                </div>
                <div class="vue-diff-line" :class="`vue-diff-line-${cell.type ?? 'disabled'}`">
                    <DiffCode
                        v-if="cell.value !== undefined"
                        :code="cell.value"
                        :language="language"
                        :counterpart="counterpartFor(index)"
                        :words="Boolean(cell.chkWords)"
                    />
                </div>
            </template>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import DiffCode from './DiffCode.vue';
import type { FoldMarker, FoldRange, Lines, Meta, VirtualScroll } from '../types';

const props = withDefaults(
    defineProps<{
        row: Lines;
        language?: string;
        foldMarker?: FoldMarker;
        showLineNumbers?: boolean;
        fold?: FoldRange;
        /** Positioning data; only supplied when virtual scroll is on. */
        meta?: Meta;
        scrollOptions?: false | VirtualScroll;
    }>(),
    {
        language: 'plaintext',
        foldMarker: 'dots',
        showLineNumbers: true,
        fold: undefined,
        meta: undefined,
        scrollOptions: false,
    },
);

const emit = defineEmits<{ height: [index: number, height: number] }>();

const element = ref<HTMLElement | null>(null);

/**
 * Absolute placement, so absent rows leave no gap and present ones land at the
 * offset the windowing pass computed. Without virtual scroll the rows simply
 * stack in normal flow.
 */
const rowStyle = computed(() => {
    if (!props.scrollOptions || !props.meta) return undefined;
    return {
        position: 'absolute' as const,
        left: 0,
        top: 0,
        transform: `translate3d(0, ${props.meta.top ?? 0}px, 0)`,
        minHeight: `${props.scrollOptions.lineMinHeight}px`,
        width: '100%',
    };
});

/**
 * Report the rendered height so the container's total is real rather than
 * estimated. A wrapped line can be any height, and the estimate would otherwise
 * make the scrollbar lie.
 */
let observer: ResizeObserver | undefined;
let frame: number | undefined;

function report(): void {
    const node = element.value;
    const meta = props.meta;
    if (!node || !meta) return;
    const height = node.offsetHeight;
    if (height > 0 && height !== meta.height) emit('height', meta.index, height);
}

/**
 * Start measuring this row, and keep measuring it as it reflows.
 *
 * Idempotent, because it runs both on mount and whenever measuring first becomes
 * possible — `scrollOptions` can arrive after mount, and a row that bailed on the
 * first attempt has to be picked up on the second.
 */
function observe(): void {
    if (!props.scrollOptions || !props.meta || !element.value) return;

    report();

    // Measure again after the browser has laid the row out.
    //
    // Mount fires once the row is in the DOM but before layout has necessarily
    // settled, so a line that wraps to two rows can still report a single line's
    // height. Reading in a rAF gets the post-layout value, which is what renders.
    if (frame === undefined && typeof requestAnimationFrame !== 'undefined') {
        frame = requestAnimationFrame(() => {
            frame = undefined;
            report();
        });
    }

    // Height changes on wrap, which happens on resize. Guarded because jsdom
    // has no ResizeObserver: without it the initial `report` above still runs,
    // so heights are simply never revised.
    if (observer || typeof ResizeObserver === 'undefined') return;

    observer = new ResizeObserver(report);
    observer.observe(element.value);

    // Observe each code cell as well, not just the row.
    //
    // In split mode a row's height is driven by the taller of its two cells, and
    // the row itself carries `min-height: lineMinHeight`. A wrap that stays
    // within that floor means the row's own box does not change size, so an
    // observer on the row alone can stay silent. The cells have no floor, so
    // they do report the reflow.
    for (const cell of element.value.querySelectorAll('.vue-diff-line')) {
        observer.observe(cell);
    }
}

onMounted(observe);

/**
 * Re-measure when the row changes, and start measuring if mount could not.
 *
 * Two distinct cases, both of which left rows stuck at their seeded estimate:
 *
 *  - `scrollOptions` is false at mount and becomes an object afterwards, which is
 *    what happens when virtual scroll is toggled on or applied by a parent after
 *    first paint. `onMounted` had already bailed, so the row never measured and
 *    never got a ResizeObserver.
 *  - `v-for` reuses component instances as the window slides, so a row that is
 *    already mounted receives new content without mounting again.
 *
 * In both cases the row kept whichever height it was first measured at: rows that
 * wrap to two lines stayed recorded as one line tall, and every row after them was
 * positioned too high, so they overlapped.
 *
 * Measured after the DOM has been patched, hence the flush.
 */
watch(
    () => [props.meta?.index, props.scrollOptions] as const,
    () => observe(),
    { flush: 'post' },
);

onBeforeUnmount(() => {
    observer?.disconnect();
    observer = undefined;
    if (frame !== undefined) {
        cancelAnimationFrame(frame);
        frame = undefined;
    }
});

/**
 * A unified-diff hunk header for the collapsed run, e.g. `@@ -12,8 +12,8 @@`.
 *
 * Null unless the `hunk` style is selected and there is a range to describe, so
 * the template falls back to the CSS dots marker.
 */
const hunkHeader = computed(() => {
    if (props.foldMarker !== 'hunk' || !props.fold) return null;

    const { count, prevStart, currentStart } = props.fold;
    const prev = prevStart === undefined ? '' : `-${prevStart},${count} `;
    const current = currentStart === undefined ? '' : `+${currentStart},${count}`;

    if (!prev && !current) return null;
    return `@@ ${prev}${current} @@`.replace(/\s+/g, ' ');
});

const cells = computed(() => props.row);

/**
 * Whether this row stands in for a collapsed run of unchanged lines.
 *
 * Keyed on `fold`, not merely "equal + folding": `useRender` only annotates a
 * range when something was actually collapsed after this row. An isolated equal
 * line (nothing to hide) keeps its content as context instead of becoming a
 * hollow dots marker.
 */
const isFold = computed(() => Boolean(props.fold));

/**
 * The other side's text, for word-diffing a modified line.
 *
 * Split: sibling cell on the same row. Unified: `counterpart` stamped on the
 * cell when `toUnifiedLines` pairs a removal with its addition.
 */
function counterpartFor(index: number): string | undefined {
    const cell = props.row[index];
    if (cell?.counterpart !== undefined) return cell.counterpart;
    if (props.row.length < 2) return undefined;
    const other = props.row[index === 0 ? 1 : 0];
    return other?.value;
}
</script>
