import type { Command } from 'commander';
import chalk from 'chalk';
import { detect, isFlat } from '../utils/detector.js';
import {
  backupConfig,
  readConfig,
  writeConfig,
  addIgnoresToFlatConfig,
  addIgnoresToLegacyConfig,
  generateFlatConfig,
  generateLegacyConfig,
} from '../utils/config-manager.js';
import { log } from '../utils/logger.js';
import path from 'path';

const DEFAULT_IGNORES = [
  '.next/',
  'dist/',
  'build/',
  'coverage/',
  'out/',
  'node_modules/',
];

export function registerIgnoreCommand(program: Command): void {
  program
    .command('ignore')
    .description('Add default ignore patterns (.next, dist, build, coverage) to ESLint config')
    .action(async () => {
      const cwd = process.cwd();

      log.banner('AI GUARD IGNORE');
      log.blank();
      log.section('Default Ignores');

      for (const p of DEFAULT_IGNORES) {
        log.print(`    ${chalk.gray('•')} ${chalk.yellow(p)}`);
      }

      log.blank();

      const env = detect(cwd);

      if (env.configType === 'none') {
        // Generate a fresh minimal config with ignores
        const useFlat = env.eslintMajor !== null && env.eslintMajor >= 9;
        const configPath = useFlat
          ? path.join(cwd, 'eslint.config.mjs')
          : path.join(cwd, '.eslintrc.js');

        const content = useFlat
          ? generateFlatConfig('recommended')
          : generateLegacyConfig('recommended');

        writeConfig(configPath, content);
        log.success(`No config found — generated ${chalk.white(path.relative(cwd, configPath))} with ignores included`);
      } else {
        const configPath = env.configPath!;
        const backupPath = backupConfig(configPath);
        log.info(`Backed up → ${chalk.gray(path.relative(cwd, backupPath))}`);

        const existing = readConfig(configPath);
        const patched = isFlat(env.configType)
          ? addIgnoresToFlatConfig(existing)
          : addIgnoresToLegacyConfig(existing);

        if (patched === existing) {
          log.warn('Ignore patterns already present in config — no changes made.');
        } else {
          writeConfig(configPath, patched);
          log.success(`Patched ${chalk.white(path.relative(cwd, configPath))} with ignore patterns`);
        }
      }

      log.blank();
      log.info('Noisy directories will now be skipped in all future ESLint runs.');
      log.info(`Run ${chalk.cyan('ai-guard run')} to verify cleaner results.`);
      log.blank();
    });
}
