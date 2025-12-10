# @fossiq/kql-ast

## 1.1.2

## 1.1.1

### Patch Changes

- cc43114: Fix CI test script to handle packages without test files

  - Updated test-packages.sh to check if test files exist before running bun test
  - Prevents CI failures for packages like kql-ast that have test scripts but no test files

## 0.2.1

### Patch Changes

- Fix test scripts to handle coverage flags properly
- Add test:coverage script to all packages

## 0.2.0

### Minor Changes

- Initial release of KQL AST types package
