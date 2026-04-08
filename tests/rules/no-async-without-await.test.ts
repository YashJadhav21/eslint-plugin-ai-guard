import { RuleTester } from '@typescript-eslint/rule-tester';
import { noAsyncWithoutAwait } from '../../src/rules/async/no-async-without-await';
import { describe, it, afterAll } from 'vitest';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-async-without-await', noAsyncWithoutAwait, {
  valid: [
    {
      code: `
        async function run() {
          await fetchData();
        }
      `,
    },
    {
      code: `
        const run = async () => await fetchData();
      `,
    },
    {
      code: `
        const run = async () => {
          if (x) await fetchA();
          else await fetchB();
        };
      `,
    },
    {
      code: `
        const run = async () => {
          for await (const item of stream) {
            consume(item);
          }
        };
      `,
    },
    {
      code: `
        async function nested() {
          await (async () => await value)();
        }
      `,
    },
    {
      code: `
        function syncFn() {
          return 1;
        }
      `,
    },
    {
      code: `
        const fn = () => Promise.resolve(1);
      `,
    },
    {
      code: `
        class S {
          async run() {
            await this.load();
          }
        }
      `,
    },
    {
      code: `
        async function withTry() {
          try {
            await run();
          } catch (e) {
            throw e;
          }
        }
      `,
    },
    {
      code: `
        const fn = async () => {
          return await Promise.resolve(1);
        };
      `,
    },
  ],
  invalid: [
    {
      code: `
        async function run() {
          return 1;
        }
      `,
      errors: [{ messageId: 'asyncWithoutAwait' }],
    },
    {
      code: `
        const run = async () => 1;
      `,
      errors: [{ messageId: 'asyncWithoutAwait' }],
    },
    {
      code: `
        const run = async () => {
          return doWork();
        };
      `,
      errors: [{ messageId: 'asyncWithoutAwait' }],
    },
    {
      code: `
        async function run() {
          doWork();
        }
      `,
      errors: [{ messageId: 'asyncWithoutAwait' }],
    },
    {
      code: `
        const run = async function () {
          const x = 1;
          return x;
        };
      `,
      errors: [{ messageId: 'asyncWithoutAwait' }],
    },
    {
      code: `
        class S {
          async run() {
            return this.load();
          }
        }
      `,
      errors: [{ messageId: 'asyncWithoutAwait' }],
    },
    {
      code: `
        async function run() {
          if (condition) {
            return a();
          }
          return b();
        }
      `,
      errors: [{ messageId: 'asyncWithoutAwait' }],
    },
    {
      code: `
        const fn = async () => {
          const inner = async () => await task();
          return inner;
        };
      `,
      errors: [{ messageId: 'asyncWithoutAwait' }],
    },
    {
      code: `
        async function empty() {}
      `,
      errors: [{ messageId: 'asyncWithoutAwait' }],
    },
    {
      code: `
        const fn = async () => {
          Promise.resolve(1);
        };
      `,
      errors: [{ messageId: 'asyncWithoutAwait' }],
    },
  ],
});
