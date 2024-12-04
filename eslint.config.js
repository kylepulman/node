import jslint from '@eslint/js'
import stlint from '@stylistic/eslint-plugin'
import tslint from 'typescript-eslint'

export default tslint.config(
  jslint.configs.all,
  tslint.configs.strictTypeChecked,
  stlint.configs['recommended-flat'],
  {
    plugins: {
      '@stylistic': stlint,
    },
    rules: {
      '@stylistic/brace-style': ['error', '1tbs'],
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/semi': ['error', 'never'],
      'brace-style': ['error', '1tbs'],
      'camelcase': ['error', {
        allow: [
          'response_type',
          'client_id',
          'redirect_uri',
          'grant_type',
          'refresh_token',
          'expires_in',
        ],
      }],
      'init-declarations': 'off',
      'max-classes-per-file': 'off',
      'max-lines-per-function': 'off',
      'max-statements': 'off',
      'no-magic-numbers': 'off',
      'one-var': 'off',
      'sort-imports': 'off',
    },
  },
  {
    ignores: ['dist'],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    extends: [tslint.configs.disableTypeChecked],
    files: ['**/*.js'],
  },
)
