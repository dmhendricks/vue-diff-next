/**
 * Public type surface. Mirrors vue-diff@1.2.4's types (src/types.ts) so that
 * consumers migrating from the original need no type changes.
 */

/** Rendering mode. Split shows prev/current side by side; unified interleaves them. */
export type Mode = 'split' | 'unified';

/**
 * Theme name. `dark` and `light` ship styles; any `custom*` value is an escape
 * hatch — it lands on the wrapper as `vue-diff-theme-<value>` and ships no CSS,
 * so the consumer supplies it. Matches the original's typing exactly.
 */
export type Theme = 'dark' | 'light' | `custom${string}`;

/** Which side of a split view a line belongs to. */
export type Role = 'prev' | 'current' | 'unified';

/** Per-line change classification. `disabled` marks a folded-region placeholder. */
export type DiffType = 'added' | 'removed' | 'equal' | 'disabled';

/** One rendered line of a diff. */
export interface Line {
    type?: DiffType;
    /** 1-based line number, or undefined where the original omits it. */
    lineNum?: number;
    value?: string;
    /** Whether this line should be word-diffed against its counterpart. */
    chkWords?: boolean;
    [key: string]: unknown;
}

export type Lines = Line[];

/**
 * Per-line render metadata, kept in an array parallel to the line data.
 *
 * The renderer always iterates a list filtered from this — never the raw diff
 * array — which is what lets folding (phase 1) and virtual scroll (phase 2)
 * both work by flipping flags rather than rewriting the render path.
 */
export interface Meta {
    index: number;
    foldable: boolean;
    visible: boolean;
    /** Set by virtual scroll (phase 2) once heights are measured. */
    top?: number;
    height?: number;
}

/** Virtual scroll tuning. Defaults match the original when enabled with `true`. */
export interface VirtualScroll {
    height: number;
    lineMinHeight: number;
    delay: number;
}

/** Options accepted by the Vue plugin install. */
export interface PluginOptions {
    /** Component name to register globally. Defaults to `Diff`. */
    componentName?: string;
}
