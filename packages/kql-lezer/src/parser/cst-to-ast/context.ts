import { SyntaxNode } from "@lezer/common";

/**
 * Utility functions for navigating syntax nodes.
 * Provides dependency injection for pure functions.
 */

export interface MapperContext {
  slice: (node: SyntaxNode) => string;
  getChild: (node: SyntaxNode, typeName: string) => SyntaxNode | null;
  getChildren: (node: SyntaxNode, typeName: string) => SyntaxNode[];
  parseStringLiteral: (raw: string) => string;
}

/**
 * Create a context object with utility functions.
 */
export function createMapperContext(text: string): MapperContext {
  return {
    slice: (node: SyntaxNode) => text.slice(node.from, node.to),
    getChild: (node: SyntaxNode, typeName: string): SyntaxNode | null => {
      let child = node.firstChild;
      while (child) {
        if (child.type.name === typeName) {
          return child;
        }
        child = child.nextSibling;
      }
      return null;
    },
    getChildren: (node: SyntaxNode, typeName: string): SyntaxNode[] => {
      const children: SyntaxNode[] = [];
      let child = node.firstChild;
      while (child) {
        if (child.type.name === typeName) {
          children.push(child);
        }
        child = child.nextSibling;
      }
      return children;
    },
    parseStringLiteral: (raw: string): string => {
      // Handle verbatim strings @"..." or @'...'
      if (raw.startsWith('@"') && raw.endsWith('"')) {
        return raw.slice(2, -1);
      }
      if (raw.startsWith("@'") && raw.endsWith("'")) {
        return raw.slice(2, -1);
      }

      // Handle obfuscated strings h"..." or h@"..."
      if (raw.startsWith('h@"') && raw.endsWith('"')) {
        return raw.slice(3, -1);
      }
      if (raw.startsWith('h"') && raw.endsWith('"')) {
        return raw.slice(2, -1);
      }

      // Handle regular strings "..." or '...'
      if (
        (raw.startsWith('"') && raw.endsWith('"')) ||
        (raw.startsWith("'") && raw.endsWith("'"))
      ) {
        // Simple unescape (handle \", \', \\, \n, \t, \r)
        return raw
          .slice(1, -1)
          .replace(`\\"`, '"')
          .replace(`\\'`, "'")
          .replace(`\\\\`, "\\")
          .replace(`\\n`, "\n")
          .replace(`\\t`, "\t")
          .replace(`\\r`, "\r");
      }

      return raw;
    },
  };
}
