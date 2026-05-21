import pluginVue from 'eslint-plugin-vue'
import tsParser from '@typescript-eslint/parser'

export default [
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      'vue/require-prop-types': 'off',
    },
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      'release/',
      'out/',
      'ignoreFolder/',
      'KuGouMusicApi/',
      '*.timestamp-*.mjs',
    ],
  },
]
