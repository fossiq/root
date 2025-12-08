/**
 * Tree-sitter grammar helper functions
 * These match the official tree-sitter grammar DSL API
 */

import type { Rule } from './types.js';

/**
 * Matches a sequence of rules in order
 */
export function seq(...rules: Array<Rule | string | RegExp>): Rule {
  return {
    type: 'SEQ',
    members: rules.map(normalizeRule),
  };
}

/**
 * Matches any one of the given rules
 */
export function choice(...rules: Array<Rule | string | RegExp>): Rule {
  return {
    type: 'CHOICE',
    members: rules.map(normalizeRule),
  };
}

/**
 * Matches zero or more repetitions of a rule
 */
export function repeat(rule: Rule | string | RegExp): Rule {
  return {
    type: 'REPEAT',
    content: normalizeRule(rule),
  };
}

/**
 * Matches one or more repetitions of a rule
 */
export function repeat1(rule: Rule | string | RegExp): Rule {
  return {
    type: 'REPEAT1',
    content: normalizeRule(rule),
  };
}

/**
 * Matches the rule or nothing
 */
export function optional(rule: Rule | string | RegExp): Rule {
  return {
    type: 'CHOICE',
    members: [normalizeRule(rule), { type: 'BLANK' }],
  };
}

/**
 * Assigns a numerical precedence to a rule
 */
export function prec(precedence: number, rule: Rule | string | RegExp): Rule {
  return {
    type: 'PREC',
    value: precedence,
    content: normalizeRule(rule),
  };
}

/**
 * Left-associative precedence
 */
prec.left = function (precedenceOrRule: number | Rule | string | RegExp, rule?: Rule | string | RegExp): Rule {
  if (typeof precedenceOrRule === 'number' && rule !== undefined) {
    return {
      type: 'PREC_LEFT',
      value: precedenceOrRule,
      content: normalizeRule(rule),
    };
  }
  return {
    type: 'PREC_LEFT',
    value: 0,
    content: normalizeRule(precedenceOrRule as Rule | string | RegExp),
  };
};

/**
 * Right-associative precedence
 */
prec.right = function (precedenceOrRule: number | Rule | string | RegExp, rule?: Rule | string | RegExp): Rule {
  if (typeof precedenceOrRule === 'number' && rule !== undefined) {
    return {
      type: 'PREC_RIGHT',
      value: precedenceOrRule,
      content: normalizeRule(rule),
    };
  }
  return {
    type: 'PREC_RIGHT',
    value: 0,
    content: normalizeRule(precedenceOrRule as Rule | string | RegExp),
  };
};

/**
 * Dynamic precedence for resolving ambiguities
 */
prec.dynamic = function (precedence: number, rule: Rule | string | RegExp): Rule {
  return {
    type: 'PREC_DYNAMIC',
    value: precedence,
    content: normalizeRule(rule),
  };
};

/**
 * Marks a rule as a token (no whitespace allowed between its parts)
 */
export function token(rule: Rule | string | RegExp): Rule {
  return {
    type: 'TOKEN',
    content: normalizeRule(rule),
  };
}

/**
 * Creates an alias for a rule
 */
export function alias(rule: Rule | string | RegExp, name: string, named: boolean = true): Rule {
  return {
    type: 'ALIAS',
    content: normalizeRule(rule),
    named,
    value: name,
  };
}

/**
 * Assigns a field name to a rule for easier access in the AST
 */
export function field(name: string, rule: Rule | string | RegExp): Rule {
  return {
    type: 'FIELD',
    name,
    content: normalizeRule(rule),
  };
}

/**
 * Normalizes a rule to the proper Rule type
 */
function normalizeRule(rule: Rule | string | RegExp): Rule {
  if (typeof rule === 'string') {
    return {
      type: 'STRING',
      value: rule,
    };
  }
  if (rule instanceof RegExp) {
    return {
      type: 'PATTERN',
      value: rule.source,
    };
  }
  return rule;
}

/**
 * Creates a regex pattern rule
 */
export function pattern(regex: RegExp | string): Rule {
  const value = typeof regex === 'string' ? regex : regex.source;
  return {
    type: 'PATTERN',
    value,
  };
}

/**
 * References another rule by name
 */
export function symbol(name: string): Rule {
  return {
    type: 'SYMBOL',
    name,
  };
}
