# Security

## Reporting a vulnerability

Please report security issues privately, not as a public issue.

Use GitHub's [private vulnerability reporting](https://github.com/dmhendricks/vue-diff-next/security/advisories/new),
which opens a draft advisory visible only to the maintainers.

I aim to acknowledge reports when I can. This is a best-effort,
single-maintainer project — there is no guaranteed response time,
and support may stop if the project is archived or abandoned.

If a fix is warranted and the project is still maintained, it ships
as a patch release and the advisory is published with credit unless
you'd rather stay anonymous.

## Scope

This component renders diffed text as HTML, so **the most serious class of bug
here is content escaping**. Anything that lets diffed input produce live markup
or execute script is in scope, including:

- Text that survives escaping and reaches the DOM as markup.
- A syntax grammar or word-diff path that reassembles content into executable
  output.
- Class names or attributes that content can influence.

All escaping funnels through one module,
[`src/core/escape.ts`](src/core/escape.ts), and the only `v-html` in the library
is in [`src/components/DiffCode.vue`](src/components/DiffCode.vue). Those two
files are the places to look.

Out of scope: vulnerabilities in Vue itself, and anything requiring the consumer
to pass already-trusted HTML through a separate sanitizer of their own.

## Supported versions

Only the latest release receives security fixes. This is a young library with a
single maintainer; older versions are not backported.
