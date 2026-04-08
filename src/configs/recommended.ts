import type { TSESLint } from '@typescript-eslint/utils';

const recommended: TSESLint.ClassicConfig.Config = {
  plugins: ['ai-guard'],
  rules: {
    // Adoption-first default:
    // Keep only high-confidence, high-impact rules at error so first run is actionable,
    // not overwhelming. Context-sensitive rules are warn/off by design.

    // Critical (error): low-noise, high-impact correctness/security failures.
    'ai-guard/no-empty-catch': 'error',
    'ai-guard/no-floating-promise': 'error',
    'ai-guard/no-hardcoded-secret': 'error',
    'ai-guard/no-eval-dynamic': 'error',

    // Important but noisier/context-dependent (warn): useful guidance without blocking.
    'ai-guard/no-broad-exception': 'warn',
    'ai-guard/require-auth-middleware': 'warn',
    'ai-guard/no-await-in-loop': 'warn',
    'ai-guard/no-async-without-await': 'warn',
    'ai-guard/no-sql-string-concat': 'warn',

    // Kept as warn in recommended to reduce false positives in mixed codebases.
    'ai-guard/no-async-array-callback': 'warn',

    // Optional/contextual (off): available for teams via strict/custom configs.
    // Intentional for trust and gradual adoption.
    'ai-guard/no-console-in-handler': 'off',
    'ai-guard/no-redundant-await': 'off',
    'ai-guard/no-catch-without-use': 'off',
    'ai-guard/no-unsafe-deserialize': 'warn',
    'ai-guard/no-catch-log-rethrow': 'off',
    'ai-guard/require-authz-check': 'warn',
    'ai-guard/no-duplicate-logic-block': 'off',
  },
};

export default recommended;
