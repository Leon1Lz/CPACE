import js from '@eslint/js'
import typescript from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import nextPlugin from '@next/eslint-plugin-next'

export default [
  js.configs.recommended,
  ...typescript.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    languageOptions: {
      parser: typescript.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript.plugin,
      react,
      'react-hooks': reactHooks,
      '@next/next': nextPlugin,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',
      'react/prop-types': 'off',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/refs': 'warn',
      'no-useless-escape': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@next/next/no-img-element': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    ignores: [
      'node_modules/**',
      '**/node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.env',
      '.env.local',
      '*.log',
      'web_detector/**',
      'cpace-landing-app/**',
      '.codex-scan-staging/**',
    ],
  },
]
