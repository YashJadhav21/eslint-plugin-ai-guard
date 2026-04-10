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
    return {
      // Template literals: `SELECT * FROM users WHERE id = ${userId}`
      TemplateLiteral(node) {
        // Must have at least one expression (interpolation)
        if (node.expressions.length === 0) return;

        // Check if the static parts contain SQL keywords
        const staticText = node.quasis.map((q) => q.value.raw).join('');
        if (SQL_STATEMENT_PATTERN.test(staticText)) {
          context.report({
            node,
            messageId: 'sqlStringConcat',
          });
        }
      },

      // Binary expressions: "SELECT * FROM users WHERE id = " + userId
      BinaryExpression(node) {
        if (node.operator !== '+') return;
        if (
          node.parent?.type === AST_NODE_TYPES.BinaryExpression &&
          node.parent.operator === '+'
        ) {
          return;
        }

        const staticText = collectStaticText(node);
        if (!SQL_STATEMENT_PATTERN.test(staticText)) return;

        if (hasDynamicParts(node)) {
          context.report({
            node,
            messageId: 'sqlStringConcat',
          });
        }
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
