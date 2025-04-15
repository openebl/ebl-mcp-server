// .eslintrc.cjs
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'prettier' // Add prettier plugin
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier' // Extends Prettier config to disable conflicting ESLint rules
  ],
  rules: {
    'prettier/prettier': 'error', // Report Prettier violations as ESLint errors
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }], // Warn about unused vars, allow underscore prefix
    '@typescript-eslint/no-explicit-any': 'warn' // Warn about using 'any'
    // Add other custom rules here
  },
  env: {
    node: true,
    es2022: true
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  ignorePatterns: ['node_modules', 'dist', '*.cjs'] // Ignore build output, node_modules, and commonjs config files
};
