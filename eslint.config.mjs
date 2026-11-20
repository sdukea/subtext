import next from "eslint-config-next";

const config = [
  ...next,
  { ignores: [".next/**", "node_modules/**", "research/**", "eval/results/**"] },
];

export default config;
