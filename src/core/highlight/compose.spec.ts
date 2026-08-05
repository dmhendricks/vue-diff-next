import { describe, it, expect } from 'vitest';
import { composeSpans, spansToHtml } from './compose';
import { tokenizeSource } from './tokenize';
import { diffWords } from '../diff/words';
import type { Token } from './tokenize';
import type { WordSegment } from '../diff/words';

const t = (value: string, type: string | null = null): Token => ({ value, type });
const s = (value: string, modified = false): WordSegment => ({ value, modified });

const text = (spans: { value: string }[]) => spans.map((x) => x.value).join('');

describe('composeSpans', () => {
    it('returns nothing for no tokens', () => {
        expect(composeSpans([], [s('a')])).toEqual([]);
    });

    it('passes tokens through when there is no word-diff', () => {
        const tokens = [t('const', 'kwd'), t(' x')];
        expect(composeSpans(tokens, [])).toEqual([
            { value: 'const', type: 'kwd', modified: false },
            { value: ' x', type: null, modified: false },
        ]);
    });

    it('splits a token when a word boundary falls inside it', () => {
        // One 'str' token, half of which is modified.
        const spans = composeSpans([t('abcd', 'str')], [s('ab'), s('cd', true)]);
        expect(spans).toEqual([
            { value: 'ab', type: 'str', modified: false },
            { value: 'cd', type: 'str', modified: true },
        ]);
    });

    it('splits a segment spanning several tokens', () => {
        // One modified run covering two differently-classified tokens.
        const spans = composeSpans([t('ab', 'kwd'), t('cd', 'str')], [s('abcd', true)]);
        expect(spans).toEqual([
            { value: 'ab', type: 'kwd', modified: true },
            { value: 'cd', type: 'str', modified: true },
        ]);
    });

    it('handles boundaries that interleave from both sides', () => {
        // Tokens cut at 2/5, segments at 3/4 — every boundary must survive.
        const spans = composeSpans([t('ab', 'a'), t('cde', 'b')], [s('abc'), s('d', true), s('e')]);
        expect(text(spans)).toBe('abcde');
        expect(spans).toEqual([
            { value: 'ab', type: 'a', modified: false },
            { value: 'c', type: 'b', modified: false },
            { value: 'd', type: 'b', modified: true },
            { value: 'e', type: 'b', modified: false },
        ]);
    });

    it('merges neighbours sharing both classifications', () => {
        const spans = composeSpans([t('ab', 'x'), t('cd', 'x')], [s('abcd')]);
        expect(spans).toHaveLength(1);
        expect(spans[0]!.value).toBe('abcd');
    });

    it('emits no zero-length spans', () => {
        const spans = composeSpans([t('a', 'x'), t('b')], [s('a', true), s('b')]);
        expect(spans.every((x) => x.value.length > 0)).toBe(true);
    });

    describe('losslessness — the composed text always equals the token text', () => {
        it('when segments are shorter than the tokens', () => {
            // A caller bug or a lossy highlighter must not silently drop text.
            const spans = composeSpans([t('abcdef', 'x')], [s('ab', true)]);
            expect(text(spans)).toBe('abcdef');
        });

        it('when segments are longer than the tokens', () => {
            const spans = composeSpans([t('ab', 'x')], [s('abcdef', true)]);
            expect(text(spans)).toBe('ab');
        });

        it('across a realistic highlight + word-diff pairing', async () => {
            const prev = '<div class="old">value</div>';
            const current = '<div class="new">value</div>';
            const tokens = await tokenizeSource(current, 'html');
            const spans = composeSpans(tokens, diffWords(prev, current));
            expect(text(spans)).toBe(current);
            expect(spans.some((x) => x.modified)).toBe(true);
        });

        it('for multibyte characters', () => {
            const spans = composeSpans([t('a🎉b', 'x')], [s('a'), s('🎉', true), s('b')]);
            expect(text(spans)).toBe('a🎉b');
        });
    });
});

describe('spansToHtml', () => {
    it('renders unclassified, unmodified text bare', () => {
        expect(spansToHtml([{ value: 'plain', type: null, modified: false }])).toBe('plain');
    });

    it('renders a syntax class', () => {
        expect(spansToHtml([{ value: 'const', type: 'kwd', modified: false }])).toBe(
            '<span class="shj-syn-kwd">const</span>',
        );
    });

    it('renders a modified marker', () => {
        expect(spansToHtml([{ value: 'x', type: null, modified: true }])).toBe(
            '<span class="vue-diff-modified">x</span>',
        );
    });

    it('renders both classes together — the whole point of composing', () => {
        expect(spansToHtml([{ value: 'x', type: 'str', modified: true }])).toBe(
            '<span class="shj-syn-str vue-diff-modified">x</span>',
        );
    });

    describe('escaping', () => {
        it('escapes text in bare spans', () => {
            expect(spansToHtml([{ value: '<script>', type: null, modified: false }])).toBe(
                '&lt;script&gt;',
            );
        });

        it('escapes text inside classified spans', () => {
            const html = spansToHtml([{ value: '<img onerror="x">', type: 'str', modified: true }]);
            expect(html).not.toMatch(/<img/);
            expect(html).toContain('&lt;img');
            expect(html).toContain('&quot;');
        });

        it('leaves no live markup from content, only our own spans', async () => {
            // Highlighting HTML then rendering must never re-emit live markup.
            // The highlighter splits `<` from `script`, so the escaped form is
            // not contiguous — assert on tags instead, and that stripping our
            // spans leaves fully escaped text.
            const source = '<script>alert("xss")</script>';
            const tokens = await tokenizeSource(source, 'html');
            const html = spansToHtml(composeSpans(tokens, []));

            expect(html).not.toContain('<script');
            expect(html).not.toContain('</script>');

            const withoutOurSpans = html.replace(/<\/?span[^>]*>/g, '');
            expect(withoutOurSpans).not.toMatch(/[<>]/);
            expect(withoutOurSpans).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        });
    });
});
