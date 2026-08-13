[![Release](https://img.shields.io/github/release/dmhendricks/vue-diff-next.svg)](https://github.com/dmhendricks/vue-diff-next/releases)
[![GitHub License](https://img.shields.io/badge/license-MIT-yellow.svg)](https://raw.githubusercontent.com/dmhendricks/vue-diff-next/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/dmhendricks/vue-diff-next/ci.yaml?label=CI)](https://github.com/dmhendricks/vue-diff-next/actions/workflows/ci.yaml)
[![NPM Downloads](https://img.shields.io/npm/dt/vue-diff-next.svg?label=npm%20downloads)](https://www.npmjs.com/package/vue-diff-next)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://paypal.me/danielhendricks)
[![Donate](https://img.shields.io/badge/Donate-Ko--fi-green.svg)](https://ko-fi.com/danielhendricks)

# vue-diff-next

![vue-diff-next screenshot, split mode](https://raw.githubusercontent.com/dmhendricks/vue-diff-next/main/.github/assets/screenshot.jpg)

A lightweight diff viewer component for Vue 3.5+. Inspired by
[`vue-diff`](https://github.com/hoiheart/vue-diff), which was archived in February 2025.

Same props, same modes, same look. **18.4 kB gzip with 35 languages bundled**, versus roughly
75 kB for the original covering 7.

Try the **[Live Demo](https://dmhendricks.github.io/vue-diff-next/)** to see it in action.

- **Drop-in replacement** — every `vue-diff` prop and default is preserved, verified against the original's own output
- **35 languages**, all bundled; no per-language imports or registration
- **Split and unified** modes, with word-level highlighting composed on top of syntax
  highlighting

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
| `theme`         | `'dark' \| 'light' \| custom* \| ...`         | `'dark'`      | See [Theming](#theming).                                                 |
| `language`      | `string`                                      | `'plaintext'` | See [Languages](#languages).                                             |
| `prev`          | `string \| null`                              | `''`          | The "before" text.                                                       |
| `current`       | `string \| null`                              | `''`          | The "after" text.                                                        |
| `folding`       | `boolean`                                     | `false`       | Collapse long runs of unchanged lines. See [Folding](#folding).          |
| `foldMarker`    | `'dots' \| 'hunk'`                            | `'dots'`      | How a collapsed run is marked. See [Folding](#folding).                  |
| `inputDelay`    | `number`                                      | `0`           | Debounce re-rendering, in ms. Useful for editor-driven input.            |
| `virtualScroll` | `boolean \| { height, lineMinHeight, delay }` | `false`       | Render only the rows near the viewport. See [Large diffs](#large-diffs). |
| `wrap`          | `boolean`                                     | `true`        | Soft-wrap long lines. Set `false` to scroll horizontally instead.        |

## Migrating from `vue-diff`

Change the import and the stylesheet path:

```diff
- import VueDiff from 'vue-diff';
- import 'vue-diff/dist/index.css';
+ import VueDiff from 'vue-diff-next';
+ import 'vue-diff-next/style.css';
```

That is the whole migration. Props, defaults, modes, and both install paths are unchanged.

A few things to know:

- **`theme="custom*"` still works**, but the CSS custom properties you override are named
  differently. See [Theming](#theming).
- **`theme="light"` / `"dark"` are a different palette** than vue-diff's highlight.js
  `vs` / `monokai`. For those colors use `visual-studio-light` / `monokai-dark` and import
  the matching extra stylesheet (see [Theming](#theming)).
- **Language names still work**, and more are accepted. `javascript`, `plaintext`,
  `markdown`, and `typescript` all resolve as before.
- **`virtualScroll` behaves as it did**, windowing the output to what is near the
  viewport. See [Large diffs](#large-diffs).

### How it differs internally

Same behaviour, different internals:

- **`diff` (jsdiff)** instead of `diff-match-patch` for line and word diffing.
- **[`@speed-highlight/core`](https://github.com/speed-highlight/core)** instead of
  `highlight.js`. The reduced library size is mostly the highlighter: `highlight.js`'s engine
  alone is 22.4 kB gzip, while `@speed-highlight/core`'s engine plus all 35 of its grammars
  is 9.9 kB.
- **No `@vueuse/core`.** Its debounce was the only part used; that is now a few lines.
- **Word-diff and syntax highlighting are composed at the token level.** The original injected
  `<vue-diff-modified>` marker strings into the source before highlighting and string-replaced
  them afterwards, which breaks if the content contains the marker. Here the two overlapping
  classifications are merged by splitting the token stream at word boundaries, so no string
  injection happens and content cannot impersonate a marker.
- **Highlighting is asynchronous**, because grammars resolve lazily. Unhighlighted text paints
  first and upgrades when highlighting resolves — which is what the original did in practice
  too, since it also filled an initially empty element from a watcher.

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

Pass any of these to `language`. Aliases in the right column resolve to the same grammar, so
highlight.js names and file extensions both work:

| Group             | Languages                                              | Also accepted                                                                                    |
| ----------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| **Web**           | `html` `css` `js` `ts` `json` `xml`                    | `htm` `vue` · `scss` `sass` `less` · `javascript` `jsx` `mjs` `cjs` · `typescript` `tsx` · `svg` |
| **Systems**       | `c` `rs` `go` `java` `py` `pl` `lua` `asm` `bf`        | `cpp` `c++` `h` `cs` · `rust` · `golang` · `python` `py3` · `perl` · `assembly` · `brainfuck`    |
| **Data & config** | `yaml` `toml` `ini` `csv` `sql` `md`                   | `yml` · `conf` `cfg` · `markdown`                                                                |
| **Shell & ops**   | `bash` `docker` `make` `git` `diff` `http` `uri` `log` | `sh` `zsh` `shell` · `dockerfile` · `makefile` · `patch` · `url`                                 |
| **Other**         | `regex` `todo` `plain`                                 | `plaintext` `text`                                                                               |

Plus three sub-grammars for narrower cases: `jsdoc`, `js_template_literals`, and
`leanpub-md`.

Matching is case-insensitive and surrounding whitespace is ignored.

**An unknown language renders as plain text rather than throwing**, so user-supplied language
names are safe to pass straight through.

## Theming

| `theme`               | Palette                                    | Stylesheet                                     |
| --------------------- | ------------------------------------------ | ---------------------------------------------- |
| `dark` (default)      | VS Code-ish dark                           | `vue-diff-next/style.css`                      |
| `light`               | VS Code-ish light                          | `vue-diff-next/style.css`                      |
| `atom-dark`           | Atom One Dark tokens                       | `vue-diff-next/themes/atom-dark.css`           |
| `monokai-dark`        | highlight.js **monokai** (vue-diff `dark`) | `vue-diff-next/themes/monokai-dark.css`        |
| `visual-studio-light` | highlight.js **vs** (vue-diff `light`)     | `vue-diff-next/themes/visual-studio-light.css` |
| `custom*`             | Unstyled; you supply the CSS               | none                                           |

`dark` and `light` ship in the default stylesheet. Extra palettes are a second import —
the wrapper class is always applied; without the extra CSS they look like an unstyled
`custom*` theme:

```js
import 'vue-diff-next/style.css';
import 'vue-diff-next/themes/visual-studio-light.css';
```

```vue
<Diff theme="visual-studio-light" ... />
```

If you bind `theme` dynamically, import every extra file you might select.

Everything is driven by CSS custom properties, so you can override any part without
forking the stylesheet:

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

## Large diffs

A few thousand rows lay out and paint slowly — the cost is **DOM size and
per-line highlighting**, not diffing. Each visible row tokenizes asynchronously;
without windowing, a large file means thousands of DOM nodes and thousands of
highlight passes.

**Use `virtualScroll` for large diffs.** It renders only the rows near the
viewport:

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
with a 48,000px scroll range. Only those visible rows are highlighted.

## Security

The component renders untrusted text as HTML, so escaping is a correctness requirement rather
than a detail. All text is escaped before insertion — the interim plain-text render and the
final highlighted markup both — and the escaping boundary is a single small module with its
own test suite covering `<script>` tags, inline event handlers, and attribute-breaking quotes.

Found a hole? Please report it privately — see [SECURITY.md](SECURITY.md).
