/**
 * SCSS as CSS plus line comments and `$variables`.
 *
 * Own rules come first so `//` is not left unclassified and `$primary` is
 * tagged `var` rather than falling through CSS's property/selector patterns.
 * Interpolation (`#{$name}`) and mixins stay CSS-ish; this is not a full Sass
 * grammar.
 */
import { css } from '@speed-highlight/core/languages';
import type { ShjGrammar, ShjLanguageData } from '@speed-highlight/core/tokenize';

export const scss: ShjLanguageData = [
    { match: /\/\/.*/g, type: 'cmnt' },
    { match: /\$[\w-]+\b/g, type: 'var' },
    ...(css as ShjGrammar),
];
