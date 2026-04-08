import type { TSESLint } from '@typescript-eslint/utils';

const recommended: TSESLint.ClassicConfig.Config = {
  plugins: ['ai-guard'],
  rules: {
    // Error Handling
    'ai-guard/no-empty-catch': 'error',
    'ai-guard/no-broad-exception': 'warn',
    'ai-guard/no-catch-log-rethrow': 'warn',
    'ai-guard/no-catch-without-use': 'warn',
    // Async
    'ai-guard/no-async-array-callback': 'error',
    'ai-guard/no-floating-promise': 'error',
    'ai-guard/no-await-in-loop': 'warn',
    'ai-guard/no-async-without-await': 'warn',
    'ai-guard/no-redundant-await': 'warn',
    // Security
    'ai-guard/no-hardcoded-secret': 'error',
    'ai-guard/no-eval-dynamic': 'error',
    'ai-guard/no-sql-string-concat': 'error',
    'ai-guard/no-unsafe-deserialize': 'warn',
    'ai-guard/require-auth-middleware': 'warn',
    // Quality
    'ai-guard/no-console-in-handler': 'warn',
  },
};

export default recommended;
