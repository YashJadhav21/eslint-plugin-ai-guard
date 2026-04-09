import chalk from 'chalk';

const PREFIX = {
  success: chalk.green('✔'),
  error: chalk.red('✖'),
  warn: chalk.yellow('⚠'),
  info: chalk.cyan('ℹ'),
  section: chalk.bold.white,
  bullet: chalk.gray('•'),
};

export const log = {
  info(msg: string): void {
    console.log(`  ${PREFIX.info}  ${chalk.white(msg)}`);
  },

  success(msg: string): void {
    console.log(`  ${PREFIX.success}  ${chalk.green(msg)}`);
  },

  warn(msg: string): void {
    console.log(`  ${PREFIX.warn}  ${chalk.yellow(msg)}`);
  },

  error(msg: string): void {
    console.error(`  ${PREFIX.error}  ${chalk.red(msg)}`);
  },

  section(title: string): void {
    console.log('');
    console.log(chalk.bold.cyan(`  ── ${title} ──`));
    console.log('');
  },

  rule(ruleName: string, count: number): void {
    console.log(
      `    ${PREFIX.bullet} ${chalk.yellow(ruleName)} ${chalk.gray(`(${count} issue${count !== 1 ? 's' : ''})`)}`,
    );
  },

  file(filePath: string, count: number): void {
    console.log(
      `    ${PREFIX.bullet} ${chalk.white(filePath)} ${chalk.gray(`→ ${count} issue${count !== 1 ? 's' : ''}`)}`,
    );
  },

  issue(msg: string, severity: 1 | 2, line: number, col: number): void {
    const icon = severity === 2 ? chalk.red('error') : chalk.yellow(' warn');
    console.log(
      `      ${chalk.gray(`${line}:${col}`).padEnd(12)} ${icon}  ${chalk.white(msg)}`,
    );
  },

  divider(): void {
    console.log(chalk.gray('  ' + '─'.repeat(60)));
  },

  blank(): void {
    console.log('');
  },

  banner(title: string): void {
    console.log('');
    console.log(chalk.bold.bgCyan.black(`  ${title}  `));
    console.log('');
  },

  print(msg: string): void {
    console.log(msg);
  },
};
