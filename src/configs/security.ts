import type { TSESLint } from '@typescript-eslint/utils';

const security: TSESLint.ClassicConfig.Config = {
  plugins: ['ai-guard'],
  rules: {
    // Security rules will be added here as they are implemented
    // For now, empty — no security-category rules in the initial 3 MVP rules
  },
};

export default security;
