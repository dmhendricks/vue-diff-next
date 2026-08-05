import { describe, it, expect } from 'vitest';
import { pairChunks, renderLines, toSplitLines, toUnifiedLines } from './lines';

describe('pairChunks', () => {
    it('pairs a removal with the addition that follows it', () => {
        // A removal immediately followed by an addition is a modification, and
        // must land in one pair so the renderer can word-diff the two sides.
        const pairs = pairChunks('a\nb\nc\n', 'a\nX\nc\n');
        const modified = pairs.find((p) => p[0].type === 'removed');
        expect(modified).toBeDefined();
        expect(modified?.[0].value).toBe('b\n');
        expect(modified?.[1].type).toBe('added');
        expect(modified?.[1].value).toBe('X\n');
    });

    it('pads a lone addition with a disabled prev side', () => {
        const pairs = pairChunks('a\n', 'a\nb\n');
        const added = pairs.find((p) => p[1].type === 'added');
        expect(added?.[0].type).toBe('disabled');
        expect(added?.[0].value).toBe('');
    });

    it('pads a lone removal with a disabled current side', () => {
        const pairs = pairChunks('a\nb\n', 'a\n');
        const removed = pairs.find((p) => p[0].type === 'removed');
        expect(removed?.[1].type).toBe('disabled');
    });

    it('duplicates equal text onto both sides', () => {
        const pairs = pairChunks('a\nb\n', 'a\nb\n');
        expect(pairs).toHaveLength(1);
        expect(pairs[0]![0].type).toBe('equal');
        expect(pairs[0]![1].type).toBe('equal');
        expect(pairs[0]![1].value).toBe(pairs[0]![0].value);
    });

    it('does not pair an addition with a removal separated by equal text', () => {
        // 'removed' then 'equal' then 'added' is two independent changes.
        const pairs = pairChunks('b\nx\n', 'x\nc\n');
        const removedPair = pairs.find((p) => p[0].type === 'removed');
        expect(removedPair?.[1].type).toBe('disabled');
    });
});

describe('toSplitLines', () => {
    it('numbers each side independently, skipping padded cells', () => {
        // prev has 2 lines, current has 3; the extra current line must not
        // advance the prev counter.
        const rows = toSplitLines(pairChunks('a\nb\n', 'a\nb\nc\n'));
        const prevNums = rows.map((r) => r[0]!.lineNum).filter((n) => n !== undefined);
        const currentNums = rows.map((r) => r[1]!.lineNum).filter((n) => n !== undefined);
        expect(prevNums).toEqual([1, 2]);
        expect(currentNums).toEqual([1, 2, 3]);
    });

    it('marks chkWords only when both sides changed', () => {
        const modified = toSplitLines(pairChunks('a\nb\nc\n', 'a\nX\nc\n'));
        expect(modified.some((r) => r[0]!.chkWords === true)).toBe(true);

        const pureAdd = toSplitLines(pairChunks('a\n', 'a\nb\n'));
        expect(pureAdd.every((r) => r[0]!.chkWords === false)).toBe(true);
    });

    it('emits one row per line for a multi-line replacement', () => {
        // prev 2 lines vs current 1: row count is the longer side.
        const rows = toSplitLines(pairChunks('a\nb\n', 'c\n'));
        expect(rows).toHaveLength(2);
        expect(rows[1]![1]!.type).toBe('disabled');
    });

    it('renders content when prev and current are identical', () => {
        // Regression guard: some diff viewers hide every line when nothing
        // changed, which breaks read-only views that just want to show content.
        const rows = toSplitLines(pairChunks('a\nb\n', 'a\nb\n'));
        expect(rows).toHaveLength(2);
        expect(rows.map((r) => r[0]!.value)).toEqual(['a', 'b']);
        expect(rows.map((r) => r[1]!.value)).toEqual(['a', 'b']);
    });

    it('handles empty input without throwing', () => {
        expect(() => toSplitLines(pairChunks('', ''))).not.toThrow();
    });
});

describe('toUnifiedLines', () => {
    it('emits removals before additions', () => {
        const rows = toUnifiedLines(pairChunks('a\nb\nc\n', 'a\nX\nc\n'));
        const types = rows.map((r) => r[0]!.type);
        expect(types.indexOf('removed')).toBeLessThan(types.indexOf('added'));
    });

    it('numbers only the current side', () => {
        const rows = toUnifiedLines(pairChunks('a\nb\nc\n', 'a\nX\nc\n'));
        const removed = rows.find((r) => r[0]!.type === 'removed');
        expect(removed?.[0]!.lineNum).toBeUndefined();

        const nums = rows.filter((r) => r[0]!.type !== 'removed').map((r) => r[0]!.lineNum);
        expect(nums).toEqual([1, 2, 3]);
    });

    it('expands a multi-line removal into one row per line', () => {
        const rows = toUnifiedLines(pairChunks('a\nb\n', 'c\n'));
        const removedValues = rows.filter((r) => r[0]!.type === 'removed').map((r) => r[0]!.value);
        expect(removedValues).toEqual(['a', 'b']);
    });

    it('renders content when prev and current are identical', () => {
        const rows = toUnifiedLines(pairChunks('a\nb\n', 'a\nb\n'));
        expect(rows.map((r) => r[0]!.value)).toEqual(['a', 'b']);
    });
});

describe('renderLines', () => {
    it('dispatches on mode', () => {
        // Same input, different row shape: split rows have 2 cells, unified 1.
        expect(renderLines('split', 'a\nb\n', 'a\nX\n')[0]).toHaveLength(2);
        expect(renderLines('unified', 'a\nb\n', 'a\nX\n')[0]).toHaveLength(1);
    });

    it('does not emit a trailing blank row for newline-terminated input', () => {
        const rows = renderLines('split', 'a\n', 'a\n');
        expect(rows).toHaveLength(1);
    });

    it('handles input with no trailing newline', () => {
        const rows = renderLines('split', 'a', 'a');
        expect(rows).toHaveLength(1);
        expect(rows[0]![0]!.value).toBe('a');
    });
});
