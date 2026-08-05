<template>
    <!--
      Highlighted markup must be injected as HTML: nothing else preserves both
      syntax spans and word-diff spans on the same line. Every path into `html`
      escapes first — plain text via escapeHtml, highlighted output via
      spansToHtml — and both are covered by XSS tests in escape.spec.ts and
      compose.spec.ts. This is the only v-html in the library.
    -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <pre><code class="vue-diff-code" v-html="html"></code></pre>
</template>

<script setup lang="ts">
import { useHighlight } from '../composables/useHighlight';

const props = withDefaults(
    defineProps<{
        code: string;
        language?: string;
        /** Counterpart text to word-diff against. */
        counterpart?: string;
        /** Whether this line participates in word-level diffing. */
        words?: boolean;
    }>(),
    { language: 'plaintext', counterpart: undefined, words: false },
);

// v-html is safe here only because every path through useHighlight escapes:
// the interim plain text via escapeHtml, the final markup via spansToHtml.
const { html } = useHighlight(() => ({
    value: props.code,
    language: props.language,
    counterpart: props.counterpart,
    words: props.words,
}));
</script>
