# Fossiq Documentation

This directory contains architectural decision records (ADRs) and debugging guides for the Fossiq monorepo.

## Contents

### [ADR 001: Unified Cross-Platform Distribution](./adr-001-unified-cross-platform-distribution.md)

**Purpose**: Documents the decision to distribute all platform-specific binaries and WASM in a single unified npm package for `@fossiq/kql-parser`.

**When to reference**:
- Setting up cross-platform builds
- Understanding the package distribution strategy
- Debugging platform-specific binary issues
- Planning changes to the build/publish pipeline

**Status**: Accepted

---

### [CI Build Debug Log](./ci-build-debug.md)

**Purpose**: Captures the debugging history and evolution of the Fossiq CI pipeline, including platform-specific issues, runner configurations, and artifact management.

**When to reference**:
- Debugging CI failures
- Understanding why certain runners are enabled/disabled
- Modifying CI workflows
- Troubleshooting build artifacts or WASM builds

**Key sections**:
- Pipeline Goals: Current requirements and constraints
- Debugging Timeline: Historical issues and resolutions
- Next Steps: Monitoring tasks and future work

---

## Document Maintenance

- **ADRs**: Should be immutable once accepted. Create new ADRs for significant architecture changes.
- **Debug logs**: Update when CI infrastructure changes or when debugging new issues.

## Related Files

- [CLAUDE.md](../CLAUDE.md) - AI agent instructions for working with the codebase
- [CONTRIBUTING.md](../CONTRIBUTING.md) - General contribution guidelines
- [.github/workflows/](./.github/workflows/) - CI/CD workflow definitions
