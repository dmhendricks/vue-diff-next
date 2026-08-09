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
    virtualScroll?: boolean | { height?: number; lineMinHeight?: number; delay?: number };
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
        prev: `<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue Diff</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/dev/main.ts"></script>
</body>
</html>
`,
        current: `<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue Diff</title>
  <link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-900">
  <div id="app"></div>
  <script type="module" src="/dev/main.ts"></script>
  <script async defer src="https://buttons.github.io/buttons.js"></script>
</body>
</html>
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

    // ---------------------------------------------------------- miscellaneous
    {
        key: 'identical',
        title: 'Identical input',
        group: 'Miscellaneous',
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
        key: 'huge',
        title: 'Huge — 2000 lines',
        group: 'Miscellaneous',
        language: 'json',
        inputDelay: 150,
        virtualScroll: { height: 500 },
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
