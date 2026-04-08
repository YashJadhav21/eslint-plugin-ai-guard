/**
 * Reusable AST helper utilities for rule authors.
 */
import type { TSESTree } from '@typescript-eslint/utils';

/**
 * Check if a node is an async function (any type: declaration, expression, or arrow).
 */
export function isAsyncFunction(
  node: TSESTree.Node
): node is
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression {
  return (
    (node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression') &&
    node.async
  );
}

/**
 * Array method names that iterate over elements.
 */
export const ARRAY_ITERATION_METHODS = [
  'map',
  'filter',
  'forEach',
  'reduce',
  'flatMap',
  'find',
  'findIndex',
  'some',
  'every',
] as const;

/**
 * Check if a CallExpression is a method call on an object (e.g., arr.map()).
 */
export function isMethodCall(
  node: TSESTree.CallExpression,
  methodName: string
): boolean {
  return (
    node.callee.type === 'MemberExpression' &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === methodName
  );
}

/**
 * Check if a CallExpression is a call to one of the given method names.
 */
export function isMethodCallOneOf(
  node: TSESTree.CallExpression,
  methodNames: readonly string[]
): boolean {
  return (
    node.callee.type === 'MemberExpression' &&
    node.callee.property.type === 'Identifier' &&
    methodNames.includes(node.callee.property.name)
  );
}
