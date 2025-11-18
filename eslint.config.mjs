import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default [
  {
    files: ['**/*.ts'],
    plugins: {
      '@typescript-eslint': typescriptEslint
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      'no-case-declarations': 'off',
      indent: ['error', 2, { SwitchCase: 1 }],
      quotes: ['error', 'single'],
      semi: ['error', 'never']
    }
  },
  {
    ignores: ['node_modules/**', 'dist/**', 'output/**', '.api/**']
  }
]
