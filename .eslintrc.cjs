/* eslint-disable @typescript-eslint/ban-ts-comment */
module.exports = {
  root: true,
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    '*.config.*',
    'src/environments/*.ts'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['tsconfig.json']
  },
  overrides: [
    // TypeScript: компоненты, сервисы, etc.
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@angular-eslint', '@typescript-eslint'],
      extends: [
        'plugin:@angular-eslint/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-type-checked',
        'plugin:@typescript-eslint/stylistic-type-checked',
        'eslint:recommended',
        'prettier' // отключает конфликтующие правила форматирования
      ],
      rules: {
        '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        '@typescript-eslint/no-floating-promises': 'error',
        '@angular-eslint/component-class-suffix': ['error', { suffixes: ['Component'] }],
        '@angular-eslint/directive-class-suffix': ['error', { suffixes: ['Directive'] }],
        '@angular-eslint/no-host-metadata-property': 'off'
      }
    },
    // Angular шаблоны
    {
      files: ['*.html'],
      parser: '@angular-eslint/template-parser',
      plugins: ['@angular-eslint/template'],
      extends: ['plugin:@angular-eslint/template/recommended', 'prettier'],
      rules: {
        '@angular-eslint/template/eqeqeq': 'error',
        '@angular-eslint/template/no-negated-async': 'warn',
        '@angular-eslint/template/banana-in-a-box': 'error'
      }
    }
  ]
};