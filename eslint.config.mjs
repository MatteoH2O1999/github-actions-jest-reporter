import jest from 'eslint-plugin-jest';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import stylisticTypescript from '@stylistic/eslint-plugin-ts';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import github from 'eslint-plugin-github';

export default [
  github.getFlatConfigs().recommended,
  {
    plugins: {
      jest,
      '@typescript-eslint': typescriptEslint,
      '@typescript-eslint-stylistic': stylisticTypescript
    },

    languageOptions: {
      globals: {
        ...globals.node,
        ...jest.environments.globals.globals,
        BufferEncoding: 'readonly'
      },

      parser: tsParser,
      ecmaVersion: 9,
      sourceType: 'module',

      parserOptions: {
        project: './tsconfig.eslint.json'
      }
    },

    rules: {
      'i18n-text/no-en': 'off',
      'eslint-comments/no-use': 'off',
      'import/no-namespace': 'off',
      'no-unused-vars': 'off',
      'no-shadow': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-shadow': 'error',

      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'no-public'
        }
      ],

      '@typescript-eslint/no-require-imports': 'error',

      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'generic'
        }
      ],

      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      camelcase: 'off',
      '@typescript-eslint/consistent-type-assertions': 'error',

      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true
        }
      ],

      '@typescript-eslint-stylistic/func-call-spacing': ['error', 'never'],
      '@typescript-eslint/no-array-constructor': 'error',
      '@typescript-eslint/no-empty-interface': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-extraneous-class': 'error',
      '@typescript-eslint/no-for-in-array': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-qualifier': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/prefer-for-of': 'warn',
      '@typescript-eslint/prefer-function-type': 'warn',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/require-array-sort-compare': 'error',
      '@typescript-eslint/restrict-plus-operands': 'error',
      semi: 'error',
      '@typescript-eslint-stylistic/semi': ['error', 'always'],
      '@typescript-eslint-stylistic/type-annotation-spacing': 'error',
      '@typescript-eslint/unbound-method': 'error',
      '@typescript-eslint/return-await': ['error', 'always'],
      'sort-imports': 'error',
      'sort-keys': 'error',
      'no-return-await': 'off',
      'github/filenames-match-regex': 'off'
    }
  },
  {
    ignores: ['test_repo/', '**/*.{mjs,js}', 'lib/']
  },
  {
    files: ['**/*.ts']
  }
];
