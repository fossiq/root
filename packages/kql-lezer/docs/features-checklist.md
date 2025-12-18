# Implementing a Feature-Complete KQL Parser with Lezer via TypeScript Plugin Grammar Files

## Summary

All participants agree on the high-level goal: build a feature-complete KQL parser using Lezer, with a plugin-style TypeScript-to-.grammar pipeline via `@fossiq/lezer-grammar-generator`, and a separate CST to AST layer producing `@fossiq/kql-ast` nodes. The debate centers on how to make that plan practical, testable, performant, and parallelizable. Key consensus items and the main risks identified:

- Consensus: Use a modular architecture, separate lexing/tokens, scalar expressions, tabular operators, and CST-to-AST mapping; prioritize an authoritative feature inventory that maps to official KQL docs for acceptance tests.
- Major risks flagged: undefined plugin shape (blocks parallel work), pseudo-code CST conversion (runtime errors), over-parallelization and merge complexity (cost and integration risk), missing explicit precedence tied to docs, no build/merge story, performance and security edge cases.
- Decision direction (recommended): Start with a concrete, minimal reference implementation (Phase 1) that proves the TS-to-.grammar flow and CST-to-AST path, then scale to a partitioned plugin model with strict conventions, feature matrix, and automated tests.

## Analysis

Bolded items below are the consensus decisions, blockers, or required technical artifacts.

### Consensus items (safe to adopt immediately)

- Plugin architecture is desirable for team parallelism and versioning, but only with a fixed plugin contract.
- Separate concerns: tokens/whitespace/comments, scalar expressions, tabular operators, script-level constructs (let/print/datatable), and CST-to-AST converters.
- Use TypeScript for generator inputs and the runtime, Lezer for parsing runtime, and `@fossiq/kql-ast` as AST types.
- Enforce tests driven by a Feature Inventory referencing Microsoft KQL doc pages and full examples per feature.

### Key disagreements, risks, and resolutions

- Risk: TS-plugin-per-operator causes merge and cost explosion. Resolution: adopt a 3-layer modular split (Core, Operator groups, AST converters) to preserve parallelism without excessive fragmentation.
- Risk: CST mapping pseudocode is not runnable. Resolution: provide concrete Lezer API patterns (use `node.type.name`, `node.firstChild`, `node.nextSibling`, `node.getChild(name)`, and source slicing via `text.slice(node.from, node.to)`).
- Risk: Precedence list must be verified against docs. Resolution: require explicit precedence blocks tied to the KQL Operator docs per feature and include ternary and member/call precedence where KQL supports them.
- Performance concern: plugin wrapping can degrade parse latencies for IDE use. Resolution: measure early (Phase 0) with a benchmark, and adopt grammar-level perf best practices (single `@top` rule, skip tokens, minimal backtracking patterns).

### Concrete technical caveats

- The pipe (`|`) is structural (stage separator) more than a regular scalar operator; grammar must treat pipeline as left-associative stage chaining.
- Identifiers and bracketed identifiers require careful escaping and limits; token regex must reject malformed bracketed forms (security).
- Error resilience: grammar must produce recoverable error nodes so CST-to-AST mapping can return partial ASTs instead of crashing.
- Build/merge: define how multiple plugin TS files are merged by `@fossiq/lezer-grammar-generator` (plugin ordering, dependency resolution).

### Precedence (recommended, must be verified against KQL docs per feature)

- Highest: Member, Call, Index (e.g., `x.y`, `f()`, `a[0]`)
- Unary: `+`, `-`, `!`, `~`
- Power: `**` (if KQL supports)
- Multiplicative: `*`, `/`, `%`
- Additive: `+`, `-`
- String/Containment ops: `in`, `!in`, `has`, `!has`, `contains`, `startswith`, `endswith`, and case-insensitive variants (`=~`, `!~`)
- Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Logical: `and`, `or`, `not`
- Ternary: `? :` (if present in KQL, verify)
- Assignment/Let-binding: script-level `let` (not a scalar operator)
- Lowest (structural): pipeline stage separator `|` (left-associative across tabular operators)

Note: Agents must confirm each precedence tier against the specific KQL doc for that operator category before implementing grammar precedence blocks.

### Phased dependency and parallelization windows

| Phase | Scope | Blockers | Parallelizable |
| --- | --- | --- | --- |
| Phase 0: Benchmark + Reference | Implement core tokens + single minimal operator to prove TS-to-.grammar and CST-to-AST roundtrip | None (early) | No, single implementer to create template |
| Phase 1: Core Infrastructure | Tokens, whitespace, comments, literals, identifiers, pipeline top-level | None after Phase 0 | No |
| Phase 2: Scalar Expressions | Arithmetic, comparison, string ops, function calls, member/call precedence | Phase 1 complete | Yes (split sub-areas) |
| Phase 3: Tabular Operators | Grouped plugins (filter/sort, projection, aggregation, joins, multi-table) | Phase 2 complete | Yes, use grouped plugins not one-per-operator |
| Phase 4: CST-to-AST Mapping | Converters per operator group, error mapping, AST validation | Phase 3 complete | Yes, converters can be parallel per operator group |
| Phase 5: Integration and CI | Tests, performance, benchmark, documentation, release | Phase 4 complete | No, integration step |

## Conclusion: Implementation Plan, Conventions, and Checklist

Below is a compact, actionable plan agents must execute. Follow it strictly: no deviation without updating the plugin contract and Feature Inventory.

### A. Mandatory repository layout and naming conventions (non-negotiable)

- `src/grammar/plugins/*.ts` - each plugin default-exports `plugin: GrammarPlugin`
- `src/grammar/index.ts` - merges plugins into single grammar input for generator
- `src/parser/grammar.generated.grammar` - output from `@fossiq/lezer-grammar-generator`
- `src/parser/cst-to-ast/*.ts` - CST-to-AST converters, one file per operator group
- `src/kql-spec/features.ts` - Feature Inventory (machine-readable)
- `tests/features/**` - per-feature positive and negative tests
- `package.json` scripts:
  - `build:grammar`: Lezer generator command
  - `test:grammar`, `test:cst2ast`

### B. Concrete GrammarPlugin TypeScript skeleton (copy this shape)

```ts
// src/grammar/plugins/phase1-core.ts
import { GrammarPlugin } from "@fossiq/lezer-grammar-generator";

export const plugin: GrammarPlugin = {
  name: "phase1-core",
  dependsOn: [],
  features: ["core.tokens", "core.identifiers", "core.pipe"],
  tokens: {
    // token declarations (regex or explicit) - keep simple and security-aware
  },
  rules: {
    // Lezer-like rule strings or structured form that the generator expects
    Query: `LetStatement* PipelineExpression`,
    PipelineExpression: `TableExpression ( "|" TabularOperator )*`
  },
  precedence: []
};

export default plugin;
```

### C. Phase 0 (blocker): Reference implementation (one person/agent)

- [ ] Implement tokens, `Query`, a single `TabularOperator` (e.g., `where`), and a scalar expressions subset.
- [ ] Convert the TS grammar to `.grammar` via `@fossiq/lezer-grammar-generator` and build a Lezer parser.
- [ ] Implement a basic CST-to-AST converter for the delivered operator using real Lezer API (`node.type.name`, `node.firstChild`, `node.nextSibling`, `text.slice(node.from,node.to)`).
- [ ] Add tests that parse sample queries and validate AST structure.
- [ ] Metric: this reference must parse 50 real-world KQL queries in <50ms average per query on CI sample runner. If not, iterate grammar patterns.

### D. Feature Inventory and per-feature spec (must exist before implementing feature)

- [ ] Each feature entry (in `src/kql-spec/features.ts`) includes `id`, `docUrl`, `plugin`, `status`, `examples` (positive and negative).
- [ ] Implement features only when the entry exists and has at least one positive and one negative example.

### E. CST-to-AST conventions and starter snippet (use this pattern)

Central context:

```ts
// src/parser/cst-to-ast/context.ts
import { SyntaxNode } from "@lezer/common";
import * as AST from "@fossiq/kql-ast";

export class CstToAstContext {
  constructor(private text: string) {}
  slice(node: SyntaxNode) {
    return this.text.slice(node.from, node.to);
  }
  mapScalarExpression(node: SyntaxNode): AST.Expression {
    // dispatch
  }
  errorNode(node: SyntaxNode, msg: string) {
    return {
      type: "ErrorNode",
      error: msg,
      from: node.from,
      to: node.to
    } as AST.ErrorNode;
  }
}
```

Example operator mapper:

```ts
// src/parser/cst-to-ast/operators/where.ts
import { SyntaxNode } from "@lezer/common";
import { CstToAstContext } from "../context";

export function mapWhereOperator(node: SyntaxNode, ctx: CstToAstContext) {
  const expr = node.getChild("ScalarExpression");
  if (!expr) return ctx.errorNode(node, "Missing expression");
  return {
    type: "WhereOperator",
    expression: ctx.mapScalarExpression(expr)
  };
}
```

### F. Precedence and grammar rule guidelines

- [ ] Implement Lezer precedence blocks per the recommended precedence list.
- [ ] Update precedence per feature by citing the specific KQL doc page used for that decision in the feature spec.
- [ ] Treat `|` as left-associative stage chaining (top-level pipeline rule, not a scalar op).

### G. Testing and CI (non-negotiable)

- [ ] Each feature must have:
  - [ ] 2-5 positive examples (including a full doc example).
  - [ ] 1-2 negative or edge cases.
  - [ ] Tests that assert no top-level Lezer error nodes and AST shape matches expected typed structure in `@fossiq/kql-ast`.
- [ ] Implement a test harness that reads `FEATURES` and auto-generates tests.
- [ ] Add performance regression checks in CI comparing parse latency to Phase 0 baseline.

### H. Security and robustness

- [ ] Token patterns for bracketed identifiers and string literals must be strict and reject malformed escapes.
- [ ] Grammar must produce recoverable error nodes for incomplete input (e.g., trailing `|`) instead of crashing.
- [ ] Include tests for malicious or unexpected inputs (very long identifiers, unclosed bracket, escaped quotes).

### I. Integration and merge strategy

- [ ] Use the generator to merge plugins in a defined order; enforce `dependsOn` in plugin metadata.
- [ ] Implement `plugins/index.ts` that sorts and validates the plugin dependency DAG; the generator receives the ordered list.

### J. Parallel work model (practical)

- [ ] After Phase 0 and Phase 1, parallelize:
  - [ ] Scalar subteams (arithmetic, string ops, function calls).
  - [ ] Operator groups (filter/sort, projection/extend/project-variants, aggregation, joins/union, context/let/datatable).
  - [ ] CST-to-AST converters per operator group.
- [ ] Avoid one-plugin-per-operator; use grouped plugins (about 10 operators per plugin) to reduce merge friction.

### K. Acceptance and sign-off

- [ ] Grammar accepts positive examples without parse errors.
- [ ] AST output (JSON) matches expected schema for provided examples.
- [ ] Negative examples produce controlled parser errors or explicit rejections per spec.
- [ ] Performance baseline remains within Phase 0 thresholds.

### L. Immediate action items for agents

- [ ] Phase 0 agent: produce reference implementation (core tokens + `where`) and end-to-end CST-to-AST. Deliver within first sprint (3 business days).
- [ ] Lead architect: publish `GrammarPlugin` interface, plugin contract, and repo layout template immediately after Phase 0 (1 day).
- [ ] Spec owner: create Feature Inventory entries for top 50 KQL features with doc URLs and examples (3 days).
- [ ] Scalar team: author scalar expression rules and precedence blocks (2-4 days, parallel sub-tasks).
- [ ] Operator teams: implement grouped operators (2-3 days per group, parallel after scalars).
- [ ] CST-to-AST team: implement converters per operator group in parallel with operator grammar development; validate via feature tests.
- [ ] CI/QA: implement auto-generated tests from Feature Inventory and performance checks.

## Final decision points (enforceable)

- Blocker: Do not begin widespread plugin work until the Phase 0 reference and GrammarPlugin contract exist.
- Blocker: Do not accept a plugin into the main build until its Feature Inventory entries are marked implemented and tested.
- Performance gate: If the TS-to-.grammar plugin approach degrades parse latency >20% vs a monolithic .grammar baseline in Phase 0, pivot to a merged three-file approach (core + operators + AST) to restore performance.

## Closure

Implement the plan above: start with a single working reference (Phase 0), lock the plugin contract, build the Feature Inventory, then proceed with grouped parallel work and test-driven feature implementation. This approach preserves modularity and parallelism while eliminating the blockers (undefined plugin shape, pseudo-code converters, merge chaos, and missing test/acceptance rigor).
