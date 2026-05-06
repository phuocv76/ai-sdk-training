import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [".open-next/**"],
  },
  {
    files: ["*.config.{js,cjs,mjs}", "eslint.config.mjs"],
    rules: {
      "import/no-anonymous-default-export": "off",
    },
  },
];

export default eslintConfig;
