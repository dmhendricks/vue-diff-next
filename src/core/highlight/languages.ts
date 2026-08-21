/**
 * Language names and the alias map that keeps vue-diff's API working.
 *
 * The original registered highlight.js grammars, so its `language` prop takes
 * highlight.js names — `javascript`, `plaintext`, `markdown`. speed-highlight
 * uses shorter ones — `js`, `plain`, `md`. Since `language` is public API and
 * `plaintext` is its default value, renaming would break every existing
 * consumer, so both spellings resolve here.
 */

import * as sh from '@speed-highlight/core/languages';
import type { ShjLanguageData } from '@speed-highlight/core/tokenize';
import { php } from './grammars/php';
import { scss } from './grammars/scss';

/** Upstream grammar types are narrower than `ShjLanguageData`; the runtime objects match. */
const data = (grammar: unknown): ShjLanguageData => grammar as ShjLanguageData;

/**
 * Bundled grammars, keyed by the public `language` name.
 *
 * The barrel exports `leanpubMd`; the name consumers pass is still `leanpub-md`.
 * Nested `sub` rules look up these same keys (`css`, `js`, `todo`, …).
 */
export const GRAMMAR_DATA = {
    asm: data(sh.asm),
    bash: data(sh.bash),
    bf: data(sh.bf),
    c: data(sh.c),
    css: data(sh.css),
    csv: data(sh.csv),
    diff: data(sh.diff),
    docker: data(sh.docker),
    git: data(sh.git),
    go: data(sh.go),
    html: data(sh.html),
    http: data(sh.http),
    ini: data(sh.ini),
    java: data(sh.java),
    js: data(sh.js),
    jsdoc: data(sh.jsdoc),
    json: data(sh.json),
    'leanpub-md': data(sh.leanpubMd),
    log: data(sh.log),
    lua: data(sh.lua),
    make: data(sh.make),
    md: data(sh.md),
    pl: data(sh.pl),
    php,
    plain: data(sh.plain),
    py: data(sh.py),
    regex: data(sh.regex),
    rs: data(sh.rs),
    scss,
    sql: data(sh.sql),
    todo: data(sh.todo),
    toml: data(sh.toml),
    ts: data(sh.ts),
    uri: data(sh.uri),
    xml: data(sh.xml),
    yaml: data(sh.yaml),
};

export type Grammar = keyof typeof GRAMMAR_DATA;

export const GRAMMARS = Object.keys(GRAMMAR_DATA) as Grammar[];

/** Fallback when a language is unknown: plain text, never an error. */
export const FALLBACK: Grammar = 'plain';

const GRAMMAR_SET: ReadonlySet<string> = new Set(GRAMMARS);

/**
 * Alternative spellings → bundled grammar.
 *
 * Covers highlight.js names (for vue-diff parity), common file extensions, and
 * languages with no grammar of their own that a related one renders acceptably.
 * `sass`/`less` map to `scss` (line comments, `$variables`, interpolation);
 * indented Sass syntax is not a separate grammar.
 *
 * `js_template_literals` was a standalone grammar in @speed-highlight/core 1.x;
 * v2 folded it into `js`.
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

    // removed as a standalone grammar in speed-highlight 2.0
    js_template_literals: 'js',

    // CSS supersets: scss is bundled; sass/less share it
    sass: 'scss',
    less: 'scss',

    phtml: 'php',

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
