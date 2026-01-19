# KQL Lezer Grammar Reference

Quick reference for the KQL grammar structure in `src/kql.grammar`.

## Grammar Hierarchy

```
@top KQL
  └─ Query
      ├─ LetStatement* (optional, multiple)
      └─ QueryExpression (required, one of:)
          ├─ UnionExpression
          ├─ SearchExpression
          ├─ FindExpression
          └─ PipelineExpression
              ├─ TableExpression (source)
              └─ (Pipe TabularOperator)* (optional, multiple)
```

## Expression Precedence (lowest to highest)

1. **OrExpression** - `a or b`
2. **AndExpression** - `a and b`
3. **NotExpression** - `not a`
4. **ComparisonExpression** - `a == b`, `a contains b`, `a between (x .. y)`
5. **AdditiveExpression** - `a + b`, `a - b`
6. **MultiplicativeExpression** - `a * b`, `a / b`, `a % b`
7. **UnaryExpression** - `-a`
8. **PrimaryExpression** - literals, identifiers, function calls, `(expr)`

## Tabular Operators

All tabular operators can appear after a pipe (`|`):

- **WhereClause** - `where Expression`
- **ProjectClause** - `project col1, alias = expr, ...`
- **ProjectAwayClause** - `project-away col1, col2, ...`
- **ProjectKeepClause** - `project-keep col1, col2, ...`
- **ProjectRenameClause** - `project-rename newName = oldName, ...`
- **ProjectReorderClause** - `project-reorder col1, col2, ...`
- **ExtendClause** - `extend newCol = expr, ...`
- **SortClause** - `sort [by] col [asc|desc] [nulls first|last], ...`
- **LimitClause** - `limit N`
- **TakeClause** - `take N`
- **TopClause** - `top N by col [asc|desc], ...`
- **DistinctClause** - `distinct col1, col2, ...`
- **SummarizeClause** - `summarize agg() [by groupCol, ...]`
- **MvExpandClause** - `mv-expand col1, col2, ...`
- **UnionClause** - `union [kind=inner|outer] [withsource=col] table`

## Query-Level Operators

These start a query (not after a pipe):

- **UnionExpression** - `union [kind=inner|outer] [withsource=col] table1, table2, ...`
- **SearchExpression** - `search [kind=case_sensitive|case_insensitive] [in (tables)] "text"`
- **FindExpression** - `find [kind=case_sensitive|case_insensitive] [in (tables)] "text"`

## Tokens

### Keywords (via `kw<term>` macro)
All keywords use `@specialize[@name={term}]<Identifier, term>` pattern:
- Statement: `let`
- Operators: `where`, `project`, `extend`, `sort`, `order`, `limit`, `take`, `top`, `distinct`, `summarize`, `mv-expand`, `union`, `search`, `find`
- Modifiers: `by`, `asc`, `desc`, `nulls`, `first`, `last`, `kind`, `inner`, `outer`, `withsource`, `in`, `case_sensitive`, `case_insensitive`
- Logical: `and`, `or`, `not`
- String ops: `contains`, `startswith`, `endswith`, `has`, `between` (with `!` negations and `_cs` variants)

### Literals
- **Number** - `@digit+ ("." @digit+)?`
- **Timespan** - `@digit+ ("." @digit+)? ($[dhms] | "ms" | "us" | "ns" | "tick" | "ticks")`
- **String** - verbatim `@"..."`, obfuscated `h"..."`, regular `"..."` or `'...'`
- **Identifier** - `$[A-Za-z_] $[A-Za-z0-9_]*`
- **BracketedIdentifier** - `[ String ]`

### Operators
- Comparison: `==`, `!=`, `>=`, `<=`, `>`, `<`
- Arithmetic: `+`, `-`, `*`, `/`, `%`
- String: `contains`, `startswith`, etc. (as keywords)
- Between: `between`, `!between` (as keywords)

### Punctuation
- `(`, `)`, `[`, `]`, `,`, `;`, `|`, `=`, `..`

### Comments
- **LineComment** - `// ![\n]*`

## Common Patterns

### Keyword Specialization
```
kw<"where"> { @specialize[@name=where]<Identifier, "where"> }
```

### Optional Elements
```
SortDirection? NullsPosition?
```

### Lists
```
IdentifierList { Identifier (Comma Identifier)* }
```

### Choice
```
TableExpression { Identifier | BracketedIdentifier | OpenParen PipelineExpression CloseParen }
```

## Token Precedence

Defined in `@tokens { @precedence { ... } }`:
```
@precedence { Timespan, Number, LineComment, Slash, String, Identifier }
```

This resolves ambiguities when multiple tokens could match:
- Timespan before Number (so `1d` is timespan, not number+identifier)
- LineComment before Slash (so `//` is comment, not two slashes)
- String before Identifier (for obfuscated strings `h"..."`)

## CST Node Types

After parsing, the tree contains these node types:

- **Structure**: KQL, Query, QueryExpression, LetStatement
- **Expressions**: Expression, OrExpression, AndExpression, NotExpression, ComparisonExpression, AdditiveExpression, MultiplicativeExpression, UnaryExpression, PrimaryExpression
- **Operators**: TabularOperator (wrapper), WhereClause, ProjectClause, ExtendClause, SortClause, etc.
- **Tables**: TableExpression, PipelineExpression
- **Literals**: Number, Timespan, String, Identifier, BracketedIdentifier, FunctionCall
- **Punctuation**: OpenParen, CloseParen, Comma, Pipe, Equals, etc.
- **Keywords**: let, where, and, or, not, contains, etc.

## Debugging Tips

1. **Shift/Reduce Conflicts** - Usually caused by ambiguous grammar rules. Make operators left-associative and add explicit precedence.

2. **Token Overlap** - Use `@precedence` to resolve. Example: `Timespan` before `Number`.

3. **Missing Nodes** - Check that CST-to-AST mappers handle all node types in `TabularOperator`, `Expression` hierarchy.

4. **Unexpected Tokens** - Verify keyword specialization uses quotes: `kw<"term">`, not `kw<term>`.

5. **Empty Output** - Check Lezer generator output for syntax errors in generated grammar.

## Example Query Parse Tree

```kql
Users | where age > 18 | project name, isAdult = age >= 21
```

Parses to:
```
KQL
  Query
    QueryExpression
      PipelineExpression
        TableExpression(Identifier "Users")
        Pipe
        TabularOperator
          WhereClause
            where
            Expression
              ComparisonExpression(age > 18)
        Pipe
        TabularOperator
          ProjectClause
            project
            ProjectExpressionList
              ProjectExpressionItem(name)
              ProjectExpressionItem(isAdult = age >= 21)
```
