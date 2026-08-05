import { escapeHtml } from '../escape';
import type { WordSegment } from '../diff/words';
import type { Token } from './tokenize';

/**
 * A leaf span carrying both classifications: what the syntax highlighter called
 * it, and whether the word-diff considers it changed.
 */
export interface ComposedSpan {
    value: string;
    /** Syntax token class, or null for unclassified text. */
    type: string | null;
    /** Inside a word-level change. */
    modified: boolean;
}

/**
 * Merge a syntax token stream with word-diff segments.
 *
 * This is the problem that dictated the choice of highlighter. The two
 * classifications *overlap*: a changed word can start mid-token and end inside
 * the next one, so neither tree nests inside the other. The original library
 * sidestepped it by injecting `<vue-diff-modified>` sentinel strings into the
 * source before highlighting and string-replacing them afterwards — which
 * corrupts output when content contains the sentinel, and depends on the
 * highlighter passing markers through untouched.
 *
 * Here both inputs are treated as spans over the same text and cut at every
 * boundary from either side, producing flat leaf spans. No string injection, so
 * no way for content to impersonate a marker.
 *
 * Both inputs must describe the *same* string. When they disagree (a caller bug,
 * or a highlighter that dropped text) the token stream wins, since it is the one
 * guaranteed lossless — the result still reproduces the source exactly.
 */
export function composeSpans(tokens: Token[], segments: WordSegment[]): ComposedSpan[] {
    if (tokens.length === 0) return [];

    // No word-diff to apply: tokens map straight through.
    if (segments.length === 0) {
        return tokens.map((t) => ({ value: t.value, type: t.type, modified: false }));
    }

    const spans: ComposedSpan[] = [];

    let segmentIndex = 0;
    // How far into the current segment the cursor sits.
    let segmentOffset = 0;

    for (const token of tokens) {
        let tokenOffset = 0;

        while (tokenOffset < token.value.length) {
            const segment = segments[segmentIndex];

            // Ran past the end of the word-diff: emit the rest unmodified rather
            // than dropping it. Losslessness outranks highlight fidelity.
            if (segment === undefined) {
                push(spans, token.value.slice(tokenOffset), token.type, false);
                break;
            }

            const tokenLeft = token.value.length - tokenOffset;
            const segmentLeft = segment.value.length - segmentOffset;
            const take = Math.min(tokenLeft, segmentLeft);

            push(
                spans,
                token.value.slice(tokenOffset, tokenOffset + take),
                token.type,
                segment.modified,
            );

            tokenOffset += take;
            segmentOffset += take;

            if (segmentOffset >= segment.value.length) {
                segmentIndex += 1;
                segmentOffset = 0;
            }
        }
    }

    return spans;
}

/** Append text, merging into the previous span when both classifications match. */
function push(spans: ComposedSpan[], value: string, type: string | null, modified: boolean): void {
    if (value === '') return;

    const last = spans[spans.length - 1];
    if (last && last.type === type && last.modified === modified) {
        last.value += value;
        return;
    }

    spans.push({ value, type, modified });
}

/**
 * Render composed spans to HTML.
 *
 * Every span's text is escaped here — this is the only place span text becomes
 * markup, and the last line of defence against XSS from diffed content.
 */
export function spansToHtml(spans: ComposedSpan[]): string {
    let html = '';

    for (const span of spans) {
        const text = escapeHtml(span.value);
        const classes: string[] = [];

        if (span.type) classes.push(`shj-syn-${span.type}`);
        if (span.modified) classes.push('vue-diff-modified');

        html += classes.length === 0 ? text : `<span class="${classes.join(' ')}">${text}</span>`;
    }

    return html;
}
