/*
 * The Unicode sample deliberately contains a zero-width character, which is the
 * whole point of that case — disabled for the file rather than the line, since
 * the offender sits inside a template literal where a line-scoped comment cannot
 * reach it.
 */
/* eslint-disable no-irregular-whitespace */
import type { Mode, Theme } from '../../src/types';

export interface Sample {
    key: string;
    title: string;
    /** Groups the picker; purely presentational. */
    group: string;
    language: string;
    prev: string;
    current: string;
    /** Set where a sample exists to exercise a specific prop. */
    folding?: boolean;
    inputDelay?: number;
}

const lines = (n: number, f: (i: number) => string) => Array.from({ length: n }, (_, i) => f(i));

/**
 * Demo inputs.
 *
 * The `Languages` group mirrors the original vue-diff demo's presets, so the
 * side-by-side comparison is judged on its cases rather than ones chosen to
 * flatter this implementation. Everything else covers ground its demo never
 * touched: data shapes this library will actually be handed, and the inputs most
 * likely to break a diff viewer — mixed encodings, pathological whitespace, very
 * long lines, reordered content, and text that looks like markup.
 */
export const samples: Sample[] = [
    // ---------------------------------------------------------------- languages
    {
        key: 'javascript',
        title: 'JavaScript',
        group: 'Languages',
        language: 'javascript',
        prev: `import { createStore } from './store';

const DEFAULTS = {
  retries: 3,
  timeout: 5000,
  verbose: false,
};

export function greet(name) {
  const greeting = 'Hello';
  console.log(greeting + ', ' + name);
  return true;
}

export async function fetchAll(urls) {
  const results = [];
  for (const url of urls) {
    const res = await fetch(url);
    results.push(await res.json());
  }
  return results;
}

const items = [1, 2, 3];
items.forEach(function (i) {
  console.log(i);
});

export default createStore(DEFAULTS);
`,
        current: `import { createStore } from './store';
import { logger } from './logger';

const DEFAULTS = {
  retries: 5,
  timeout: 10000,
  verbose: true,
  backoff: 'exponential',
};

export function greet(name, punctuation = '!') {
  const greeting = 'Hi';
  logger.info(\`\${greeting}, \${name}\${punctuation}\`);
  return true;
}

export async function fetchAll(urls) {
  // Parallel now: the sequential loop was the bottleneck.
  const responses = await Promise.all(urls.map((url) => fetch(url)));
  return Promise.all(responses.map((res) => res.json()));
}

const items = [1, 2, 3, 4];
items.forEach((i) => {
  logger.debug(i * 2);
});

export default createStore(DEFAULTS);
`,
    },
    {
        key: 'typescript',
        title: 'TypeScript',
        group: 'Languages',
        language: 'typescript',
        prev: `interface User {
  id: number;
  name: string;
  email?: string;
}

type Result = { ok: true; user: User } | { ok: false; error: string };

export function findUser(users: User[], id: number): Result {
  const user = users.find((u) => u.id === id);
  if (!user) {
    return { ok: false, error: 'not found' };
  }
  return { ok: true, user };
}
`,
        current: `interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  roles: readonly string[];
}

type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

export function findUser(users: readonly User[], id: string): Result<User> {
  const user = users.find((u) => u.id === id);
  if (!user) {
    return { ok: false, error: new Error(\`no user \${id}\`) };
  }
  return { ok: true, value: user };
}
`,
    },
    {
        key: 'html',
        title: 'HTML',
        group: 'Languages',
        language: 'html',
        prev: `<div class="card">
  <h2 class="title">Old heading</h2>
  <p>Some text here.</p>
  <ul>
    <li>One</li>
    <li>Two</li>
  </ul>
  <img src="a.png" alt="">
</div>
`,
        current: `<div class="card card--wide" data-id="7">
  <h2 class="title">New heading</h2>
  <p>Some other text here.</p>
  <ul>
    <li>One</li>
    <li>Two</li>
    <li>Three</li>
  </ul>
  <img src="b.webp" alt="A picture" loading="lazy">
</div>
`,
    },
    {
        key: 'scss',
        title: 'SCSS',
        group: 'Languages',
        language: 'scss',
        prev: `$primary: #007bff;

.button {
  color: #fff;
  background: $primary;
  padding: 8px 16px;

  &:hover {
    background: darken($primary, 10%);
  }
}
`,
        current: `$primary: #0d6efd;
$radius: 4px;

.button {
  color: #f8f9fa;
  background: $primary;
  padding: 10px 20px;
  border-radius: $radius;

  &:hover {
    background: darken($primary, 12%);
  }

  &:disabled {
    opacity: 0.5;
  }
}
`,
    },
    {
        key: 'python',
        title: 'Python',
        group: 'Languages',
        language: 'python',
        prev: `import os

def load(path):
    with open(path) as f:
        return f.read()

class Parser:
    def __init__(self, strict=False):
        self.strict = strict

    def parse(self, text):
        return [l for l in text.split("\\n") if l]
`,
        current: `import os
from pathlib import Path

def load(path: str | Path) -> str:
    return Path(path).read_text(encoding="utf-8")

class Parser:
    def __init__(self, strict: bool = True, encoding: str = "utf-8"):
        self.strict = strict
        self.encoding = encoding

    def parse(self, text: str) -> list[str]:
        return [line.strip() for line in text.splitlines() if line.strip()]
`,
    },
    {
        key: 'yaml',
        title: 'YAML',
        group: 'Languages',
        language: 'yaml',
        prev: `name: build
on:
  push:
    branches:
      - main
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`,
        current: `name: ci
on:
  push:
    branches:
      - main
      - develop
  pull_request:
jobs:
  test:
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
`,
    },
    {
        key: 'sql',
        title: 'SQL',
        group: 'Languages',
        language: 'sql',
        prev: `SELECT u.id, u.name
FROM users u
WHERE u.active = 1
ORDER BY u.name ASC;
`,
        current: `SELECT u.id, u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.active = 1
  AND u.deleted_at IS NULL
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 0
ORDER BY order_count DESC, u.name ASC
LIMIT 100;
`,
    },
    {
        key: 'diff',
        title: 'A diff of a diff',
        group: 'Languages',
        language: 'diff',
        prev: `--- a/config.ini
+++ b/config.ini
@@ -1,3 +1,3 @@
 [server]
-port = 80
+port = 8080
`,
        current: `--- a/config.ini
+++ b/config.ini
@@ -1,4 +1,5 @@
 [server]
-port = 8080
+port = 443
+tls = on
`,
    },

    // ------------------------------------------------------------- data shapes
    {
        key: 'json-object',
        title: 'JSON — nested object',
        group: 'Data',
        language: 'json',
        prev: `{
  "name": "example",
  "version": "1.0.0",
  "private": false,
  "count": 42,
  "ratio": 0.5,
  "enabled": true,
  "tags": null,
  "nested": {
    "deep": {
      "deeper": {
        "value": "unchanged"
      }
    }
  },
  "list": [1, 2, 3],
  "mixed": [1, "two", true, null, { "k": "v" }]
}
`,
        current: `{
  "name": "example",
  "version": "2.0.0",
  "private": true,
  "count": -42,
  "ratio": 0.55,
  "enabled": false,
  "tags": [],
  "nested": {
    "deep": {
      "deeper": {
        "value": "unchanged"
      },
      "sibling": "added"
    }
  },
  "list": [1, 2, 3, 4, 5],
  "mixed": [1, "two", false, null, { "k": "w" }]
}
`,
    },
    {
        key: 'numbers',
        title: 'Numbers — precision and format',
        group: 'Data',
        language: 'json',
        prev: `{
  "int": 1,
  "negative": -1,
  "zero": 0,
  "negativeZero": 0,
  "float": 1.5,
  "precision": 0.1,
  "exponent": 1e10,
  "big": 9007199254740991,
  "hexish": "0xFF",
  "leadingZero": "007",
  "currency": "1,234.56",
  "percent": "50%"
}
`,
        current: `{
  "int": 10,
  "negative": -100,
  "zero": 0,
  "negativeZero": -0,
  "float": 1.50,
  "precision": 0.10000000000000001,
  "exponent": 1e-10,
  "big": 9007199254740993,
  "hexish": "0xff",
  "leadingZero": "07",
  "currency": "1234.56",
  "percent": "50.0%"
}
`,
    },
    {
        key: 'csv',
        title: 'CSV — reordered rows',
        group: 'Data',
        language: 'csv',
        prev: `id,name,qty,price
1,Widget,10,9.99
2,Gadget,5,24.50
3,Doohickey,0,1.00
4,Thing,7,15.75
`,
        current: `id,name,qty,price,sku
2,Gadget,5,24.50,GDG-2
1,Widget,12,9.99,WDG-1
4,Thing,7,15.75,THG-4
5,Sprocket,3,4.25,SPR-5
`,
    },
    {
        key: 'toml',
        title: 'TOML — config',
        group: 'Data',
        language: 'toml',
        prev: `[server]
host = "localhost"
port = 8080

[database]
url = "postgres://localhost/dev"
pool = 5
`,
        current: `[server]
host = "0.0.0.0"
port = 443
tls = true

[database]
url = "postgres://db.internal/prod"
pool = 20
timeout_ms = 3000

[cache]
driver = "redis"
`,
    },
    {
        key: 'log',
        title: 'Log output',
        group: 'Data',
        language: 'log',
        prev: `2026-08-04 10:00:01 INFO  starting worker pid=1234
2026-08-04 10:00:02 DEBUG connecting to queue
2026-08-04 10:00:02 INFO  connected
2026-08-04 10:00:05 WARN  slow query took 1200ms
2026-08-04 10:00:09 INFO  job 41 complete
`,
        current: `2026-08-05 10:00:01 INFO  starting worker pid=5678
2026-08-05 10:00:02 DEBUG connecting to queue
2026-08-05 10:00:02 INFO  connected
2026-08-05 10:00:04 ERROR connection reset by peer
2026-08-05 10:00:04 WARN  retrying in 500ms
2026-08-05 10:00:09 INFO  job 41 complete
`,
    },

    // ------------------------------------------------------------- edge cases
    {
        key: 'identical',
        title: 'Identical input',
        group: 'Edge cases',
        language: 'json',
        prev: `{
  "level": "info",
  "message": "nothing changed here",
  "count": 3
}
`,
        current: `{
  "level": "info",
  "message": "nothing changed here",
  "count": 3
}
`,
    },
    {
        key: 'empty-prev',
        title: 'Empty before (all additions)',
        group: 'Edge cases',
        language: 'plaintext',
        prev: '',
        current: lines(6, (i) => `new line ${i + 1}`).join('\n') + '\n',
    },
    {
        key: 'empty-current',
        title: 'Empty after (all removals)',
        group: 'Edge cases',
        language: 'plaintext',
        prev: lines(6, (i) => `old line ${i + 1}`).join('\n') + '\n',
        current: '',
    },
    {
        key: 'words',
        title: 'Word-level changes',
        group: 'Edge cases',
        language: 'plaintext',
        prev: `The quick brown fox jumps over the lazy dog.
This line is completely unchanged.
Only one word differs on this line.
A single character changes: version 1.
Punctuation only, here!
`,
        current: `The quick red fox leaps over the lazy dog.
This line is completely unchanged.
Only one term differs on this line.
A single character changes: version 2.
Punctuation only, here?
`,
    },
    {
        key: 'whitespace',
        title: 'Whitespace-only changes',
        group: 'Edge cases',
        language: 'plaintext',
        prev: `no trailing space
trailing space here
\ttab indented
    four spaces
mixed \t indentation
`,
        current: `no trailing space
trailing space here
    tab indented
\tfour spaces
mixed  indentation
`,
    },
    {
        key: 'unicode',
        title: 'Unicode and emoji',
        group: 'Edge cases',
        language: 'plaintext',
        prev: `ascii only
中文字符测试
العربية من اليمين إلى اليسار
Ελληνικά γράμματα
emoji: 🎉 🚀 ✨
combining: café (e + accent)
zero-width: a​b
`,
        current: `ascii only
中文字符已更改
العربية من اليمين إلى اليسار
Ελληνικά γράμματα άλλαξαν
emoji: 🎉 🔥 ✨ 🐛
combining: café (precomposed)
zero-width: ab
`,
    },
    {
        key: 'looks-like-markup',
        title: 'Content that looks like markup',
        group: 'Edge cases',
        language: 'html',
        prev: `<script>alert('before')</script>
<img src=x onerror="alert(1)">
a < b && c > d
&amp; &lt; &gt; &quot; &#39;
<vue-diff-modified>sentinel</vue-diff-modified>
{{ interpolation }}
</code></pre><div>escape attempt</div>
`,
        current: `<script>alert('after')</script>
<img src=y onerror="alert(2)">
a < b || c > d
&amp; &lt; &gt; &apos; &#39;
<vue-diff-modified>SENTINEL</vue-diff-modified>
{{ other }}
</code></pre><div>another attempt</div>
`,
    },
    {
        key: 'long-lines',
        title: 'Very long lines',
        group: 'Edge cases',
        language: 'plaintext',
        prev:
            'short\n' +
            'x'.repeat(400) +
            '\n' +
            lines(3, (i) => `word${i} `.repeat(60)).join('\n') +
            '\n',
        current:
            'short\n' +
            'y'.repeat(400) +
            '\n' +
            lines(3, (i) => `word${i} `.repeat(60)).join('\n') +
            '\n',
    },
    {
        key: 'minified',
        title: 'Minified — one enormous line',
        group: 'Edge cases',
        language: 'js',
        prev: `!function(e,t){"object"==typeof exports?module.exports=t():e.lib=t()}(this,function(){return{version:"1.0.0",init:function(e){return this.opts=e||{},this}}});`,
        current: `!function(e,t){"object"==typeof exports?module.exports=t():e.lib=t()}(this,function(){return{version:"2.0.0",init:function(e){return this.opts=e||{},this.ready=!0,this}}});`,
    },
    {
        key: 'reordered',
        title: 'Reordered lines',
        group: 'Edge cases',
        language: 'plaintext',
        prev: `alpha
bravo
charlie
delta
echo
`,
        current: `echo
delta
charlie
bravo
alpha
`,
    },
    {
        key: 'indent-shift',
        title: 'Re-indented block',
        group: 'Edge cases',
        language: 'js',
        prev: `function outer() {
  const a = 1;
  const b = 2;
  return a + b;
}
`,
        current: `function outer() {
  if (enabled) {
    const a = 1;
    const b = 2;
    return a + b;
  }
  return 0;
}
`,
    },
    {
        key: 'no-trailing-newline',
        title: 'No trailing newline',
        group: 'Edge cases',
        language: 'plaintext',
        prev: 'first\nsecond\nthird',
        current: 'first\nsecond\nTHIRD',
    },
    {
        key: 'blank-lines',
        title: 'Blank-line churn',
        group: 'Edge cases',
        language: 'plaintext',
        prev: `one

two


three
`,
        current: `one
two

three


`,
    },

    // ---------------------------------------------------------------- at scale
    {
        key: 'folding',
        title: 'Folding — long unchanged run',
        group: 'At scale',
        language: 'plaintext',
        folding: true,
        prev:
            ['header line', ...lines(40, (i) => `unchanged line ${i + 1}`), 'OLD footer'].join(
                '\n',
            ) + '\n',
        current:
            ['header line', ...lines(40, (i) => `unchanged line ${i + 1}`), 'NEW footer'].join(
                '\n',
            ) + '\n',
    },
    {
        key: 'folding-multi',
        title: 'Folding — several gaps',
        group: 'At scale',
        language: 'js',
        folding: true,
        prev: [
            'const a = 1;',
            ...lines(15, (i) => `  // filler ${i}`),
            'const OLD_B = 2;',
            ...lines(15, (i) => `  // more ${i}`),
            'const c = 3;',
            ...lines(15, (i) => `  // tail ${i}`),
            'const OLD_D = 4;',
        ].join('\n'),
        current: [
            'const a = 1;',
            ...lines(15, (i) => `  // filler ${i}`),
            'const NEW_B = 22;',
            ...lines(15, (i) => `  // more ${i}`),
            'const c = 3;',
            ...lines(15, (i) => `  // tail ${i}`),
            'const NEW_D = 44;',
        ].join('\n'),
    },
    {
        key: 'large',
        title: 'Large — 600 lines',
        group: 'At scale',
        language: 'javascript',
        inputDelay: 100,
        prev: lines(600, (i) => `const value${i} = compute(${i}, 'alpha');`).join('\n'),
        current: lines(
            600,
            (i) => `const value${i} = compute(${i}, ${i % 50 === 0 ? "'beta'" : "'alpha'"});`,
        ).join('\n'),
    },
    {
        key: 'huge',
        title: 'Huge — 2000 lines',
        group: 'At scale',
        language: 'json',
        inputDelay: 150,
        prev: '{\n' + lines(2000, (i) => `  "key${i}": ${i},`).join('\n') + '\n  "last": true\n}\n',
        current:
            '{\n' +
            lines(2000, (i) => `  "key${i}": ${i % 100 === 0 ? i * 2 : i},`).join('\n') +
            '\n  "last": false\n}\n',
    },
];

/** Sample keys grouped in picker order, preserving first-seen group order. */
export const groups: Array<{ name: string; samples: Sample[] }> = samples.reduce(
    (acc, sample) => {
        const existing = acc.find((g) => g.name === sample.group);
        if (existing) existing.samples.push(sample);
        else acc.push({ name: sample.group, samples: [sample] });
        return acc;
    },
    [] as Array<{ name: string; samples: Sample[] }>,
);

export const MODES: Mode[] = ['split', 'unified'];
export const THEMES: Theme[] = ['dark', 'light'];
