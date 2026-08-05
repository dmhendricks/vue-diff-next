/**
 * HTML escaping — the XSS boundary for this library.
 *
 * A diff viewer renders arbitrary untrusted text as HTML. Every path where input
 * text becomes markup MUST route through here first. This module is deliberately
 * tiny and dependency-free so it can be audited at a glance.
 *
 * Do not "optimise" this by skipping the escape when input looks safe: the whole
 * point is that the check is unconditional.
 */

/**
 * Characters that must be escaped, in replacement order.
 *
 * `&` is first and non-negotiable — escaping it after the others would
 * double-escape the ampersands they introduce (`&lt;` -> `&amp;lt;`).
 */
const ESCAPE_MAP: ReadonlyArray<readonly [RegExp, string]> = [
    [/&/g, '&amp;'],
    [/</g, '&lt;'],
    [/>/g, '&gt;'],
    [/"/g, '&quot;'],
    [/'/g, '&#39;'],
];

/**
 * Escape HTML-significant characters in `value`.
 *
 * Non-string input (including `null`/`undefined`) yields `''` rather than
 * throwing — the component tolerates null-ish `prev`/`current` props.
 */
export function escapeHtml(value: unknown): string {
    if (value === null || value === undefined) return '';

    let out = typeof value === 'string' ? value : String(value);
    for (const [pattern, replacement] of ESCAPE_MAP) {
        out = out.replace(pattern, replacement);
    }
    return out;
}
