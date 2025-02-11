import * as path from "node:path"
import type { ViteUserConfig } from "vitest/config"

const alias = (pkg: string, dir = pkg) => {
  const name = pkg === "effect" ? "effect" : `@effect/${pkg}`
  const target = process.env.TEST_DIST !== undefined ? path.join("dist", "dist", "esm") : "src"
  return ({
    [`${name}/test`]: path.join(__dirname, "packages", dir, "test"),
    [`${name}`]: path.join(__dirname, "packages", dir, target)
  })
}

const config: ViteUserConfig = {
  esbuild: {
    target: "es2020"
  },
  optimizeDeps: {
    exclude: ["bun:sqlite"]
  },
  test: {
    setupFiles: [path.join(__dirname, "vitest.setup.ts")],
    fakeTimers: {
      toFake: undefined
    },
    sequence: {
      concurrent: true
    },
    include: ["test/**/*.test.ts"],
    alias: {
      ...alias("effect"),
    }
  }
}

export default config
