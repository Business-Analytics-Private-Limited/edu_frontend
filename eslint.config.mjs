/**
 * Code rules for the whole frontend repository (`pnpm lint`).
 */
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Generated or downloaded files are never linted.
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/next-env.d.ts',
      'packages/api/src/generated/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      // Next.js code runs both in the browser and on the server.
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Command-line scripts print to the terminal on purpose.
    files: ['**/scripts/**/*.mjs'],
    rules: { 'no-console': 'off' },
  },
);
