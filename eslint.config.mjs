import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [
    ...compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended'),
    {
        plugins: { '@typescript-eslint': typescriptEslint },

        languageOptions: {
            globals: { ...globals.node },

            parser: tsParser,
            ecmaVersion: 12,
            sourceType: 'module'
        },

        rules: {
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/ban-types': 'off',
            '@typescript-eslint/no-require-imports': 'off',
            quotes: ['error', 'single'],
            semi: ['error', 'always'],
            'no-loss-of-precision': 'error',
            'no-template-curly-in-string': 'error',
            'template-curly-spacing': 'error',
            'no-unreachable-loop': 'error',
            'no-useless-backreference': 'error',
            'accessor-pairs': 'warn',
            'array-callback-return': 'error',
            'block-scoped-var': 'error',
            'dot-notation': 'error',
            eqeqeq: 'error',
            'grouped-accessor-pairs': 'error',
            'no-alert': 'error',
            'no-caller': 'error',
            'no-constructor-return': 'error',
            'no-div-regex': 'error',
            'no-else-return': 'error',
            'no-eq-null': 'error',
            'no-extend-native': 'error',
            'no-extra-bind': 'error',
            'no-extra-label': 'error',
            'no-floating-decimal': 'error',
            'no-implicit-coercion': 'error',
            'no-implicit-globals': 'error',
            'no-implied-eval': 'error',
            'no-invalid-this': 'error',
            'no-iterator': 'error',
            'no-labels': 'error',
            'no-lone-blocks': 'error',
            'no-loop-func': 'error',
            'no-multi-spaces': 'error',
            'no-multi-str': 'error',
            'no-new': 'error',
            'no-new-func': 'error',
            'no-new-wrappers': 'error',
            'no-octal-escape': 'error',
            'no-proto': 'error',
            'no-return-assign': 'error',
            'no-script-url': 'error',
            'no-self-compare': 'error',
            'no-throw-literal': 'error',
            'no-unmodified-loop-condition': 'error',
            'no-unused-expressions': 'error',
            'no-useless-call': 'error',
            'no-useless-concat': 'error',
            'no-useless-return': 'error',
            'prefer-const': 'error',
            'prefer-promise-reject-errors': 'error',
            'prefer-regex-literals': 'error',
            'require-await': 'error',
            'wrap-iife': 'error',
            yoda: 'error',
            'no-extra-semi': 'error',
            'comma-dangle': 'error',
            'comma-spacing': 'error',
            'new-parens': 'error',
            'no-array-constructor': 'error',
            'no-lonely-if': 'error',
            'no-new-object': 'error',
            'no-trailing-spaces': 'error',
            'no-unneeded-ternary': 'error',
            'no-whitespace-before-property': 'error',

            'object-curly-newline': ['error', { multiline: true }],

            'object-curly-spacing': ['error', 'always'],
            'key-spacing': ['error'],
            'computed-property-spacing': ['error', 'never'],
            'operator-assignment': 'error',
            'prefer-exponentiation-operator': 'error',
            'prefer-object-spread': 'error',
            'space-before-blocks': 'error',
            'space-infix-ops': 'error',
            'space-unary-ops': 'error',
            'spaced-comment': 'error',
            'switch-colon-spacing': 'error',
            'wrap-regex': 'error',
            'arrow-spacing': 'error',
            'no-confusing-arrow': 'error',
            'no-useless-computed-key': 'error',
            'no-var': 'error',
            'prefer-arrow-callback': 'error',
            'prefer-numeric-literals': 'error',
            'prefer-spread': 'error',
            'prefer-template': 'error',
            'symbol-description': 'error'
        }
    }
];