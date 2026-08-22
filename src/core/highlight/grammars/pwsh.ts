/**
 * PowerShell grammar: `5c647ed` (case-insensitive cmdlets, `$_` / `$?` / `$$`,
 * `-eq` family, no lookbehind) plus PR #86 (`$()`, backtick in strings, type
 * `[]` / `()`). Verb-Noun is `class` and `-Path` is `kwd` — `func` / `oper` are
 * near-foreground in visual-studio-dark.
 *
 * CC0. Drop this file when @speed-highlight/core ships `pwsh`/`ps1`.
 *
 * @see https://github.com/dmhendricks/speed-highlight/commit/5c647ed70d126bcac3d5b349d1c540375db32da4
 * @see https://github.com/speed-highlight/core/pull/86
 */
import type { ShjLanguageData, ShjRule } from '@speed-highlight/core/tokenize';

const variable: ShjRule = {
    type: 'var',
    match: /\$(\([^)]*\)|\{[^}]*\}|\$|\?|_|\w+(:\w+)?)/g,
};

export const pwsh: ShjLanguageData = [
    {
        match: /<#((?!#>)[^])*(#>)?/g,
        sub: 'todo',
    },
    {
        match: /#.*/g,
        sub: 'todo',
    },
    {
        type: 'str',
        match: /@(["'])\n((?!\1@)[^])*\n\s*\1@/g,
        sub: [variable],
    },
    {
        type: 'str',
        match: /"(`[^]|[^"\r\n`]|"")*"?/g,
        sub: [{ type: 'oper', match: /`[^]/g }, variable],
    },
    {
        type: 'str',
        match: /'(''|[^'\r\n])*'?/g,
    },
    {
        type: 'class',
        match: /\b[A-Za-z]+-[A-Za-z]+\b/g,
    },
    {
        type: 'type',
        match: /\[[a-zA-Z_][\w.]*(\[\]|\([^)]*\))?\]/g,
    },
    {
        type: 'kwd',
        match: /\b(begin|break|catch|class|continue|data|define|do|dynamicparam|else|elseif|end|enum|exit|filter|finally|for|foreach|from|function|hidden|if|in|param|process|return|static|switch|throw|trap|try|until|using|var|while)\b/gi,
    },
    {
        type: 'kwd',
        match: /-(eq|ne|gt|ge|lt|le|like|notlike|match|notmatch|contains|notcontains|in|notin|replace|and|or|xor|not|band|bor|bxor|bnot|is|isnot|as|f|join)\b/gi,
    },
    {
        type: 'kwd',
        match: /-[A-Za-z][A-Za-z0-9]*\b(?=\s|$)/g,
    },
    {
        type: 'bool',
        match: /\$(true|false|null)\b/gi,
    },
    {
        expand: 'num',
    },
    {
        type: 'class',
        match: /[a-zA-Z_]\w*(?=\s*\()/g,
    },
    {
        type: 'oper',
        match: /[|;=(){}<>!+\-*/%]+/g,
    },
    variable,
];
