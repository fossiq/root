import { isValidIdentifier } from "./type-guards.js";

/**
 * Branded types to prevent mixing up similar string types at compile time.
 * These types use TypeScript's intersection types with a unique brand property.
 */

// Core domain types
export type GrammarName = string & { readonly __brand: 'GrammarName' };
export type RuleName = string & { readonly __brand: 'RuleName' };
export type TokenName = string & { readonly __brand: 'TokenName' };
export type MacroName = string & { readonly __brand: 'MacroName' };
export type PluginName = string & { readonly __brand: 'PluginName' };

// Constructor functions for branded types
export function createGrammarName(name: string): GrammarName | null {
  return isValidIdentifier(name) ? (name as GrammarName) : null;
}

export function createRuleName(name: string): RuleName | null {
  return isValidIdentifier(name) ? (name as RuleName) : null;
}

export function createTokenName(name: string): TokenName | null {
  return isValidIdentifier(name) ? (name as TokenName) : null;
}

export function createMacroName(name: string): MacroName | null {
  return isValidIdentifier(name) ? (name as MacroName) : null;
}

export function createPluginName(name: string): PluginName | null {
  return isValidIdentifier(name) ? (name as PluginName) : null;
}

// Type guards for branded types
export function isGrammarName(value: string): value is GrammarName {
  return isValidIdentifier(value);
}

export function isRuleName(value: string): value is RuleName {
  return isValidIdentifier(value);
}

export function isTokenName(value: string): value is TokenName {
  return isValidIdentifier(value);
}

export function isMacroName(value: string): value is MacroName {
  return isValidIdentifier(value);
}

export function isPluginName(value: string): value is PluginName {
  return isValidIdentifier(value);
}

// Utility functions for working with branded types
export function grammarNameToString(name: GrammarName): string {
  return name as string;
}

export function ruleNameToString(name: RuleName): string {
  return name as string;
}

export function tokenNameToString(name: TokenName): string {
  return name as string;
}

export function macroNameToString(name: MacroName): string {
  return name as string;
}

export function pluginNameToString(name: PluginName): string {
  return name as string;
}
