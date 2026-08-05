<script setup lang="ts">
import { computed, ref } from 'vue';
import { Diff } from '../../src';
import type { FoldMarker, Mode, Theme } from '../../src/types';
import { MODES, THEMES, samples } from './samples';

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
</script>

<template>
    <div class="page" :class="`page-${theme}`">
        <header class="masthead">
            <h1>vue-diff-next</h1>
            <p class="tagline">
                A modern, lightweight diff viewer for Vue 3 — a successor to
                <a href="https://github.com/hoiheart/vue-diff">vue-diff</a>.
            </p>
            <p class="links">
                <a href="https://github.com/dmhendricks/vue-diff-next">GitHub</a>
                <a href="https://www.npmjs.com/package/vue-diff-next">npm</a>
            </p>
        </header>

        <div class="controls">
            <label>
                Sample
                <select v-model="sampleKey">
                    <option v-for="s in samples" :key="s.key" :value="s.key">
                        {{ s.title }}
                    </option>
                </select>
            </label>

            <label>
                Mode
                <select v-model="mode">
                    <option v-for="m in MODES" :key="m" :value="m">{{ m }}</option>
                </select>
            </label>

            <label>
                Theme
                <select v-model="theme">
                    <option v-for="t in THEMES" :key="t" :value="t">{{ t }}</option>
                </select>
            </label>

            <label>
                Fold marker
                <select v-model="foldMarker" :disabled="!effectiveFolding">
                    <option value="dots">dots</option>
                    <option value="hunk">hunk</option>
                </select>
            </label>

            <div class="switches">
                <label class="switch">
                    <input v-model="folding" type="checkbox" role="switch" />
                    <span class="track"></span>
                    Folding
                </label>

                <label class="switch">
                    <input v-model="wrap" type="checkbox" role="switch" />
                    <span class="track"></span>
                    Wrap
                </label>
            </div>
        </div>

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
            />
        </div>

        <section class="usage">
            <h2>Usage</h2>
            <pre><code>npm install vue-diff-next</code></pre>
            <pre><code>&lt;script setup&gt;
import { Diff } from 'vue-diff-next';
import 'vue-diff-next/style.css';
&lt;/script&gt;

&lt;template&gt;
  &lt;Diff
    mode="{{ mode }}"
    theme="{{ theme }}"
    language="{{ sample.language }}"
    :prev="before"
    :current="after"
  /&gt;
&lt;/template&gt;</code></pre>
        </section>
    </div>
</template>

<style>
:root {
    color-scheme: light dark;
}

body {
    margin: 0;
    font-family:
        system-ui,
        -apple-system,
        'Segoe UI',
        sans-serif;
}

.page {
    min-height: 100vh;
    padding: 2rem 1.5rem 4rem;
    box-sizing: border-box;
    transition:
        background-color 0.15s,
        color 0.15s;
}

.page-dark {
    background: #0d1117;
    color: #c9d1d9;
}

.page-light {
    background: #fff;
    color: #24292f;
}

.masthead,
.controls,
.viewer,
.usage {
    max-width: 1100px;
    margin: 0 auto;
}

.masthead h1 {
    margin: 0 0 0.25rem;
    font-size: 1.75rem;
}

.tagline {
    margin: 0 0 0.5rem;
    opacity: 0.8;
}

.links {
    margin: 0 0 1.5rem;
    display: flex;
    gap: 1rem;
}

.page a {
    color: #58a6ff;
}

.page-light a {
    color: #0969da;
}

/*
  Controls are styled by hand rather than with a CSS framework. Classless
  frameworks restyle `pre`/`code` semantically, which fights the diff viewer for
  control of the page's main content — that is what made the earlier Pico
  attempt wash out the rows.
*/

.page {
    /* Themed via variables so the light overrides below stay to a few lines. */
    --field-bg: #161b22;
    --field-border: #30363d;
    --field-border-hover: #484f58;
    --accent: #2f81f7;
    --track-off: #30363d;
    --knob: #c9d1d9;
}

.page-light {
    --field-bg: #fff;
    --field-border: #d0d7de;
    --field-border-hover: #afb8c1;
    --accent: #0969da;
    --track-off: #d0d7de;
    --knob: #fff;
}

.controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.875rem;
    align-items: end;
    margin-bottom: 1rem;
}

.controls > label {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    opacity: 0.6;
}

.controls select {
    /* Drop the platform control so the arrow and padding are ours. */
    appearance: none;
    font: inherit;
    font-size: 0.875rem;
    font-weight: 400;
    text-transform: none;
    letter-spacing: normal;
    opacity: 1;
    padding: 0.5rem 2rem 0.5rem 0.75rem;
    border-radius: 8px;
    border: 1px solid var(--field-border);
    background-color: var(--field-bg);
    color: inherit;
    min-width: 9.5rem;
    cursor: pointer;
    transition:
        border-color 0.15s,
        box-shadow 0.15s;

    /* Chevron, inlined so the demo makes no network requests of its own. */
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
    background-repeat: no-repeat;
    background-position: right 0.625rem center;
}

.controls select:hover:not(:disabled) {
    border-color: var(--field-border-hover);
}

.controls select:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.controls select:focus-visible {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgb(47 129 247 / 30%);
}

.switches {
    display: flex;
    gap: 1.25rem;
    align-items: center;
    /* Sit level with the selects rather than their uppercase labels. */
    padding-bottom: 0.5rem;
}

.switch {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
    user-select: none;
}

/* The checkbox stays in the DOM for semantics and keyboard use; `.track` is what
   you actually see. Hiding it with `display: none` would take it out of the tab
   order, so it is clipped instead. */
.switch input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
}

.track {
    position: relative;
    flex: 0 0 auto;
    width: 2rem;
    height: 1.125rem;
    border-radius: 999px;
    background: var(--track-off);
    transition:
        background-color 0.18s ease,
        box-shadow 0.15s;
}

.track::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: calc(1.125rem - 4px);
    height: calc(1.125rem - 4px);
    border-radius: 50%;
    background: var(--knob);
    transition: transform 0.18s ease;
}

.switch input:checked + .track {
    background: var(--accent);
}

.switch input:checked + .track::after {
    background: #fff;
    transform: translateX(calc(2rem - 1.125rem));
}

.switch input:focus-visible + .track {
    box-shadow: 0 0 0 3px rgb(47 129 247 / 30%);
}

@media (prefers-reduced-motion: reduce) {
    .controls select,
    .track,
    .track::after {
        transition: none;
    }
}

.viewer {
    border: 1px solid rgb(128 128 128 / 25%);
    border-radius: 8px;
    overflow: hidden;
}

.usage {
    margin-top: 2.5rem;
}

.usage h2 {
    font-size: 1.125rem;
}

.usage pre {
    margin: 0 0 1rem;
    padding: 0.875rem 1rem;
    border-radius: 6px;
    overflow-x: auto;
    background: rgb(128 128 128 / 12%);
    font-size: 0.8125rem;
    line-height: 1.5;
}
</style>
