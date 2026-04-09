import type { Command } from 'commander';
import chalk from 'chalk';
import { detect, isFlat } from '../utils/detector.js';
import {
  generateFlatConfig,
  generateLegacyConfig,
  patchFlatConfig,
  patchLegacyConfig,
  backupConfig,
  readConfig,
  writeConfig,
  getConfigFilePath,
  type Preset,
} from '../utils/config-manager.js';
import { log } from '../utils/logger.js';
import path from 'path';
import fs from 'fs';

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Configure eslint-plugin-ai-guard in this project')
    .option('--preset <name>', 'Preset to use: recommended | strict | security', 'recommended')
    .action(async (opts: { preset: string }) => {
      const preset = (opts.preset as Preset) ?? 'recommended';
      const cwd = process.cwd();

      log.banner('AI GUARD INIT');
      log.info('Detecting your project setup…');
      log.blank();

      const env = detect(cwd);

      // ─── Step 1: Environment report ────────────────────────────────────────

      log.section('Environment');

      if (env.eslintVersion) {
        log.success(`ESLint ${env.eslintVersion} found (v${env.eslintMajor})`);
      } else {
        log.warn('ESLint not found in node_modules');
      }

      if (env.pluginInstalled) {
        log.success('eslint-plugin-ai-guard is installed');
      } else {
        log.warn('eslint-plugin-ai-guard not found');
      }

      if (env.configType !== 'none') {
        log.success(`ESLint config: ${chalk.white(env.configPath ?? env.configType)}`);
      } else {
        log.info('No ESLint config found — will generate one');
      }

      log.blank();

      // ─── Step 2: Missing deps — print install command, do NOT auto-install ──

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
        log.print(
          `  ${chalk.bold('Run this first:')}`,
        );
        log.blank();
        log.print(
          `    ${chalk.cyan(`npm install --save-dev ${toInstall.join(' ')}`)}`,
        );
        log.blank();
        log.print(
          `  Then re-run ${chalk.cyan('ai-guard init')} to complete setup.`,
        );
        log.blank();
        process.exit(1);
      }

      // ─── Step 3: Configure ESLint ──────────────────────────────────────────

      log.section('Configuring ESLint');

      const useFlat =
        (env.eslintMajor !== null && env.eslintMajor >= 9) ||
        isFlat(env.configType);

      if (env.configType === 'none') {
        const configPath = useFlat
          ? path.join(cwd, 'eslint.config.mjs')
          : path.join(cwd, '.eslintrc.js');

        const content = useFlat
          ? generateFlatConfig(preset)
          : generateLegacyConfig(preset);

        writeConfig(configPath, content);
        log.success(`Created ${chalk.white(path.relative(cwd, configPath))}`);
        log.info(`  Preset: ${chalk.cyan(preset)}`);
        log.info(`  Format: ${chalk.cyan(useFlat ? 'ESLint v9 flat config' : 'ESLint v8 legacy config')}`);
      } else {
        const configPath = env.configPath!;
        const backupPath = backupConfig(configPath);
        log.info(`Backed up → ${chalk.gray(path.relative(cwd, backupPath))}`);

        const existing = readConfig(configPath);
        const patched = isFlat(env.configType)
          ? patchFlatConfig(existing, preset)
          : patchLegacyConfig(existing, preset);

        if (patched === existing) {
          log.warn('ai-guard is already configured in your ESLint config — no changes made');
        } else {
          writeConfig(configPath, patched);
          log.success(`Patched ${chalk.white(path.relative(cwd, configPath))}`);
        }
      }

      log.blank();

      // ─── Step 4: Verify ────────────────────────────────────────────────────

      log.section('Verification');

      const finalConfigPath = getConfigFilePath(
        env.configType === 'none' ? (useFlat ? 'flat-mjs' : 'eslintrc-js') : env.configType,
        cwd,
      );

      if (fs.existsSync(finalConfigPath)) {
        log.success(`Config present: ${chalk.white(path.relative(cwd, finalConfigPath))}`);
      }

      log.blank();

      // ─── Step 5: Next steps ────────────────────────────────────────────────

      log.section("You're all set! 🎉");
      log.info(`Run ${chalk.cyan('ai-guard run')}      → scan your project`);
      log.info(`Run ${chalk.cyan('ai-guard doctor')}   → verify the setup`);
      log.info(`Run ${chalk.cyan('ai-guard baseline')} → track only new issues over time`);
      log.blank();
    });
}
