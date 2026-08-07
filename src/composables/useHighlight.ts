import { ref, watch } from 'vue';
import { escapeHtml } from '../core/escape';
import { diffWords } from '../core/diff/words';
import { composeSpans, spansToHtml } from '../core/highlight/compose';
import { tokenizeSource } from '../core/highlight/tokenize';

export interface HighlightSource {
    /** The line's text. */
    value: string;
    language: unknown;
    /** Counterpart text to word-diff against, when this line was modified. */
    counterpart?: string;
    /** Whether to word-diff at all (the row's `chkWords`). */
    words: boolean;
}

/**
 * Produce highlighted HTML for one line.
 *
 * Highlighting is asynchronous because the tokenizer resolves grammars lazily,
 * so this renders **escaped plain text immediately** and upgrades to highlighted
 * markup when tokenizing resolves. The original was synchronous internally but
 * rendered the same way in practice — its `Code.vue` starts from `ref('')` and
 * fills it from a watcher inside `onMounted`, so it also paints unhighlighted
 * first. The visible behaviour matches; ours is one microtask later.
 *
 * Escaping the interim value matters as much as escaping the final one: both
 * reach the DOM through `v-html`.
 */
export function useHighlight(source: () => HighlightSource) {
    const html = ref('');

    // Declared before the watcher: `immediate: true` runs it synchronously.
    let generation = 0;

    watch(
        source,
        (current) => {
            const { value, language, counterpart, words } = current;

            // Invalidate any in-flight tokenize, including when the line clears.
            // Without bumping here, a slow tokenize for the previous value can
            // still resolve and write highlighted HTML into an empty cell.
            const token = ++generation;

            if (value === '') {
                html.value = '';
                return;
            }

            // Paint escaped text now so there is never a blank frame.
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
