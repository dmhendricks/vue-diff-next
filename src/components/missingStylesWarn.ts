/**
 * Module-level guard for the missing-stylesheet console.warn.
 *
 * Kept out of Diff.vue so the SFC can be a single `<script setup>` — a companion
 * plain `<script>` block makes Volar lose prop types on the default export, which
 * then breaks `wrapper.setProps({ ... })` typing in tests.
 */
export const missingStylesWarn = { warned: false };
