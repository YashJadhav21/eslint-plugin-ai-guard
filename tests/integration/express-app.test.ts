import { describe, it, expect } from 'vitest';
import { ESLint } from 'eslint';
import aiGuard from '../../src/index';

describe('integration: express app sample', () => {
  it('reports representative ai-guard issues end-to-end', async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [
        {
          files: ['**/*.js'],
          plugins: {
            'ai-guard': aiGuard,
          },
          rules: {
            ...aiGuard.configs.strict.rules,
          },
        },
      ],
      ignore: false,
    });

    const code = `
      const express = require('express');
      const router = express.Router();

      router.get('/users/:id', async (req, res) => {
        console.log('debug');
        const user = await loadUser(req.params.id);
        res.json(user);
      });

      async function syncUsers(users) {
        for (const user of users) {
          await saveUser(user);
        }
      }

      try {
        maybeFails();
      } catch (e) {}
    `;

    const [result] = await eslint.lintText(code, { filePath: 'sample.js' });
    const ruleIds = result.messages.map((m) => m.ruleId);

    expect(ruleIds).toContain('ai-guard/no-empty-catch');
    expect(ruleIds).toContain('ai-guard/no-console-in-handler');
    expect(ruleIds).toContain('ai-guard/no-await-in-loop');
    expect(ruleIds).toContain('ai-guard/require-authz-check');
  });
});
