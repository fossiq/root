# Eta Template Rewrite Plan for Lezer Grammar Generator

## Overview

The `lezer-grammar-generator` package currently uses extensive string concatenation and template literals to generate Lezer grammar text. This approach leads to:

- **Maintainability Issues**: Large functions with complex string building logic
- **Error-Prone Code**: Easy to introduce syntax errors in generated grammar
- **Hard to Test**: String outputs are difficult to verify for correctness
- **Poor Readability**: Mixed logic and template code

This plan outlines a rewrite using [Eta.js](https://eta.js.org/), a lightweight, fast templating engine for JavaScript that supports embedded JavaScript expressions and logic.

## Current String Generation Pain Points

### 1. Grammar Serialization (`src/serialization/`)
- `generateLezerGrammar()`: Complex section concatenation
- `renderTokens()`, `renderLocalTokens()`: Repetitive token formatting
- `renderRules()`: Nested rule formatting with parameters and properties
- `formatProps()`: Complex property serialization with dialect handling

### 2. Legacy Generator (`src/generator/`)
- `generateTokensSection()`: 70+ lines of token template building
- `generatePrecedenceSection()`: Complex precedence grouping logic mixed with string building
- Macro and section generation functions

### 3. Validation Messages
- Error message construction scattered throughout validation functions
- Inconsistent formatting and parameterization

## Eta.js Benefits for This Use Case

### 1. Separation of Concerns
- **Logic**: JavaScript code handles data transformation
- **Presentation**: Eta templates handle string formatting
- **Result**: Cleaner, more maintainable code

### 2. Template Features Perfect for Grammar Generation
- **Embedded JavaScript**: Complex logic in templates (loops, conditionals)
- **Partial Templates**: Reusable template components
- **Whitespace Control**: Precise control over generated output
- **Type Safety**: Templates can be validated against data structures

### 3. Performance
- **Fast Compilation**: Templates compiled once, executed many times
- **Minimal Overhead**: Lightweight runtime
- **Caching**: Compiled templates can be cached

## Rewrite Scope and Strategy

### Phase 1: Core Serialization Templates
**Priority: High** | **Effort: Medium** | **Risk: Low** | **Status: COMPLETED**

#### Files Created:
```
src/templates/
├── template-manager.ts  # Template management with Eta integration
├── helpers.ts           # Serialization helper functions
├── index.ts             # Template loading
└── sections/
    ├── tokens.eta       # Token definitions
    ├── local-tokens.eta # Local token definitions
    ├── externals.eta    # External tokens
    ├── dialects.eta     # Dialect declarations
    ├── precedence.eta   # Precedence rules
    ├── detectDelim.eta  # Detect delimiter directive
    ├── skip.eta         # Skip patterns
    ├── top.eta          # Top rule declaration
    └── rules.eta        # Rule definitions
```

#### Migration Steps Completed:
1. ✅ Install Eta.js as dependency (already present)
2. ✅ Create base template infrastructure (TemplateManager, helpers)
3. ✅ Rewrite `grammar-serialize.ts` to render sections separately and join
4. ✅ Update tests to match new output format
5. ✅ Remove old string concatenation code

#### Lessons Learned:
- **Whitespace Sensitivity**: Eta templates preserve all whitespace, requiring careful control of newlines for correct grammar formatting
- **Section-Based Approach**: Splitting into separate templates per section provides better maintainability than a single large template
- **Join Strategy**: Rendering sections individually and joining in TypeScript gives precise control over separators
- **Template Compilation**: Pre-compile templates for performance; use `Eta.renderString` for rendering
- **Error Handling**: Template loading and rendering need robust error handling for missing files or syntax issues

### Phase 2: Legacy Generator Templates
**Priority: Medium** | **Effort: High** | **Risk: Medium**

#### Files to Create:
```
src/templates/generator/
├── config.eta           # Main config template
├── token-section.eta    # Default token sections
├── rule-section.eta     # Rule sections
├── precedence-section.eta
└── macro-section.eta
```

#### Migration Steps:
1. Template the token generation logic
2. Rewrite section generators
3. Update plugin merging to work with templates
4. Comprehensive testing of generated grammars

### Phase 3: Validation Message Templates
**Priority: Low** | **Effort: Low** | **Risk: Low**

#### Files to Create:
```
src/templates/validation/
├── errors.eta           # Error message templates
├── warnings.eta         # Warning message templates
└── issues.eta           # Issue formatting
```

## Technical Implementation

### Template Data Structures

```typescript
// For grammar serialization
interface GrammarTemplateData {
  name?: string;
  tokens?: TokenDef[];
  localTokens?: TokenDef[];
  externals?: string[];
  dialects?: string[];
  precedence?: PrecedenceLevel[];
  detectDelim?: boolean;
  skip?: PatternExpression;
  top?: string;
  rules: Record<string, RuleDef>;
}

// For legacy generator
interface GeneratorTemplateData {
  grammarName: string;
  tokens: TokenDefinition[];
  rules: Record<string, RuleDef>;
  precedence?: string[];
  macros?: Record<string, string>;
  skipWhitespace: boolean;
}
```

### Template Engine Integration

```typescript
import { Eta } from "eta";

// Template compilation and caching
class TemplateManager {
  private templates = new Map<string, Eta>();

  load(name: string, template: string): void {
    this.templates.set(name, new Eta({ templates: { [name]: template } }));
  }

  render<T>(name: string, data: T): string {
    const template = this.templates.get(name);
    if (!template) throw new Error(`Template ${name} not found`);
    return template.render(data);
  }
}
```

### Example Template: Token Section

```eta
@tokens {
<% for (const token of it.tokens) { %>
  <%= token.name %><% if (token.dialect) { %>[@dialect=<%= token.dialect %>]<% } %> { <%= serializePattern(token.pattern) %> }
<% } %>
}
```

## Testing Strategy

### 1. Template Output Verification
- **Snapshot Tests**: Capture expected template outputs
- **Grammar Validation**: Ensure generated grammar parses correctly
- **Regression Tests**: Compare old vs new outputs

### 2. Template Logic Testing
- **Unit Tests**: Test template helper functions
- **Integration Tests**: End-to-end grammar generation
- **Edge Case Coverage**: Empty inputs, special characters, etc.

### 3. Performance Testing
- **Compilation Time**: Measure template compilation overhead
- **Render Time**: Compare with string concatenation
- **Memory Usage**: Monitor template caching

## Migration Timeline

### Week 1: Infrastructure Setup
- Install Eta.js
- Create template directory structure
- Set up TemplateManager class
- Basic template loading/rendering tests

### Week 2: Core Serialization
- Implement grammar.eta and section templates
- Rewrite grammar-serialize.ts
- Update pattern-serialize.ts integration
- Full test suite validation

### Week 3: Legacy Generator
- Template token section generation
- Rewrite generator sections
- Update plugin handling
- Cross-package testing (kql-lezer integration)

### Week 4: Polish and Optimization
- Validation message templates
- Performance optimization
- Documentation updates
- Final testing and cleanup

## Risk Mitigation

### 1. Backward Compatibility
- **Template Output Validation**: Ensure identical output to current implementation
- **API Preservation**: Keep existing function signatures
- **Gradual Migration**: Phase-by-phase rollout

### 2. Error Handling
- **Template Compilation Errors**: Clear error messages for template syntax issues
- **Runtime Errors**: Proper error propagation from templates
- **Fallback Mechanisms**: Ability to fall back to string concatenation if needed

### 3. Maintenance
- **Template Documentation**: Comprehensive comments in templates
- **Version Control**: Templates as first-class code artifacts
- **Developer Experience**: Good error messages and debugging support

## Success Metrics

### 1. Code Quality
- **Lines of Code**: 30-40% reduction in string manipulation code
- **Cyclomatic Complexity**: Reduced complexity in generation functions
- **Maintainability Index**: Improved scores

### 2. Performance
- **Generation Speed**: No significant performance regression
- **Memory Usage**: Efficient template caching
- **Bundle Size**: Minimal impact from Eta.js

### 3. Developer Experience
- **Template Readability**: Easier to understand grammar structure
- **Error Debugging**: Better error messages for generation issues
- **Testing**: Simplified test writing for complex outputs

## Dependencies and Requirements

### Runtime Dependencies
- `eta`: ^3.2.0 (lightweight templating engine)

### Development Dependencies
- Template validation tools
- Enhanced testing utilities for template outputs

### Node.js Version
- Compatible with existing Bun/Node.js setup
- No additional runtime requirements

## Conclusion

This rewrite will significantly improve the maintainability and reliability of the grammar generation code. By separating presentation logic from business logic, we'll create a more robust, testable, and maintainable codebase that scales better as the grammar complexity grows.

The phased approach ensures minimal risk while providing substantial benefits. Eta.js is an excellent fit for this use case due to its performance, simplicity, and JavaScript-native syntax.

**Phase 1 completed successfully. Phase 2 (Legacy Generator Templates) ready for implementation.**