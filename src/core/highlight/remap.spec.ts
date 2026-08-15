import { describe, it, expect } from 'vitest';
import { tokenizeSource } from './tokenize';

describe('remapHighlightTokens (via tokenizeSource)', () => {
    it('tags JS object keys as class, matching hljs-attr', async () => {
        const tokens = tokenizeSource('const o = { retries: 3 };\n', 'javascript');
        const retries = tokens.find((t) => t.value === 'retries');
        expect(retries?.type).toBe('class');
    });

    it('tags JS PascalCase constructors as type, matching hljs-title', async () => {
        const tokens = tokenizeSource('class TimeoutError extends Error {}\n', 'javascript');
        expect(tokens.find((t) => t.value === 'TimeoutError')?.type).toBe('type');
        expect(tokens.find((t) => t.value === 'Error')?.type).toBe('type');
    });

    it('tags JS SCREAMING_SNAKE constants as var, matching hljs-variable', async () => {
        const tokens = tokenizeSource('const DEFAULTS = 1;\n', 'javascript');
        const defaults = tokens.find((t) => t.value === 'DEFAULTS');
        expect(defaults?.type).toBe('var');
    });

    it('leaves JS numbers as num', async () => {
        const tokens = tokenizeSource('const n = 5000;\n', 'javascript');
        const num = tokens.find((t) => t.value === '5000');
        expect(num?.type).toBe('num');
    });

    it('retags JS null as bool, matching hljs-literal', async () => {
        const tokens = tokenizeSource('const x = null;\n', 'javascript');
        const nil = tokens.find((t) => t.value === 'null');
        expect(nil?.type).toBe('bool');
    });

    it('retags JSON null as kwd, matching hljs-keyword', async () => {
        const tokens = tokenizeSource('{ "a": null }\n', 'json');
        const nil = tokens.find((t) => t.value === 'null');
        expect(nil?.type).toBe('kwd');
    });

    it('does not retag JSON numbers', async () => {
        const tokens = tokenizeSource('{ "a": 42 }\n', 'json');
        const num = tokens.find((t) => t.value === '42');
        expect(num?.type).toBe('num');
    });
});
