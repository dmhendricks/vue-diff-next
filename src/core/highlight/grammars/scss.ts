/**
 * SCSS as CSS plus line comments, `$variables`, `#{$interpolation}`, and
 * `!default` / `!global` / `!optional`.
 *
 * Own rules come first so `//` is not left unclassified, `$primary` is tagged
 * `var` rather than falling through CSS's property/selector patterns, and
 * `#{$name}` is not eaten by CSS's hex-color rule. Mixins, maps, and `@use`
 * still ride CSS's `@rule` / function patterns; this is not a full Sass grammar.
 */
import { css } from '@speed-highlight/core/languages';
import type { ShjGrammar, ShjLanguageData } from '@speed-highlight/core/tokenize';

export const scss: ShjLanguageData = [
    { match: /\/\/.*/g, type: 'cmnt' },
    { match: /#\{\$[\w-]+\}/g, type: 'type' },
    { match: /\$[\w-]+\b/g, type: 'var' },
    { match: /!(default|global|optional)\b/g, type: 'kwd' },
    ...(css as ShjGrammar),
];
