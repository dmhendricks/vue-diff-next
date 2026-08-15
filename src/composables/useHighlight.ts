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

/** Per-line highlight in the same tick as the source change. */
export function useHighlight(source: () => HighlightSource) {
    const html = ref('');

    watch(
        source,
        (current) => {
            const { value, language, counterpart, words } = current;

            if (value === '') {
                html.value = '';
                return;
            }

            try {
                const tokens = tokenizeSource(value, language);
                const segments =
                    words && counterpart !== undefined ? diffWords(counterpart, value) : [];
                html.value = spansToHtml(composeSpans(tokens, segments));
            } catch {
                html.value = escapeHtml(value);
            }
        },
        { immediate: true, deep: true },
    );

    return { html };
}
