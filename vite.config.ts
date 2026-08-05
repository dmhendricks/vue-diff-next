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
                assetFileNames: (assetInfo) =>
                    assetInfo.names?.includes('style.css') ? 'style.css' : '[name][extname]',
            },
        },
    },
});
