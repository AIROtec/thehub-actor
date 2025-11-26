import prettier from 'eslint-config-prettier';

import apify from '@apify/eslint-config/ts.js';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

// eslint-disable-next-line import/no-default-export
export default [
    {
        ignores: [
            '**/dist',
            'eslint.config.mjs',
            '**/scripts/**',
            '**/vitest.config.ts',
            '**/coverage/**',
            '**/output/**',
            '**/storage/**',
        ],
    },
    ...apify,
    prettier,
    {
        languageOptions: {
            parser: tsEslint.parser,
            parserOptions: {
                project: 'tsconfig.json',
            },
            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },
        plugins: {
            '@typescript-eslint': tsEslint.plugin,
        },
        rules: {
            'no-console': 0,
        },
    },
    {
        files: ['test/**/*.ts'],
        languageOptions: {
            parser: tsEslint.parser,
            parserOptions: {
                project: 'tsconfig.test.json',
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            '@typescript-eslint/no-empty-function': 'off',
            'no-restricted-globals': 'off',
            'no-self-compare': 'off',
        },
    },
];
