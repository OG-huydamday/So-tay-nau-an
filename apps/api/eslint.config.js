export default [{
  files: ['src/**/*.js', 'test/**/*.js'],
  languageOptions: { globals: { console: 'readonly', process: 'readonly' } },
  rules: {
    'no-undef': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
}];
