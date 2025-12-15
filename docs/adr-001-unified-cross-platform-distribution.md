# ADR 001: Unified Cross-Platform Package Distribution

## Status

Accepted

## Context

The `@fossiq/kql-parser` package is a tree-sitter based parser for Kusto Query Language (KQL) that needs to support multiple platforms and architectures:

- **Native environments**: Linux (x64, ARM64), macOS (x64, ARM64), Windows (x64, ARM64)
- **Browser environments**: WebAssembly (WASM)

The package includes:

- TypeScript/JavaScript code and type definitions
- Native prebuilt binaries for each platform (via tree-sitter bindings)
- WASM binary for browser usage
- Tree-sitter grammar and generated parser files

We needed to decide how to distribute these components to provide the best developer experience while maintaining cross-platform compatibility.

## Decision

We will distribute all platform-specific binaries and WASM in a **single unified npm package** (`@fossiq/kql-parser`) that includes:

- All native prebuilt binaries in the `prebuilds/` directory
- WASM binary (`tree-sitter-kql.wasm`) in the package root
- TypeScript/JavaScript code and type definitions
- Tree-sitter grammar files

The CI/CD pipeline will:

1. Build native binaries on each target platform (Linux x64/ARM64, macOS x64/ARM64, Windows x64/ARM64)
2. Build WASM on Linux x64 using WASI SDK
3. Merge all artifacts into a single package
4. Publish the unified package to npm

## Consequences

### Positive

- **Simple installation**: Users run `npm install @fossiq/kql-parser` once
- **Automatic platform detection**: Tree-sitter automatically loads the correct binary
- **Unified API**: Same import/usage pattern for all platforms
- **Standard pattern**: Follows how other tree-sitter parsers are distributed
- **Small effective size**: npm only installs binaries needed for the user's platform
- **Seamless WASM support**: Browser usage works out-of-the-box
- **No dependency management**: No optionalDependencies complexity

### Negative

- **Larger package size**: All binaries are included in the npm tarball
- **All binaries downloaded**: Even though npm caches intelligently, initial install includes everything
- **CI complexity**: Need to build and merge artifacts from multiple platforms

### Neutral

- **Build time**: Slightly longer CI due to multi-platform builds
- **Maintenance**: Single package to maintain vs. multiple packages

## Alternatives Considered

### Option 1: Separate Platform-Specific Packages

**Approach**: Create main package + separate packages for each platform (e.g., `@fossiq/kql-parser-linux-x64`, `@fossiq/kql-parser-darwin-arm64`)

**Pros**:

- Smaller individual packages
- Users only download what they need
- Follows esbuild's pattern

**Cons**:

- Complex runtime platform detection logic required
- Breaking change for existing users
- Multiple packages to maintain/version together
- WASM handling becomes more complex
- Users need to understand optionalDependencies

**Rejected because**: Adds unnecessary complexity for minimal benefit. Tree-sitter bindings are small (~100KB each), and npm's platform-specific installation already optimizes downloads.

### Option 2: Runtime Download of Binaries

**Approach**: Download platform-specific binaries at runtime from a CDN

**Pros**:

- Minimal package size
- Always up-to-date binaries

**Cons**:

- Requires network access at runtime
- Security concerns with binary downloads
- Complex fallback logic
- Not suitable for air-gapped environments

**Rejected because**: Runtime network dependencies are unacceptable for a parser library, and security concerns outweigh size benefits.

### Option 3: Source-Only Package

**Approach**: Ship only source code, require users to build locally

**Pros**:

- Minimal package size
- Always compatible with user's environment

**Cons**:

- Poor developer experience (build tools required)
- Platform-specific build failures
- Slower installation
- Not suitable for production deployments

**Rejected because**: The target audience expects prebuilt binaries for immediate usage.

## Implementation Details

### Build Process

- **Native builds**: Use `node-gyp` to build platform-specific bindings on each target platform
- **WASM builds**: Use tree-sitter CLI with WASI SDK on Linux x64
- **Artifact merging**: CI downloads artifacts from all platforms and merges `dist/` directories
- **Publishing**: Single npm package with all binaries included

### File Structure

```
@fossiq/kql-parser/
├── dist/
│   ├── index.js
│   ├── index.d.ts
│   └── prebuilds/
│       ├── linux-x64/
│       ├── linux-arm64/
│       ├── darwin-x64/
│       ├── darwin-arm64/
│       ├── win32-x64/
│       └── win32-arm64/
├── tree-sitter-kql.wasm
└── package.json
```

### Usage Examples

**Native (Node.js/Bun):**

```typescript
import Parser from "tree-sitter";
import KqlLanguage from "@fossiq/kql-parser";

const parser = new Parser();
parser.setLanguage(KqlLanguage); // Auto-loads correct platform binary
```

**Browser:**

```typescript
import Parser from "web-tree-sitter";

await Parser.init();
const KqlLanguage = await Parser.Language.load(
  "./node_modules/@fossiq/kql-parser/tree-sitter-kql.wasm"
);
const parser = new Parser();
parser.setLanguage(KqlLanguage);
```

## References

- [Tree-sitter documentation](https://tree-sitter.github.io/tree-sitter/)
- [npm prebuilt binaries](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#directories)
- [esbuild platform-specific packages](https://esbuild.github.io/getting-started/#install-esbuild)
