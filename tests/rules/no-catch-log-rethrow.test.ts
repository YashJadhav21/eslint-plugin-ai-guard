import { RuleTester } from '@typescript-eslint/rule-tester';
import { noCatchLogRethrow } from '../../src/rules/error-handling/no-catch-log-rethrow';
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

ruleTester.run('no-catch-log-rethrow', noCatchLogRethrow, {
  valid: [
    {
      code: `
        try { run(); }
        catch (e) { throw e; }
      `,
    },
    {
      code: `
        try { run(); }
        catch (e) {
          report(e);
          throw e;
        }
      `,
    },
    {
      code: `
        try { run(); }
        catch (e) {
          console.error('failed', e);
          throw new Error('wrapped');
        }
      `,
    },
    {
      code: `
        try { run(); }
        catch (e) {
          return fallback();
        }
      `,
    },
    {
      code: `
        try { run(); }
        catch {
          console.error('failed');
          throw new Error('boom');
        }
      `,
    },
    {
      code: `
        try { run(); }
        catch (e) {
          if (shouldIgnore(e)) return;
          throw e;
        }
      `,
    },
    {
      code: `
        try { run(); }
        catch (e) {
          logger.error(e);
          throw e;
        }
      `,
    },
    {
      code: `
        try { run(); }
        catch (e) {
          console.error(e);
          cleanup();
          throw e;
        }
      `,
    },
    {
      code: `
        try { run(); }
        catch (e) {
          console.error(e);
        }
      `,
    },
    {
      code: `
        try { run(); }
        catch (e) {
          throw transform(e);
        }
      `,
    },
  ],
  invalid: [
    {
      code: `
        try { run(); }
        catch (e) {
          console.error(e);
          throw e;
        }
      `,
      errors: [{ messageId: 'catchLogRethrow' }],
    },
    {
      code: `
        try { run(); }
        catch (e) {
          console.log(e);
          throw e;
        }
      `,
      errors: [{ messageId: 'catchLogRethrow' }],
    },
    {
      code: `
        try { run(); }
        catch (e) {
          console.warn(e);
          throw e;
        }
      `,
      errors: [{ messageId: 'catchLogRethrow' }],
    },
    {
      code: `
        try { run(); }
        catch (e) {
          console.info(e);
          throw e;
        }
      `,
      errors: [{ messageId: 'catchLogRethrow' }],
    },
    {
      code: `
        try { run(); }
        catch (e) {
          console.debug(e);
          throw e;
        }
      `,
      errors: [{ messageId: 'catchLogRethrow' }],
    },
    {
      code: `
        try { run(); }
        catch (e) {
          console.error('a', e);
          console.warn('b', e);
          throw e;
        }
      `,
      errors: [{ messageId: 'catchLogRethrow' }],
    },
    {
      code: `
        try { run(); }
        catch (error) {
          console.error(error);
          throw error;
        }
      `,
      errors: [{ messageId: 'catchLogRethrow' }],
    },
    {
      code: `
        async function main() {
          try { await run(); }
          catch (e) {
            console.error(e);
            throw e;
          }
        }
      `,
      errors: [{ messageId: 'catchLogRethrow' }],
    },
    {
      code: `
        class Service {
          exec() {
            try { run(); }
            catch (e) {
              console.error(e);
              throw e;
            }
          }
        }
      `,
      errors: [{ messageId: 'catchLogRethrow' }],
    },
    {
      code: `
        try { a(); } catch (e) { console.error(e); throw e; }
      `,
      errors: [{ messageId: 'catchLogRethrow' }],
    },
  ],
});
