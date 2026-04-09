import path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

type RuleLevel = 'error' | 'warn' | 'off';

export type Preset = 'recommended' | 'strict' | 'security';

export interface RunOptions {
  preset: Preset;
  targetPath: string;
  maxWarnings?: number;
  jsonOutput?: boolean;
}

export interface IssueDetail {
  ruleId: string;
  severity: 1 | 2;
  message: string;
  line: number;
  column: number;
}

export interface FileResult {
  filePath: string;
  issues: IssueDetail[];
  errorCount: number;
  warningCount: number;
}

export interface RunResult {
  files: FileResult[];
  totalErrors: number;
  totalWarnings: number;
  totalIssues: number;
  ruleBreakdown: Map<string, number>;
  topFiles: Array<{ path: string; count: number }>;
  durationMs: number;
}

// ─── Plugin normalizer ────────────────────────────────────────────────────────
// Plugin exports `default` (ESM). When require()'d in CJS context it arrives as
// { default: { rules, configs, meta } }. We normalise both shapes.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePlugin(raw: any): any {
  if (raw && raw.default && raw.default.rules) return raw.default;
  if (raw && raw.rules) return raw;
  throw new Error(
    'Could not load eslint-plugin-ai-guard. Run: npm install eslint-plugin-ai-guard',
  );
}

// ─── Preset rule maps ─────────────────────────────────────────────────────────

const RECOMMENDED_RULES: Record<string, RuleLevel> = {
  'ai-guard/no-empty-catch': 'error',
  'ai-guard/no-floating-promise': 'error',
  'ai-guard/no-hardcoded-secret': 'error',
  'ai-guard/no-eval-dynamic': 'error',
  'ai-guard/no-broad-exception': 'warn',
  'ai-guard/require-auth-middleware': 'warn',
  'ai-guard/no-await-in-loop': 'warn',
  'ai-guard/no-async-without-await': 'warn',
  'ai-guard/no-sql-string-concat': 'warn',
  'ai-guard/no-async-array-callback': 'warn',
  'ai-guard/no-unsafe-deserialize': 'warn',
  'ai-guard/require-authz-check': 'warn',
};

const STRICT_RULES: Record<string, RuleLevel> = {
  'ai-guard/no-empty-catch': 'error',
  'ai-guard/no-broad-exception': 'error',
  'ai-guard/no-catch-log-rethrow': 'error',
  'ai-guard/no-catch-without-use': 'error',
  'ai-guard/no-async-array-callback': 'error',
  'ai-guard/no-floating-promise': 'error',
  'ai-guard/no-await-in-loop': 'error',
  'ai-guard/no-async-without-await': 'error',
  'ai-guard/no-redundant-await': 'error',
  'ai-guard/no-hardcoded-secret': 'error',
  'ai-guard/no-eval-dynamic': 'error',
  'ai-guard/no-sql-string-concat': 'error',
  'ai-guard/no-unsafe-deserialize': 'error',
  'ai-guard/require-auth-middleware': 'error',
  'ai-guard/require-authz-check': 'error',
  'ai-guard/no-console-in-handler': 'error',
  'ai-guard/no-duplicate-logic-block': 'error',
};

const SECURITY_RULES: Record<string, RuleLevel> = {
  'ai-guard/no-hardcoded-secret': 'error',
  'ai-guard/no-eval-dynamic': 'error',
  'ai-guard/no-sql-string-concat': 'error',
  'ai-guard/no-unsafe-deserialize': 'warn',
  'ai-guard/require-auth-middleware': 'warn',
  'ai-guard/require-authz-check': 'warn',
};

function getRules(
  preset: Preset,
): Record<string, RuleLevel> {
  if (preset === 'strict') return STRICT_RULES;
  if (preset === 'security') return SECURITY_RULES;
  return RECOMMENDED_RULES;
}

// ─── Default ignores ──────────────────────────────────────────────────────────

const DEFAULT_IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/out/**',
  '**/.git/**',
];

// ─── Core runner ──────────────────────────────────────────────────────────────

export async function runEslint(options: RunOptions): Promise<RunResult> {
  const { ESLint } = await import('eslint').catch(() => {
    throw new Error(
      'ESLint is not installed. Run: npm install --save-dev eslint',
    );
  });

  // Load the plugin — resolve relative to the user's cwd so it finds their install
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawPlugin: any;
  try {
    // First try user's project node_modules
    const pluginPath = path.join(
      process.cwd(),
      'node_modules',
      'eslint-plugin-ai-guard',
    );
    rawPlugin = await import(pluginPath);
  } catch {
    // Fallback: use ourselves (running from inside the plugin package)
    try {
      rawPlugin = await import('../../src/index.js');
    } catch {
      throw new Error(
        'eslint-plugin-ai-guard is not installed. Run: npm install --save-dev eslint-plugin-ai-guard',
      );
    }
  }

  const plugin = normalizePlugin(rawPlugin);
  const rules = getRules(options.preset);
  const targetPath = path.resolve(options.targetPath);

  const startMs = Date.now();

  const JS_TS_FILES = [
    '**/*.js',
    '**/*.jsx',
    '**/*.ts',
    '**/*.tsx',
    '**/*.mjs',
    '**/*.cjs',
  ];

  // ESLint v9 programmatic API: use overrideConfigFile to disable config file
  // discovery and overrideConfig to inject our plugin config.
  // Setting `cwd` to the target path makes relative globs work correctly.

  // Try to load TypeScript parser for .ts/.tsx files
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tsParser: any = null;
  try {
    // Try user's project first, then our own node_modules
    try {
      tsParser = require(path.join(
        process.cwd(),
        'node_modules',
        '@typescript-eslint',
        'parser',
      ));
    } catch {
      tsParser = require('@typescript-eslint/parser');
    }
  } catch {
    // TypeScript parser not available — ts files will use default espree parser
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const configBlocks: any[] = [
    // JS/JSX files — default espree parser
    {
      files: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
      plugins: { 'ai-guard': plugin } as Record<string, unknown>,
      rules: rules as Record<string, unknown>,
    },
    // Ignore generated directories
    { ignores: DEFAULT_IGNORE_PATTERNS },
  ];

  if (tsParser) {
    configBlocks.splice(1, 0, {
      files: ['**/*.ts', '**/*.tsx'],
      plugins: { 'ai-guard': plugin } as Record<string, unknown>,
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          // project: true would be needed for type-aware rules — skip for speed
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
      },
      rules: rules as Record<string, unknown>,
    });
  } else {
    // No TS parser — still lint ts files but they may fail to parse
    configBlocks.splice(1, 0, {
      files: ['**/*.ts', '**/*.tsx'],
      plugins: { 'ai-guard': plugin } as Record<string, unknown>,
      rules: rules as Record<string, unknown>,
    });
  }

  const eslint = new ESLint({
    cwd: targetPath,
    overrideConfigFile: true as unknown as string,
    overrideConfig: configBlocks,
  });

  // Use relative glob patterns since cwd is the targetPath
  const patterns = JS_TS_FILES;

  // ESLint v9 throws if no files match a pattern — run each glob independently
  // and collect results, silently skipping 'no files found' errors
  const allRawResults: Awaited<ReturnType<(typeof eslint)['lintFiles']>> = [];
  for (const pattern of patterns) {
    try {
      const r = await eslint.lintFiles([pattern]);
      allRawResults.push(...r);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      // Skip "no files found" errors — not every project has every extension
      if (msg.includes('No files matching') || msg.includes('no files')) {
        continue;
      }
      throw new Error(`ESLint encountered an error: ${msg}`);
    }
  }

  const rawResults = allRawResults;

  const durationMs = Date.now() - startMs;

  // ─── Process results ─────────────────────────────────────────────────────

  const files: FileResult[] = [];
  const ruleBreakdown = new Map<string, number>();
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const result of rawResults) {
    if (result.messages.length === 0) continue;

    const issues: IssueDetail[] = result.messages.map((m) => ({
      ruleId: m.ruleId ?? 'unknown',
      severity: m.severity as 1 | 2,
      message: m.message,
      line: m.line,
      column: m.column,
    }));

    const errorCount = result.errorCount;
    const warningCount = result.warningCount;
    totalErrors += errorCount;
    totalWarnings += warningCount;

    for (const issue of issues) {
      ruleBreakdown.set(
        issue.ruleId,
        (ruleBreakdown.get(issue.ruleId) ?? 0) + 1,
      );
    }

    const relPath = path.relative(process.cwd(), result.filePath);
    files.push({ filePath: relPath, issues, errorCount, warningCount });
  }

  // Top files by issue count (top 10)
  const topFiles = [...files]
    .sort((a, b) => b.issues.length - a.issues.length)
    .slice(0, 10)
    .map((f) => ({ path: f.filePath, count: f.issues.length }));

  return {
    files,
    totalErrors,
    totalWarnings,
    totalIssues: totalErrors + totalWarnings,
    ruleBreakdown,
    topFiles,
    durationMs,
  };
}
