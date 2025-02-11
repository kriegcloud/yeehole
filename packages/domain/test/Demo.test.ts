import { expect, it, describe } from "@effect/vitest";
import { sayBeep } from "../src/Demo.js"

describe("Demo", () => {
  it("should say beep", () => {
    expect(sayBeep()).toBe("BEEP");
  });
});