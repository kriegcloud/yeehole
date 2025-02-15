import { type ViteUserConfig, mergeConfig } from "vitest/config";
import * as path from "node:path";


const alias = (pkg: string, dir = pkg) => {
  const name = `@ye/${pkg}`;
  const target =
    process.env.TEST_DIST !== undefined
      ? path.join("dist", "dist", "esm")
      : "src";
  return {
    [`${name}/test`]: path.join(__dirname, "packages", dir, "test"),
    [`${name}`]: path.join(__dirname, "packages", dir, target),
  };
};

const shared: ViteUserConfig = {
  esbuild: {
    target: "es2020",
  },
  optimizeDeps: {
    exclude: ["bun:sqlite"],
  },
  test: {
    setupFiles: [path.join(__dirname, "../../vitest.setup.ts")],
    fakeTimers: {
      toFake: undefined,
    },
    sequence: {
      concurrent: true,
    },
    include: ["test/**/*.test.ts"],
    alias: {
      ...alias("effect"),
    },
  },
};


const config: ViteUserConfig = {
  test: {
    coverage: {
      provider: "v8",
      reporter: ["html"],
    },
  },
};

export default mergeConfig(shared, config);
