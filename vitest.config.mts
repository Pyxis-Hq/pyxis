import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: {
      "@pyxis-hq/wallets-kit/react": fileURLToPath(new URL("./sdk/wallets-kit/src/react.tsx", import.meta.url)),
      "@pyxis-hq/wallets-kit": fileURLToPath(new URL("./sdk/wallets-kit/src/index.ts", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    } },
  test: { environment: "node", testTimeout: 60_000, hookTimeout: 120_000, fileParallelism: false },
});
