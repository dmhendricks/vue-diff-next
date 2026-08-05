import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { isLossless, tokenizeSource } from './tokenize';
import { GRAMMARS } from './languages';

const HOSTILE_DIR = 'tests/fixtures/hostile';
const LANGUAGES_DIR = 'tests/fixtures/languages';

function read(dir: string, file: string): string {
    return readFileSync(`${dir}/${file}`, 'utf8');
}

describe('tokenizeSource', () => {
    it('returns no tokens for empty input', async () => {
        expect(await tokenizeSource('', 'js')).toEqual([]);
    });

    it('emits no zero-length tokens', async () => {
        // speed-highlight emits many empty tokens; they would become empty spans.
        const tokens = await tokenizeSource('<div class="a">hi</div>', 'html');
        expect(tokens.every((t) => t.value.length > 0)).toBe(true);
    });

    it('merges adjacent tokens of the same class', async () => {
        const tokens = await tokenizeSource('const a = 1;\nconst b = 2;\n', 'js');
        for (let i = 1; i < tokens.length; i++) {
            expect(tokens[i]!.type).not.toBe(tokens[i - 1]!.type);
        }
    });

    it('classifies at least some tokens for a known language', async () => {
        const tokens = await tokenizeSource('const x = "s";', 'js');
        expect(tokens.some((t) => t.type !== null)).toBe(true);
    });

    it('falls back to plain text for an unknown language', async () => {
        const source = 'some text';
        const tokens = await tokenizeSource(source, 'not-a-real-language');
        expect(isLossless(tokens, source)).toBe(true);
    });

    it('resolves highlight.js language names, for vue-diff parity', async () => {
        // `javascript` and `plaintext` are what the original's API accepts.
        const viaAlias = await tokenizeSource('const x = 1;', 'javascript');
        const viaName = await tokenizeSource('const x = 1;', 'js');
        expect(viaAlias).toEqual(viaName);
    });
});

/**
 * The contract the whole architecture rests on. Word-diff composition splits
 * this token stream at word boundaries, so any dropped, reordered, or duplicated
 * character corrupts the rendered diff — silently, and in a way that misleads
 * the reader about what changed.
 */
describe('losslessness invariant', () => {
    describe('every bundled grammar, against its own sample', () => {
        const files = readdirSync(LANGUAGES_DIR).filter((f) => f.endsWith('.txt'));

        it('has a sample for every grammar', () => {
            const covered = new Set(files.map((f) => f.replace(/\.txt$/, '')));
            const missing = GRAMMARS.filter((g) => !covered.has(g));
            expect(missing).toEqual([]);
        });

        for (const file of files) {
            const language = file.replace(/\.txt$/, '');
            it(`${language} round-trips exactly`, async () => {
                const source = read(LANGUAGES_DIR, file);
                const tokens = await tokenizeSource(source, language);
                expect(tokens.map((t) => t.value).join('')).toBe(source);
            });
        }
    });

    describe('hostile input', () => {
        const files = readdirSync(HOSTILE_DIR);

        for (const file of files) {
            // Highlight each fixture as the type its extension implies, so bad
            // HTML is parsed as HTML rather than sidestepped as plain text.
            const ext = file.split('.').pop() ?? 'plain';

            it(`${file} round-trips exactly`, async () => {
                const source = read(HOSTILE_DIR, file);
                const tokens = await tokenizeSource(source, ext);
                expect(isLossless(tokens, source)).toBe(true);
            });
        }
    });

    describe('synthetic edge cases', () => {
        const cases: Array<[name: string, source: string, language: string]> = [
            ['lone angle bracket', 'a < b', 'html'],
            ['lone ampersand', 'a & b', 'html'],
            ['only whitespace', '   \n\t\n  ', 'plain'],
            ['single newline', '\n', 'plain'],
            ['no trailing newline', 'last line', 'plain'],
            ['CRLF line endings', 'a\r\nb\r\n', 'plain'],
            ['null byte', 'a\0b', 'plain'],
            ['unterminated string', 'const s = "never closed', 'js'],
            ['unterminated comment', '/* never closed', 'css'],
            ['deeply nested', '{'.repeat(200) + '}'.repeat(200), 'json'],
            ['many short lines', Array.from({ length: 500 }, (_, i) => `l${i}`).join('\n'), 'plain'],
            ['mixed scripts', 'ascii 中文 العربية 🎉 ñ', 'plain'],
            ['combining marks', 'é à', 'plain'],
            ['zero-width chars', 'a​b‍c', 'plain'],
        ];

        for (const [name, source, language] of cases) {
            it(name, async () => {
                const tokens = await tokenizeSource(source, language);
                expect(isLossless(tokens, source)).toBe(true);
            });
        }
    });
});
