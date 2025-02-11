import { describe, expect, it } from "@effect/vitest";
import { sayBeep } from "#Demo.js";

describe("Demo", () => {
  it("should say beep", () => {
    expect(sayBeep()).toBe("BEEP");
  });
});
