import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };

const shared = {
  format: ["esm", "cjs"] as ("esm" | "cjs")[],
  dts: true,
  sourcemap: false,
  minify: false,
  target: "es2020",
  external: ["react"],
  define: { __SDK_VERSION__: JSON.stringify(pkg.version) },
};

export default defineConfig([
  { ...shared, entry: { index: "src/index.ts" }, clean: true },
  // The React entry is a client module; the core entry stays server-safe.
  { ...shared, entry: { react: "src/react.tsx" }, clean: false, esbuildOptions(o) { o.banner = { js: '"use client";' }; } },
]);
