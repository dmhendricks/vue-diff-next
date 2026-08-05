import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

// Library build. The demo site has its own config (vite.config.demo.ts).
export default defineConfig({
    plugins: [
        vue(),
        dts({
            // Co-located specs must not emit declarations into dist/.
            exclude: ['**/*.spec.ts', 'tests/**'],
            tsconfigPath: './tsconfig.build.json',
            // Roll every declaration into a single dist/index.d.ts.
            //
            // Per-file declarations emit extensionless relative specifiers
            // (`./components/Diff`, `./types`), which node16 module resolution
            // rejects — it requires explicit `.js` extensions in ESM — so
            // @arethetypeswrong/cli reports an internal resolution error in every
            // environment. Bundling removes internal specifiers altogether.
            // Requires @microsoft/api-extractor (a devDependency); the option is
            // silently a no-op without it, and is named `bundleTypes` here rather
            // than the older `rollupTypes`.
            bundleTypes: true,
            // Emit `Diff` rather than `Diff.vue` in any remaining specifier:
            // consumers have no SFC plugin to resolve a `.vue` import.
            cleanVueFileName: true,
        }),
    ],
    build: {
        target: 'baseline-widely-available',
        lib: {
            entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
            formats: ['es'],
            fileName: () => 'index.js',
        },
        rollupOptions: {
            // Never bundle Vue into a component library.
            external: ['vue'],
            output: {
                // The exports map publishes ./style.css, so the emitted CSS must
                // use that exact name rather than Vite's package-name default.
                assetFileNames: (assetInfo) =>
                    assetInfo.names?.some((n) => n.endsWith('.css'))
                        ? 'style.css'
                        : '[name][extname]',
            },
        },
    },
});
