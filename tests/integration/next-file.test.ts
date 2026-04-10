import { describe, it, expect } from 'vitest';
import { ESLint } from 'eslint';
import parser from '@typescript-eslint/parser';
import aiGuard from '../../src/index';

describe('integration: next-like file sample', () => {
  it('runs plugin rules in a frontend-heavy file', async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [
        {
          files: ['**/*.{ts,tsx,js,jsx}'],
          languageOptions: {
            parser,
            parserOptions: {
              ecmaFeatures: { jsx: true },
            },
          },
          plugins: {
            'ai-guard': aiGuard,
          },
          rules: {
            ...aiGuard.configs.recommended.rules,
          },
        },
      ],
      ignore: false,
    });

    const code = `
      const db = {
        query(sql) {
          return sql;
        },
      };

      async function fetchData() {
        return 1;
      }

      export default async function Page() {
        fetchData();
        db.query(` + "`SELECT * FROM users WHERE id = ${userId}`" + `);
        return <div>ok</div>;
      }

      async function run() {
        return load();
      }
    `;

    const [result] = await eslint.lintText(code, { filePath: 'page.tsx' });
    const ruleIds = result.messages.map((m) => m.ruleId);

    expect(ruleIds).toContain('ai-guard/no-floating-promise');
    expect(ruleIds).toContain('ai-guard/no-sql-string-concat');
    expect(ruleIds).toContain('ai-guard/no-async-without-await');
  });
});
