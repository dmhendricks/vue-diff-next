import type { FoldMarker, Mode, Theme } from '../../src/types';

/** Form defaults. Absent query keys mean these, so a bare URL is a shareable default. */
export const QUERY_DEFAULTS = {
    sample: 'javascript',
    mode: 'split' as Mode,
    theme: 'dark' as Theme,
    folding: false,
    foldMarker: 'dots' as FoldMarker,
    wrap: true,
    showLineNumbers: true,
};

export type DemoQuery = typeof QUERY_DEFAULTS;

export interface QueryAllow {
    samples: readonly string[];
    modes: readonly string[];
    themes: readonly string[];
}

const FOLD_MARKERS: readonly FoldMarker[] = ['dots', 'hunk'];

function pick<T extends string>(value: string | null, allowed: readonly string[], fallback: T): T {
    return value && allowed.includes(value) ? (value as T) : fallback;
}

function bool(value: string | null, fallback: boolean): boolean {
    if (value == null) return fallback;
    const v = value.toLowerCase();
    if (v === '1' || v === 'true' || v === 'yes') return true;
    if (v === '0' || v === 'false' || v === 'no') return false;
    return fallback;
}

/** Read the demo form from a query string. Unknown or invalid keys are ignored. */
export function parseDemoQuery(search: string, allow: QueryAllow): DemoQuery {
    const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    return {
        sample: pick(q.get('sample'), allow.samples, QUERY_DEFAULTS.sample),
        mode: pick(q.get('mode'), allow.modes, QUERY_DEFAULTS.mode),
        theme: pick(q.get('theme'), allow.themes, QUERY_DEFAULTS.theme),
        folding: bool(q.get('folding'), QUERY_DEFAULTS.folding),
        foldMarker: pick(q.get('foldMarker'), FOLD_MARKERS, QUERY_DEFAULTS.foldMarker),
        wrap: bool(q.get('wrap'), QUERY_DEFAULTS.wrap),
        showLineNumbers: bool(q.get('showLineNumbers'), QUERY_DEFAULTS.showLineNumbers),
    };
}

/**
 * Encode only values that differ from the defaults, in a stable order.
 * All-default state is an empty string — no `?` and no empty keys.
 */
export function serializeDemoQuery(state: DemoQuery): string {
    const q = new URLSearchParams();
    if (state.sample !== QUERY_DEFAULTS.sample) q.set('sample', state.sample);
    if (state.mode !== QUERY_DEFAULTS.mode) q.set('mode', state.mode);
    if (state.theme !== QUERY_DEFAULTS.theme) q.set('theme', state.theme);
    if (state.folding !== QUERY_DEFAULTS.folding) q.set('folding', '1');
    if (state.foldMarker !== QUERY_DEFAULTS.foldMarker) q.set('foldMarker', state.foldMarker);
    if (state.wrap !== QUERY_DEFAULTS.wrap) q.set('wrap', '0');
    if (state.showLineNumbers !== QUERY_DEFAULTS.showLineNumbers) q.set('showLineNumbers', '0');
    const encoded = q.toString();
    return encoded ? `?${encoded}` : '';
}

/** Replace the address bar without stacking history entries on every toggle. */
export function syncDemoQuery(state: DemoQuery): void {
    const next = `${location.pathname}${serializeDemoQuery(state)}${location.hash}`;
    const current = `${location.pathname}${location.search}${location.hash}`;
    if (next !== current) history.replaceState(null, '', next);
}
