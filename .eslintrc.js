module.exports = {
  root: false,
  env: {
    node: false
  },
  extends: [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "@vue/typescript/recommended",
    "@vue/prettier",
    "@vue/prettier/@typescript-eslint"
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-var": "off",
    "prefer-const": "off",
    "camelcase": "off",
    "@typescript-eslint/camelcase": "off",
    "preserveWhitespace": 0,
    "missing-whitespace-between-attributes": 0,
    "no-whitespace-before-property": 0,
    'prettier/prettier': 'off',
    'vue/no-unused-components': 0
  },
  overrides: [
    {
      files: [
        "**/__tests__/*.{j,t}s?(x)",
        "**/tests/unit/**/*.spec.{j,t}s?(x)"
      ],
      env: {
        jest: true
      }
    }
  ]
};
