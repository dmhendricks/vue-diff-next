import type { Mode, Theme } from '../../src/types';

export interface Sample {
    key: string;
    title: string;
    language: string;
    prev: string;
    current: string;
    /** Set where a sample exists to exercise a specific prop. */
    folding?: boolean;
    inputDelay?: number;
}

/**
 * Demo inputs.
 *
 * The first four mirror the original vue-diff demo's own presets, so the
 * side-by-side comparison is judged on its test cases rather than ones chosen to
 * flatter this implementation. The rest cover what its demo never exercised but
 * this library must handle: identical input, word-level changes, escaping, and
 * folding.
 */
export const samples: Sample[] = [
    {
        key: 'javascript',
        title: 'JavaScript',
        language: 'javascript',
        prev: `function greet(name) {
  const greeting = 'Hello';
  console.log(greeting + ', ' + name);
  return true;
}

const items = [1, 2, 3];
items.forEach(function (i) {
  console.log(i);
});
`,
        current: `function greet(name, punctuation = '!') {
  const greeting = 'Hi';
  console.log(\`\${greeting}, \${name}\${punctuation}\`);
  return true;
}

const items = [1, 2, 3, 4];
items.forEach((i) => {
  console.log(i * 2);
});
`,
    },
    {
        key: 'html',
        title: 'HTML',
        language: 'html',
        prev: `<div class="card">
  <h2 class="title">Old heading</h2>
  <p>Some text here.</p>
  <ul>
    <li>One</li>
    <li>Two</li>
  </ul>
</div>
`,
        current: `<div class="card card--wide">
  <h2 class="title">New heading</h2>
  <p>Some other text here.</p>
  <ul>
    <li>One</li>
    <li>Two</li>
    <li>Three</li>
  </ul>
</div>
`,
    },
    {
        key: 'scss',
        title: 'SCSS',
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
}
`,
    },
    {
        key: 'yaml',
        title: 'YAML',
        language: 'yaml',
        prev: `name: build
on:
  push:
    branches:
      - main
jobs:
  test:
    runs-on: ubuntu-latest
`,
        current: `name: ci
on:
  push:
    branches:
      - main
      - develop
jobs:
  test:
    runs-on: ubuntu-24.04
    timeout-minutes: 10
`,
    },
    {
        key: 'identical',
        title: 'Identical input',
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
        key: 'words',
        title: 'Word-level changes',
        language: 'plaintext',
        prev: `The quick brown fox jumps over the lazy dog.
This line is completely unchanged.
Only one word differs on this line.
`,
        current: `The quick red fox leaps over the lazy dog.
This line is completely unchanged.
Only one term differs on this line.
`,
    },
    {
        key: 'escaping',
        title: 'Escaping',
        language: 'html',
        prev: `<script>alert('before')</script>
<img src=x onerror="alert(1)">
a < b && c > d
`,
        current: `<script>alert('after')</script>
<img src=y onerror="alert(2)">
a < b && c > d
`,
    },
    {
        key: 'folding',
        title: 'Folding',
        language: 'plaintext',
        folding: true,
        prev: [
            'header line',
            ...Array.from({ length: 20 }, (_, i) => `unchanged line ${i + 1}`),
            'OLD footer',
        ].join('\n'),
        current: [
            'header line',
            ...Array.from({ length: 20 }, (_, i) => `unchanged line ${i + 1}`),
            'NEW footer',
        ].join('\n'),
    },
    {
        key: 'large',
        title: 'Large input',
        language: 'javascript',
        inputDelay: 100,
        prev: Array.from(
            { length: 600 },
            (_, i) => `const value${i} = compute(${i}, 'alpha');`,
        ).join('\n'),
        current: Array.from(
            { length: 600 },
            (_, i) => `const value${i} = compute(${i}, ${i % 50 === 0 ? "'beta'" : "'alpha'"});`,
        ).join('\n'),
    },
];

export const MODES: Mode[] = ['split', 'unified'];
export const THEMES: Theme[] = ['dark', 'light'];
