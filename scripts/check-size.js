#!/usr/bin/env node
/**
 * Size budget gate.
 *
 * The central claim of this library is that it ships meaningfully smaller than
 * the retired vue-diff (~75.6 kB gzip for 7 languages: its own 29.8 kB bundle
 * plus the 44.5 kB highlight.js core and grammars it depends on at runtime).
 * An estimate nobody checks drifts, so CI fails when the budget is exceeded.
 *
 * Measures gzip of the default dist JS + CSS (`index.js` + `style.css`). Vue is
 * external and not counted; @speed-highlight/core IS bundled, so it counts once
 * imported. Opt-in palettes under `dist/themes/` are listed but not budgeted —
 * consumers who never import them do not pay for them.
 */
import { gzipSync } from 'node:zlib';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Total gzip budget in bytes for the default sheet (under the original's ~75 kB). */
const BUDGET_BYTES = 23 * 1024;
const OPT_IN_THEMES = ['classic-light.css', 'classic-dark.css'];

const DIST = new URL('../dist/', import.meta.url).pathname;

function walk(dir) {
    return readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry);
        return statSync(full).isDirectory() ? walk(full) : [full];
    });
}

function posixName(file) {
    return file.slice(DIST.length).replaceAll('\\', '/');
}

function isOptInTheme(file) {
    return posixName(file).startsWith('themes/');
}

let files;
try {
    files = walk(DIST).filter((f) => /\.(js|css)$/.test(f));
} catch {
    console.error('✗ No dist/ directory. Run `npm run build` first.');
    process.exit(1);
}

if (files.length === 0) {
    console.error('✗ No .js or .css files in dist/. Did the build succeed?');
    process.exit(1);
}

const styleCss = files.find((f) => posixName(f) === 'style.css');
if (!styleCss) {
    console.error('✗ dist/style.css is missing.');
    process.exit(1);
}
if (readFileSync(styleCss, 'utf8').includes('vue-diff-theme-classic')) {
    console.error(
        '✗ dist/style.css contains classic theme rules. Extra palettes must be compiled to dist/themes/ only.',
    );
    process.exit(1);
}

const missingThemes = OPT_IN_THEMES.filter(
    (name) => !files.some((f) => posixName(f) === `themes/${name}`),
);
if (missingThemes.length > 0) {
    console.error(`✗ Missing opt-in theme CSS: ${missingThemes.join(', ')}. Run the full build.`);
    process.exit(1);
}

const kb = (n) => `${(n / 1024).toFixed(2)} kB`;
const row = (file) => ({
    name: posixName(file),
    gzipped: gzipSync(readFileSync(file), { level: 9 }).length,
});

const defaultRows = files.filter((f) => !isOptInTheme(f)).map(row);
const extraRows = files.filter(isOptInTheme).map(row);
defaultRows.sort((a, b) => b.gzipped - a.gzipped);
extraRows.sort((a, b) => b.gzipped - a.gzipped);

let total = 0;
for (const { name, gzipped } of defaultRows) {
    total += gzipped;
    console.log(`  ${name.padEnd(32)} ${kb(gzipped).padStart(10)}`);
}

const pct = ((total / BUDGET_BYTES) * 100).toFixed(0);
console.log(`  ${''.padEnd(32, '-')} ${''.padStart(10, '-')}`);
console.log(`  ${'total (gzip)'.padEnd(32)} ${kb(total).padStart(10)}`);
console.log(`\n  budget ${kb(BUDGET_BYTES)} — using ${pct}%`);

if (extraRows.length > 0) {
    console.log('\n  opt-in themes (not budgeted)');
    for (const { name, gzipped } of extraRows) {
        console.log(`  ${name.padEnd(32)} ${kb(gzipped).padStart(10)}`);
    }
}

if (total > BUDGET_BYTES) {
    console.error(
        `\n✗ Size budget exceeded by ${kb(total - BUDGET_BYTES)}.\n` +
            '  Either reduce the bundle or raise BUDGET_BYTES in this script deliberately.',
    );
    process.exit(1);
}

console.log('\n✓ Within size budget.');
