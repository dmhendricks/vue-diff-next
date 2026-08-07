import type { App, Plugin } from 'vue';
import Diff from './components/Diff.vue';
import type { PluginOptions } from './types';
import './assets/scss/index.scss';

declare module 'vue' {
    export interface GlobalComponents {
        Diff: typeof Diff;
    }
}

/** Default global component name, matching vue-diff. */
const DEFAULT_COMPONENT_NAME = 'Diff';

/**
 * Vue plugin install, supporting both styles the original did:
 *
 *   app.use(VueDiff)                                // registers <Diff>
 *   app.use(VueDiff, { componentName: 'VueDiff' })  // registers <VueDiff>
 *
 * The component can also be imported directly, bypassing the plugin. Both paths
 * are parity surface — the original's own tests cover both.
 *
 * The default export is the plugin, not the component, matching the original.
 */
const plugin: Plugin = {
    install(app: App, options: PluginOptions = {}) {
        app.component(options.componentName ?? DEFAULT_COMPONENT_NAME, Diff);
    },
};

export default plugin;
export { Diff };

export type {
    Mode,
    Theme,
    Role,
    DiffType,
    Line,
    Lines,
    Meta,
    FoldRange,
    FoldMarker,
    VirtualScroll,
    PluginOptions,
} from './types';
