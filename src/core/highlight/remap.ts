import type { Grammar } from './languages';
import type { Token } from './tokenize';

const JS_LITERAL = /^(NaN|null|undefined)$/;
const JS_CONSTANT = /^[A-Z][A-Z_]*$/;

/**
 * speed-highlight's token buckets do not line up with highlight.js, which is
 * what vue-diff's classic palettes were written against.
 *
 * The same SH class means different things per language (`var` is an HTML tag
 * name and a JSON key), and some SH rules emit no class at all (JS object
 * keys). Remap here so classic CSS — and the default themes — can colour the
 * roles hljs used, without forking the grammars.
 *
 * Concatenated `value`s are left untouched.
 */
export function remapHighlightTokens(tokens: Token[], grammar: Grammar): Token[] {
    if (grammar === 'json') {
        return tokens.map((token) =>
            token.type === 'num' && token.value === 'null' ? { ...token, type: 'kwd' } : token,
        );
    }

    if (grammar !== 'js' && grammar !== 'ts') return tokens;

    const remapped = tokens.map((token) => {
        if (token.type === 'num') {
            if (JS_LITERAL.test(token.value)) return { ...token, type: 'bool' };
            if (JS_CONSTANT.test(token.value)) return { ...token, type: 'var' };
        }
        // PascalCase constructors (`TimeoutError`) are SH `class`, the same
        // bucket we later use for object keys / HTML attrs (`#f00`). hljs
        // painted titles `#a31515` — retag as `type` so classic-light can.
        if (token.type === 'class' && /^[A-Z]/.test(token.value)) {
            return { ...token, type: 'type' };
        }
        return token;
    });

    return markJsPropertyKeys(remapped);
}

/**
 * The JS grammar matches `retries:` and `"foo":` but does not assign a type, so
 * keys render as foreground. hljs tagged them `.hljs-attr`. Reuse `class`, the
 * same bucket HTML attribute names already occupy.
 */
function markJsPropertyKeys(tokens: Token[]): Token[] {
    const result: Token[] = [];

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]!;
        if (token.type !== null) {
            result.push({ ...token });
            continue;
        }

        let j = i + 1;
        while (j < tokens.length && tokens[j]!.type === null && /^\s+$/.test(tokens[j]!.value)) {
            j += 1;
        }
        const next = tokens[j];
        const followedByColon = next?.type === 'oper' && next.value.startsWith(':');

        if (!followedByColon) {
            result.push({ ...token });
            continue;
        }

        // Adjacent unclassified runs are merged (`{ retries`), so the key may
        // sit at the end of a larger null token rather than in its own span.
        const ident = /^(.*?)([A-Za-z_$][\w$]*)$/s.exec(token.value);
        const quoted = /^(.*?)((['"])(?:\\.|.)*?\3)$/s.exec(token.value);
        const split = ident ?? quoted;

        if (!split?.[2]) {
            result.push({ ...token });
            continue;
        }

        if (split[1]) result.push({ value: split[1], type: null });
        result.push({ value: split[2], type: 'class' });
    }

    return result;
}
