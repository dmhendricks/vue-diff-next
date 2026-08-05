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

describe('punctuation between changed words', () => {
    it('bridges a dot inside a changed filename', () => {
        // diffWordsWithSpace splits on word boundaries, so `a.png` -> `b.webp`
        // arrives as a/./png vs b/./webp with the dot unchanged. Left bare it
        // showed as an unhighlighted speck mid-highlight.
        const segments = diffWords('<img src="a.png">', '<img src="b.webp">');

        const modified = segments.filter((s) => s.modified);
        expect(modified).toHaveLength(1);
        expect(modified[0]!.value).toBe('b.webp');
    });

    it('bridges other short seams between changes', () => {
        const cases: Array<[string, string, string]> = [
            ['a::b', 'x::y', 'x::y'],
            ['one, two', 'three, four', 'three, four'],
            ['a->b', 'c->d', 'c->d'],
            ['v1.2.3', 'v4.5.6', 'v4.5.6'],
        ];

        for (const [prev, current, expected] of cases) {
            const modified = diffWords(prev, current).filter((s) => s.modified);
            expect(modified.map((s) => s.value).join('|')).toBe(expected);
        }
    });

    it('does not bridge an unchanged word between two changes', () => {
        // The guard that keeps the rule honest: `brown` survived, so it must not
        // be swallowed just because both of its neighbours changed.
        const segments = diffWords('the quick brown fox', 'a quick brown dog');
        const modified = segments.filter((s) => s.modified);

        expect(modified.map((s) => s.value)).toEqual(['a', 'dog']);
        expect(segments.some((s) => !s.modified && s.value.includes('brown'))).toBe(true);
    });

    it('does not bridge a long punctuation run between two changes', () => {
        // Over MAX_BRIDGE_LENGTH, so it reads as content rather than a seam.
        const segments = diffWords('a ===== b', 'x ===== y');
        expect(segments.some((s) => !s.modified && s.value.includes('====='))).toBe(true);
    });

    it('does not bridge digits, which are content even when short', () => {
        const segments = diffWords('fn(a, 42, b)', 'fn(x, 42, y)');
        expect(segments.some((s) => !s.modified && s.value.includes('42'))).toBe(true);
    });

    it('leaves a trailing seam unmarked when nothing follows it', () => {
        // No changed run on the right, so there is nothing to bridge to.
        const segments = diffWords('old.', 'new.');
        expect(segments[segments.length - 1]).toEqual({ value: '.', modified: false });
    });
});

describe('whitespace between changed words', () => {
    it('marks interior gaps so a rewritten phrase highlights as one run', () => {
        // diffWordsWithSpace emits whitespace as its own unchanged token, which
        // rendered as stripes: words tinted, the spaces between them bare.
        const segments = diffWords(
            '  const results = [];',
            '  // Parallel now: the sequential loop was the bottleneck.',
        );

        const modified = segments.filter((s) => s.modified);
        expect(modified).toHaveLength(1);
        expect(modified[0]!.value).toBe('// Parallel now: the sequential loop was the bottleneck.');
    });

    it('leaves leading indentation unmarked', () => {
        // Indentation is not what changed, so highlighting it would misreport.
        const segments = diffWords('    old value', '    new value');
        expect(segments[0]).toEqual({ value: '    ', modified: false });
    });

    it('leaves trailing whitespace unmarked', () => {
        const segments = diffWords('old   ', 'new   ');
        expect(segments[segments.length - 1]!.modified).toBe(false);
    });

    it('does not widen a single-word change to its neighbours', () => {
        const segments = diffWords('the quick brown fox', 'the quick red fox');
        const modified = segments.filter((s) => s.modified);
        expect(modified).toHaveLength(1);
        expect(modified[0]!.value).toBe('red');
    });

    it('still reconstructs current exactly', () => {
        const current = '  // a  b   c changed entirely here';
        const segments = diffWords('  const x = 1;', current);
        expect(segments.map((s) => s.value).join('')).toBe(current);
    });
});
