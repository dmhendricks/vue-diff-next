import type { App } from 'vue';
import type { PluginOptions } from './types';

export type {
    Mode,
    Theme,
    Role,
    DiffType,
    Line,
    Lines,
    Meta,
    VirtualScroll,
    PluginOptions,
} from './types';

/** Default global component name, matching vue-diff. */
const DEFAULT_COMPONENT_NAME = 'Diff';

/**
 * Vue plugin install. Supports both usage styles the original did:
 *
 *   app.use(VueDiff)                                // registers <Diff>
 *   app.use(VueDiff, { componentName: 'VueDiff' })  // registers <VueDiff>
 *
 * The component can also be imported directly, bypassing the plugin entirely.
 */
export default {
    install(_app: App, options: PluginOptions = {}) {
        const _name = options.componentName ?? DEFAULT_COMPONENT_NAME;
        // Component registration lands here once components/Diff.vue exists.
        void _name;
    },
};
