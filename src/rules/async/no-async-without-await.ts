import { ESLintUtils, AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree, TSESLint } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/YashJadhav21/eslint-plugin-ai-guard/blob/main/docs/rules/${name}.md`
);

function containsAwaitExpression(node: TSESTree.Node): boolean {
  if (node.type === AST_NODE_TYPES.AwaitExpression) {
    return true;
  }

  if (node.type === AST_NODE_TYPES.ForOfStatement && node.await) {
    return true;
  }

  // Do not count await expressions inside nested functions.
  if (
    node.type === AST_NODE_TYPES.FunctionDeclaration ||
    node.type === AST_NODE_TYPES.FunctionExpression ||
    node.type === AST_NODE_TYPES.ArrowFunctionExpression
  ) {
    return false;
  }

  const entries = Object.entries(node) as Array<[string, unknown]>;
  for (const [key, value] of entries) {
    if (key === 'parent') {
      continue;
    }

    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child === 'object' && 'type' in child) {
          if (containsAwaitExpression(child as TSESTree.Node)) {
            return true;
          }
        }
      }
      continue;
    }

    if (value && typeof value === 'object' && 'type' in value) {
      if (containsAwaitExpression(value as TSESTree.Node)) {
        return true;
      }
    }
  }

  return false;
}

export const noAsyncWithoutAwait = createRule({
  name: 'no-async-without-await',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow async functions that never use await. AI tools frequently add async by default, creating misleading signatures and unnecessary Promise wrappers. Includes a safe autofix for simple function bodies.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      asyncWithoutAwait:
        'Async function does not contain `await`. AI tools frequently add `async` unnecessarily, which can mislead callers and mask intent. Remove `async` or add proper await logic.',
    },
  },
  defaultOptions: [],
  create(context) {
    function buildSafeAutofix(
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.FunctionExpression
        | TSESTree.ArrowFunctionExpression,
    ): ((fixer: TSESLint.RuleFixer) => TSESLint.RuleFix | null) | undefined {
      const sourceCode = context.sourceCode;

      if (node.body.type !== AST_NODE_TYPES.BlockStatement) {
        const exprText = sourceCode.getText(node.body);
        return (fixer) => fixer.replaceText(node.body, `await (${exprText})`);
      }

      if (node.body.body.length !== 1) {
        return undefined;
      }

      const onlyStatement = node.body.body[0];

      if (
        onlyStatement.type === AST_NODE_TYPES.ReturnStatement &&
        onlyStatement.argument &&
        onlyStatement.argument.type !== AST_NODE_TYPES.AwaitExpression
      ) {
        const returnValueText = sourceCode.getText(onlyStatement.argument);
        return (fixer) =>
          fixer.replaceText(onlyStatement.argument as TSESTree.Node, `await (${returnValueText})`);
      }

      if (onlyStatement.type === AST_NODE_TYPES.ExpressionStatement) {
        const exprText = sourceCode.getText(onlyStatement.expression);
        return (fixer) =>
          fixer.replaceText(onlyStatement.expression as TSESTree.Node, `await (${exprText})`);
      }

      return undefined;
    }

    function reportIfNeeded(
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.FunctionExpression
        | TSESTree.ArrowFunctionExpression
    ): void {
      if (!node.async) {
        return;
      }

      // Async arrow with expression body cannot contain await unless the body itself is AwaitExpression.
      if (node.body.type !== AST_NODE_TYPES.BlockStatement) {
        if (node.body.type !== AST_NODE_TYPES.AwaitExpression) {
          const fix = buildSafeAutofix(node);
          context.report({
            node,
            messageId: 'asyncWithoutAwait',
            fix,
          });
        }
        return;
      }

      if (!containsAwaitExpression(node.body)) {
        const fix = buildSafeAutofix(node);
        context.report({
          node,
          messageId: 'asyncWithoutAwait',
          fix,
        });
      }
    }

    return {
      FunctionDeclaration: reportIfNeeded,
      FunctionExpression: reportIfNeeded,
      ArrowFunctionExpression: reportIfNeeded,
    };
  },
});

export default noAsyncWithoutAwait;
