module.exports = {
  parser: '@typescript-eslint/parser',
  env: {
    'es6': true,
    'node': true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: ['./tsconfig.json'],
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: [
    'import',
  ],
  rules: {
    'max-len': ['error', { code: 140 }],
    'indent': ['error', 2, { 'SwitchCase': 1 }],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'always',
      { 'omitLastInOneLineBlock': true }
    ],
    'semi-spacing': 'error',
    'space-before-blocks': 'error',
    'switch-colon-spacing': 'error',
    'camelcase': [
      'error'
    ],
    'prefer-const': [
      'error'
    ],
    'prefer-template': 'error',
    'no-var': [
      'error'
    ],
    'object-curly-spacing': [
      'error',
      'always'
    ],
    'object-curly-newline': [
      'error', { 'multiline': true, 'consistent': true }
    ],
    'array-bracket-spacing': [
      'error', 'never'
    ],
    'padded-blocks': ['error', 'never'],
    'arrow-spacing': 'error',
    'brace-style': [
      'error',
      '1tbs',
      { 'allowSingleLine': true },
    ],
    'arrow-parens': [
      'error',
      'as-needed',
    ],
    'arrow-body-style': ['error', 'as-needed'],
    'prefer-arrow-callback': [
      'error'
    ],
    'no-multiple-empty-lines': [
      'error'
    ],
    'no-cond-assign': [
      'error',
      'except-parens'
    ],
    'no-console': [
      'error'
    ],
    '@typescript-eslint/no-floating-promises': [
      'error'
    ],
    'comma-dangle': ['error', 'only-multiline'],
    'quote-props': [
      'error',
      'as-needed'
    ],
    'comma-spacing': [
      'error', { 'before': false, 'after': true }
    ],
    'key-spacing': [
      'error', { 'mode': 'strict' }
    ],
    'no-whitespace-before-property': 'error',
    'generator-star-spacing': [
      'error', {'before': false, 'after': true}
    ],
    'no-duplicate-imports': 'error',
    'keyword-spacing': [
      'error', { 'before': true , 'after': true }
    ],
    'space-before-blocks': 'error',
    'import/order': [
      'error',
      { 'newlines-between': 'always' },
    ],
    '@typescript-eslint/consistent-type-assertions': [
      'error',
      { 'assertionStyle': 'as' }
    ],
    'no-template-curly-in-string': 'error',
    'default-case-last': 'error',
    'dot-notation': 'error',
    'no-fallthrough': 'error',
    'no-lone-blocks': 'error',
    'no-throw-literal': 'error',
    'yoda': 'error',
    'block-spacing': 'error',
    'space-before-function-paren': ["error", {
      "anonymous": "never",
      "named": "never",
      "asyncArrow": "always"
    }],
    'space-in-parens': ['error', 'never'],
    'rest-spread-spacing': ['error', 'never'],
    'template-curly-spacing': 'error',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'radix': [ 'error' ],
    'object-shorthand': ['error', 'always'],
    'space-infix-ops': ['error'],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    'no-trailing-spaces': 'error',
    'eol-last': 'error',
    'curly': 'error',
    '@typescript-eslint/no-namespace': [
      'error', { 'allowDeclarations': true, 'allowDefinitionFiles': true }
    ],
    '@typescript-eslint/member-delimiter-style': 'error',
    "@typescript-eslint/ban-types": [
      "error",
      {
        "types": {
          "Object": false,
          "Function": false,
        },
        "extendDefaults": true
      }
    ],
  }
};