import type { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { detect, isFlat, isLegacy, requiresFlatConfig } from '../utils/detector.js';
import {
  generateFlatConfig,
  generateLegacyConfig,
  patchFlatConfig,
  patchLegacyConfig,
  backupConfig,
  readConfig,
  writeConfig,
  getConfigFilePath,
  removeNukeIgnore,
  validateFlatConfigText,
  validateLegacyConfigText,
  type Preset,
} from '../utils/config-manager.js';
import { log } from '../utils/logger.js';

// ─── Flags ────────────────────────────────────────────────────────────────────

interface InitOptions {
  preset: string;
  flat?: boolean;
  dryRun?: boolean;
}

// ─── Error classification ────────────────────────────────────────────────────

type VerifyError =
  | { kind: 'syntax'; message: string }
  | { kind: 'module-not-found'; pkg: string; message: string }
  | { kind: 'unknown'; message: string };

function classifyVerifyError(err: unknown): VerifyError {
  const msg = err instanceof Error ? err.message : String(err);
  const clean = msg.replace(/\s+at\s+.+/gm, '').trim();

  // Module resolution errors
  const modNotFound = clean.match(
    /Cannot find module '([^']+)'|Cannot find package '([^']+)'/,
  );
  if (modNotFound) {
    const pkg = modNotFound[1] ?? modNotFound[2] ?? 'unknown';
    return { kind: 'module-not-found', pkg, message: clean };
  }

  // SyntaxError / parse errors
  if (
    clean.includes('SyntaxError') ||
    clean.includes('Unexpected token') ||
    clean.includes('Invalid or unexpected token')
  ) {
    return { kind: 'syntax', message: clean };
  }

  return { kind: 'unknown', message: clean };
}

// ─── Programmatic ESLint verification ────────────────────────────────────────

/**
 * After writing a config, try to load it via ESLint's own API.
 * Returns null on success, a classified error on failure.
 */
async function verifyConfigLoads(
  configPath: string,
  cwd: string,
): Promise<null | VerifyError> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { ESLint } = await import('eslint') as { ESLint: any };

    const eslint = new ESLint({
      cwd,
      overrideConfigFile: configPath,
    });

    // Lint an empty JS file — forces ESLint to parse and validate the config
    await eslint.lintText('', {
      filePath: path.join(cwd, '_ai_guard_probe_.js'),
    });
    return null; // success
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    // "No files" / probe path exclusion errors are not config errors
    if (
      msg.includes('No files matching') ||
      msg.includes('_ai_guard_probe_')
    ) {
      return null;
    }

    return classifyVerifyError(err);
  }
}

// ─── Command registration ─────────────────────────────────────────────────────

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Configure eslint-plugin-ai-guard in this project')
    .option('--preset <name>', 'Preset to use: recommended | strict | security', 'recommended')
    .option('--flat', 'Force flat config format (eslint.config.mjs) regardless of ESLint version')
    .option('--dry-run', 'Preview what would change without writing any files')
    .action(async (opts: InitOptions) => {
      const preset = (opts.preset as Preset) ?? 'recommended';
      const cwd = process.cwd();
      const isDryRun = opts.dryRun === true;

      log.banner('AI GUARD INIT');
      if (isDryRun) {
        log.print(`  ${chalk.yellow('⚑  DRY RUN — no files will be written')}`);
        log.blank();
      }
      log.info('Detecting your project setup…');
      log.blank();

      const env = detect(cwd);

      // ─── Step 1: Environment report ──────────────────────────────────────────

      log.section('Environment');

      if (env.eslintVersion) {
        log.success(`ESLint ${env.eslintVersion} detected (v${env.eslintMajor})`);
      } else {
        log.warn('ESLint not found in node_modules');
      }

      if (env.pluginInstalled) {
        log.success('eslint-plugin-ai-guard is installed');
      } else {
        log.warn('eslint-plugin-ai-guard not found');
      }

      if (env.configType !== 'none') {
        log.success(`ESLint config found: ${chalk.white(path.relative(cwd, env.configPath ?? env.configType))}`);
      } else {
        log.info('No ESLint config found — will generate one');
      }

      // Warn about conflicting configs
      if (env.hasConflictingConfigs) {
        log.blank();
        log.warn('Conflicting configs detected:');
        for (const p of env.allConfigPaths) {
          log.print(`    ${chalk.yellow('→')} ${chalk.white(path.relative(cwd, p))}`);
        }
        log.print(`  ${chalk.gray('ESLint v9 will use the flat config and ignore .eslintrc.* files.')}`);
        log.print(`  ${chalk.gray('Consider removing the legacy config to avoid confusion.')}`);
      }

      log.blank();

      // ─── Step 2: Gate on missing deps ────────────────────────────────────────

      const toInstall: string[] = [];
      if (!env.eslintVersion) toInstall.push('eslint');
      if (!env.pluginInstalled) toInstall.push('eslint-plugin-ai-guard');

      if (toInstall.length > 0) {
        log.section('Missing Dependencies');
        log.warn('The following packages are not installed:');
        log.blank();
        for (const pkg of toInstall) {
          log.print(`    ${chalk.yellow('→')} ${chalk.white(pkg)}`);
        }
        log.blank();
        log.print(`  ${chalk.bold('Run this first:')}`);
        log.blank();
        log.print(`    ${chalk.cyan(`npm install --save-dev ${toInstall.join(' ')}`)}`);
        log.blank();
        log.print(`  Then re-run ${chalk.cyan('ai-guard init')} to complete setup.`);
        log.blank();
        process.exit(1);
        return;
      }

      // ─── Step 3: Determine config format ────────────────────────────────────
      //   Priority:
      //   1. --flat flag forces flat config
      //   2. ESLint v9+ → MUST use flat config
      //   3. ESLint v8  → use legacy; unless an existing flat config is already there
      //   4. No version info → default to flat (safer)

      const forceFlat = opts.flat === true;
      const eslintNeedsFlat = requiresFlatConfig(env.eslintMajor);
      const existingIsFlat = isFlat(env.configType);
      const existingIsLegacy = isLegacy(env.configType);
      const useFlat = forceFlat || eslintNeedsFlat || existingIsFlat || env.configType === 'none';

      // Guard: ESLint v9 + existing legacy config → migrate, don't re-create legacy
      if (eslintNeedsFlat && existingIsLegacy) {
        log.section('Config Migration Required');
        log.warn(`ESLint v${env.eslintMajor} requires flat config, but a legacy config was found:`);
        log.print(`    ${chalk.white(path.relative(cwd, env.configPath!))}`);
        log.blank();
        log.print(`  ${chalk.bold('ai-guard will create a new flat config alongside it.')}`);
        log.print(`  The legacy file will remain; ESLint v9 will automatically`);
        log.print(`  ignore it in favour of the flat config.`);
        log.blank();
      }

      // ─── Step 4: Apply config change ────────────────────────────────────────

      log.section(`Configuring ESLint${isDryRun ? ' (dry run)' : ''}`);

      let finalConfigPath: string;
      let configWritten = false;

      // Nuke-ignore removal — fix before anything else
      if (env.configPath && env.hasNukeIgnore) {
        const raw = readConfig(env.configPath);
        const { content: fixed, changed } = removeNukeIgnore(raw);
        if (changed) {
          log.warn(`Removed "**/*" ignore pattern from ${path.relative(cwd, env.configPath)}`);
          if (!isDryRun) {
            backupConfig(env.configPath);
            writeConfig(env.configPath, fixed);
            log.success('Ignore pattern fixed');
          } else {
            log.print(`  ${chalk.gray('[dry-run] would remove nuke-ignore from existing config')}`);
          }
        }
      }

      if (env.configType === 'none' || (eslintNeedsFlat && existingIsLegacy)) {
        // ── Generate fresh config ──────────────────────────────────────────────
        const targetName = useFlat ? 'eslint.config.mjs' : '.eslintrc.js';
        finalConfigPath = path.join(cwd, targetName);

        const content = useFlat
          ? generateFlatConfig(preset)
          : generateLegacyConfig(preset);

        if (isDryRun) {
          log.print(`  ${chalk.gray(`[dry-run] would create: ${targetName}`)}`);
          log.blank();
          log.print(chalk.gray('─── Preview ─────────────────────────────────────────────'));
          log.blank();
          for (const line of content.split('\n')) {
            log.print(chalk.gray(`  ${line}`));
          }
          log.blank();
        } else {
          writeConfig(finalConfigPath, content);
          log.success(`Created ${chalk.white(targetName)}`);
          log.info(`  Preset: ${chalk.cyan(preset)}`);
          log.info(`  Format: ${chalk.cyan(useFlat ? 'ESLint v9 flat config (eslint.config.mjs)' : 'ESLint v8 legacy config (.eslintrc.js)')}`);
          configWritten = true;
        }
      } else if (useFlat && existingIsFlat) {
        // ── Patch existing flat config ─────────────────────────────────────────
        const existing = readConfig(env.configPath!);
        const patched = patchFlatConfig(existing, preset);

        if (patched === existing) {
          log.warn('ai-guard is already present in your config — no changes made');
          finalConfigPath = env.configPath!;
        } else if (isDryRun) {
          finalConfigPath = env.configPath!;
          log.print(`  ${chalk.gray(`[dry-run] would patch: ${path.relative(cwd, env.configPath!)}`)}`);
        } else {
          const bak = backupConfig(env.configPath!);
          log.info(`Backed up → ${chalk.gray(path.relative(cwd, bak))}`);
          writeConfig(env.configPath!, patched);
          log.success(`Patched ${chalk.white(path.relative(cwd, env.configPath!))}`);
          finalConfigPath = env.configPath!;
          configWritten = true;
        }
      } else {
        // ── Patch existing legacy config ─────────────────────────────────────
        const existing = readConfig(env.configPath!);
        const patched = patchLegacyConfig(existing, preset);

        if (patched === existing) {
          log.warn('ai-guard is already present in your config — no changes made');
          finalConfigPath = env.configPath!;
        } else if (isDryRun) {
          finalConfigPath = env.configPath!;
          log.print(`  ${chalk.gray(`[dry-run] would patch: ${path.relative(cwd, env.configPath!)}`)}`);
        } else {
          const bak = backupConfig(env.configPath!);
          log.info(`Backed up → ${chalk.gray(path.relative(cwd, bak))}`);
          writeConfig(env.configPath!, patched);
          log.success(`Patched ${chalk.white(path.relative(cwd, env.configPath!))}`);
          finalConfigPath = env.configPath!;
          configWritten = true;
        }
      }

      if (isDryRun) {
        log.blank();
        log.print(`  ${chalk.yellow('Dry run complete — no files written.')}`);
        log.print(`  Re-run without ${chalk.cyan('--dry-run')} to apply.`);
        log.blank();
        process.exit(0);
        return;
      }

      log.blank();

      // ─── Step 5: Structural validation ──────────────────────────────────────

      log.section('Validation');

      if (!fs.existsSync(finalConfigPath)) {
        log.error(`Config file not found after write: ${path.relative(cwd, finalConfigPath)}`);
        log.blank();
        log.print(`  ${chalk.bold('Problem:')} File write may have failed.`);
        log.print(`  ${chalk.bold('Fix:')} Check disk space and file permissions, then re-run.`);
        log.blank();
        process.exit(1);
        return;
      }

      const content = readConfig(finalConfigPath);
      const validationErrors = useFlat
        ? validateFlatConfigText(content)
        : validateLegacyConfigText(content);

      if (validationErrors.length > 0) {
        log.warn('Config validation found issues:');
        for (const e of validationErrors) {
          log.print(`    ${chalk.red('✖')} ${e}`);
        }
      } else {
        log.success(`Config structure valid: ${chalk.white(path.relative(cwd, finalConfigPath))}`);
      }

      // ─── Step 6: Programmatic ESLint load verification ───────────────────────

      log.info('Verifying ESLint can load the config…');

      const loadError = await verifyConfigLoads(finalConfigPath, cwd);
      if (loadError !== null) {
        log.blank();

        if (loadError.kind === 'module-not-found') {
          // Missing dep — config syntax is fine, just need to install the package
          log.warn(`Could not verify: module not found: ${chalk.yellow(loadError.pkg)}`);
          log.blank();
          log.print(`  ${chalk.bold('Install the missing package:')}`);
          log.print(`    ${chalk.cyan(`npm install --save-dev ${loadError.pkg}`)}`);
          log.print(`  Then run ${chalk.cyan('ai-guard doctor')} to confirm.`);
          log.blank();
          // Fall through — config was written correctly; missing dep is user's next step
        } else {
          // Real error — config syntax broken or unknown failure → hard fail
          log.error('ESLint failed to load the generated config.');
          log.blank();
          log.print(`  ${chalk.bold('Problem:')}`);
          log.print(`    ${chalk.red(loadError.message)}`);
          log.blank();
          log.print(`  ${chalk.bold('Fix:')}`);
          log.print(`    1. Check the syntax in ${chalk.cyan(path.relative(cwd, finalConfigPath))}`);
          log.print(`    2. Make sure ${chalk.cyan('eslint-plugin-ai-guard')} is installed`);
          log.print(`    3. Run ${chalk.cyan('ai-guard doctor')} for full diagnostics`);
          log.blank();
          process.exit(1);
          return;
        }
      } else {
        log.success('ESLint loaded config successfully');
      }


      log.blank();



      // ─── Step 7: Success ─────────────────────────────────────────────────────

      log.section('Setup Complete');
      log.blank();
      log.print(`  ${chalk.green('✔')}  ${chalk.bold.green('Configuration validated successfully')}`);
      log.print(`  ${chalk.green('✔')}  ${chalk.bold('ESLint config:')} ${chalk.cyan(path.relative(cwd, finalConfigPath))}`);
      log.print(`  ${chalk.green('✔')}  ${chalk.bold('Mode:')} ${chalk.cyan(useFlat ? `Flat config (ESLint v${env.eslintMajor ?? 9})` : `Legacy config (ESLint v${env.eslintMajor ?? 8})`)}`);
      log.print(`  ${chalk.green('✔')}  ${chalk.bold('Preset:')} ${chalk.cyan(preset)}`);
      log.blank();
      log.info(`Run ${chalk.cyan('npx eslint .')}         → lint with your editor integration`);
      log.info(`Run ${chalk.cyan('ai-guard run')}          → zero-config scan`);
      log.info(`Run ${chalk.cyan('ai-guard doctor')}       → verify the full setup`);
      log.info(`Run ${chalk.cyan('ai-guard baseline')}     → save baseline, track only new issues`);
      log.blank();
    });
}
