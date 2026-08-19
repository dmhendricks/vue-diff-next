import { describe, it, expect } from 'vitest';
import { tokenizeSource } from '../tokenize';

describe('scss grammar', () => {
    it('tags // comments as cmnt', () => {
        const tokens = tokenizeSource('// note\n.a { color: red; }\n', 'scss');
        expect(tokens.find((t) => t.value.startsWith('//'))?.type).toBe('cmnt');
    });

    it('tags $variables as var', () => {
        const tokens = tokenizeSource('$primary: #007bff;\n', 'scss');
        expect(tokens.find((t) => t.value === '$primary')?.type).toBe('var');
    });

    it('still tags CSS block comments', () => {
        const tokens = tokenizeSource('/* hover */\n.a {}\n', 'scss');
        expect(tokens.find((t) => t.value.includes('hover'))?.type).toBe('cmnt');
    });

    it('tags #{$interpolation} as type, not a hex color', () => {
        const tokens = tokenizeSource('.btn-#{$name} {}\n', 'scss');
        expect(tokens.find((t) => t.value === '#{$name}')?.type).toBe('type');
    });

    it('tags !default as kwd', () => {
        const tokens = tokenizeSource('$primary: #007bff !default;\n', 'scss');
        expect(tokens.find((t) => t.value === '!default')?.type).toBe('kwd');
    });
});
