import { ESLintUtils, AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/YashJadhav21/eslint-plugin-ai-guard/blob/main/docs/rules/${name}.md`
);

/**
 * Heuristic: checks if a function name or callee suggests it returns a Promise.
 * This is a naming-convention-based approach for MVP (no type-checker needed).
 */
function looksLikeAsyncCall(node: TSESTree.CallExpression): boolean {
  // Direct call: fetchData(), loadUser(), etc.
  if (node.callee.type === AST_NODE_TYPES.Identifier) {
    return hasAsyncishName(node.callee.name);
  }

  // Method call: this.fetchData(), service.loadUser(), etc.
  if (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    return hasAsyncishName(node.callee.property.name);
  }

  return false;
}

/**
 * Heuristic naming patterns for async functions.
 * Common prefixes/names used by both humans and AI for async operations.
 */
function hasAsyncishName(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.startsWith('fetch') ||
    lower.startsWith('load') ||
    lower.startsWith('save') ||
    lower.startsWith('delete') ||
    lower.startsWith('create') ||
    lower.startsWith('update') ||
    lower.startsWith('get') ||
    lower.startsWith('post') ||
    lower.startsWith('put') ||
    lower.startsWith('patch') ||
    lower.startsWith('send') ||
    lower.startsWith('upload') ||
    lower.startsWith('download') ||
    lower.startsWith('connect') ||
    lower.startsWith('disconnect') ||
    lower.startsWith('subscribe') ||
    lower.startsWith('publish') ||
    lower.startsWith('request') ||
    lower.startsWith('query') ||
    lower === 'axios' ||
    lower === 'fetch'
  );
}

/**
 * Check if a CallExpression's callee is known to be async — either via:
 * 1. The callee is defined as an async function in the current scope
 * 2. The callee name matches naming heuristics
 */
function isCalleeAsync(
  node: TSESTree.CallExpression,
  asyncFunctionNames: Set<string>
): boolean {
  // If the callee is an identifier and we've seen it declared as async
  if (node.callee.type === AST_NODE_TYPES.Identifier) {
    if (asyncFunctionNames.has(node.callee.name)) {
      return true;
    }
  }

  // Fall back to naming heuristics
  return looksLikeAsyncCall(node);
}

/**
 * Check if the ExpressionStatement is already handled:
 * - Used as argument to .then() or .catch()
 * - Inside an await
 * - Piped to void
 * - Result is assigned
 */
function isExpressionHandled(node: TSESTree.ExpressionStatement): boolean {
  const expr = node.expression;

  // Check if the expression is a call chained with .then() or .catch()
  if (expr.type === AST_NODE_TYPES.CallExpression) {
    if (expr.callee.type === AST_NODE_TYPES.MemberExpression) {
      const prop = expr.callee.property;
      if (prop.type === AST_NODE_TYPES.Identifier) {
        if (prop.name === 'then' || prop.name === 'catch' || prop.name === 'finally') {
          return true;
        }
      }
    }
  }

  // void operator suppresses the warning intentionally
  if (expr.type === AST_NODE_TYPES.UnaryExpression && expr.operator === 'void') {
    return true;
  }

  return false;
}

export const noFloatingPromise = createRule({
  name: 'no-floating-promise',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow calling an async function or Promise-returning function without awaiting or handling the result. AI tools frequently generate floating promises where errors disappear silently.',
    },
    fixable: undefined,
    schema: [],
    messages: {
      floatingPromise:
        'This async call is not awaited, returned, or error-handled (.catch). AI tools frequently generate floating promises, causing errors to be silently lost. Add `await`, `.catch()`, or assign the result.',
    },
  },
  defaultOptions: [],
  create(context) {
    // Track function names declared with `async` keyword in the current file
    const asyncFunctionNames = new Set<string>();

    return {
      // Track async function declarations
      FunctionDeclaration(node) {
        if (node.async && node.id) {
          asyncFunctionNames.add(node.id.name);
        }
      },

      // Track async arrow functions assigned to variables
      VariableDeclarator(node) {
        if (
          node.init &&
          (node.init.type === AST_NODE_TYPES.ArrowFunctionExpression ||
            node.init.type === AST_NODE_TYPES.FunctionExpression) &&
          node.init.async &&
          node.id.type === AST_NODE_TYPES.Identifier
        ) {
          asyncFunctionNames.add(node.id.name);
        }
      },

      // Check ExpressionStatements — standalone call expressions
      ExpressionStatement(node) {
        // We only care about bare CallExpression statements
        if (node.expression.type !== AST_NODE_TYPES.CallExpression) {
          return;
        }

        // If it's already chained with .then()/.catch() or wrapped in void, skip
        if (isExpressionHandled(node)) {
          return;
        }

        const callExpr = node.expression;

        // Check if the callee is async
        if (isCalleeAsync(callExpr, asyncFunctionNames)) {
          context.report({
            node,
            messageId: 'floatingPromise',
          });
        }
      },
    };
  },
});

export default noFloatingPromise;
