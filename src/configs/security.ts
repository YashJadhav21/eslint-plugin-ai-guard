import type { TSESLint } from '@typescript-eslint/utils';

const security: TSESLint.ClassicConfig.Config = {
  plugins: ['ai-guard'],
  rules: {
    'ai-guard/no-hardcoded-secret': 'error',
    'ai-guard/no-eval-dynamic': 'error',
    'ai-guard/no-sql-string-concat': 'error',
    'ai-guard/no-unsafe-deserialize': 'error',
    'ai-guard/require-auth-middleware': 'error',
  },
};

export default security;
