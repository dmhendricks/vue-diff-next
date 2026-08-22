import { describe, it, expect } from 'vitest';
import { tokenizeSource } from '../tokenize';

describe('pwsh grammar', () => {
    it('tags # comments as cmnt', () => {
        const tokens = tokenizeSource('# note\nGet-Item\n', 'pwsh');
        expect(tokens.find((t) => t.value.startsWith('#'))?.type).toBe('cmnt');
    });

    it('tags Verb-Noun cmdlets as class', () => {
        const tokens = tokenizeSource('Get-ChildItem -Path .\n', 'pwsh');
        expect(tokens.find((t) => t.value === 'Get-ChildItem')?.type).toBe('class');
    });

    it('tags $variables as var', () => {
        const tokens = tokenizeSource('$name = "hi"\n', 'pwsh');
        expect(tokens.find((t) => t.value === '$name')?.type).toBe('var');
    });

    it('tags $true as bool, not var', () => {
        const tokens = tokenizeSource('if ($true) {}\n', 'pwsh');
        expect(tokens.find((t) => t.value === '$true')?.type).toBe('bool');
    });

    it('tags -eq as kwd', () => {
        const tokens = tokenizeSource('if ($a -eq 1) {}\n', 'pwsh');
        expect(tokens.find((t) => t.value === '-eq')?.type).toBe('kwd');
    });

    it('tags [string] as type', () => {
        const tokens = tokenizeSource('[string]$name = "x"\n', 'pwsh');
        expect(tokens.find((t) => t.value === '[string]')?.type).toBe('type');
    });

    it('tags interpolation inside double-quoted strings as var', () => {
        const tokens = tokenizeSource('Write-Host "Hello $name"\n', 'pwsh');
        expect(tokens.find((t) => t.value === '$name')?.type).toBe('var');
        expect(tokens.find((t) => t.value.includes('Hello'))?.type).toBe('str');
    });

    it('tags ForEach-Object as a cmdlet, not the foreach keyword', () => {
        const tokens = tokenizeSource('Get-Item | ForEach-Object { $_ }\n', 'pwsh');
        expect(tokens.find((t) => t.value === 'ForEach-Object')?.type).toBe('class');
    });

    it('tags -Path as kwd', () => {
        const tokens = tokenizeSource('Get-ChildItem -Path .\n', 'pwsh');
        expect(tokens.find((t) => t.value === '-Path')?.type).toBe('kwd');
    });

    it('tags $() subexpressions as var', () => {
        const tokens = tokenizeSource('Write-Host "User $($_.Name)"\n', 'pwsh');
        expect(tokens.find((t) => t.value.startsWith('$('))?.type).toBe('var');
    });
});
