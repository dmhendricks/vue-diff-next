# vue-diff-next

## Unreleased

### Added

- `showLineNumbers` (default `true`) hides the diff line-number gutter when set to `false`.

### Changed

- Upgrade `@speed-highlight/core` from 1.2 to 2.0. Highlighting is synchronous: grammars are bundled and tokenized with `tokenizeWith` rather than lazy-loaded.
- `js_template_literals` is no longer a standalone grammar; the `language` value still works and maps to `js`.

## 1.1.0

### Added

- Optional themes as a second CSS import (`vue-diff-next/themes/<name>.css`). They are not in `style.css`.
  - Light: `visual-studio-light`, `atom-light`, `github-light`, `coral-light`
  - Dark: `monokai-dark`, `atom-dark`, `visual-studio-dark`, `github-dark`, `coral-dark`
- `visual-studio-light` and `monokai-dark` match vue-diff's highlight.js `vs` / `monokai` palettes.

### Changed

- Syntax tokens from `@speed-highlight/core` are remapped so palettes colour the same roles vue-diff did — object keys, constants, types, and JSON `null`.
- Add/remove washes are shared across extras: every light theme uses the same red/green, every dark theme the same. Default `light` / `dark` washes are stronger so added/removed rows read more clearly.

## 1.0.0

Initial release
