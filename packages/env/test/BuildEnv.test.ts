import { BuildEnv } from "#BuildEnv.js";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { Effect } from "effect";


describe("BuildEnv Configuration", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env }; // Backup original environment variables
  });

  afterEach(() => {
    process.env = originalEnv; // Restore environment variables after each test
    vi.resetModules(); // Reset modules to clear cache between tests
  });

  test("should return 'development' when NODE_ENV is not set", async () => {
    delete process.env.NODE_ENV; // Ensure NODE_ENV is not set

    const result = await Effect.runPromise(BuildEnv);

    expect(result).toEqual({ NODE_ENV: "development" });
  });

  test("should return 'production' when NODE_ENV is set", async () => {
    process.env.NODE_ENV = "production";

    const result = await Effect.runPromise(BuildEnv);

    expect(result).toEqual({ NODE_ENV: "production" });
  });

  test("should return 'staging' when NODE_ENV is set to staging", async () => {
    process.env.NODE_ENV = "staging";

    const result = await Effect.runPromise(BuildEnv);

    expect(result).toEqual({ NODE_ENV: "staging" });
  });
});
