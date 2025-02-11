import { describe, expect, it } from "@effect/vitest";
import { Primitives } from "#kernel/Primitives.js";

describe("Demo", () => {
  it("should say beep", () => {
    expect(Primitives.Str).toBe("BEEP");
  });
});
