import type { Command } from 'commander';
import chalk from 'chalk';
import { detect, isFlat } from '../utils/detector.js';
import { log } from '../utils/logger.js';
import { readConfig } from '../utils/config-manager.js';

interface CheckResult {
  label: string;
  pass: boolean;
  detail: string;
  fix?: string;
}

export function registerDoctorCommand(program: Command): void {
  program
    .command('doctor')
    .description('Diagnose your ai-guard setup and print actionable fixes')
    .action(async () => {
      const cwd = process.cwd();

      log.banner('AI GUARD DOCTOR');
      log.info('Checking your environment…');
      log.blank();

      const env = detect(cwd);
      const checks: CheckResult[] = [];

      // ─── Check 1: ESLint installed ──────────────────────────────────────────

      checks.push({
        label: 'ESLint installed',
        pass: env.eslintVersion !== null,
        detail: env.eslintVersion
          ? `ESLint ${env.eslintVersion}`
          : 'Not found in node_modules',
        fix: env.eslintVersion
          ? undefined
          : 'npm install --save-dev eslint',
      });

      // ─── Check 2: Plugin installed ─────────────────────────────────────────

      checks.push({
        label: 'eslint-plugin-ai-guard installed',
        pass: env.pluginInstalled,
        detail: env.pluginInstalled
          ? 'Found in node_modules'
          : 'Not found in node_modules',
        fix: env.pluginInstalled
          ? undefined
          : 'npm install --save-dev eslint-plugin-ai-guard',
      });

      // ─── Check 3: ESLint config exists ─────────────────────────────────────

      const hasConfig = env.configType !== 'none';
      checks.push({
        label: 'ESLint config present',
        pass: hasConfig,
        detail: hasConfig
          ? `${env.configPath} (${env.configType})`
          : 'No eslint.config.* or .eslintrc.* found',
        fix: hasConfig ? undefined : 'ai-guard init',
      });

      // ─── Check 4: Plugin wired in config ───────────────────────────────────

      let pluginWired = false;
      if (hasConfig && env.configPath) {
        try {
          const content = readConfig(env.configPath);
          pluginWired =
            content.includes('ai-guard') ||
            content.includes('eslint-plugin-ai-guard');
        } catch {
          pluginWired = false;
        }
      }

      checks.push({
        label: 'Plugin wired in config',
        pass: pluginWired,
        detail: pluginWired
          ? 'ai-guard plugin found in config'
          : hasConfig
          ? 'Config exists but ai-guard plugin not referenced'
          : 'No config to check',
        fix:
          !pluginWired && hasConfig
            ? 'ai-guard init   ← will patch your existing config'
            : !pluginWired
            ? 'ai-guard init   ← will generate config with plugin wired'
            : undefined,
      });

      // ─── Check 5: ESLint version ───────────────────────────────────────────

      const versionOk =
        env.eslintMajor !== null && env.eslintMajor >= 8;
      checks.push({
        label: 'ESLint version compatible',
        pass: versionOk,
        detail: versionOk
          ? `v${env.eslintMajor} ✔ (requires ≥ v8)`
          : env.eslintMajor !== null
          ? `v${env.eslintMajor} is too old — requires ESLint ≥ 8`
          : 'ESLint not installed',
        fix: versionOk
          ? undefined
          : 'npm install --save-dev eslint@latest',
      });

      // ─── Check 6: Flat vs classic config alignment ─────────────────────────

      if (env.eslintMajor !== null && env.eslintVersion !== null) {
        const shouldBeFlat = env.eslintMajor >= 9;
        const actuallyFlat = isFlat(env.configType);
        const aligned = !hasConfig || shouldBeFlat === actuallyFlat;

        checks.push({
          label: 'Config format matches ESLint version',
          pass: aligned,
          detail: aligned
            ? `${shouldBeFlat ? 'Flat' : 'Legacy'} config + ESLint v${env.eslintMajor} ✔`
            : `ESLint v${env.eslintMajor} expects ${shouldBeFlat ? 'flat' : 'legacy'} config but found ${actuallyFlat ? 'flat' : 'legacy'}`,
          fix: aligned
            ? undefined
            : shouldBeFlat
            ? 'Rename .eslintrc.* → eslint.config.mjs, or run: ai-guard init'
            : 'Upgrade to ESLint v9: npm install eslint@latest',
        });
      }

      // ─── Render results ─────────────────────────────────────────────────────

      log.section('Diagnostics');

      let allPassed = true;
      for (const check of checks) {
        const icon = check.pass
          ? chalk.green('✔')
          : chalk.red('✖');
        const label = check.pass
          ? chalk.white(check.label)
          : chalk.red.bold(check.label);
        const detail = chalk.gray(check.detail);

        log.print(`  ${icon}  ${label}`);
        log.print(`       ${detail}`);

        if (!check.pass && check.fix) {
          log.print(`       ${chalk.cyan('→ Fix:')} ${chalk.yellow(check.fix)}`);
          allPassed = false;
        }

        log.blank();
      }

      log.divider();
      log.blank();

      if (allPassed) {
        log.success('All checks passed! Your setup looks great.');
        log.info(`Run ${chalk.cyan('ai-guard run')} to start scanning.`);
      } else {
        log.error('Some checks failed. Follow the fixes above.');
        log.info(`Run ${chalk.cyan('ai-guard init')} to fix most issues automatically.`);
      }

      log.blank();
      process.exit(allPassed ? 0 : 1);
    });
}
