import swc from "rollup-plugin-swc3";

export default {
    input: "src/index.ts",
    output: {
        file: "index.js",
        format: "cjs",
        exports: "default"
    },
    plugins: [
        swc({
            jsc: {
                parser: { syntax: "typescript", tsx: true },
                target: "es2022",
                transform: { react: { runtime: "classic", pragma: "vendetta.metro.common.React.createElement" } }
            }
        })
    ]
};
