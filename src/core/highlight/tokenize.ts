import { tokenizeWith } from '@speed-highlight/core/tokenize';
import { GRAMMAR_DATA, resolveLanguage } from './languages';
import { remapHighlightTokens } from './remap';

/**
 * A classified run of source text.
 *
 * `type` is speed-highlight's token class (`kwd`, `str`, `oper`, …) or null for
 * unclassified text. Callers render it as a CSS class.
 */
export interface Token {
    value: string;
    type: string | null;
}

/**
 * Tokenize `source` for syntax highlighting.
 *
 * Synchronous: grammars are bundled and `tokenizeWith` does not load anything.
 * Unknown languages fall back to plain text.
 *
 * **Invariant: the concatenated token values equal `source` byte for byte.**
 * Everything downstream (word-diff composition, escaping, line splitting)
 * depends on it, so it is asserted directly in the specs.
 */
export function tokenizeSource(source: string, language: unknown): Token[] {
    if (source === '') return [];

    const grammar = resolveLanguage(language);
    const tokens: Token[] = [];

    tokenizeWith(
        source,
        GRAMMAR_DATA[grammar],
        (value: string, type?: string) => {
            // speed-highlight emits many zero-length tokens; they carry no text and
            // would only produce empty spans.
            if (value === '') return;

            const normalized = type ?? null;
            const last = tokens[tokens.length - 1];

            // Merge runs sharing a class to keep the stream (and the DOM) small.
            if (last && last.type === normalized) {
                last.value += value;
                return;
            }

            tokens.push({ value, type: normalized });
        },
        { languages: GRAMMAR_DATA },
    );

    return mergeAdjacent(remapHighlightTokens(tokens, grammar));
}

/** True when `tokens` reproduce `source` exactly. Used by the invariant tests. */
export function isLossless(tokens: Token[], source: string): boolean {
    let total = 0;
    for (const token of tokens) total += token.value.length;
    if (total !== source.length) return false;

    return tokens.map((t) => t.value).join('') === source;
}

function mergeAdjacent(tokens: Token[]): Token[] {
    const merged: Token[] = [];
    for (const token of tokens) {
        const last = merged[merged.length - 1];
        if (last && last.type === token.type) {
            last.value += token.value;
        } else {
            merged.push({ value: token.value, type: token.type });
        }
    }
    return merged;
}
