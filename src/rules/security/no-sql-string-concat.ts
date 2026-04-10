import { ESLintUtils, AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/YashJadhav21/eslint-plugin-ai-guard/blob/main/docs/rules/${name}.md`
);

/**
 * SQL statement signatures. We intentionally require query-like combinations
 * to avoid false positives for normal app strings (e.g., "create", "from").
 */
const SQL_STATEMENT_PATTERN =
  /\b(select\s+[\s\S]*\s+from|insert\s+into|update\s+\S+\s+set|delete\s+from|drop\s+table|create\s+(table|database)|alter\s+table|truncate\s+table|exec(?:ute)?\s+\S+|union\s+select)\b/i;

const SQL_SINK_METHODS = new Set([
  'query',
  'execute',
  'queryraw',
  'queryrawunsafe',
  'executeraw',
  'executerawunsafe',
  'raw',
  'run',
  'all',
  'get',
  'prepare',
]);

const SQL_SINK_FUNCTIONS = new Set(['query', 'execute']);

function getIdentifierName(node: TSESTree.Node): string | null {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return node.name;
  }
  return null;
}

function isSqlSinkCall(node: TSESTree.CallExpression): boolean {
  if (node.callee.type === AST_NODE_TYPES.Identifier) {
    return SQL_SINK_FUNCTIONS.has(node.callee.name.toLowerCase());
  }

  if (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    const methodName = node.callee.property.name.toLowerCase().replace(/^\$/, '');
    return SQL_SINK_METHODS.has(methodName);
  }

  return false;
}

function resolveExpression(
  node: TSESTree.Expression,
  variableMap: Map<string, TSESTree.Expression>,
): TSESTree.Expression {
  const identifier = getIdentifierName(node);
  if (identifier && variableMap.has(identifier)) {
    return variableMap.get(identifier)!;
  }
  return node;
}

function isDynamicSqlExpression(node: TSESTree.Expression): boolean {
  if (node.type === AST_NODE_TYPES.TemplateLiteral) {
    if (node.expressions.length === 0) {
      return false;
    }
    const staticText = node.quasis.map((q) => q.value.raw).join(' ');
    return SQL_STATEMENT_PATTERN.test(staticText);
  }

  if (node.type === AST_NODE_TYPES.BinaryExpression && node.operator === '+') {
    const staticText = collectStaticText(node);
    if (!SQL_STATEMENT_PATTERN.test(staticText)) {
      return false;
    }
    return hasDynamicParts(node);
  }

  return false;
}

export const noSqlStringConcat = createRule({
  name: 'no-sql-string-concat',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow string concatenation or interpolation with variables in SQL query contexts. AI tools frequently generate SQL queries using template literals or string concatenation with user input, creating SQL injection vulnerabilities.',
    },
    fixable: undefined,
    schema: [],
    messages: {
      sqlStringConcat:
        'Potential SQL injection: string concatenation or interpolation detected in a SQL query. AI tools frequently generate this pattern. Use parameterized queries (e.g., `db.query("SELECT * FROM users WHERE id = $1", [id])`) instead.',
    },
  },
  defaultOptions: [],
  create(context) {
    const variableMap = new Map<string, TSESTree.Expression>();

    return {
      VariableDeclarator(node) {
        if (
          node.id.type === AST_NODE_TYPES.Identifier &&
          node.init &&
          node.init.type !== AST_NODE_TYPES.AwaitExpression
        ) {
          variableMap.set(node.id.name, node.init);
        }
      },

      AssignmentExpression(node) {
        if (
          node.left.type === AST_NODE_TYPES.Identifier &&
          node.right.type !== AST_NODE_TYPES.AwaitExpression
        ) {
          variableMap.set(node.left.name, node.right);
        }
      },

      CallExpression(node) {
        if (!isSqlSinkCall(node)) {
          return;
        }

        const firstArg = node.arguments[0];
        if (!firstArg || firstArg.type === AST_NODE_TYPES.SpreadElement) {
          return;
        }

        const resolved = resolveExpression(firstArg, variableMap);
        if (!isDynamicSqlExpression(resolved)) {
          return;
        }

        context.report({
          node: firstArg,
          messageId: 'sqlStringConcat',
        });
      },
    };
  },
});

function collectStaticText(node: TSESTree.Expression | TSESTree.PrivateIdentifier): string {
  if (node.type === AST_NODE_TYPES.BinaryExpression && node.operator === '+') {
    return `${collectStaticText(node.left)} ${collectStaticText(node.right)}`;
  }

  const literalValue = getStringLiteralValue(node);
  return literalValue ?? '';
}

function hasDynamicParts(node: TSESTree.Expression | TSESTree.PrivateIdentifier): boolean {
  if (node.type === AST_NODE_TYPES.BinaryExpression && node.operator === '+') {
    return hasDynamicParts(node.left) || hasDynamicParts(node.right);
  }

  return !isStaticString(node);
}

function getStringLiteralValue(node: TSESTree.Expression | TSESTree.PrivateIdentifier): string | null {
  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === 'string') {
    return node.value;
  }
  return null;
}

function isStaticString(node: TSESTree.Expression | TSESTree.PrivateIdentifier): boolean {
  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === 'string') {
    return true;
  }
  if (
    node.type === AST_NODE_TYPES.TemplateLiteral &&
    node.expressions.length === 0
  ) {
    return true;
  }
  return false;
}

export default noSqlStringConcat;
