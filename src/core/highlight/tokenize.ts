import { tokenize as shTokenize } from '@speed-highlight/core';
import { resolveLanguage } from './languages';
import type { Grammar } from './languages';

/**
 * speed-highlight's own `ShjLanguage` union omits `js_template_literals`, even
 * though the grammar ships and works (verified at runtime). Casting at this one
 * boundary keeps `Grammar` honest about what is actually bundled.
 */
type ShjLanguageArg = Parameters<typeof shTokenize>[1];
const asShjLanguage = (grammar: Grammar) => grammar as unknown as ShjLanguageArg;

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
 * Async because @speed-highlight/core resolves grammars lazily. It is fast
 * (~8ms for 200 lines of HTML) and does no I/O — grammars are bundled — but the
 * promise is real, so callers must render unhighlighted text first and upgrade
 * when this resolves. Unknown languages fall back to plain text.
 *
 * **Invariant: the concatenated token values equal `source` byte for byte.**
 * Everything downstream (word-diff composition, escaping, line splitting)
 * depends on it, so it is asserted directly in the specs.
 */
export async function tokenizeSource(source: string, language: unknown): Promise<Token[]> {
    if (source === '') return [];

    const grammar = resolveLanguage(language);
    const tokens: Token[] = [];

    await shTokenize(source, asShjLanguage(grammar), (value: string, type?: string) => {
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
    });

    return tokens;
}

/** True when `tokens` reproduce `source` exactly. Used by the invariant tests. */
export function isLossless(tokens: Token[], source: string): boolean {
    let total = 0;
    for (const token of tokens) total += token.value.length;
    if (total !== source.length) return false;

    return tokens.map((t) => t.value).join('') === source;
}
