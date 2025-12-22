import { serializePattern } from "../serialization/pattern-serialize.js";
import type { MacroDef, RuleDef } from "../model.js";

/**
 * Helper function to format properties for rules in templates.
 */
export function formatProps(props: RuleDef["props"], dialect?: string): string {
  const allProps: Record<string, string | number | boolean> = { ...props };
  if (!allProps || Object.keys(allProps).length === 0) {
    if (dialect) return `[@dialect=${dialect}]`;
    return "";
  }
  const keys = Object.keys(allProps).sort((a, b) => a.localeCompare(b));
  const entries = keys.map((key) => {
    const value = allProps[key];
    if (key === "@dialect") {
      return `${key}=${value}`;
    }
    return `${key}=${formatPropValue(value)}`;
  });
  const propStr = entries.length > 0 ? `[${entries.join(", ")}]` : "";
  if (dialect) {
    return propStr
      ? `${propStr.slice(0, -1)}, @dialect=${dialect}]`
      : `[@dialect=${dialect}]`;
  }
  return propStr;
}

/**
 * Helper to format a single property value.
 */
export function formatPropValue(value: string | number | boolean): string {
  if (typeof value === "string") return JSON.stringify(value);
  return String(value);
}

/**
 * Expand macros in a given text string.
 */
export function expandMacrosInText(
  text: string,
  macros: Readonly<Record<string, MacroDef>>
): string {
  return text.replace(/(\w+)<([^>]+)>/g, (match, macroName, argsStr) => {
    const macro = macros[macroName];
    if (!macro || !macro.params) return match;

    const args = argsStr.split(",").map((arg: string) => arg.trim());
    if (args.length !== macro.params.length) return match;

    let expanded = serializePattern(macro.expression);
    for (let i = 0; i < macro.params.length; i++) {
      const param = macro.params[i];
      const arg = args[i];
      // Remove quotes if present
      const cleanArg = arg.replace(/^"(.*)"$/, "$1");
      expanded = expanded.replace(new RegExp(`\\{${param}\\}`, "g"), cleanArg);
    }
    return expanded;
  });
}

// Re-export serializePattern for convenience in templates
export { serializePattern };
