module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    "@vue/typescript/recommended"
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-unused-vars": "off",
    "no-empty": "off",
    "no-undef": "off",
    "no-redeclare": "off",
    "no-empty-functio": "off",
    "vue/no-unused-components":"off",
    "@typescript-eslint/no-empty-function": "off",
    "vue/multi-word-component-names": "off",
    "typescript-eslint/no-empty-function": "off",
    "vue/no-setup-props-destructure": "off",
    "comma-dangle": ["error", "never"],
    "prettier/prettier": "off",
    "@typescript-eslint/no-var-requires": "off"
  },
  overrides: [
    {
      files: [
        "**/__tests__/*.{j,t}s?(x)",
        "**/tests/unit/**/*.spec.{j,t}s?(x)",
      ],
      env: {
        jest: true,
      },
    },
  ],
};
