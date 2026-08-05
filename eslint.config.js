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
    // Build scripts and configs run in Node, not the browser.
    {
        files: ['scripts/**/*.js', '*.config.{js,ts}'],
        languageOptions: {
            globals: globals.node,
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
