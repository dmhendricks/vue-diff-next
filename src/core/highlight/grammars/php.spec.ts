import { describe, it, expect } from 'vitest';
import { tokenizeSource } from '../tokenize';

describe('php grammar', () => {
    it('tags <?php and <?= as kwd', () => {
        const tokens = tokenizeSource('<?php\necho 1;\n', 'php');
        expect(tokens.find((t) => t.value === '<?php')?.type).toBe('kwd');
    });

    it('tags $variables as var', () => {
        const tokens = tokenizeSource('<?php $title = 1;\n', 'php');
        expect(tokens.find((t) => t.value === '$title')?.type).toBe('var');
    });

    it('tags // comments via todo as cmnt', () => {
        const tokens = tokenizeSource('<?php\n// note\n', 'php');
        expect(tokens.find((t) => t.value.startsWith('//'))?.type).toBe('cmnt');
    });

    it('does not treat #[Attribute] as a # comment', () => {
        const tokens = tokenizeSource('<?php\n#[Deprecated]\nfunction f() {}\n', 'php');
        const attr = tokens.find((t) => t.value.includes('Deprecated'));
        expect(attr?.type).not.toBe('cmnt');
        expect(attr?.type).toBe('class');
    });

    it('tags builtins as type and PascalCase as class', () => {
        const tokens = tokenizeSource('<?php function f(int $id): ?User {}\n', 'php');
        expect(tokens.find((t) => t.value === 'int')?.type).toBe('type');
        expect(tokens.find((t) => t.value === 'User')?.type).toBe('class');
    });

    it('tags true/false/null as bool', () => {
        const tokens = tokenizeSource('<?php return null;\n', 'php');
        expect(tokens.find((t) => t.value === 'null')?.type).toBe('bool');
    });

    it('still tags PHP on a line with no opener (per-line highlighting)', () => {
        const tokens = tokenizeSource('declare(strict_types=1);\n', 'php');
        expect(tokens.find((t) => t.value === 'declare')?.type).toBe('kwd');
    });

    it('tags interpolation inside double-quoted strings as var', () => {
        const tokens = tokenizeSource('<?php echo "User {$user?->id}: ";\n', 'php');
        expect(tokens.find((t) => t.value === '{$user?->id}')?.type).toBe('var');
        expect(tokens.find((t) => t.value.includes('User'))?.type).toBe('str');
    });
});
