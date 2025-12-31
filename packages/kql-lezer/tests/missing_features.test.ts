import { describe, test, expect } from "bun:test";
import { isValid } from "./_helpers";

describe("Missing features", () => {
  test("range operator parses", () => {
    expect(isValid("range x from 1 to 5 step 1")).toBe(true);
  });
});
