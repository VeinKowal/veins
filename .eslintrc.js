module.exports = {
  extends: [require.resolve('@umijs/fabric/dist/eslint')],
  globals: {
    page: true,
    REACT_APP_ENV: true,
  },
  rules: {
    'consistent-return': [0],
    'jsx-a11y/media-has-caption': [0],
    'react-hooks/rules-of-hooks': 'error', // Checks rules of Hooks
    'react-hooks/exhaustive-deps': 'error', // Checks effect dependencies,
    'no-bitwise': [0],
    'no-underscore-dangle': [0],
    '@typescript-eslint/semi': [0],
    'global-require': [0],
    'no-param-reassign': [0],
    '@typescript-eslint/no-unused-expressions': [0],
  },
};
