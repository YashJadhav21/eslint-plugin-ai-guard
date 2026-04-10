import { ESLintUtils, AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/YashJadhav21/eslint-plugin-ai-guard/blob/main/docs/rules/${name}.md`
);

const LOOP_TYPES = new Set([
  AST_NODE_TYPES.ForStatement,
  AST_NODE_TYPES.ForInStatement,
  AST_NODE_TYPES.ForOfStatement,
  AST_NODE_TYPES.WhileStatement,
  AST_NODE_TYPES.DoWhileStatement,
]);

const SEQUENTIAL_CALL_HINTS = [
  'read',
  'next',
  'retry',
  'sleep',
  'delay',
  'wait',
  'throttle',
  'ratelimit',
  'acquire',
  'release',
  'drain',
  'flush',
  'consume',
];

const INTENT_COMMENT_HINTS = [
  'sequential',
  'ordered',
  'order matters',
  'intentional',
  'rate limit',
  'rate-limit',
  'retry',
  'stream',
  'backpressure',
];

type LoopNode =
  | TSESTree.ForStatement
  | TSESTree.ForInStatement
  | TSESTree.ForOfStatement
  | TSESTree.WhileStatement
  | TSESTree.DoWhileStatement;

function getCalleeName(callee: TSESTree.Node): string | null {
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return callee.name;
  }

  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    return callee.property.name;
  }

  return null;
}

function isLikelySequentialAwaitCall(node: TSESTree.AwaitExpression): boolean {
  if (node.argument.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }

  const calleeName = getCalleeName(node.argument.callee);
  if (!calleeName) {
    return false;
  }

  const lower = calleeName.toLowerCase();
  return SEQUENTIAL_CALL_HINTS.some((hint) => lower.includes(hint));
}

function hasIntentionalSequentialComment(
  loopNode: LoopNode,
  sourceCode: Readonly<Parameters<ReturnType<typeof createRule>['create']>[0]['sourceCode']>,
): boolean {
  const directComments = sourceCode.getCommentsBefore(loopNode);
  const allComments = sourceCode.getAllComments();

  const nearComments = allComments.filter((comment) => {
    if (!comment.range || !loopNode.range) {
      return false;
    }

    const [commentStart, commentEnd] = comment.range;
    const [loopStart, loopEnd] = loopNode.range;

    const insideLoop = commentStart >= loopStart && commentEnd <= loopEnd;
    const immediatelyBeforeLoop = commentEnd <= loopStart && loopStart - commentEnd < 120;
    return insideLoop || immediatelyBeforeLoop;
  });

  const combined = [...directComments, ...nearComments];
  return combined.some((comment) => {
    const lower = comment.value.toLowerCase();
    return INTENT_COMMENT_HINTS.some((hint) => lower.includes(hint));
  });
}

function shouldAllowIntentionalSequentialAwait(
  loopNode: LoopNode,
  awaitNode: TSESTree.AwaitExpression,
  context: Readonly<Parameters<ReturnType<typeof createRule>['create']>[0]>,
): boolean {
  if (loopNode.type === AST_NODE_TYPES.ForOfStatement && loopNode.await) {
    return true;
  }

  if (hasIntentionalSequentialComment(loopNode, context.sourceCode)) {
    return true;
  }

  return isLikelySequentialAwaitCall(awaitNode);
}

export const noAwaitInLoop = createRule({
  name: 'no-await-in-loop',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow `await` inside loops. AI tools frequently generate sequential awaits inside for/while loops where `Promise.all()` would be more efficient and correct. Each iteration waits for the previous one to complete, causing O(n) latency instead of O(1).',
    },
    fixable: undefined,
    schema: [],
    messages: {
      awaitInLoop:
        'Unexpected `await` inside a {{loopType}}. AI tools frequently generate sequential awaits in loops, causing O(n) latency. Consider collecting promises and using `Promise.all()` for parallel execution.',
    },
  },
  defaultOptions: [],
  create(context) {
    /**
     * Track ancestor scope boundaries (functions) so we don't flag await
     * expressions inside a nested async function that happens to be inside a loop.
     */
    const functionBoundary: TSESTree.Node[] = [];

    function enterFunction(node: TSESTree.Node) {
      functionBoundary.push(node);
    }
    function exitFunction() {
      functionBoundary.pop();
    }

    return {
      FunctionDeclaration: enterFunction,
      FunctionExpression: enterFunction,
      ArrowFunctionExpression: enterFunction,
      'FunctionDeclaration:exit': exitFunction,
      'FunctionExpression:exit': exitFunction,
      'ArrowFunctionExpression:exit': exitFunction,

      AwaitExpression(node) {
        // Walk up ancestors looking for a loop, but stop at any function boundary
        const ancestors = context.sourceCode.getAncestors(node);
        const currentFunction = functionBoundary[functionBoundary.length - 1];

        for (let i = ancestors.length - 1; i >= 0; i--) {
          const ancestor = ancestors[i];

          // Stop if we hit the current function boundary
          if (ancestor === currentFunction) {
            break;
          }

          if (LOOP_TYPES.has(ancestor.type as AST_NODE_TYPES)) {
            const loopNode = ancestor as LoopNode;
            if (shouldAllowIntentionalSequentialAwait(loopNode, node, context)) {
              return;
            }

            const loopName = getLoopName(ancestor.type as AST_NODE_TYPES);
            context.report({
              node,
              messageId: 'awaitInLoop',
              data: { loopType: loopName },
            });
            return;
          }
        }
      },
    };
  },
});

function getLoopName(type: AST_NODE_TYPES): string {
  switch (type) {
    case AST_NODE_TYPES.ForStatement:
      return 'for loop';
    case AST_NODE_TYPES.ForInStatement:
      return 'for...in loop';
    case AST_NODE_TYPES.ForOfStatement:
      return 'for...of loop';
    case AST_NODE_TYPES.WhileStatement:
      return 'while loop';
    case AST_NODE_TYPES.DoWhileStatement:
      return 'do...while loop';
    default:
      return 'loop';
  }
}

export default noAwaitInLoop;
