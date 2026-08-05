<template>
    <div class="vue-diff-row">
        <template v-for="(cell, index) in cells" :key="index">
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
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DiffCode from './DiffCode.vue';
import type { Lines } from '../types';

const props = withDefaults(
    defineProps<{
        row: Lines;
        language?: string;
    }>(),
    { language: 'plaintext' },
);

const cells = computed(() => props.row);

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
