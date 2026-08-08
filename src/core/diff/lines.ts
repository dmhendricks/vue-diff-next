import { diffLines as jsDiffLines } from 'diff';
import type { DiffType, Line, Lines, Mode } from '../../types';

/**
 * One side of a diff chunk: a change type plus its text.
 *
 * `disabled` is not a jsdiff concept — it is our placeholder for "this side has
 * no counterpart", used to pad a lone addition or removal so both sides of a
 * split view stay aligned. Mirrors vue-diff's `[2, '']` sentinel.
 */
export interface Chunk {
    type: DiffType;
    value: string;
}

/** A prev/current chunk pair. Index 0 is prev, index 1 is current. */
export type ChunkPair = [Chunk, Chunk];

const DISABLED: Chunk = { type: 'disabled', value: '' };

/** Split into lines, dropping the single trailing newline a chunk always ends with. */
function toLines(value: string): string[] {
    return value.replace(/\n$/, '').split('\n');
}

/**
 * Run the line diff and group the flat result into prev/current pairs.
 *
 * The grouping is what makes word-level diffing possible: a `removed` chunk
 * immediately followed by an `added` chunk is a *modification*, so both land in
 * one pair and can be word-diffed against each other. Anything else is padded
 * with a `disabled` chunk on the opposite side.
 */
export function pairChunks(prev: string, current: string): ChunkPair[] {
    const raw = jsDiffLines(prev, current);
    const pairs: ChunkPair[] = [];

    for (const part of raw) {
        const type: DiffType = part.removed ? 'removed' : part.added ? 'added' : 'equal';
        const chunk: Chunk = { type, value: part.value };

        if (type === 'added') {
            const last = pairs[pairs.length - 1];
            // Pair with an immediately preceding removal: that is a modification.
            if (last && last[0].type === 'removed' && last[1].type === 'disabled') {
                last[1] = chunk;
                continue;
            }
            pairs.push([DISABLED, chunk]);
            continue;
        }

        if (type === 'removed') {
            pairs.push([chunk, DISABLED]);
            continue;
        }

        // Equal text appears on both sides.
        pairs.push([chunk, { ...chunk }]);
    }

    return pairs;
}

/**
 * Build split-mode rows: one row per visual line, each carrying a prev cell and
 * a current cell.
 *
 * Line numbers count only lines that actually exist on that side, so a padded
 * `disabled` cell leaves the counter untouched — that is how the two gutters
 * stay independently correct.
 */
export function toSplitLines(pairs: ChunkPair[]): Lines[] {
    const rows: Lines[] = [];
    let prevNum = 0;
    let currentNum = 0;

    for (const [prevChunk, currentChunk] of pairs) {
        const prevLines = toLines(prevChunk.value);
        const currentLines = toLines(currentChunk.value);

        // A modification: both sides changed, so the renderer should word-diff them.
        const chkWords =
            (prevChunk.type === 'removed' || prevChunk.type === 'added') &&
            (currentChunk.type === 'removed' || currentChunk.type === 'added');

        const rowCount = Math.max(prevLines.length, currentLines.length);

        for (let i = 0; i < rowCount; i++) {
            const hasPrev = prevChunk.type !== 'disabled' && prevLines[i] !== undefined;
            const hasCurrent = currentChunk.type !== 'disabled' && currentLines[i] !== undefined;

            if (hasPrev) prevNum += 1;
            if (hasCurrent) currentNum += 1;

            const prevCell: Line = {
                type: hasPrev ? prevChunk.type : 'disabled',
                lineNum: hasPrev ? prevNum : undefined,
                value: hasPrev ? prevLines[i] : undefined,
                chkWords,
            };
            const currentCell: Line = {
                type: hasCurrent ? currentChunk.type : 'disabled',
                lineNum: hasCurrent ? currentNum : undefined,
                value: hasCurrent ? currentLines[i] : undefined,
                chkWords,
            };

            rows.push([prevCell, currentCell]);
        }
    }

    return rows;
}

/**
 * Build unified-mode rows: removals first, then additions/equals, one cell each.
 *
 * Only the current side is numbered — removed lines have no line number in the
 * result, matching the original.
 *
 * When a pair is a modification (removed + added), each aligned line gets
 * `chkWords` and a `counterpart` so word-level highlighting works the same as
 * split mode. Unequal hunk lengths only word-diff the overlapping prefix.
 */
export function toUnifiedLines(pairs: ChunkPair[]): Lines[] {
    const rows: Lines[] = [];
    let lineNum = 0;

    for (const [prevChunk, currentChunk] of pairs) {
        const modification =
            prevChunk.type === 'removed' && currentChunk.type === 'added';
        const prevLines = prevChunk.type === 'removed' ? toLines(prevChunk.value) : [];
        const currentLines =
            currentChunk.type !== 'disabled' ? toLines(currentChunk.value) : [];

        if (prevChunk.type === 'removed') {
            for (let i = 0; i < prevLines.length; i++) {
                const counterpart = modification ? currentLines[i] : undefined;
                rows.push([
                    {
                        type: 'removed',
                        lineNum: undefined,
                        value: prevLines[i],
                        chkWords: counterpart !== undefined,
                        counterpart,
                    },
                ]);
            }
        }

        if (currentChunk.type !== 'disabled') {
            for (let i = 0; i < currentLines.length; i++) {
                lineNum += 1;
                const counterpart = modification ? prevLines[i] : undefined;
                rows.push([
                    {
                        type: currentChunk.type,
                        lineNum,
                        value: currentLines[i],
                        chkWords: counterpart !== undefined,
                        counterpart,
                    },
                ]);
            }
        }
    }

    return rows;
}

/** Diff `prev` against `current` and render rows for the given mode. */
export function renderLines(mode: Mode, prev: string, current: string): Lines[] {
    const pairs = pairChunks(prev, current);
    return mode === 'unified' ? toUnifiedLines(pairs) : toSplitLines(pairs);
}
