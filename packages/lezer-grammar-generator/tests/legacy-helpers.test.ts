import { describe, expect, test } from "bun:test";
import { legacy } from "../src/index.js";

describe("legacy helpers", () => {
  test("literal and p helpers", () => {
    expect(legacy.literal("project-away")).toBe("\"project-away\"");
    expect(legacy.p`"x"`).toBe('"x"');
  });

  test("seq/choice helpers", () => {
    expect(legacy.seq("a", "b")).toBe("a b");
    expect(legacy.choice("a", "b")).toBe("a | b");
  });
});
