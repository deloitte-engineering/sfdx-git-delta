/*
👋 Hi! This file was autogenerated by tslint-to-eslint-config.
https://github.com/typescript-eslint/tslint-to-eslint-config

It represents the closest reasonable ESLint configuration to this
project's original TSLint configuration.

We recommend eventually switching this configuration to extend from
the recommended rulesets in typescript-eslint. 
https://github.com/typescript-eslint/tslint-to-eslint-config/blob/master/docs/FAQs.md

Happy linting! 💖
*/
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'prettier',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  ignorePatterns: [
    'lib/**/*',
    'node_modules',
    '.next',
    'output',
    'reports',
    'e2e',
    '.github',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['prettier', '@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/brace-style': 'off',
    '@typescript-eslint/comma-dangle': 'off',
    '@typescript-eslint/comma-spacing': 'off',
    '@typescript-eslint/func-call-spacing': 'off',
    '@typescript-eslint/indent': 'off',
    '@typescript-eslint/keyword-spacing': 'off',
    '@typescript-eslint/member-delimiter-style': 'off',
    '@typescript-eslint/no-extra-parens': 'off',
    '@typescript-eslint/no-extra-semi': 'off',
    '@typescript-eslint/object-curly-spacing': 'off',
    '@typescript-eslint/quotes': 'off',
    '@typescript-eslint/semi': 'off',
    '@typescript-eslint/space-before-function-paren': 'off',
    '@typescript-eslint/space-infix-ops': 'off',
    '@typescript-eslint/type-annotation-spacing': 'off',
    'array-bracket-newline': 'off',
    'array-bracket-spacing': 'off',
    'array-element-newline': 'off',
    'arrow-body-style': 'off',
    'arrow-parens': 'off',
    'arrow-spacing': 'off',
    'babel/object-curly-spacing': 'off',
    'babel/quotes': 'off',
    'babel/semi': 'off',
    'block-spacing': 'off',
    'brace-style': 'off',
    'comma-dangle': 'off',
    'comma-spacing': 'off',
    'comma-style': 'off',
    'computed-property-spacing': 'off',
    'constructor-super': 'error',
    curly: 'off',
    'dot-location': 'off',
    'eol-last': 'off',
    'flowtype/boolean-style': 'off',
    'flowtype/delimiter-dangle': 'off',
    'flowtype/generic-spacing': 'off',
    'flowtype/object-type-curly-spacing': 'off',
    'flowtype/object-type-delimiter': 'off',
    'flowtype/semi': 'off',
    'flowtype/space-after-type-colon': 'off',
    'flowtype/space-before-generic-bracket': 'off',
    'flowtype/space-before-type-colon': 'off',
    'flowtype/union-intersection-spacing': 'off',
    'for-direction': 'error',
    'func-call-spacing': 'off',
    'function-call-argument-newline': 'off',
    'function-paren-newline': 'off',
    'generator-star': 'off',
    'generator-star-spacing': 'off',
    'getter-return': 'error',
    'implicit-arrow-linebreak': 'off',
    'import/no-cycle': 'error',
    'import/no-unresolved': 'off',
    indent: 'off',
    'indent-legacy': 'off',
    'jsx-quotes': 'off',
    'key-spacing': 'off',
    'keyword-spacing': 'off',
    'linebreak-style': 'off',
    'lines-around-comment': 'off',
    'max-len': 'off',
    'multiline-ternary': 'off',
    'new-parens': 'off',
    'newline-per-chained-call': 'off',
    'no-arrow-condition': 'off',
    'no-async-promise-executor': 'error',
    'no-case-declarations': 'error',
    'no-class-assign': 'error',
    'no-comma-dangle': 'off',
    'no-compare-neg-zero': 'error',
    'no-cond-assign': 'error',
    'no-confusing-arrow': 'off',
    'no-console': 'error',
    'no-const-assign': 'error',
    'no-constant-condition': 'error',
    'no-control-regex': 'error',
    'no-debugger': 'error',
    'no-delete-var': 'error',
    'no-dupe-args': 'error',
    'no-dupe-class-members': 'error',
    'no-dupe-else-if': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-empty': 'error',
    'no-empty-character-class': 'error',
    'no-empty-pattern': 'error',
    'no-ex-assign': 'error',
    'no-extra-boolean-cast': 'error',
    'no-extra-parens': 'off',
    'no-extra-semi': 'off',
    'no-fallthrough': 'error',
    'no-floating-decimal': 'off',
    'no-func-assign': 'error',
    'no-global-assign': 'error',
    'no-import-assign': 'error',
    'no-inner-declarations': 'error',
    'no-invalid-regexp': 'error',
    'no-irregular-whitespace': 'error',
    'no-misleading-character-class': 'error',
    'no-mixed-operators': 'off',
    'no-mixed-spaces-and-tabs': 'off',
    'no-multi-spaces': 'off',
    'no-multiple-empty-lines': 'off',
    'no-new-symbol': 'error',
    'no-obj-calls': 'error',
    'no-octal': 'error',
    'no-prototype-builtins': 'error',
    'no-redeclare': 'error',
    'no-regex-spaces': 'error',
    'no-reserved-keys': 'off',
    'no-self-assign': 'error',
    'no-setter-return': 'error',
    'no-shadow-restricted-names': 'error',
    'no-space-before-semi': 'off',
    'no-spaced-func': 'off',
    'no-sparse-arrays': 'error',
    'no-tabs': 'off',
    'no-this-before-super': 'error',
    'no-trailing-spaces': 'off',
    'no-undef': 'error',
    'no-unexpected-multiline': 'off',
    'no-unreachable': 'error',
    'no-unsafe-finally': 'error',
    'no-unsafe-negation': 'error',
    'no-unused-labels': 'error',
    'no-unused-vars': 'off',
    'no-useless-catch': 'error',
    'no-useless-escape': 'error',
    'no-whitespace-before-property': 'off',
    'no-with': 'error',
    'no-wrap-func': 'off',
    'nonblock-statement-body-position': 'off',
    'object-curly-newline': 'off',
    'object-curly-spacing': 'off',
    'object-property-newline': 'off',
    'one-var-declaration-per-line': 'off',
    'operator-linebreak': 'off',
    'padded-blocks': 'off',
    'prefer-arrow-callback': 'off',
    'prettier/prettier': 'error',
    'quote-props': 'off',
    quotes: 'off',
    'react/jsx-child-element-spacing': 'off',
    'react/jsx-closing-bracket-location': 'off',
    'react/jsx-closing-tag-location': 'off',
    'react/jsx-curly-newline': 'off',
    'react/jsx-curly-spacing': 'off',
    'react/jsx-equals-spacing': 'off',
    'react/jsx-first-prop-new-line': 'off',
    'react/jsx-indent': 'off',
    'react/jsx-indent-props': 'off',
    'react/jsx-max-props-per-line': 'off',
    'react/jsx-newline': 'off',
    'react/jsx-one-expression-per-line': 'off',
    'react/jsx-props-no-multi-spaces': 'off',
    'react/jsx-space-before-closing': 'off',
    'react/jsx-tag-spacing': 'off',
    'react/jsx-wrap-multilines': 'off',
    'require-yield': 'error',
    'rest-spread-spacing': 'off',
    semi: 'off',
    'semi-spacing': 'off',
    'semi-style': 'off',
    'space-after-function-name': 'off',
    'space-after-keywords': 'off',
    'space-before-blocks': 'off',
    'space-before-function-paren': 'off',
    'space-before-function-parentheses': 'off',
    'space-before-keywords': 'off',
    'space-in-brackets': 'off',
    'space-in-parens': 'off',
    'space-infix-ops': 'off',
    'space-return-throw-case': 'off',
    'space-unary-ops': 'off',
    'space-unary-word-ops': 'off',
    'standard/array-bracket-even-spacing': 'off',
    'standard/computed-property-even-spacing': 'off',
    'standard/object-curly-even-spacing': 'off',
    'switch-colon-spacing': 'off',
    'template-curly-spacing': 'off',
    'template-tag-spacing': 'off',
    'unicode-bom': 'off',
    'unicorn/empty-brace-spaces': 'off',
    'unicorn/no-nested-ternary': 'off',
    'unicorn/number-literal-case': 'off',
    'use-isnan': 'error',
    'valid-typeof': 'error',
    'vue/array-bracket-newline': 'off',
    'vue/array-bracket-spacing': 'off',
    'vue/arrow-spacing': 'off',
    'vue/block-spacing': 'off',
    'vue/block-tag-newline': 'off',
    'vue/brace-style': 'off',
    'vue/comma-dangle': 'off',
    'vue/comma-spacing': 'off',
    'vue/comma-style': 'off',
    'vue/dot-location': 'off',
    'vue/func-call-spacing': 'off',
    'vue/html-closing-bracket-newline': 'off',
    'vue/html-closing-bracket-spacing': 'off',
    'vue/html-end-tags': 'off',
    'vue/html-indent': 'off',
    'vue/html-quotes': 'off',
    'vue/html-self-closing': 'off',
    'vue/key-spacing': 'off',
    'vue/keyword-spacing': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/max-len': 'off',
    'vue/multiline-html-element-content-newline': 'off',
    'vue/mustache-interpolation-spacing': 'off',
    'vue/no-extra-parens': 'off',
    'vue/no-multi-spaces': 'off',
    'vue/no-spaces-around-equal-signs-in-attribute': 'off',
    'vue/object-curly-newline': 'off',
    'vue/object-curly-spacing': 'off',
    'vue/object-property-newline': 'off',
    'vue/operator-linebreak': 'off',
    'vue/script-indent': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/space-in-parens': 'off',
    'vue/space-infix-ops': 'off',
    'vue/space-unary-ops': 'off',
    'vue/template-curly-spacing': 'off',
    'wrap-iife': 'off',
    'wrap-regex': 'off',
    'yield-star-spacing': 'off',
    'import/order': [
      'error',
      {
        alphabetize: {
          order: 'asc',
          caseInsensitive: false,
        },
        groups: ['builtin', 'external', 'parent', 'index', 'sibling'],
        'newlines-between': 'always',
      },
    ],
  },
  env: {
    browser: false,
    commonjs: true,
    es6: true,
    node: true,
    jest: true,
  },
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
}
