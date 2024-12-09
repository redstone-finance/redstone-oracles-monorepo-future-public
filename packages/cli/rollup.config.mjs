import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { obfuscator } from "rollup-obfuscator";

const outputFile = process.env["OUTPUT"] ?? "dist/index.js";

export default {
  external: (id) => {
    // bundle only @redstone-finance modules
    // rest import from node_modules
    return id.includes("node_modules") && !id.includes("@redstone-finance");
  },
  input: process.env["ENTRYPOINT"],
  output: {
    file: outputFile,
    format: "cjs",
    banner: "#!/usr/bin/env node",
  },
  cache: false,
  plugins: [
    typescript({ composite: false, project: "tsconfig.build.json" }),
    commonjs({
      ignoreGlobal: false,
    }),
    nodeResolve(),
    json(),
    obfuscator(),
  ],
};
