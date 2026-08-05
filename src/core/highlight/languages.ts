/**
 * Language names and the alias map that keeps vue-diff's API working.
 *
 * The original registered highlight.js grammars, so its `language` prop takes
 * highlight.js names — `javascript`, `plaintext`, `markdown`. speed-highlight
 * uses shorter ones — `js`, `plain`, `md`. Since `language` is public API and
 * `plaintext` is its default value, renaming would break every existing
 * consumer, so both spellings resolve here.
 */

/** Grammars bundled by @speed-highlight/core@1.2.23. */
export const GRAMMARS = [
    'asm',
    'bash',
    'bf',
    'c',
    'css',
    'csv',
    'diff',
    'docker',
    'git',
    'go',
    'html',
    'http',
    'ini',
    'java',
    'js',
    'js_template_literals',
    'jsdoc',
    'json',
    'leanpub-md',
    'log',
    'lua',
    'make',
    'md',
    'pl',
    'plain',
    'py',
    'regex',
    'rs',
    'sql',
    'todo',
    'toml',
    'ts',
    'uri',
    'xml',
    'yaml',
] as const;

export type Grammar = (typeof GRAMMARS)[number];

/** Fallback when a language is unknown: plain text, never an error. */
export const FALLBACK: Grammar = 'plain';

const GRAMMAR_SET: ReadonlySet<string> = new Set(GRAMMARS);

/**
 * Alternative spellings → bundled grammar.
 *
 * Covers highlight.js names (for vue-diff parity), common file extensions, and
 * languages with no grammar of their own that a related one renders acceptably.
 * `scss`/`less` map to `css`: verified lossless, with only cosmetic differences
 * (`//` comments and `$vars` are not specially tagged).
 */
const ALIASES: Readonly<Record<string, Grammar>> = {
    // highlight.js names used by vue-diff
    javascript: 'js',
    typescript: 'ts',
    plaintext: 'plain',
    text: 'plain',
    markdown: 'md',
    python: 'py',
    rust: 'rs',
    shell: 'bash',
    perl: 'pl',
    dockerfile: 'docker',
    makefile: 'make',
    assembly: 'asm',
    brainfuck: 'bf',

    // CSS supersets: no dedicated grammar, css degrades cleanly
    scss: 'css',
    sass: 'css',
    less: 'css',

    // markup
    htm: 'html',
    vue: 'html',
    svg: 'xml',

    // extensions and common short forms
    jsx: 'js',
    tsx: 'ts',
    mjs: 'js',
    cjs: 'js',
    sh: 'bash',
    zsh: 'bash',
    yml: 'yaml',
    py3: 'py',
    golang: 'go',
    rb: 'plain',
    cpp: 'c',
    'c++': 'c',
    h: 'c',
    cs: 'c',
    conf: 'ini',
    cfg: 'ini',
    patch: 'diff',
    url: 'uri',
};

/**
 * Resolve a user-supplied language name to a bundled grammar.
 *
 * Case-insensitive, tolerates null-ish input, and falls back to plain text for
 * anything unrecognised rather than throwing — a diff view must still render.
 */
export function resolveLanguage(language: unknown): Grammar {
    if (typeof language !== 'string') return FALLBACK;

    const key = language.trim().toLowerCase();
    if (key === '') return FALLBACK;
    if (GRAMMAR_SET.has(key)) return key as Grammar;

    return ALIASES[key] ?? FALLBACK;
}

/** Whether a name resolves to a real grammar rather than the fallback. */
export function isSupportedLanguage(language: unknown): boolean {
    if (typeof language !== 'string') return false;
    const key = language.trim().toLowerCase();
    return GRAMMAR_SET.has(key) || key in ALIASES;
}
