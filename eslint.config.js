import js from '@eslint/js';
import ts from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default ts.config(
    { ignores: ['dist', 'dist-demo', 'coverage', 'node_modules', 'tests/fixtures'] },
    js.configs.recommended,
    ...ts.configs.recommended,
    ...vue.configs['flat/recommended'],
    {
        files: ['**/*.vue'],
        languageOptions: {
            parserOptions: { parser: ts.parser },
        },
    },
    // Library source targets the browser.
    {
        files: ['src/**/*.{ts,vue}'],
        languageOptions: {
            globals: globals.browser,
        },
    },
    // Build scripts and configs run in Node, not the browser.
    {
        files: ['scripts/**/*.js', '*.config.{js,ts}'],
        languageOptions: {
            globals: globals.node,
        },
    },
    // Specs run in jsdom (or a real browser, for *.browser-spec.ts) with Node APIs
    // available for fixture reading.
    {
        files: ['src/**/*.spec.ts', 'src/**/*.browser-spec.ts'],
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
        },
        rules: {
            // Specs legitimately call createApp more than once per file; the rule
            // is about SFC authoring, not tests.
            'vue/one-component-per-file': 'off',
        },
    },
    // The demo builds a copy-pasteable SFC snippet inside a template literal. That
    // string contains a closing script tag, which must stay escaped as `<\/script>`
    // — unescaped, it would terminate the demo's own <script setup> block when the
    // SFC is parsed. The rule reads the escape as redundant; it is load-bearing.
    {
        files: ['demo/**/*.vue'],
        rules: {
            'no-useless-escape': 'off',
        },
    },
    {
        rules: {
            'vue/multi-word-component-names': 'off',
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
        },
    },
    // Prettier last: turns off stylistic rules that would conflict with it.
    prettier,
);
