import { ESLintUtils, AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/YashJadhav21/eslint-plugin-ai-guard/blob/main/docs/rules/${name}.md`
);

const ARRAY_CALLBACK_METHODS = ['map', 'filter', 'forEach', 'reduce', 'flatMap', 'find', 'findIndex', 'some', 'every'] as const;

const PROMISE_COMBINATORS = ['all', 'allSettled', 'race', 'any'] as const;

/**
 * Checks if the given CallExpression (e.g., arr.map(...)) is used as an argument
 * to Promise.all(), Promise.allSettled(), Promise.race(), or Promise.any().
 */
function isWrappedInPromiseCombinator(
  node: TSESTree.CallExpression,
  context: Readonly<Parameters<ReturnType<typeof createRule>['create']>[0]>
): boolean {
  const ancestors = context.sourceCode.getAncestors(node);
  // The immediate parent should be a CallExpression with callee Promise.all/etc.
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const ancestor = ancestors[i];
    if (
      ancestor.type === AST_NODE_TYPES.CallExpression &&
      ancestor.callee.type === AST_NODE_TYPES.MemberExpression &&
      ancestor.callee.object.type === AST_NODE_TYPES.Identifier &&
      ancestor.callee.object.name === 'Promise' &&
      ancestor.callee.property.type === AST_NODE_TYPES.Identifier &&
      PROMISE_COMBINATORS.includes(
        ancestor.callee.property.name as (typeof PROMISE_COMBINATORS)[number]
      )
    ) {
      return true;
    }
    // Only look up to the immediate call expression ancestor, not further
    if (ancestor.type === AST_NODE_TYPES.CallExpression) {
      break;
    }
  }
  return false;
}

/**
 * Checks if a node is an async function expression or arrow function.
 */
function isAsyncCallback(node: TSESTree.Node): boolean {
  return (
    (node.type === AST_NODE_TYPES.FunctionExpression ||
      node.type === AST_NODE_TYPES.ArrowFunctionExpression) &&
    node.async
  );
}

export const noAsyncArrayCallback = createRule({
  name: 'no-async-array-callback',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow async callbacks in array iteration methods (map, filter, forEach, reduce). AI tools generate `array.map(async ...)` which returns `Promise[]` instead of resolved values — a silent bug.',
    },
    fixable: undefined,
    schema: [],
    messages: {
      asyncArrayCallback:
        'Async callback passed to Array.{{method}}(). This returns an array of Promises, not resolved values. AI tools frequently generate this pattern. Wrap with `await Promise.all(array.{{method}}(...))` or use a for...of loop.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        // Check if this is a method call like something.map(...), something.filter(...), etc.
        if (
          node.callee.type !== AST_NODE_TYPES.MemberExpression ||
          node.callee.property.type !== AST_NODE_TYPES.Identifier
        ) {
          return;
        }

        const methodName = node.callee.property.name;

        if (
          !ARRAY_CALLBACK_METHODS.includes(
            methodName as (typeof ARRAY_CALLBACK_METHODS)[number]
          )
        ) {
          return;
        }

        // The callback is the first argument for all methods except reduce where it's also the first
        const callback = node.arguments[0];
        if (!callback) {
          return;
        }

        if (isAsyncCallback(callback)) {
          // Don't flag if the array method call is already wrapped in Promise.all/allSettled/race/any
          // e.g., Promise.all(arr.map(async ...)) — this is the correct pattern
          if (isWrappedInPromiseCombinator(node, context)) {
            return;
          }

          context.report({
            node: callback,
            messageId: 'asyncArrayCallback',
            data: {
              method: methodName,
            },
          });
        }
      },
    };
  },
});

export default noAsyncArrayCallback;
