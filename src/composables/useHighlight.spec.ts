import { describe, it, expect, vi, beforeEach } from 'vitest';
import { effectScope, nextTick, reactive } from 'vue';
import type { Token } from '../core/highlight/tokenize';

const { tokenizeSource } = vi.hoisted(() => ({
    tokenizeSource: vi.fn<(source: string, language: unknown) => Token[]>(),
}));

vi.mock('../core/highlight/tokenize', () => ({ tokenizeSource }));

import { useHighlight } from './useHighlight';
import type { HighlightSource } from './useHighlight';

describe('useHighlight', () => {
    beforeEach(() => {
        tokenizeSource.mockReset();
        tokenizeSource.mockReturnValue([{ value: 'hi', type: 'kwd' }]);
    });

    it('renders highlighted markup in the same tick', () => {
        const scope = effectScope();
        const { html } = scope.run(() =>
            useHighlight(() => ({
                value: 'hi',
                language: 'js',
                words: false,
            })),
        )!;

        expect(html.value).toBe('<span class="shj-syn-kwd">hi</span>');
        expect(tokenizeSource).toHaveBeenCalledTimes(1);

        scope.stop();
    });

    it('clears when the line becomes empty', async () => {
        const source = reactive<HighlightSource>({
            value: 'hi',
            language: 'js',
            words: false,
        });

        const scope = effectScope();
        const { html } = scope.run(() => useHighlight(() => ({ ...source })))!;
        expect(html.value).toBe('<span class="shj-syn-kwd">hi</span>');

        source.value = '';
        await nextTick();
        expect(html.value).toBe('');
        expect(tokenizeSource).toHaveBeenCalledTimes(1);

        scope.stop();
    });

    it('falls back to escaped plaintext when tokenize throws', () => {
        tokenizeSource.mockImplementationOnce(() => {
            throw new Error('tokenizer failed');
        });

        const scope = effectScope();
        const { html } = scope.run(() =>
            useHighlight(() => ({
                value: '<bad>',
                language: 'js',
                words: false,
            })),
        )!;

        expect(html.value).toBe('&lt;bad&gt;');

        scope.stop();
    });
});
