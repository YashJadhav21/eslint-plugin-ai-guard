import fs from 'fs';
import path from 'path';

export type ConfigType =
  | 'flat-js'
  | 'flat-mjs'
  | 'flat-cjs'
  | 'eslintrc-js'
  | 'eslintrc-json'
  | 'eslintrc-yaml'
  | 'none';

export interface DetectionResult {
  eslintVersion: string | null;
  eslintMajor: number | null;
  pluginInstalled: boolean;
  configType: ConfigType;
  configPath: string | null;
}

const CONFIG_FILES: Array<{ file: string; type: ConfigType }> = [
  { file: 'eslint.config.js', type: 'flat-js' },
  { file: 'eslint.config.mjs', type: 'flat-mjs' },
  { file: 'eslint.config.cjs', type: 'flat-cjs' },
  { file: '.eslintrc.js', type: 'eslintrc-js' },
  { file: '.eslintrc.cjs', type: 'eslintrc-js' },
  { file: '.eslintrc.json', type: 'eslintrc-json' },
  { file: '.eslintrc.yaml', type: 'eslintrc-yaml' },
  { file: '.eslintrc.yml', type: 'eslintrc-yaml' },
];

export function isPackageInstalled(
  pkgName: string,
  cwd = process.cwd(),
): boolean {
  try {
    const pkgPath = path.join(cwd, 'node_modules', pkgName, 'package.json');
    return fs.existsSync(pkgPath);
  } catch {
    return false;
  }
}

export function getPackageVersion(
  pkgName: string,
  cwd = process.cwd(),
): string | null {
  try {
    const pkgPath = path.join(cwd, 'node_modules', pkgName, 'package.json');
    if (!fs.existsSync(pkgPath)) return null;
    const raw = fs.readFileSync(pkgPath, 'utf-8');
    const json = JSON.parse(raw) as { version?: string };
    return json.version ?? null;
  } catch {
    return null;
  }
}

export function detectConfigType(cwd = process.cwd()): {
  type: ConfigType;
  path: string | null;
} {
  for (const { file, type } of CONFIG_FILES) {
    const fullPath = path.join(cwd, file);
    if (fs.existsSync(fullPath)) {
      return { type, path: fullPath };
    }
  }
  return { type: 'none', path: null };
}

export function isFlat(type: ConfigType): boolean {
  return type === 'flat-js' || type === 'flat-mjs' || type === 'flat-cjs';
}

export function detect(cwd = process.cwd()): DetectionResult {
  const eslintVersion = getPackageVersion('eslint', cwd);
  const eslintMajor = eslintVersion
    ? parseInt(eslintVersion.split('.')[0], 10)
    : null;
  const pluginInstalled = isPackageInstalled('eslint-plugin-ai-guard', cwd);
  const { type: configType, path: configPath } = detectConfigType(cwd);

  return {
    eslintVersion,
    eslintMajor,
    pluginInstalled,
    configType,
    configPath,
  };
}
