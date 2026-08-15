# Demo

The site published to <https://dmhendricks.github.io/vue-diff-next/>.

## Running it

```bash
npm run dev
```

Serves at <http://localhost:5190/vue-diff-next/> with hot reload. It imports from
`src/` rather than `dist/`, so library edits appear without a rebuild.

**Opening `index.html` directly does not work.** It is a Vite template, not a
standalone page: `src="/src/main.ts"` is a dev-server path, and browsers cannot
execute TypeScript without the transform step. Over `file://` you get CORS errors
and a failed `main.ts` request.

To check the production build the way Pages serves it:

```bash
npm run build:demo
npx vite preview -c vite.config.demo.ts
```

## Layout

| Path             | Purpose                                                       |
| ---------------- | ------------------------------------------------------------- |
| `index.html`     | Vite entry template.                                          |
| `src/main.ts`    | Mounts the app; imports the default sheet and extra palettes. |
| `src/App.vue`    | The page: controls, viewer, usage snippet.                    |
| `src/query.ts`   | Query-string encode/decode for the Options form.              |
| `src/samples.ts` | Diff inputs. The first four mirror the original's presets.    |

The Options controls write non-default values into the query string (`?theme=coral-dark&mode=unified`),
so a copied URL restores the picker. Defaults are omitted rather than stored as empty keys.

`base` is `/vue-diff-next/` because project Pages serve from a subpath — a
root-relative base would 404 every asset. Override with `DEMO_BASE` for a
root-domain deploy.
