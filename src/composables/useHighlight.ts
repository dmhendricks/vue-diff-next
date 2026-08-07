import { ref, watch } from 'vue';
import { escapeHtml } from '../core/escape';
import { diffWords } from '../core/diff/words';
import { composeSpans, spansToHtml } from '../core/highlight/compose';
import { tokenizeSource } from '../core/highlight/tokenize';

export interface HighlightSource {
    value: string;
    language: unknown;
    /** Other side of a modified split row, for word-diff. */
    counterpart?: string;
    /** Whether to word-diff (the row's `chkWords`). */
    words: boolean;
}

/** Async per-line highlight: escaped plaintext first, upgraded when tokenize resolves. */
export function useHighlight(source: () => HighlightSource) {
    const html = ref('');
    let generation = 0;

    watch(
        source,
        (current) => {
            const { value, language, counterpart, words } = current;

            // Bump before empty return — stale tokenize must not repaint a cleared cell.
            const token = ++generation;

            if (value === '') {
                html.value = '';
                return;
            }

            html.value = escapeHtml(value);

            void tokenizeSource(value, language)
                .then((tokens) => {
                    if (token !== generation) return;

                    const segments =
                        words && counterpart !== undefined ? diffWords(counterpart, value) : [];

                    html.value = spansToHtml(composeSpans(tokens, segments));
                })
                .catch(() => {
                    if (token !== generation) return;
                    html.value = escapeHtml(value);
                });
        },
        { immediate: true, deep: true },
    );

    return { html };
}
