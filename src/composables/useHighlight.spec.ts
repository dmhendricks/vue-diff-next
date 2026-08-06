import { describe, it, expect, vi, beforeEach } from 'vitest';
import { effectScope, nextTick, reactive } from 'vue';
import type { Token } from '../core/highlight/tokenize';

const { tokenizeSource } = vi.hoisted(() => ({
    tokenizeSource: vi.fn<(source: string, language: unknown) => Promise<Token[]>>(),
}));

vi.mock('../core/highlight/tokenize', () => ({ tokenizeSource }));

import { useHighlight } from './useHighlight';
import type { HighlightSource } from './useHighlight';

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => {
        resolve = r;
    });
    return { promise, resolve };
}

describe('useHighlight', () => {
    beforeEach(() => {
        tokenizeSource.mockReset();
    });

    it('does not apply a stale tokenize after the line clears to empty', async () => {
        const pending = deferred<Token[]>();
        tokenizeSource.mockReturnValueOnce(pending.promise);

        const source = reactive<HighlightSource>({
            value: 'const x = 1;',
            language: 'js',
            words: false,
        });

        const scope = effectScope();
        const { html } = scope.run(() => useHighlight(() => ({ ...source })))!;

        await nextTick();
        expect(html.value).toBe('const x = 1;');
        expect(tokenizeSource).toHaveBeenCalledTimes(1);

        source.value = '';
        await nextTick();
        expect(html.value).toBe('');

        pending.resolve([{ value: 'const x = 1;', type: 'kwd' }]);
        await pending.promise;
        await nextTick();

        expect(html.value).toBe('');

        scope.stop();
    });

    it('upgrades escaped plaintext once tokenize resolves', async () => {
        tokenizeSource.mockResolvedValueOnce([{ value: 'hi', type: 'kwd' }]);

        const scope = effectScope();
        const { html } = scope.run(() =>
            useHighlight(() => ({
                value: 'hi',
                language: 'js',
                words: false,
            })),
        )!;

        await Promise.resolve();
        await nextTick();
        expect(html.value).toBe('<span class="shj-syn-kwd">hi</span>');

        scope.stop();
    });
});
