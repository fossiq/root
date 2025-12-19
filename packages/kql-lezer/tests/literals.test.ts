import { describe, test, expect } from "bun:test";
import { isValid } from "./_helpers";

describe("Timespan literals", () => {
    test("shorthand syntax in filter", () => {
        expect(isValid("Events | where Duration > 1d")).toBe(true);
        expect(isValid("Events | where Duration < 30m")).toBe(true);
        expect(isValid("Events | extend Window = 12h")).toBe(true);
        expect(isValid("Events | where Latency > 500ms")).toBe(true);
    });

    test("combined shorthand", () => {
        expect(isValid("Events | where Duration > 1d12h")).toBe(true);
        expect(isValid("Events | extend Total = 1h30m")).toBe(true);
    });

    test("negative timespans", () => {
        // Negative usually handled by unary minus operator + literal
        expect(isValid("Events | where Offset == -1d")).toBe(true);
    });
});

describe("Complex string literals", () => {
    test("verbatim strings", () => {
        expect(isValid('Events | where Path == @"C:\\path\\file.txt"')).toBe(
            true,
        );
        expect(isValid("Events | extend Text = @'no escapes \t'")).toBe(true);
    });

    test("obfuscated strings", () => {
        expect(isValid('Events | where Secret == h"secret"')).toBe(true);
        expect(isValid('Events | where Key == h@"verbatim secret"')).toBe(true);
    });
});
