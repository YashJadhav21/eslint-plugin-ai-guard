import { describe, it, expect } from 'vitest';
import {
  generateFlatConfig,
  isInvalidAiGuardConfig,
  repairInvalidFlatConfig,
  patchFlatConfig,
  switchFlatPreset,
  switchLegacyPreset,
} from '../../cli/utils/config-manager';

describe('cli config-manager flat config', () => {
  it('generates a valid flat config using plugin configs', () => {
    const text = generateFlatConfig('recommended');

    expect(text).toContain("'ai-guard': aiGuard");
    expect(text).toContain('...aiGuard.configs.recommended.rules');
    expect(text).not.toContain('aiGuard.default');
    expect(text).not.toContain('...aiGuard.recommended.rules');
  });

  it('repairs old invalid ai-guard flat config shapes', () => {
    const old = `
import aiGuard from 'eslint-plugin-ai-guard';

export default [
  {
    plugins: { 'ai-guard': aiGuard.default },
    rules: {
      ...aiGuard.recommended.rules,
    },
  },
];
`;

    expect(isInvalidAiGuardConfig(old)).toBe(true);

    const repaired = repairInvalidFlatConfig(old);

    expect(repaired).toContain("'ai-guard': aiGuard");
    expect(repaired).toContain('...aiGuard.configs.recommended.rules');
    expect(repaired).not.toContain('aiGuard.default');
    expect(repaired).not.toContain('...aiGuard.recommended.rules');
  });

  it('patches existing flat config using plugin configs', () => {
    const existing = `
import js from '@eslint/js';

export default [
  js.configs.recommended,
];
`;

    const patched = patchFlatConfig(existing, 'strict');

    expect(patched).toContain("import aiGuard from 'eslint-plugin-ai-guard';");
    expect(patched).toContain("'ai-guard': aiGuard");
    expect(patched).toContain('...aiGuard.configs.strict.rules');
  });

  it('switches preset in flat config from recommended to security', () => {
    const existing = generateFlatConfig('recommended');
    const switched = switchFlatPreset(existing, 'security');

    expect(switched).toContain('...aiGuard.configs.security.rules');
    expect(switched).not.toContain('...aiGuard.configs.recommended.rules');
  });

  it('switches preset in legacy config extends line', () => {
    const existing = `module.exports = {
  plugins: ['ai-guard'],
  extends: ['plugin:ai-guard/recommended'],
};`;
    const switched = switchLegacyPreset(existing, 'strict');

    expect(switched).toContain("'plugin:ai-guard/strict'");
    expect(switched).not.toContain("'plugin:ai-guard/recommended'");
  });
});
