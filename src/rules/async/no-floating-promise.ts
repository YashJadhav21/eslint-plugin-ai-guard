import { ESLintUtils, AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/YashJadhav21/eslint-plugin-ai-guard/blob/main/docs/rules/${name}.md`
);

const KNOWN_PROMISE_FACTORIES = new Set([
  'fetch',
]);

const PROMISE_STATIC_METHODS = new Set([
  'resolve',
  'reject',
  'all',
  'allSettled',
  'race',
  'any',
]);

interface TypeCheckerLike {
  getTypeAtLocation(node: unknown): unknown;
  typeToString(type: unknown): string;
  getPromisedTypeOfPromise?(type: unknown): unknown;
}

interface ProgramLike {
  getTypeChecker(): TypeCheckerLike;
}

interface ParserServicesLike {
  program?: ProgramLike;
  esTreeNodeToTSNodeMap?: {
    get(node: TSESTree.Node): unknown;
  };
}

/**
 * Check if a CallExpression's callee is known async via local declarations.
 */
function isLocallyAsyncCallee(
  node: TSESTree.CallExpression,
  asyncFunctionNames: Set<string>
): boolean {
  // If the callee is an identifier and we've seen it declared as async
  if (node.callee.type === AST_NODE_TYPES.Identifier) {
    if (asyncFunctionNames.has(node.callee.name)) {
      return true;
    }
  }

  if (
    (node.callee.type === AST_NODE_TYPES.FunctionExpression ||
      node.callee.type === AST_NODE_TYPES.ArrowFunctionExpression) &&
    node.callee.async
  ) {
    return true;
  }

  return false;
}

function isKnownPromiseFactoryCall(node: TSESTree.CallExpression): boolean {
  if (node.callee.type === AST_NODE_TYPES.Identifier) {
    return KNOWN_PROMISE_FACTORIES.has(node.callee.name);
  }

  if (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.object.type === AST_NODE_TYPES.Identifier &&
    node.callee.object.name === 'Promise' &&
    node.callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    return PROMISE_STATIC_METHODS.has(node.callee.property.name);
  }

  return false;
}

function getParserServices(
  context: Readonly<Parameters<ReturnType<typeof createRule>['create']>[0]>,
): ParserServicesLike | null {
  const services = context.sourceCode.parserServices as unknown;
  if (!services || typeof services !== 'object') {
    return null;
  }

  return services as ParserServicesLike;
}

function isPromiseLikeByTypeInfo(
  node: TSESTree.CallExpression,
  context: Readonly<Parameters<ReturnType<typeof createRule>['create']>[0]>,
): boolean {
  const services = getParserServices(context);
  if (!services?.program || !services.esTreeNodeToTSNodeMap) {
    return false;
  }

  try {
    const tsNode = services.esTreeNodeToTSNodeMap.get(node);
    if (!tsNode) {
      return false;
    }

    const checker = services.program.getTypeChecker();
    const type = checker.getTypeAtLocation(tsNode);

    if (typeof checker.getPromisedTypeOfPromise === 'function') {
      if (checker.getPromisedTypeOfPromise(type)) {
        return true;
      }
    }

    const text = checker.typeToString(type).toLowerCase();
    return (
      text === 'promise' ||
      text.includes('promise<') ||
      text.includes('promiselike<') ||
      text.includes('thenable')
    );
  } catch {
    return false;
  }
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
        if (
          node.expression.type === AST_NODE_TYPES.NewExpression &&
          node.expression.callee.type === AST_NODE_TYPES.Identifier &&
          node.expression.callee.name === 'Promise'
        ) {
          context.report({
            node,
            messageId: 'floatingPromise',
          });
          return;
        }

        // We only care about bare CallExpression statements
        if (node.expression.type !== AST_NODE_TYPES.CallExpression) {
          return;
        }

        // If it's already chained with .then()/.catch() or wrapped in void, skip
        if (isExpressionHandled(node)) {
          return;
        }

        const callExpr = node.expression;

        if (
          isLocallyAsyncCallee(callExpr, asyncFunctionNames) ||
          isKnownPromiseFactoryCall(callExpr) ||
          isPromiseLikeByTypeInfo(callExpr, context)
        ) {
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
