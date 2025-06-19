// ESLint config para projetos Angular/TypeScript
// Segue boas práticas de código limpo

import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'max-len': ['warn', { code: 100 }],
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
      'quotes': ['warn', 'single'],
      'semi': ['warn', 'always'],
      'object-curly-spacing': ['warn', 'always'],
      'comma-dangle': ['warn', 'always-multiline'],
    },
  },
];
