# vue-diff-next

## Unreleased

### Added

- `classic-light` and `classic-dark` themes, matching vue-diff's highlight.js **vs** / **monokai** palettes. These are opt-in stylesheets:

  ```js
  import 'vue-diff-next/style.css';
  import 'vue-diff-next/themes/classic-light.css';
  ```

  `theme="classic-light"` without the extra import is an unstyled wrapper class.

### Changed

- Syntax tokens from `@speed-highlight/core` are remapped so classic (and default) palettes colour the same roles vue-diff did — object keys, constants, types, and JSON `null`.
- Add/remove line, gutter, and word washes on `light` and `classic-light` are slightly softer than the original GitHub-style greens and reds.

## 1.0.0

Initial release
