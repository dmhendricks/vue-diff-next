#!/usr/bin/env node
/**
 * Compile opt-in palettes to dist/themes/*.css.
 *
 * These must not be imported from src/index.ts — Vite would fold them into
 * style.css. Each file is only the theme's custom-property block (no layout).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'sass-embedded';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'dist', 'themes');
const THEMES = [
    'visual-studio-light',
    'visual-studio-dark',
    'monokai-dark',
    'atom-dark',
    'atom-light',
];

mkdirSync(OUT_DIR, { recursive: true });

for (const name of THEMES) {
    const input = join(ROOT, 'src', 'assets', 'scss', 'themes', `${name}.scss`);
    const result = compile(input, { style: 'compressed' });
    const dest = join(OUT_DIR, `${name}.css`);
    writeFileSync(dest, result.css);
    console.log(`  wrote dist/themes/${name}.css`);
}
