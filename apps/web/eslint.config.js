export default [{
  files: ['src/**/*.{js,jsx}'],
  languageOptions: {
    globals: { document: 'readonly' },
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
  rules: { 'no-undef': 'error' },
}];
