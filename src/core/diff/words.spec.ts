import { describe, it, expect } from 'vitest';
import { diffWords } from './words';

/** The invariant every consumer depends on: segments reconstruct `current`. */
function reassemble(prev: string, current: string): string {
    return diffWords(prev, current)
        .map((s) => s.value)
        .join('');
}

describe('diffWords', () => {
    it('marks nothing when the texts are identical', () => {
        expect(diffWords('abc', 'abc')).toEqual([{ value: 'abc', modified: false }]);
    });

    it('returns an empty list for empty current text', () => {
        expect(diffWords('', '')).toEqual([]);
    });

    it('marks a changed word and leaves its neighbours alone', () => {
        expect(diffWords('the quick fox', 'the slow fox')).toEqual([
            { value: 'the ', modified: false },
            { value: 'slow', modified: true },
            { value: ' fox', modified: false },
        ]);
    });

    it('marks inserted text as modified', () => {
        const segments = diffWords('a c', 'a b c');
        expect(segments.some((s) => s.modified)).toBe(true);
        expect(segments.map((s) => s.value).join('')).toBe('a b c');
    });

    it('drops removed text, since it is absent from current', () => {
        const segments = diffWords('a b c', 'a c');
        expect(segments.map((s) => s.value).join('')).toBe('a c');
        expect(segments.every((s) => !s.value.includes('b'))).toBe(true);
    });

    it('marks everything when the text is wholly replaced', () => {
        expect(diffWords('aaa', 'bbb')).toEqual([{ value: 'bbb', modified: true }]);
    });

    it('merges adjacent segments of the same kind', () => {
        // No two consecutive segments should share a `modified` value.
        const segments = diffWords('one two three four', 'one XX YY four');
        for (let i = 1; i < segments.length; i++) {
            expect(segments[i]!.modified).not.toBe(segments[i - 1]!.modified);
        }
    });

    it('preserves whitespace exactly', () => {
        // diffWordsWithSpace, not diffWords: leading/collapsed spaces matter in a
        // diff view, where alignment is the whole point.
        expect(reassemble('a    b', 'a  b')).toBe('a  b');
        expect(reassemble('\tindented', '  indented')).toBe('  indented');
    });

    describe('losslessness: segments always reconstruct current', () => {
        const cases: Array<[string, string]> = [
            ['', 'added from nothing'],
            ['removed to nothing', ''],
            ['same', 'same'],
            ['the quick brown fox', 'the slow brown dog'],
            ['<div class="a">x</div>', '<div class="b">y</div>'],
            ['{"k": 1}', '{"k": 2, "j": 3}'],
            ['trailing space ', 'trailing space'],
            ['multi\nline\ntext', 'multi\nchanged\ntext'],
            ['emoji 🎉 here', 'emoji 🚀 here'],
            ['a'.repeat(500), `${'a'.repeat(250)}b${'a'.repeat(249)}`],
        ];

        for (const [prev, current] of cases) {
            it(`reconstructs ${JSON.stringify(current.slice(0, 30))}`, () => {
                expect(reassemble(prev, current)).toBe(current);
            });
        }
    });
});
