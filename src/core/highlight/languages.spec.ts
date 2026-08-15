import { describe, it, expect } from 'vitest';
import { FALLBACK, GRAMMARS, isSupportedLanguage, resolveLanguage } from './languages';

describe('resolveLanguage', () => {
    it('passes through every bundled grammar name', () => {
        for (const grammar of GRAMMARS) {
            expect(resolveLanguage(grammar)).toBe(grammar);
        }
    });

    it('maps the highlight.js names vue-diff registered', () => {
        // These are the seven the original supported; all must keep working.
        expect(resolveLanguage('css')).toBe('css');
        expect(resolveLanguage('xml')).toBe('xml');
        expect(resolveLanguage('markdown')).toBe('md');
        expect(resolveLanguage('javascript')).toBe('js');
        expect(resolveLanguage('json')).toBe('json');
        expect(resolveLanguage('plaintext')).toBe('plain');
        expect(resolveLanguage('typescript')).toBe('ts');
    });

    it("maps vue-diff's default language value", () => {
        // `plaintext` is the prop default, so this alias is load-bearing.
        expect(resolveLanguage('plaintext')).toBe('plain');
    });

    it('maps the v1 js_template_literals grammar onto js', () => {
        expect(resolveLanguage('js_template_literals')).toBe('js');
        expect(GRAMMARS).not.toContain('js_template_literals');
    });

    it('maps CSS supersets to css', () => {
        expect(resolveLanguage('scss')).toBe('css');
        expect(resolveLanguage('sass')).toBe('css');
        expect(resolveLanguage('less')).toBe('css');
    });

    it('is case-insensitive and trims whitespace', () => {
        expect(resolveLanguage('JavaScript')).toBe('js');
        expect(resolveLanguage('  JSON  ')).toBe('json');
        expect(resolveLanguage('YAML')).toBe('yaml');
    });

    it('falls back to plain text for unknown languages', () => {
        expect(resolveLanguage('klingon')).toBe(FALLBACK);
        expect(resolveLanguage('')).toBe(FALLBACK);
        expect(resolveLanguage('   ')).toBe(FALLBACK);
    });

    it('tolerates null-ish and non-string input', () => {
        // The component accepts null/undefined props; resolving must not throw.
        expect(resolveLanguage(null)).toBe(FALLBACK);
        expect(resolveLanguage(undefined)).toBe(FALLBACK);
        expect(resolveLanguage(42)).toBe(FALLBACK);
        expect(resolveLanguage({})).toBe(FALLBACK);
    });

    it('never returns a name that is not a bundled grammar', () => {
        const inputs = ['js', 'javascript', 'nonsense', '', null, 'SCSS', 'vue'];
        for (const input of inputs) {
            expect(GRAMMARS).toContain(resolveLanguage(input));
        }
    });
});

describe('isSupportedLanguage', () => {
    it('is true for grammars and aliases', () => {
        expect(isSupportedLanguage('js')).toBe(true);
        expect(isSupportedLanguage('javascript')).toBe(true);
        expect(isSupportedLanguage('scss')).toBe(true);
        expect(isSupportedLanguage('js_template_literals')).toBe(true);
    });

    it('is false for unknown or non-string input', () => {
        expect(isSupportedLanguage('klingon')).toBe(false);
        expect(isSupportedLanguage(null)).toBe(false);
        expect(isSupportedLanguage('')).toBe(false);
    });
});
