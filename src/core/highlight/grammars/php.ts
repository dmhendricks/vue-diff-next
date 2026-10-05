/**
 * PHP grammar from speed-highlight/core PR #86 (lvolland, `9073dae`).
 *
 * CC0. Drop this file when @speed-highlight/core ships `php`. Nested `sub: 'html'`
 * and `sub: 'todo'` resolve through our `GRAMMAR_DATA` map. `#(?!\\[)` keeps
 * `#[Attribute]` out of the `#` comment branch.
 *
 * @see https://github.com/speed-highlight/core/pull/86
 */
import { html } from '@speed-highlight/core/languages';
import type { ShjLanguageData, ShjRule } from '@speed-highlight/core/tokenize';

type Rule = Extract<ShjRule, { match: unknown }>;

/** `<?php … ?>` / `<?= … ?>` inside markup, or to the end of the line. */
const phpBlock: Rule = { match: /<\?(?:php\b|=)?[^]*?(?:\?>|$)/g, sub: 'php' };

/** Let PHP blocks into quoted attribute values (`href="/u/<?= $id ?>"`). */
const withPhpInStrings = (rules: Rule[]): Rule[] =>
    rules.map((rule) => {
        if (!Array.isArray(rule.sub)) return rule;
        const sub = rule.sub as Rule[];
        if (rule.type === 'str') return { ...rule, sub: [...sub, phpBlock] };
        return { ...rule, sub: withPhpInStrings(sub) };
    });

/** The html grammar, with PHP blocks first so they win ties at `<?`. */
const markup: Rule[] = [phpBlock, ...withPhpInStrings(html as Rule[])];

export const php: ShjLanguageData = [
    // A line that starts with a tag (`<div`, `</ul>`, `<!DOCTYPE`, `<!--`) is
    // markup. Diff rows are highlighted one line at a time, so line shape is
    // the only signal; `$a < $b` and `"<?php"` mid-line stay PHP.
    {
        match: /^[ \t]*<[A-Za-z!/][^\n]*/gm,
        sub: markup,
    },
    // HTML only after `?>`, not from start-of-string. We tokenize one diff line
    // at a time, so a `^…<?` HTML region would swallow every line that does not
    // itself contain `<?php`.
    {
        match: /\?>[^]*?(?=<\?|$)/g,
        sub: [
            {
                type: 'kwd',
                match: /^\?>/g,
            },
            {
                match: /[^]+/g,
                sub: 'html',
            },
        ],
    },
    {
        type: 'kwd',
        match: /<\?(php|=)?/g,
    },
    {
        match: /(\/\/|#(?!\[))((?!\?>).)*\n?|\/\*((?!\*\/)[^])*(\*\/)?/g,
        sub: 'todo',
    },
    {
        type: 'str',
        match: /<<<(["']?)(\w+)\1[^]*?\n\s*\2\b/g,
    },
    // Double-quoted strings interpolate. Match them before expand:str so
    // `{$user?->id}` and `$id` can be tagged `var` while the rest stays `str`.
    // Single quotes still use expand:str (no interpolation).
    {
        match: /"((?!")[^\r\n\\]|\\[^])*"?/g,
        type: 'str',
        sub: [
            { match: /\{\$[^}]+\}/g, type: 'var' },
            { match: /\$[a-zA-Z_]\w*/g, type: 'var' },
        ],
    },
    {
        expand: 'str',
    },
    {
        expand: 'num',
    },
    {
        type: 'var',
        match: /\$+\w+/g,
    },
    {
        type: 'kwd',
        match: /\b(abstract|and|array|as|break|callable|case|catch|class|clone|const|continue|declare|default|die|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|enum|exit|extends|final|finally|fn|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|match|namespace|new|or|parent|print|private|protected|public|readonly|require|require_once|return|static|switch|throw|trait|try|unset|use|var|while|xor|yield)\b/g,
    },
    {
        type: 'bool',
        match: /\b(true|false|null)\b/g,
    },
    {
        type: 'type',
        match: /\b(bool|float|int|iterable|mixed|never|object|self|string|void)\b/g,
    },
    {
        type: 'class',
        match: /\b[A-Z][\w_]*\b/g,
    },
    {
        type: 'func',
        match: /[a-zA-Z_]\w*(?=\s*\()/g,
    },
    {
        type: 'oper',
        match: /[/*+:?&|%^~=!,<>.@\\-]+/g,
    },
];
