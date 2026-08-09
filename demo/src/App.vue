<script setup lang="ts">
import { computed, ref } from 'vue';
import { Diff } from '../../src';
import type { FoldMarker, Mode, Theme } from '../../src/types';
import { MODES, THEMES, groups, samples } from './samples';

const sampleKey = ref(samples[0]!.key);
const mode = ref<Mode>('split');
const theme = ref<Theme>('dark');
const folding = ref(false);
const foldMarker = ref<FoldMarker>('dots');
const wrap = ref(true);

const sample = computed(() => samples.find((s) => s.key === sampleKey.value) ?? samples[0]!);

// A sample that exists to demonstrate folding switches it on by itself, so the
// preset isn't silently doing nothing when you pick it.
const effectiveFolding = computed(() => folding.value || sample.value.folding === true);

/**
 * Usage snippet that tracks the live controls — not a static README excerpt.
 *
 * Defaults (folding off, wrap on, no virtual scroll) stay off the tag so the
 * copy-paste stays short; toggles and sample-driven options appear when active.
 */
const usageSnippet = computed(() => {
    const attrs = [
        `mode="${mode.value}"`,
        `theme="${theme.value}"`,
        `language="${sample.value.language}"`,
        ':prev="before"',
        ':current="after"',
    ];

    if (effectiveFolding.value) {
        attrs.push(':folding="true"');
        if (foldMarker.value !== 'dots') {
            attrs.push(`fold-marker="${foldMarker.value}"`);
        }
    }

    // wrap defaults to true; only the opt-out is worth showing.
    if (!wrap.value) {
        attrs.push(':wrap="false"');
    }

    const scroll = sample.value.virtualScroll;
    if (scroll) {
        attrs.push(
            scroll === true
                ? ':virtual-scroll="true"'
                : `:virtual-scroll='${JSON.stringify(scroll)}'`,
        );
    }

    const delay = sample.value.inputDelay;
    if (delay) {
        attrs.push(`:input-delay="${delay}"`);
    }

    const indented = attrs.map((line) => `    ${line}`).join('\n');

    return `<script setup>
import { Diff } from 'vue-diff-next';
import 'vue-diff-next/style.css';
<\/script>

<template>
  <Diff
${indented}
  />
</template>`;
});
</script>

<template>
    <!--
      The theme control drives the page as well as the viewer, so a dark diff is
      never framed by light chrome.
    -->
    <div class="page" :data-theme="theme">
        <div class="atmosphere" aria-hidden="true"></div>

        <div class="shell">
            <header class="masthead">
                <h1>vue-diff-next</h1>
                <p class="tagline">A modern, lightweight diff viewer for Vue 3.</p>
                <p class="links">
                    <a href="https://github.com/dmhendricks/vue-diff-next">GitHub</a>
                    <a href="https://www.npmjs.com/package/vue-diff-next">npm</a>
                </p>
            </header>

            <section class="section">
                <h2>Options</h2>

                <div class="controls">
                    <label class="field">
                        <span class="field__label">Sample</span>
                        <select v-model="sampleKey">
                            <optgroup v-for="g in groups" :key="g.name" :label="g.name">
                                <option v-for="s in g.samples" :key="s.key" :value="s.key">
                                    {{ s.title }}
                                </option>
                            </optgroup>
                        </select>
                    </label>

                    <label class="field">
                        <span class="field__label">Mode</span>
                        <select v-model="mode">
                            <option v-for="m in MODES" :key="m" :value="m">{{ m }}</option>
                        </select>
                    </label>

                    <label class="field">
                        <span class="field__label">Theme</span>
                        <select v-model="theme">
                            <option v-for="t in THEMES" :key="t" :value="t">{{ t }}</option>
                        </select>
                    </label>

                    <label class="field">
                        <span class="field__label">Fold marker</span>
                        <select v-model="foldMarker" :disabled="!effectiveFolding">
                            <option value="dots">dots</option>
                            <option value="hunk">hunk</option>
                        </select>
                    </label>

                    <div class="toggles">
                        <label class="switch">
                            <input v-model="folding" type="checkbox" />
                            <span class="switch__track">
                                <span class="switch__thumb"></span>
                            </span>
                            <span class="switch__label">Folding</span>
                        </label>

                        <label class="switch">
                            <input v-model="wrap" type="checkbox" />
                            <span class="switch__track">
                                <span class="switch__thumb"></span>
                            </span>
                            <span class="switch__label">Wrap</span>
                        </label>
                    </div>
                </div>
            </section>

            <section class="section">
                <h2>{{ sample.title }}</h2>
                <div class="viewer">
                    <Diff
                        :key="sample.key"
                        :mode="mode"
                        :theme="theme"
                        :language="sample.language"
                        :prev="sample.prev"
                        :current="sample.current"
                        :folding="effectiveFolding"
                        :fold-marker="foldMarker"
                        :wrap="wrap"
                        :input-delay="sample.inputDelay ?? 0"
                        :virtual-scroll="sample.virtualScroll ?? false"
                    />
                </div>
            </section>

            <section class="section">
                <h2>Usage</h2>
                <pre class="code"><code>npm install vue-diff-next</code></pre>
                <pre class="code"><code>{{ usageSnippet }}</code></pre>
            </section>

            <footer class="footer">
                <small> MIT licensed </small>
            </footer>
        </div>
    </div>
</template>

<style>
/*
  Dark-first demo chrome: coral and green accents, elevated translucent
  surfaces, and a fixed gradient atmosphere behind the content. Full width,
  since a side-by-side diff wants the room.
*/

.page {
    --vd-coral: #f87575;
    --vd-coral-soft: color-mix(in srgb, var(--vd-coral) 22%, transparent);
    --vd-green: #6a8e46;
    --vd-green-soft: color-mix(in srgb, var(--vd-green) 18%, transparent);
    /* Section headings. Separate from --vd-green so light mode can diverge:
       the green reaches only 3.48:1 on the light background, below AA. */
    --vd-heading: var(--vd-green);

    --vd-bg: #0e1218;
    --vd-bg-elevated: #161c25;
    --vd-text: #e8edf4;
    --vd-text-muted: #9aa6b8;
    --vd-border: color-mix(in srgb, #9aa6b8 22%, transparent);
    --vd-link: #7eb6ff;
    --vd-link-hover: #a8d0ff;
    --vd-input-bg: #1c2430;
    --vd-input-border: #2c3748;
    --vd-glow: color-mix(in srgb, var(--vd-coral) 28%, transparent);
    --vd-grid: color-mix(in srgb, #9aa6b8 7%, transparent);

    /* Cross-platform stack — avoid macOS-only faces that make the demo look
       different per OS for no benefit. */
    --vd-font-sans:
        system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', ui-sans-serif, sans-serif;
    --vd-font-mono: 'SF Mono', 'Cascadia Code', 'Consolas', ui-monospace, monospace;
    --vd-radius: 12px;
}

/* Driven by the theme control rather than prefers-color-scheme, so the page
   follows the viewer the user explicitly chose. */
.page[data-theme='light'] {
    --vd-bg: #f4f6f9;
    --vd-bg-elevated: #ffffff;
    --vd-text: #1a2230;
    --vd-text-muted: #52607a;
    --vd-border: color-mix(in srgb, #1a2230 12%, transparent);
    --vd-link: #1a6fd4;
    --vd-link-hover: #0f4f9e;
    --vd-input-bg: #eef2f7;
    --vd-input-border: #c9d3e0;
    --vd-glow: color-mix(in srgb, var(--vd-coral) 20%, transparent);
    --vd-grid: color-mix(in srgb, #1a2230 5%, transparent);
    /* Scarlet, 5.75:1 against this background — the dark theme's green muddies
       on white and only clears 3.48:1. */
    --vd-heading: #c1121f;
}

*,
*::before,
*::after {
    box-sizing: border-box;
}

body {
    margin: 0;
}

.page {
    position: relative;
    min-height: 100vh;
    padding: 2.5rem 1.5rem 4rem;
    font-family: var(--vd-font-sans);
    font-size: 1rem;
    line-height: 1.6;
    color: var(--vd-text);
    background: var(--vd-bg);
    -webkit-font-smoothing: antialiased;
    transition:
        background-color 0.2s,
        color 0.2s;
}

/* Fixed gradient wash plus a faint grid, behind everything. */
.atmosphere {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
        radial-gradient(ellipse 70% 45% at 15% -5%, var(--vd-glow), transparent 55%),
        radial-gradient(ellipse 50% 40% at 95% 10%, var(--vd-green-soft), transparent 50%),
        repeating-linear-gradient(0deg, var(--vd-grid) 0 1px, transparent 1px 48px),
        repeating-linear-gradient(90deg, var(--vd-grid) 0 1px, transparent 1px 48px);
}

/* Full width by design — a split diff needs the room. */
.shell {
    position: relative;
    z-index: 1;
    max-width: none;
}

.masthead {
    margin-bottom: 2.25rem;
}

.masthead h1 {
    margin: 0 0 0.35rem;
    font-size: 1.6rem;
    font-weight: 650;
    letter-spacing: -0.01em;
}

.tagline {
    margin: 0 0 0.6rem;
    color: var(--vd-text-muted);
}

.links {
    margin: 0;
    display: flex;
    gap: 1.25rem;
}

.page a {
    color: var(--vd-link);
    text-decoration-color: color-mix(in srgb, var(--vd-link) 45%, transparent);
    text-underline-offset: 0.15em;
}

.page a:hover {
    color: var(--vd-link-hover);
}

.section {
    margin-bottom: 2rem;
}

.section h2 {
    margin: 0 0 0.85rem;
    font-size: 0.78rem;
    font-weight: 650;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--vd-heading);
}

/* —— Controls ———————————————————————————————————————————————————————————— */

.controls {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 0.9rem;
    padding: 0.9rem 1rem;
    background: color-mix(in srgb, var(--vd-bg-elevated) 70%, transparent);
    border: 1px solid var(--vd-border);
    border-radius: 0.75rem;
    transition: border-color 0.15s ease;
}

.controls:hover {
    border-color: color-mix(in srgb, var(--vd-coral) 35%, var(--vd-border));
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.field__label {
    font-size: 0.72rem;
    font-weight: 650;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--vd-text-muted);
}

.controls select {
    appearance: none;
    min-width: 10rem;
    padding: 0.5rem 2rem 0.5rem 0.7rem;
    font: inherit;
    font-size: 0.9rem;
    color: var(--vd-text);
    background-color: var(--vd-input-bg);
    border: 1px solid var(--vd-input-border);
    border-radius: 0.55rem;
    cursor: pointer;
    transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;

    /* Inlined so the demo makes no network requests of its own. */
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239aa6b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
    background-repeat: no-repeat;
    background-position: right 0.6rem center;
}

.controls select:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--vd-coral) 40%, var(--vd-input-border));
}

.controls select:focus-visible {
    outline: 2px solid var(--vd-link);
    outline-offset: 2px;
}

.controls select:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.toggles {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding-bottom: 0.4rem;
    margin-left: auto;
}

.switch {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    cursor: pointer;
    user-select: none;
}

/* Kept in the DOM and merely transparent, so it stays keyboard-operable. */
.switch input {
    position: absolute;
    inset: 0;
    width: 2.75rem;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
}

.switch__track {
    position: relative;
    display: block;
    flex: 0 0 auto;
    width: 2.75rem;
    height: 1.55rem;
    background: var(--vd-input-bg);
    border: 1px solid var(--vd-input-border);
    border-radius: 999px;
    transition:
        background 0.18s ease,
        border-color 0.18s ease,
        box-shadow 0.18s ease;
}

.switch__thumb {
    position: absolute;
    top: 0.2rem;
    left: 0.2rem;
    width: 1.1rem;
    height: 1.1rem;
    background: var(--vd-text-muted);
    border-radius: 50%;
    transition:
        transform 0.18s ease,
        background 0.18s ease;
}

.switch input:checked + .switch__track {
    background: var(--vd-coral-soft);
    border-color: color-mix(in srgb, var(--vd-coral) 55%, var(--vd-input-border));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--vd-coral) 20%, transparent);
}

.switch input:checked + .switch__track .switch__thumb {
    transform: translateX(1.15rem);
    background: var(--vd-coral);
}

.switch input:focus-visible + .switch__track {
    outline: 2px solid var(--vd-link);
    outline-offset: 2px;
}

.switch__label {
    font-size: 0.9rem;
}

/* —— Viewer and code ———————————————————————————————————————————————————— */

.viewer {
    border: 1px solid var(--vd-border);
    border-radius: var(--vd-radius);
    overflow: hidden;
}

.code {
    margin: 0 0 1rem;
    padding: 0.9rem 1rem;
    font-family: var(--vd-font-mono);
    font-size: 0.85rem;
    line-height: 1.55;
    overflow-x: auto;
    color: var(--vd-text);
    background: color-mix(in srgb, var(--vd-bg-elevated) 70%, transparent);
    border: 1px solid var(--vd-border);
    border-radius: 0.75rem;
}

.footer {
    color: var(--vd-text-muted);
}

@media (prefers-reduced-motion: reduce) {
    .page,
    .controls,
    .controls select,
    .switch__track,
    .switch__thumb {
        transition: none;
    }
}
</style>
