import fs from 'fs';
import path from 'path';
import type { ConfigType } from './detector.js';

export type Preset = 'recommended' | 'strict' | 'security';

export function backupConfig(configPath: string): string {
  const backupPath = `${configPath}.bak`;
  fs.copyFileSync(configPath, backupPath);
  return backupPath;
}

export function readConfig(configPath: string): string {
  return fs.readFileSync(configPath, 'utf-8');
}

export function writeConfig(configPath: string, content: string): void {
  fs.writeFileSync(configPath, content, 'utf-8');
}

// ─── Flat Config Generator (ESLint v9) ────────────────────────────────────────

export function generateFlatConfig(preset: Preset): string {
  return `import aiGuardPlugin from 'eslint-plugin-ai-guard';

export default [
  // ai-guard: catch AI-generated code issues
  {
    plugins: {
      'ai-guard': aiGuardPlugin,
    },
    rules: aiGuardPlugin.configs.${preset}.rules,
  },

  // Ignore generated / dependency directories
  {
    ignores: ['.next/**', 'dist/**', 'build/**', 'coverage/**', 'out/**'],
  },
];
`;
}

// ─── Legacy Config Generator (ESLint v8) ──────────────────────────────────────

export function generateLegacyConfig(preset: Preset): string {
  return `module.exports = {
  plugins: ['ai-guard'],
  extends: ['plugin:ai-guard/${preset}'],
  ignorePatterns: ['.next/', 'dist/', 'build/', 'coverage/', 'out/'],
};
`;
}

// ─── Patch Existing Flat Config ───────────────────────────────────────────────

const FLAT_PATCH_MARKER = '// ai-guard: injected by ai-guard CLI';

export function patchFlatConfig(existing: string, preset: Preset): string {
  if (existing.includes('eslint-plugin-ai-guard')) {
    // Already has plugin — just ensure rules block is correct
    return existing;
  }

  const injection = `
${FLAT_PATCH_MARKER}
import aiGuardPlugin from 'eslint-plugin-ai-guard';

`;

  const rulesBlock = `
  // ai-guard injected block
  {
    plugins: { 'ai-guard': aiGuardPlugin },
    rules: aiGuardPlugin.configs.${preset}.rules,
  },
`;

  // Inject import at top, spread rule block into the array
  let patched = injection + existing;
  // Insert rule block before the last closing bracket of the export default array
  const lastBracket = patched.lastIndexOf('];');
  if (lastBracket !== -1) {
    patched =
      patched.slice(0, lastBracket) + rulesBlock + patched.slice(lastBracket);
  }
  return patched;
}

// ─── Patch Existing Legacy Config ─────────────────────────────────────────────

export function patchLegacyConfig(existing: string, preset: Preset): string {
  if (existing.includes('ai-guard')) {
    return existing; // already configured
  }

  // Try to add plugins and extends into existing module.exports object
  let patched = existing;

  if (patched.includes('plugins:')) {
    patched = patched.replace(
      /plugins:\s*\[/,
      `plugins: ['ai-guard', `,
    );
  } else {
    patched = patched.replace(
      'module.exports = {',
      `module.exports = {\n  plugins: ['ai-guard'],`,
    );
  }

  if (patched.includes('extends:')) {
    patched = patched.replace(
      /extends:\s*\[/,
      `extends: ['plugin:ai-guard/${preset}', `,
    );
  } else {
    patched = patched.replace(
      'module.exports = {',
      `module.exports = {\n  extends: ['plugin:ai-guard/${preset}'],`,
    );
  }

  return patched;
}

// ─── Apply Ignore Patterns ────────────────────────────────────────────────────

const DEFAULT_IGNORES = [
  '.next/',
  'dist/',
  'build/',
  'coverage/',
  'out/',
  'node_modules/',
];

export function addIgnoresToFlatConfig(existing: string): string {
  if (existing.includes('ignores:')) {
    return existing; // Already has ignores block
  }

  const ignoreBlock = `
  // Default ignores added by ai-guard CLI
  {
    ignores: ${JSON.stringify(DEFAULT_IGNORES.map((i) => `${i}**`))},
  },
`;

  const lastBracket = existing.lastIndexOf('];');
  if (lastBracket !== -1) {
    return (
      existing.slice(0, lastBracket) + ignoreBlock + existing.slice(lastBracket)
    );
  }
  return existing;
}

export function addIgnoresToLegacyConfig(existing: string): string {
  if (existing.includes('ignorePatterns')) {
    return existing;
  }

  return existing.replace(
    'module.exports = {',
    `module.exports = {\n  ignorePatterns: ${JSON.stringify(DEFAULT_IGNORES)},`,
  );
}

// ─── New Config File Paths ────────────────────────────────────────────────────

export function getConfigFilePath(
  configType: ConfigType,
  cwd = process.cwd(),
): string {
  if (configType === 'flat-mjs' || configType === 'flat-js') {
    return path.join(cwd, 'eslint.config.mjs');
  }
  return path.join(cwd, '.eslintrc.js');
}
