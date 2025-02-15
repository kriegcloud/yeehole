import { describe, expect, it } from "@effect/vitest";
import { beep } from "#/beep.js";

describe("Demo", () => {
  it("should be beep", () => {
    expect(beep()).toBe("beep");
  });
});
