import { describe, expect, it } from 'vitest';
import { parseDemoQuery, QUERY_DEFAULTS, serializeDemoQuery } from './query';

const allow = {
    samples: ['javascript', 'html', 'json'],
    modes: ['split', 'unified'],
    themes: ['dark', 'light', 'coral-dark', 'coral-light'],
};

describe('parseDemoQuery', () => {
    it('treats a missing query as the form defaults', () => {
        expect(parseDemoQuery('', allow)).toEqual(QUERY_DEFAULTS);
        expect(parseDemoQuery('?', allow)).toEqual(QUERY_DEFAULTS);
    });

    it('applies known keys and ignores junk', () => {
        expect(parseDemoQuery('?theme=coral-dark&mode=unified&sample=html&foo=bar', allow)).toEqual(
            {
                ...QUERY_DEFAULTS,
                theme: 'coral-dark',
                mode: 'unified',
                sample: 'html',
            },
        );
    });

    it('falls back when a value is not in the picker', () => {
        expect(parseDemoQuery('?theme=dracula&sample=cobol&mode=side-by-side', allow)).toEqual(
            QUERY_DEFAULTS,
        );
    });

    it('reads folding, wrap, and showLineNumbers as 1/0 or true/false', () => {
        expect(parseDemoQuery('?folding=1&wrap=0&showLineNumbers=0', allow)).toMatchObject({
            folding: true,
            wrap: false,
            showLineNumbers: false,
        });
        expect(
            parseDemoQuery('?folding=true&wrap=false&showLineNumbers=false', allow),
        ).toMatchObject({
            folding: true,
            wrap: false,
            showLineNumbers: false,
        });
    });
});

describe('serializeDemoQuery', () => {
    it('emits nothing for the defaults', () => {
        expect(serializeDemoQuery(QUERY_DEFAULTS)).toBe('');
    });

    it('emits only keys that differ, in a stable order', () => {
        expect(
            serializeDemoQuery({
                sample: 'html',
                mode: 'unified',
                theme: 'coral-light',
                folding: true,
                foldMarker: 'hunk',
                wrap: false,
                showLineNumbers: false,
            }),
        ).toBe(
            '?sample=html&mode=unified&theme=coral-light&folding=1&foldMarker=hunk&wrap=0&showLineNumbers=0',
        );
    });
});
