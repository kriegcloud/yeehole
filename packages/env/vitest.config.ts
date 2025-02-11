import { type ViteUserConfig, mergeConfig } from "vitest/config";
import shared from "../../vitest.shared.js";

const config: ViteUserConfig = {
  test: {
    coverage: {
      provider: "v8",
      reporter: ["html"],
    },
  },
};

export default mergeConfig(shared, config);
