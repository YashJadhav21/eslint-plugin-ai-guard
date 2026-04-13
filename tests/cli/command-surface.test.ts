import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { detect } from '../../cli/utils/detector';
import {
  addIgnoresToFlatConfig,
  addIgnoresToLegacyConfig,
  generateFlatConfig,
  generateLegacyConfig,
} from '../../cli/utils/config-manager';

describe('cli command surface helpers', () => {
  it('ignore helper injects ignores into flat config when missing', () => {
    const base = `import js from '@eslint/js';\n\nexport default [js.configs.recommended];\n`;
    const patched = addIgnoresToFlatConfig(base);

    expect(patched).toContain('ignores');
    expect(patched).toContain('node_modules/**');
  });

  it('ignore helper injects ignorePatterns into legacy config when missing', () => {
    const base = `module.exports = {\n  plugins: ['ai-guard']\n};\n`;
    const patched = addIgnoresToLegacyConfig(base);

    expect(patched).toContain('ignorePatterns');
    expect(patched).toContain('node_modules/');
  });

  it('doctor-style detection reports no config in a fresh directory', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-guard-detect-'));
    try {
      const result = detect(dir);
      expect(result.configType).toBe('none');
      expect(result.configPath).toBeNull();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('generated configs include ai-guard presets for preset command flow', () => {
    const flat = generateFlatConfig('strict');
    const legacy = generateLegacyConfig('security');

    expect(flat).toContain('aiGuard.configs.strict.rules');
    expect(legacy).toContain('plugin:ai-guard/security');
  });
});
