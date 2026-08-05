import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Demo site build. The library itself has its own config (vite.config.ts).
//
// The demo imports from `src/` rather than the built `dist/`, so `npm run dev`
// hot-reloads library changes without a rebuild step.
export default defineConfig({
    // GitHub project Pages serve from a subpath, so a root-relative base would
    // 404 every asset. Overridable for a root-domain or local preview deploy.
    base: process.env.DEMO_BASE ?? '/vue-diff-next/',
    root: fileURLToPath(new URL('./demo', import.meta.url)),
    plugins: [vue()],
    build: {
        // Relative to `root`, hence the climb out of demo/.
        outDir: fileURLToPath(new URL('./dist-demo', import.meta.url)),
        emptyOutDir: true,
    },
    server: {
        // 5173 is Vite's default and often already taken; a distinct port keeps
        // this from silently landing somewhere unexpected.
        port: 5190,
        open: true,
    },
});
