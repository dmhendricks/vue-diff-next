<template>
    <div class="vue-diff-row">
        <template v-for="(cell, index) in cells" :key="index">
            <!--
              A collapsed run of unchanged lines. The gutter and code markers are
              supplied by CSS so the placeholder holds no text a word-diff or
              highlighter could act on.
            -->
            <template v-if="isFold">
                <div class="vue-diff-line-num vue-diff-line-fold"></div>
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
                <div class="vue-diff-line-num" :class="`vue-diff-line-${cell.type ?? 'disabled'}`">
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
import { computed } from 'vue';
import DiffCode from './DiffCode.vue';
import type { FoldMarker, FoldRange, Lines } from '../types';

const props = withDefaults(
    defineProps<{
        row: Lines;
        language?: string;
        folding?: boolean;
        foldMarker?: FoldMarker;
        fold?: FoldRange;
    }>(),
    { language: 'plaintext', folding: false, foldMarker: 'dots', fold: undefined },
);

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
 * `useRender` filters out every foldable row, and a row is only foldable when the
 * one before it is also unchanged — so the first unchanged row after a change
 * always survives the filter. That survivor is what marks the gap.
 */
const isFold = computed(() => props.folding && props.row[0]?.type === 'equal');

/**
 * The other side's text, for word-diffing a modified line.
 *
 * Only meaningful in split mode, where index 0 is prev and index 1 is current.
 * Unified rows hold a single cell and have no counterpart to compare against.
 */
function counterpartFor(index: number): string | undefined {
    if (props.row.length < 2) return undefined;
    const other = props.row[index === 0 ? 1 : 0];
    return other?.value;
}
</script>
