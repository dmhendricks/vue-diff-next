#!/usr/bin/env node
/**
 * Size budget gate.
 *
 * The central claim of this library is that it ships meaningfully smaller than
 * the retired vue-diff (~29.8 kB gzip for 7 languages). An estimate nobody
 * checks drifts, so CI fails when the budget is exceeded.
 *
 * Measures gzip of the built JS + CSS. Vue is external and not counted;
 * @speed-highlight/core IS bundled, so it counts once imported.
 */
import { gzipSync } from 'node:zlib';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Total gzip budget in bytes for dist JS + CSS. See "Realistic budget" in the plan. */
const BUDGET_BYTES = 23 * 1024;

const DIST = new URL('../dist/', import.meta.url).pathname;

function walk(dir) {
    return readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry);
        return statSync(full).isDirectory() ? walk(full) : [full];
    });
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

let total = 0;
const rows = files.map((file) => {
    const gzipped = gzipSync(readFileSync(file), { level: 9 }).length;
    total += gzipped;
    return { name: file.slice(DIST.length), gzipped };
});

rows.sort((a, b) => b.gzipped - a.gzipped);

const kb = (n) => `${(n / 1024).toFixed(2)} kB`;
for (const { name, gzipped } of rows) {
    console.log(`  ${name.padEnd(32)} ${kb(gzipped).padStart(10)}`);
}

const pct = ((total / BUDGET_BYTES) * 100).toFixed(0);
console.log(`  ${''.padEnd(32, '-')} ${''.padStart(10, '-')}`);
console.log(`  ${'total (gzip)'.padEnd(32)} ${kb(total).padStart(10)}`);
console.log(`\n  budget ${kb(BUDGET_BYTES)} — using ${pct}%`);

if (total > BUDGET_BYTES) {
    console.error(
        `\n✗ Size budget exceeded by ${kb(total - BUDGET_BYTES)}.\n` +
            '  Either reduce the bundle or raise BUDGET_BYTES deliberately, ' +
            'updating the budget table in the plan to match.',
    );
    process.exit(1);
}

console.log('\n✓ Within size budget.');
