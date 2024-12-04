import jslint from '@eslint/js'
import stlint from '@stylistic/eslint-plugin'
import tslint from 'typescript-eslint'

const stylistic = {
  indent: 2,
}

export default tslint.config(
  jslint.configs.all,
  tslint.configs.strictTypeChecked,
  stlint.configs['recommended-flat'],
  {
    plugins: {
      '@stylistic': stlint,
    },
    rules: {
      '@stylistic/indent': [
        'error',
        stylistic.indent,
      ],
      '@stylistic/quotes': [
        'error',
        'single',
      ],
      '@stylistic/semi': [
        'error',
        'never',
      ],
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
