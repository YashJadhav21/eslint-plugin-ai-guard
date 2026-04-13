import type { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { runEslint, type Preset } from '../utils/eslint-runner.js';
import { log } from '../utils/logger.js';
import type { RunResult } from '../utils/eslint-runner.js';

export function registerRunCommand(program: Command): void {
  program
    .command('run')
    .description('Run ai-guard rules on your project (zero ESLint config required)')
    .option('--path <dir>', 'Directory or file to scan', '.')
    .option('--strict', 'Use the strict rule preset (all rules at error)')
    .option('--security', 'Use the security-only rule preset')
    .option('--json', 'Output results as JSON')
    .option(
      '--max-warnings <n>',
      'Fail if warnings exceed this count',
      (value: string) => Number.parseInt(value, 10),
    )
    .action(async (opts: {
      path: string;
      strict?: boolean;
      security?: boolean;
      json?: boolean;
      maxWarnings?: number;
    }) => {
      if (
        opts.maxWarnings !== undefined &&
        (!Number.isInteger(opts.maxWarnings) || opts.maxWarnings < 0)
      ) {
        log.blank();
        log.error('--max-warnings must be a non-negative integer.');
        log.blank();
        process.exit(1);
        return;
      }

      const preset: Preset = opts.strict
        ? 'strict'
        : opts.security
        ? 'security'
        : 'recommended';

      if (opts.strict && opts.security && !opts.json) {
        log.warn('Both --strict and --security were provided. Using --strict.');
        log.blank();
      }

      if (!opts.json) {
        log.banner('AI GUARD RESULTS');
        log.blank();
      }

      const spinner = opts.json
        ? null
        : ora({ text: 'Scanning…', color: 'cyan' }).start();

      let result: RunResult;
      try {
        result = await runEslint({ preset, targetPath: opts.path });
        spinner?.stop();
      } catch (err: unknown) {
        spinner?.stop();
        const msg = err instanceof Error ? err.message : String(err);

        // Friendly TS parser error
        if (msg.toLowerCase().includes('typescript') && msg.toLowerCase().includes('parser')) {
          log.blank();
          log.error('TypeScript detected but parser not found.');
          log.blank();
          log.print(`  ${chalk.bold('Install the TypeScript parser:')}`);
          log.blank();
          log.print(`    ${chalk.cyan('npm install --save-dev @typescript-eslint/parser')}`);
          log.blank();
        } else {
          log.blank();
          log.error(msg);
          log.blank();
          log.print(`  ${chalk.bold('Fix:')} Run ${chalk.cyan('ai-guard doctor')} to diagnose your setup.`);
          log.blank();
        }
        process.exit(1);
        return;
      }

      // ─── JSON mode ─────────────────────────────────────────────────────────

      if (opts.json) {
        const jsonOutput = {
          preset,
          scannedPath: opts.path,
          totalErrors: result.totalErrors,
          totalWarnings: result.totalWarnings,
          totalIssues: result.totalIssues,
          durationMs: result.durationMs,
          ruleBreakdown: Object.fromEntries(result.ruleBreakdown),
          topFiles: result.topFiles,
          files: result.files,
        };
        console.log(JSON.stringify(jsonOutput, null, 2));
        process.exit(getRunExitCode(result, opts.maxWarnings));
        return;
      }

      // ─── Human output ──────────────────────────────────────────────────────

      // Header: scan info
      log.success(`Scanned:  ${chalk.white(opts.path)}`);
      log.success(`Duration: ${chalk.white(result.durationMs + 'ms')}`);
      log.blank();

      // ── Success state ────────────────────────────────────────────────────────

      if (result.totalIssues === 0) {
        log.print(
          `  ${chalk.green('✔')}  ${chalk.bold.green('No AI issues found — your code looks clean')}`,
        );
        log.blank();
        process.exit(0);
        return;
      }

      // ── Issue summary ────────────────────────────────────────────────────────

      log.print(
        `  ${chalk.bold('Total Issues:')} ${formatIssueCount(result.totalErrors, result.totalWarnings)}`,
      );
      log.blank();

      // ── By Rule ─────────────────────────────────────────────────────────────

      if (result.ruleBreakdown.size > 0) {
        log.section('By Rule');

        const sorted = [...result.ruleBreakdown.entries()].sort(
          (a, b) => b[1] - a[1],
        );
        for (const [rule, count] of sorted) {
          // Strip the "ai-guard/" prefix for cleaner display
          const shortRule = rule.replace(/^ai-guard\//, '');
          log.print(
            `    ${chalk.gray('•')} ${chalk.yellow(shortRule)}${chalk.gray(':')} ${chalk.white(String(count))}`,
          );
        }
        log.blank();
      }

      // ── Top Files ───────────────────────────────────────────────────────────

      if (result.topFiles.length > 0) {
        log.section('Top Files');

        for (const { path: fp, count } of result.topFiles) {
          log.print(
            `    ${chalk.gray('•')} ${chalk.white(fp)} ${chalk.gray(`(${count})`)}`,
          );
        }
        log.blank();
      }

      // ── Issues by File ───────────────────────────────────────────────────────

      log.section('Issues by File');
      log.blank();

      for (const file of result.files) {
        log.print(
          `  ${chalk.bold.white(file.filePath)} ` +
            chalk.gray(
              `(${file.errorCount} error${file.errorCount !== 1 ? 's' : ''}, ` +
              `${file.warningCount} warning${file.warningCount !== 1 ? 's' : ''})`,
            ),
        );

        for (const issue of file.issues) {
          const sev = issue.severity === 2
            ? chalk.red('error')
            : chalk.yellow(' warn');
          const loc = chalk.gray(`${String(issue.line)}:${String(issue.column)}`).padEnd(12);
          const ruleShort = chalk.gray(issue.ruleId.replace(/^ai-guard\//, ''));
          log.print(
            `    ${loc} ${sev}  ${chalk.white(issue.message)}  ${ruleShort}`,
          );
        }

        log.blank();
      }

      log.divider();
      log.blank();

      // ── Next steps ───────────────────────────────────────────────────────────

      log.section('Next Steps');
      if (!result.topFiles.length) {
        log.info(`Run ${chalk.cyan('ai-guard init')}     to wire up ESLint for your editor`);
      }
      log.info(`Run ${chalk.cyan('ai-guard baseline')} to save these issues and track only new ones`);
      log.info(`Run ${chalk.cyan('ai-guard ignore')}    to suppress dist/build noise`);
      log.blank();

      process.exit(getRunExitCode(result, opts.maxWarnings));
    });
}

export function getRunExitCode(result: RunResult, maxWarnings?: number): number {
  if (result.totalErrors > 0) return 1;
  if (maxWarnings !== undefined && result.totalWarnings > maxWarnings) return 1;
  return 0;
}

function formatIssueCount(errors: number, warnings: number): string {
  const parts: string[] = [];
  if (errors > 0) parts.push(chalk.red.bold(`${errors} error${errors !== 1 ? 's' : ''}`));
  if (warnings > 0) parts.push(chalk.yellow.bold(`${warnings} warning${warnings !== 1 ? 's' : ''}`));
  return parts.join(chalk.gray(' · '));
}
