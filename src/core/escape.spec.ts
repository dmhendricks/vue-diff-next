import { describe, it, expect } from 'vitest';
import { escapeHtml } from './escape';

describe('escapeHtml', () => {
    it('escapes the five HTML-significant characters', () => {
        expect(escapeHtml('&')).toBe('&amp;');
        expect(escapeHtml('<')).toBe('&lt;');
        expect(escapeHtml('>')).toBe('&gt;');
        expect(escapeHtml('"')).toBe('&quot;');
        expect(escapeHtml("'")).toBe('&#39;');
    });

    it('escapes & before the characters whose escapes contain &', () => {
        // Wrong ordering would yield '&amp;amp;lt;' here.
        expect(escapeHtml('&<')).toBe('&amp;&lt;');
        expect(escapeHtml('&amp;')).toBe('&amp;amp;');
    });

    it('leaves text with no significant characters untouched', () => {
        expect(escapeHtml('plain text 123')).toBe('plain text 123');
        expect(escapeHtml('')).toBe('');
    });

    it('coerces null-ish input to an empty string', () => {
        // prev/current are allowed to be null; escaping must not throw.
        expect(escapeHtml(null)).toBe('');
        expect(escapeHtml(undefined)).toBe('');
    });

    it('coerces non-string input rather than throwing', () => {
        expect(escapeHtml(42)).toBe('42');
        expect(escapeHtml(false)).toBe('false');
    });

    describe('XSS vectors render inert', () => {
        it('neutralises a script tag', () => {
            expect(escapeHtml('<script>alert(1)</script>')).toBe(
                '&lt;script&gt;alert(1)&lt;/script&gt;',
            );
        });

        it('neutralises an inline event handler', () => {
            expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
                '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
            );
        });

        it('neutralises an attribute-breaking single quote', () => {
            expect(escapeHtml("' onmouseover='alert(1)")).toBe('&#39; onmouseover=&#39;alert(1)');
        });

        it('escapes every significant character in mixed content', () => {
            const escaped = escapeHtml(`<a href="x">&'</a>`);
            expect(escaped).not.toMatch(/[<>"']/);
            expect(escaped).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
        });
    });
});
