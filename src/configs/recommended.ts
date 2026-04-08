import type { TSESLint } from '@typescript-eslint/utils';

const recommended: TSESLint.ClassicConfig.Config = {
  plugins: ['ai-guard'],
  rules: {
    'ai-guard/no-empty-catch': 'error',
    'ai-guard/no-async-array-callback': 'error',
    'ai-guard/no-floating-promise': 'error',
  },
};

export default recommended;
