/**
 * Public type surface. Mirrors vue-diff@1.2.4's types (src/types.ts) so that
 * consumers migrating from the original need no type changes.
 */

/** Rendering mode. Split shows prev/current side by side; unified interleaves them. */
export type Mode = 'split' | 'unified';

/**
 * Theme name. `dark` and `light` ship in the default stylesheet; `monokai-dark`,
 * `visual-studio-light`, and `atom-dark` are first-class names whose CSS is opt-in
 * (`vue-diff-next/themes/monokai-dark.css`). Any `custom*` value is an escape
 * hatch — it lands on the wrapper as `vue-diff-theme-<value>` and ships no CSS,
 * so the consumer supplies it.
 */
export type Theme =
    | 'dark'
    | 'light'
    | 'monokai-dark'
    | 'visual-studio-light'
    | 'atom-dark'
    | `custom${string}`;

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
    /**
     * Other side of a modification, for word-diffing.
     *
     * Split mode supplies this via the sibling cell on the same row. Unified
     * mode stores it here so a one-cell removed/added row can still highlight
     * intra-line changes.
     */
    counterpart?: string;
    [key: string]: unknown;
}

export type Lines = Line[];

/**
 * Per-line render metadata, kept in an array parallel to the line data.
 *
 * The renderer always iterates a list filtered from this — never the raw diff
 * array — which is what lets folding and virtual scroll both work by flipping
 * flags rather than rewriting the render path.
 */
export interface Meta {
    index: number;
    foldable: boolean;
    visible: boolean;
    /**
     * The run of unchanged lines this row stands in for, when folding is on.
     *
     * Only the `hunk` marker style needs it — the `dots` style renders the same
     * regardless of how much was collapsed — but it is computed once here rather
     * than recovered from the DOM.
     */
    fold?: FoldRange;
    /** Set by virtual scroll once heights are measured. */
    top?: number;
    height?: number;
}

/** The extent of a collapsed run, in 1-based line numbers per side. */
export interface FoldRange {
    /** How many rows the run spans, including this marker row. */
    count: number;
    prevStart?: number;
    prevEnd?: number;
    currentStart?: number;
    currentEnd?: number;
}

/**
 * How a collapsed run is marked.
 *
 * - `dots` — a centred `•••••` marker, as the original renders it.
 * - `hunk` — a unified-diff header, `@@ -12,8 +12,8 @@`, which states how much
 *   was skipped instead of only that something was.
 */
export type FoldMarker = 'dots' | 'hunk';

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
