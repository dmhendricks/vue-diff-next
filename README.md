# vue-diff-next

A modern, lightweight diff viewer component for Vue 3. Inspired by
[`vue-diff`](https://github.com/hoiheart/vue-diff), which was archived in February 2025.

Same props, same modes, same look. **16.3 kB gzip with 35 languages bundled**, versus roughly
75 kB for the original covering 7.

Try the **[Live Demo](https://dmhendricks.github.io/vue-diff-next/)** to see it in action.

- **Drop-in replacement** — every `vue-diff` prop and default is preserved, verified against the original's own output
- **35 languages**, all bundled; no per-language imports or registration
- **Split and unified** modes, with word-level highlighting composed on top of syntax
  highlighting
- **ESM only**, zero configuration, two small runtime dependencies
- **TypeScript** declarations included

## Install

```bash
npm install vue-diff-next
```

Vue 3.5 or newer is a peer dependency.

## Usage

As a component:

```vue
<script setup>
import { Diff } from 'vue-diff-next';
import 'vue-diff-next/style.css';
</script>

<template>
  <Diff mode="split" theme="dark" language="javascript" :prev="before" :current="after" />
</template>
```

Or registered globally as a plugin:

```js
import { createApp } from 'vue';
import VueDiff from 'vue-diff-next';
import 'vue-diff-next/style.css';

createApp(App).use(VueDiff).mount('#app');
// Renders as <Diff>, or pass { componentName: 'VueDiff' } to rename it.
```

**The stylesheet is not optional** — the component ships unstyled without it.

## Props

| Prop            | Type                                          | Default       | Description                                                              |
| --------------- | --------------------------------------------- | ------------- | ------------------------------------------------------------------------ |
| `mode`          | `'split' \| 'unified'`                        | `'split'`     | Side-by-side or interleaved.                                             |
| `theme`         | `'dark' \| 'light' \| \`custom${string}\``    | `'dark'`      | See [Theming](#theming).                                                 |
| `language`      | `string`                                      | `'plaintext'` | See [Languages](#languages).                                             |
| `prev`          | `string \| null`                              | `''`          | The "before" text.                                                       |
| `current`       | `string \| null`                              | `''`          | The "after" text.                                                        |
| `folding`       | `boolean`                                     | `false`       | Collapse long runs of unchanged lines. See [Folding](#folding).          |
| `foldMarker`    | `'dots' \| 'hunk'`                            | `'dots'`      | How a collapsed run is marked. See [Folding](#folding).                  |
| `inputDelay`    | `number`                                      | `0`           | Debounce re-rendering, in ms. Useful for editor-driven input.            |
| `virtualScroll` | `boolean \| { height, lineMinHeight, delay }` | `false`       | Render only the rows near the viewport. See [Large diffs](#large-diffs). |
| `wrap`          | `boolean`                                     | `true`        | Soft-wrap long lines. Set `false` to scroll horizontally instead.        |

Every default matches `vue-diff` — including `theme`, which defaults to **`dark`**.

`wrap` and `foldMarker` are the only props the original lacked, and both default to reproducing
its behaviour: it always wrapped, and it always marked folds with dots.

Unlike the original, `prev` and `current` accept `null` and `undefined`, which are treated as
empty strings.

## Migrating from `vue-diff`

Change the import and the stylesheet path:

```diff
- import VueDiff from 'vue-diff';
- import 'vue-diff/dist/index.css';
+ import VueDiff from 'vue-diff-next';
+ import 'vue-diff-next/style.css';
```

That is the whole migration. Props, defaults, modes, and both install paths are unchanged.

Three things to know:

- **`theme="custom*"` still works**, but the CSS custom properties you override are named
  differently. See [Theming](#theming).
- **Language names still work**, and more are accepted. `javascript`, `plaintext`,
  `markdown`, and `typescript` all resolve as before.
- **`virtualScroll` behaves as it did**, windowing the output to what is near the
  viewport. See [Large diffs](#large-diffs).

## Folding

With `folding`, runs of unchanged lines collapse to a single marker row, so a small change in a
large file doesn't bury the diff. `foldMarker` chooses how that row looks:

```vue
<Diff :folding="true" fold-marker="hunk" :prev="before" :current="after" />
```

**`dots`** (default) — a centred `•••••`, matching the original:

```
  12  const config = {
   >  • • • • •
  47    timeout: 5000,
```

**`hunk`** — a unified-diff header, stating how much was skipped rather than only that
something was:

```
  12  const config = {
   >  @@ -13,34 +13,34 @@
  47    timeout: 5000,
```

Both are styleable — see `--vue-diff-fold-*` under [Theming](#theming). The dots' size and
spacing are variables, so you can tune them without overriding the content.

A changed line is never hidden by folding, and the first unchanged line after each change stays
visible as context.

## Languages

Pass any of these to `language`:

```
asm   bash  bf    c     css   csv   diff  docker  git   go
html  http  ini   java  js    json  log   lua     make  md
pl    plain py    regex rs    sql   todo  toml    ts    uri
xml   yaml
```

Plus three sub-grammars for narrower cases: `jsdoc`, `js_template_literals`, and
`leanpub-md`.

Common aliases resolve automatically, so highlight.js names and file extensions both work:
`javascript` → `js`, `typescript` → `ts`, `plaintext` → `plain`, `markdown` → `md`,
`python` → `py`, `rust` → `rs`, `shell` → `bash`, `yml` → `yaml`, `scss`/`sass`/`less` → `css`,
`jsx` → `js`, `tsx` → `ts`, and others.

**An unknown language renders as plain text rather than throwing**, so user-supplied language
names are safe to pass straight through.

## Theming

`dark` and `light` ship styled. Everything is driven by CSS custom properties, so you can
override any part without forking the stylesheet:

```css
.vue-diff-theme-dark {
  --vue-diff-added-bg: #143d2b;
  --vue-diff-removed-bg: #45161a;
  --vue-diff-syn-kwd: #ff7b72;
}
```

For a wholly separate theme, pass any `theme` value beginning with `custom`. The component
adds `vue-diff-theme-<value>` to its wrapper and **ships no styles for it** — you supply them:

```vue
<Diff theme="custom-solarized" ... />
```

```css
.vue-diff-theme-custom-solarized {
  --vue-diff-bg: #002b36;
  --vue-diff-fg: #839496;
  /* …and the rest */
}
```

Available properties: `--vue-diff-{bg,fg,font-family,font-size,line-height,gutter-width}`,
`--vue-diff-{gutter-bg,gutter-fg}`,
`--vue-diff-{added,removed,disabled}-bg`,
`--vue-diff-{added,removed}-gutter-bg`,
`--vue-diff-{added,removed}-word-bg`,
`--vue-diff-fold-{bg,fg}`, `--vue-diff-fold-dot-{size,spacing,opacity}`, `--vue-diff-fold-hunk-opacity`, and
`--vue-diff-syn-{kwd,str,num,bool,cmnt,func,class,var,type,oper,section,insert,deleted,err}`.

## Size

Measured with `gzip -9` on the built output:

|              | This library | Original `vue-diff`                          |
| ------------ | ------------ | -------------------------------------------- |
| Component JS | **15.1 kB**  | 29.8 kB                                      |
| CSS          | **1.2 kB**   | 1.3 kB                                       |
| Highlighter  | **bundled**  | + 44.5 kB (`highlight.js` core + 7 grammars) |
| **Total**    | **16.3 kB**  | **~75.6 kB**                                 |
| Languages    | **35**       | 7                                            |

Vue is a peer dependency and is not bundled. The highlighter and diff engine are, so the total
above is what a consumer actually downloads.

The difference is mostly the highlighter: `highlight.js`'s engine alone is 22.4 kB gzip, while
[`@speed-highlight/core`](https://github.com/speed-highlight/core)'s engine plus all 35 of its
grammars is 9.9 kB.

## How it differs internally

Same behaviour, different internals:

- **`diff` (jsdiff)** instead of `diff-match-patch` for line and word diffing.
- **`@speed-highlight/core`** instead of `highlight.js`, for the size reason above.
- **No `@vueuse/core`.** Its debounce was the only part used; that is now a few lines.
- **Word-diff and syntax highlighting are composed at the token level.** The original injected
  `<vue-diff-modified>` marker strings into the source before highlighting and string-replaced
  them afterwards, which breaks if the content contains the marker. Here the two overlapping
  classifications are merged by splitting the token stream at word boundaries, so no string
  injection happens and content cannot impersonate a marker.
- **Highlighting is asynchronous**, because grammars resolve lazily. Unhighlighted text paints
  first and upgrades when highlighting resolves — which is what the original did in practice
  too, since it also filled an initially empty element from a watcher.

## Large diffs

A few thousand rows lay out and paint slowly — the cost is DOM size, not diffing. Pass
`virtualScroll` to render only the rows near the viewport:

```vue
<Diff :virtual-scroll="true" :prev="before" :current="after" />
```

```vue
<!-- or tune it -->
<Diff
  :virtual-scroll="{ height: 500, lineMinHeight: 24, delay: 100 }"
  :prev="before"
  :current="after"
/>
```

| Option          | Default | Meaning                                              |
| --------------- | ------- | ---------------------------------------------------- |
| `height`        | `500`   | Viewer height in px. Also sets the windowing extent. |
| `lineMinHeight` | `24`    | Assumed row height until one is measured.            |
| `delay`         | `100`   | Scroll throttle in ms.                               |

The window extends 1.5 viewport heights past each edge, so ordinary scrolling does not
outrun it. Row heights are measured rather than assumed — a wrapped line can be any
height — so the container's scroll height converges on the truth as rows report in, and
the scrollbar reflects the whole diff rather than only what is rendered.

Measured on a 2000-line diff in a 500px viewer: **53 rows in the DOM instead of 2000**,
with a 48,000px scroll range.

## Not yet implemented

- **Bundled themes beyond `dark` and `light`.** `theme="custom*"` covers this without adding
  weight for everyone.
- **A dedicated `scss` grammar.** `scss`, `sass`, and `less` currently use the `css` grammar,
  which is lossless but does not specially mark `//` comments or `$variables`.

## Security

The component renders untrusted text as HTML, so escaping is a correctness requirement rather
than a detail. All text is escaped before insertion — the interim plain-text render and the
final highlighted markup both — and the escaping boundary is a single small module with its
own test suite covering `<script>` tags, inline event handlers, and attribute-breaking quotes.

Found a hole? Please report it privately — see [SECURITY.md](SECURITY.md).
