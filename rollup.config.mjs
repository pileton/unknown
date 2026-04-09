import esbuild from "rollup-plugin-esbuild";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
    input: "src/index.ts",
    output: {
        file: "index.js",
        format: "cjs",
        exports: "default"
    },
    plugins: [
        nodeResolve(),
        commonjs(),
        esbuild({
            minify: true,
            target: "es2022"
        })
    ]
};
