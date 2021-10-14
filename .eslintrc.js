module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.eslint.json',
  },
  plugins: [
    '@typescript-eslint',
  ],
  ignorePatterns: ['**/example', '**/dist'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
  },
};
