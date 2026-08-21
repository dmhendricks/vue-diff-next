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
 * `Languages` covers the grammars worth judging a theme against (plus aliases
 * like `sass` → `scss`), with comments, numbers, strings, keywords, and whatever
 * else that grammar paints. Sub-grammars (`jsdoc`, `regex`, `todo`, …) are
 * exercised inside their hosts. Data / edge-case groups cover shapes a diff
 * viewer is actually handed.
 */
export const samples: Sample[] = [
    // ---------------------------------------------------------------- languages
    {
        key: 'javascript',
        title: 'JavaScript',
        group: 'Languages',
        language: 'javascript',
        prev: `import { createStore } from './store';

/* Shared defaults for the client store. */
const DEFAULTS = {
  retries: 3,
  timeout: 5000,
  verbose: false,
};

export class TimeoutError extends Error {}

export function greet(name) {
  const greeting = 'Hello';
  console.log(greeting + ', ' + name);
  return true;
}

export async function fetchAll(urls) {
  // Sequential on purpose: easier to reason about failures.
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

/* Shared defaults for the client store. Override per environment. */
const DEFAULTS = {
  retries: 5,
  timeout: 10000,
  verbose: true,
  backoff: 'exponential',
};

export class TimeoutError extends Error {}

export function greet(name, punctuation = '!') {
  const greeting = 'Hi';
  logger.info(\`\${greeting}, \${name}\${punctuation}\`);
  return true;
}

export async function fetchAll(urls) {
  // Parallel now: the sequential loop was the bottleneck.
  if (!urls) return null;
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
        prev: `/* Look up a user by numeric id. */
interface User {
  id: number;
  name: string;
  email?: string;
}

type Result = { ok: true; user: User } | { ok: false; error: string };

export class UserStore {
  // Linear scan is fine for the fixture size.
  findUser(users: User[], id: number): Result {
    const user = users.find((u) => u.id === id);
    if (!user || id === 0) {
      return { ok: false, error: 'not found' };
    }
    return { ok: true, user };
  }
}
`,
        current: `/* Look up a user by string id. */
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  roles: readonly string[];
}

type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

export class UserStore {
  // Index by id once the list is larger than a handful of rows.
  findUser(users: readonly User[], id: string): Result<User> {
    const user = users.find((u) => u.id === id);
    if (!user || id.length === 0) {
      return { ok: false, error: new Error(\`no user \${id}\`) };
    }
    return { ok: true, value: user };
  }
}
`,
    },
    {
        key: 'html',
        title: 'HTML',
        group: 'Languages',
        language: 'html',
        prev: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Testing</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="canonical" href="https://example.com/" />
    <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
</head>
<body>
    <!-- Skip link: first focusable control -->
    <a href="#content" class="sr-only" accesskey="s">
        Skip to main content
    </a>

    <main id="content" tabindex="-1">
        <p>This is a test.</p>
        <p id="status">The DOM is loaded!</p>
    </main>

    <footer>Copyright &copy;2026</footer>

    <script src="https://unpkg.com/jquery/jquery.min.js"></script>
</body>
</html>
`,
        current: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Demo Page</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="canonical" href="https://github.com" />
    <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
    <link rel="stylesheet" href="https://unpkg.com/basscss/basscss.min.css" />
</head>
<body>
    <!-- Skip link: first focusable control -->
    <a href="#content" class="sr-only" accesskey="s">
        Skip to main content
    </a>

    <h3>Welcome</h3>

    <main id="content" tabindex="-1">
        <div>This is a demo page.</div>
        <p id="status">The DOM is loaded!</p>
    </main>

    <footer>Copyright &copy;2026</footer>

    <script src="https://unpkg.com/jquery/jquery.min.js?ver=4.0.0"></script>
</body>
</html>
`,
    },
    {
        key: 'scss',
        title: 'SCSS',
        group: 'Languages',
        language: 'scss',
        prev: `// Default button surface
@use 'sass:color';

$primary: #007bff !default;
$name: 'primary';

@mixin surface($pad: 8px 16px) {
  padding: $pad;
  border: 0;
}

.button-#{$name} {
  @include surface;
  color: #fff;
  background: $primary;

  /* Hover darkens the fill */
  &:hover {
    background: color.adjust($primary, $lightness: -10%);
  }
}
`,
        current: `// Default button surface
@use 'sass:color';
@use 'sass:map';

$primary: #0d6efd !default;
$name: 'primary';
$radius: 4px;
$spacing: (y: 10px, x: 20px);

@mixin surface($pad: 10px 20px) {
  padding: $pad;
  border: 0;
  border-radius: $radius;
}

.button-#{$name} {
  @include surface(map.get($spacing, y) map.get($spacing, x));
  color: #f8f9fa;
  background: $primary;

  /* Hover darkens the fill */
  &:hover {
    background: color.adjust($primary, $lightness: -12%);
  }

  &:disabled {
    opacity: 0.5;
  }
}
`,
    },
    {
        key: 'php',
        title: 'PHP',
        group: 'Languages',
        language: 'php',
        prev: `<h1><?= $title ?></h1>
<?php
// Find a user by id
function findUser(int $id) {
  $row = db()->one('SELECT * FROM users WHERE id = ?', [$id]);
  if ($row === false) {
    return null;
  }
  return $row;
}
`,
        current: `<h1><?= htmlspecialchars($title) ?></h1>
<?php
declare(strict_types=1);

// Find a user by id
#[Deprecated]
function findUser(int $id): ?User {
  $row = db()->one('SELECT * FROM users WHERE id = ?', [$id]);
  return $row ? User::from($row) : null;
}
`,
    },
    {
        key: 'python',
        title: 'Python',
        group: 'Languages',
        language: 'python',
        prev: `import os

# Load a file from disk as text.
def load(path):
    with open(path) as f:
        return f.read()

class Parser:
    """Split records on newlines."""

    def __init__(self, strict=False):
        self.strict = strict
        self.max_lines = 100

    def parse(self, text):
        if text is None:
            return []
        return [l for l in text.split("\\n") if l]
`,
        current: `import os
from pathlib import Path

# Load a file from disk as UTF-8 text.
def load(path: str | Path) -> str:
    return Path(path).read_text(encoding="utf-8")

class Parser:
    """Split records on newlines and strip empties."""

    def __init__(self, strict: bool = True, encoding: str = "utf-8"):
        self.strict = strict
        self.encoding = encoding
        self.max_lines = 1000

    def parse(self, text: str) -> list[str]:
        if text is None:
            return []
        return [line.strip() for line in text.splitlines() if line.strip()]
`,
    },
    {
        key: 'yaml',
        title: 'YAML',
        group: 'Languages',
        language: 'yaml',
        prev: `# GitHub Actions workflow
name: "build"
on:
  push:
    branches:
      - main
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    retries: !!int 1
    continue-on-error: No
    env:
      NODE_ENV: production
    steps:
      - uses: actions/checkout@v4
    summary: |
      Checkout and test on main.
`,
        current: `# GitHub Actions workflow
name: "ci"
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
    retries: !!int 3
    continue-on-error: Yes
    env:
      NODE_ENV: "development"
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
    summary: |
      Checkout, install Node, and test
      on main, develop, and pull requests.
`,
    },
    {
        key: 'sql',
        title: 'SQL',
        group: 'Languages',
        language: 'sql',
        prev: `-- Active users, oldest names first
SELECT u.id, u.name
FROM users u
WHERE u.active = TRUE
ORDER BY u.name ASC;
`,
        current: `-- Active users with at least one order
SELECT u.id, u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.active = TRUE
  /* Exclude soft-deleted rows */
  AND u.deleted_at IS NULL
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 0
ORDER BY order_count DESC, u.name ASC
LIMIT 100;
`,
    },
    {
        key: 'diff',
        title: 'Diff of a diff',
        group: 'Languages',
        language: 'diff',
        prev: `--- a/config.ini
+++ b/config.ini
@@ -1,4 +1,4 @@
 [server]
 host = localhost
-port = 80
+port = 8080
`,
        current: `--- a/config.ini
+++ b/config.ini
@@ -1,5 +1,6 @@
 [server]
 host = localhost
-port = 8080
+port = 443
+tls = on
`,
    },
    {
        key: 'asm',
        title: 'Assembly',
        group: 'Languages',
        language: 'asm',
        prev: `; add two constants
section .text
global main
extern printf

main:
	mov eax, 3
	add eax, 5
	ret
`,
        current: `; add two constants, then print
section .text
global main
extern printf

main:
	mov eax, 8
	add eax, 13
	call printf
	ret
`,
    },
    {
        key: 'bash',
        title: 'Bash',
        group: 'Languages',
        language: 'bash',
        prev: `#!/usr/bin/env bash
# Retry a command a few times.
MAX=3
verbose=false

retry() {
  local n=1
  until "$@"; do
    if [ "$n" -ge "$MAX" ]; then
      echo "failed after $n tries"
      return 1
    fi
    n=$((n + 1))
  done
}

retry echo hello
`,
        current: `#!/usr/bin/env bash
# Retry a command with backoff.
MAX=5
verbose=true

retry() {
  local n=1
  until "$@"; do
    if [ "$n" -ge "$MAX" ]; then
      echo "failed after $n tries"
      return 1
    fi
    sleep "$n"
    n=$((n + 1))
  done
}

retry curl -fsS https://example.com
`,
    },
    {
        key: 'c',
        title: 'C',
        group: 'Languages',
        language: 'c',
        prev: `/* Sum a small array. */
#include <stdio.h>

#define N 3

int sum(int *xs, int n) {
  int total = 0;
  for (int i = 0; i < n; i++) {
    total += xs[i];
  }
  return total;
}

int main(void) {
  int xs[N] = {1, 2, 3};
  // Always print.
  printf("%d\\n", sum(xs, N));
  return 0;
}
`,
        current: `/* Sum a small array, skip zeros. */
#include <stdio.h>

#define N 4

int sum(int *xs, int n) {
  int total = 0;
  for (int i = 0; i < n; i++) {
    if (xs[i] == 0) continue;
    total += xs[i];
  }
  return total;
}

int main(void) {
  int xs[N] = {1, 2, 0, 4};
  printf("%d\\n", sum(xs, N));
  return 0;
}
`,
    },
    {
        key: 'css',
        title: 'CSS',
        group: 'Languages',
        language: 'css',
        prev: `/* Page chrome */
:root {
  --gap: 8px;
}

.button {
  color: #fff;
  background: #007bff;
  padding: 8px 16px;
}

@media (min-width: 768px) {
  .button { padding: 10px 20px; }
}
`,
        current: `/* Page chrome */
:root {
  --gap: 12px;
}

.button {
  color: #f8f9fa;
  background: #0d6efd;
  padding: 10px 20px;
  border-radius: 4px;
}

@media (min-width: 1024px) {
  .button { padding: 12px 24px; }
}
`,
    },
    {
        key: 'docker',
        title: 'Dockerfile',
        group: 'Languages',
        language: 'docker',
        prev: `# App image
FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install
EXPOSE 3000
CMD ["node", "server.js"]
`,
        current: `# App image
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json .
RUN npm ci --omit=dev
ENV NODE_ENV=production
EXPOSE 8080
USER node
CMD ["node", "server.js"]
`,
    },
    {
        key: 'go',
        title: 'Go',
        group: 'Languages',
        language: 'go',
        prev: `package main

import "fmt"

// Greet returns a hello.
func Greet(name string) string {
  if name == "" {
    return "Hello"
  }
  return fmt.Sprintf("Hello, %s", name)
}

func main() {
  fmt.Println(Greet("Ada"))
}
`,
        current: `package main

import "fmt"

const MaxName = 32

// Greet returns a hello, truncated.
func Greet(name string) string {
  if name == "" {
    return "Hi"
  }
  if len(name) > MaxName {
    name = name[:MaxName]
  }
  return fmt.Sprintf("Hi, %s", name)
}

func main() {
  fmt.Println(Greet("Ada"))
}
`,
    },
    {
        key: 'java',
        title: 'Java',
        group: 'Languages',
        language: 'java',
        prev: `package app;

/** A tiny greeter. */
public class Greeter {
  private static final int MAX = 3;

  // Returns a hello.
  public String greet(String name) {
    if (name == null) {
      return "Hello";
    }
    return "Hello, " + name;
  }
}
`,
        current: `package app;

/** A tiny greeter. */
public class Greeter {
  private static final int MAX = 8;

  public String greet(String name) {
    if (name == null || name.isEmpty()) {
      return "Hi";
    }
    return "Hi, " + name;
  }
}
`,
    },
    {
        key: 'markdown',
        title: 'Markdown',
        group: 'Languages',
        language: 'markdown',
        prev: `# Notes

A *small* list:

1. Install
2. Run \`npm test\`

See [docs](https://example.com).
`,
        current: `# Notes

A **small** list:

1. Install
2. Run \`npm test\`
3. Open the [demo](https://example.com/demo)

> Ship when green.
`,
    },
    {
        key: 'perl',
        title: 'Perl',
        group: 'Languages',
        language: 'perl',
        prev: `#!/usr/bin/env perl
# Greet a user
use strict;

my $MAX = 3;

sub greet {
  my ($name) = @_;
  return "Hello" unless $name;
  return "Hello, $name";
}

print greet("Ada"), "\\n";
`,
        current: `#!/usr/bin/env perl
# Greet a user
use strict;

my $MAX = 8;

sub greet {
  my ($name) = @_;
  return "Hi" unless $name;
  return "Hi, $name";
}

print greet("Ada"), "\\n";
`,
    },
    {
        key: 'rust',
        title: 'Rust',
        group: 'Languages',
        language: 'rust',
        prev: `/// Greet a user.
pub fn greet(name: &str) -> String {
    // Empty names get a generic hello.
    if name.is_empty() {
        return "Hello".into();
    }
    format!("Hello, {}", name)
}

fn main() {
    println!("{}", greet("Ada"));
}
`,
        current: `const MAX: usize = 32;

/// Greet a user.
pub fn greet(name: &str) -> String {
    if name.is_empty() {
        return "Hi".into();
    }
    format!("Hi, {}", &name[..name.len().min(MAX)])
}

fn main() {
    println!("{}", greet("Ada"));
}
`,
    },
    {
        key: 'xml',
        title: 'XML',
        group: 'Languages',
        language: 'xml',
        prev: `<?xml version="1.0" encoding="UTF-8"?>
<!-- widget list -->
<items count="2">
  <item id="1" enabled="true">Widget</item>
  <item id="2" enabled="false">Gadget</item>
</items>
`,
        current: `<?xml version="1.0" encoding="UTF-8"?>
<!-- widget list -->
<items count="3">
  <item id="1" enabled="true">Widget</item>
  <item id="2" enabled="true">Gadget</item>
  <item id="3" enabled="false">Sprocket</item>
</items>
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
        prev: `# Listen address
[server]
host = "localhost"
port = 8080
debug = false

[database]
url = "postgres://localhost/dev"
pool = 5
`,
        current: `# Listen address
[server]
host = "0.0.0.0"
port = 443
debug = true
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
        prev: `# worker boot
2026-08-04 10:00:01 INFO  starting worker pid=1234
2026-08-04 10:00:02 DEBUG connecting to queue
2026-08-04 10:00:02 INFO  connected
2026-08-04 10:00:05 WARN  slow query took 1200ms
2026-08-04 10:00:09 INFO  job 41 complete
`,
        current: `# worker boot
2026-08-05 10:00:01 INFO  starting worker pid=5678
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
export const groups: Array<{ name: string; samples: Sample[] }> = samples
    .reduce(
        (acc, sample) => {
            const existing = acc.find((g) => g.name === sample.group);
            if (existing) existing.samples.push(sample);
            else acc.push({ name: sample.group, samples: [sample] });
            return acc;
        },
        [] as Array<{ name: string; samples: Sample[] }>,
    )
    .map((group) =>
        group.name === 'Languages'
            ? {
                  ...group,
                  samples: [...group.samples].sort((a, b) => a.title.localeCompare(b.title)),
              }
            : group,
    );

export const MODES: Mode[] = ['split', 'unified'];

const EXTRA_THEMES = [
    'monokai-dark',
    'visual-studio-light',
    'visual-studio-dark',
    'atom-dark',
    'atom-light',
    'github-dark',
    'github-light',
    'coral-dark',
    'coral-light',
    'twilight-dark',
] as const;

export const THEMES: Theme[] = [
    'dark',
    'light',
    ...[...EXTRA_THEMES].sort((a, b) => a.localeCompare(b)),
];
