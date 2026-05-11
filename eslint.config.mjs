import js from '@eslint/js';
import tsPlugin from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';

export default tsPlugin.config(
  js.configs.recommended,
  ...tsPlugin.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  {
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
    },
  },
  {
    rules: {
      'react/prop-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  prettierConfig,
  {
    ignores: ['dist/', 'node_modules/'],
  },
);
