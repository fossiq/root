import { describe, expect, test } from "bun:test";
import {
  choice,
  group,
  kw,
  kwRenamed,
  many,
  many1,
  opt,
  raw,
  ref,
  regex,
  repeat,
  separatedList,
  seq,
  literal,
} from "../src/helpers.js";

describe("helpers", () => {
  test("literal and regex helpers", () => {
    expect(literal("x")).toEqual({ type: "literal", value: "x" });
    expect(regex("[a-z]+")).toEqual({ type: "regex", pattern: "[a-z]+" });
  });

  test("seq and choice helpers", () => {
    const seqExpr = seq(ref("A"), ref("B"), ref("C"));
    expect(seqExpr).toEqual({
      type: "seq",
      elements: [
        { type: "ref", name: "A" },
        { type: "ref", name: "B" },
        { type: "ref", name: "C" },
      ],
    });

    const choiceExpr = choice(ref("Number"), ref("String"));
    expect(choiceExpr).toEqual({
      type: "choice",
      alternatives: [
        { type: "ref", name: "Number" },
        { type: "ref", name: "String" },
      ],
    });
  });

  test("group wraps in parens", () => {
    expect(group(ref("A"))).toEqual({
      type: "group",
      expr: { type: "ref", name: "A" },
    });
  });

  test("optional and repeat helpers", () => {
    expect(opt(ref("Identifier"))).toEqual({
      type: "optional",
      expr: { type: "ref", name: "Identifier" },
    });
    expect(repeat(ref("Identifier"), "*")).toEqual({
      type: "repeat",
      kind: "*",
      expr: { type: "ref", name: "Identifier" },
    });
  });

  test("many/many1 helpers", () => {
    expect(many(ref("Identifier"))).toEqual({
      type: "repeat",
      kind: "*",
      expr: { type: "ref", name: "Identifier" },
    });
    expect(many1(ref("Identifier"))).toEqual({
      type: "repeat",
      kind: "+",
      expr: { type: "ref", name: "Identifier" },
    });
  });

  test("separatedList emits common list patterns", () => {
    expect(separatedList(ref("identifier"), ref("Comma"))).toEqual({
      type: "seq",
      elements: [
        { type: "ref", name: "identifier" },
        {
          type: "repeat",
          kind: "*",
          expr: {
            type: "group",
            expr: {
              type: "seq",
              elements: [
                { type: "ref", name: "Comma" },
                { type: "ref", name: "identifier" },
              ],
            },
          },
        },
      ],
    });

    expect(separatedList(ref("identifier"), ref("Comma"), { min: 0 })).toEqual({
      type: "optional",
      expr: {
        type: "seq",
        elements: [
          { type: "ref", name: "identifier" },
          {
            type: "repeat",
            kind: "*",
            expr: {
              type: "group",
              expr: {
                type: "seq",
                elements: [
                  { type: "ref", name: "Comma" },
                  { type: "ref", name: "identifier" },
                ],
              },
            },
          },
        ],
      },
    });
  });

  test("kw helpers emit macro invocations with quoted terms", () => {
    expect(kw("where")).toEqual({ type: "raw", content: 'kw<"where">' });
    expect(kwRenamed("!in", "NotIn")).toEqual({
      type: "raw",
      content: 'kwRenamed<"!in", "NotIn">',
    });
    expect(raw("CustomToken")).toEqual({ type: "raw", content: "CustomToken" });
  });
});
