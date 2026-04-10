import { RuleTester } from '@typescript-eslint/rule-tester';
import { noAwaitInLoop } from '../../src/rules/async/no-await-in-loop';
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

ruleTester.run('no-await-in-loop', noAwaitInLoop, {
  valid: [
    // 1. Await outside loop — normal usage
    {
      code: `
        async function foo() {
          const data = await fetch('/api');
        }
      `,
    },
    // 2. Promise.all with map — correct parallel pattern
    {
      code: `
        async function foo() {
          const results = await Promise.all(items.map(item => fetch(item.url)));
        }
      `,
    },
    // 3. Await in nested async function inside a loop — should NOT flag
    {
      code: `
        async function foo() {
          for (const item of items) {
            const process = async () => {
              const result = await fetch(item.url);
              return result;
            };
            process();
          }
        }
      `,
    },
    // 4. Await in nested async arrow inside forEach
    {
      code: `
        async function foo() {
          items.forEach(async (item) => {
            const result = await fetch(item.url);
          });
        }
      `,
    },
    // 5. Normal for loop without await
    {
      code: `
        function foo() {
          for (let i = 0; i < 10; i++) {
            console.log(i);
          }
        }
      `,
    },
    // 6. Await after loop
    {
      code: `
        async function foo() {
          const promises = [];
          for (const item of items) {
            promises.push(fetch(item));
          }
          await Promise.all(promises);
        }
      `,
    },
    // 7. For-of with synchronous processing
    {
      code: `
        function process(items) {
          for (const item of items) {
            console.log(item);
          }
        }
      `,
    },
    // 8. While loop with no await
    {
      code: `
        function countdown() {
          let i = 10;
          while (i > 0) {
            console.log(i--);
          }
        }
      `,
    },
    // 9. for-await-of stream consumption is intentionally sequential
    {
      code: `
        async function consume(stream) {
          for await (const chunk of stream) {
            await processChunk(chunk);
          }
        }
      `,
    },
    // 10. Intentional retry loop should be allowed
    {
      code: `
        async function retry(tasks) {
          for (const task of tasks) {
            // intentional sequential retry with backoff
            await retryWithBackoff(task);
          }
        }
      `,
    },
    // 11. Rate-limit delay loop should be allowed
    {
      code: `
        async function processRateLimited(items) {
          for (const item of items) {
            await delay(50);
            handle(item);
          }
        }
      `,
    },
  ],
  invalid: [
    // 1. await inside for...of loop
    {
      code: `
        async function foo() {
          for (const url of urls) {
            const data = await fetch(url);
          }
        }
      `,
      errors: [{ messageId: 'awaitInLoop' }],
    },
    // 2. await inside standard for loop
    {
      code: `
        async function foo() {
          for (let i = 0; i < urls.length; i++) {
            await processItem(urls[i]);
          }
        }
      `,
      errors: [{ messageId: 'awaitInLoop' }],
    },
    // 3. await inside while loop
    {
      code: `
        async function foo() {
          let i = 0;
          while (i < items.length) {
            await process(items[i]);
            i++;
          }
        }
      `,
      errors: [{ messageId: 'awaitInLoop' }],
    },
    // 4. await inside do...while loop
    {
      code: `
        async function foo() {
          let page = 1;
          do {
            const data = await fetchPage(page);
            page++;
          } while (page < 10);
        }
      `,
      errors: [{ messageId: 'awaitInLoop' }],
    },
    // 5. Multiple awaits inside a single loop
    {
      code: `
        async function foo() {
          for (const item of items) {
            const user = await getUser(item.userId);
            await sendEmail(user.email);
          }
        }
      `,
      errors: [
        { messageId: 'awaitInLoop' },
        { messageId: 'awaitInLoop' },
      ],
    },
    // 6. await inside for...in loop
    {
      code: `
        async function foo() {
          for (const key in obj) {
            await processKey(key, obj[key]);
          }
        }
      `,
      errors: [{ messageId: 'awaitInLoop' }],
    },
    // 7. Nested loops with await in inner loop
    {
      code: `
        async function foo() {
          for (const group of groups) {
            for (const item of group.items) {
              await process(item);
            }
          }
        }
      `,
      errors: [{ messageId: 'awaitInLoop' }],
    },
    // 8. await in try-catch inside a loop
    {
      code: `
        async function foo() {
          for (const url of urls) {
            try {
              await fetch(url);
            } catch (e) {
              console.error(e);
            }
          }
        }
      `,
      errors: [{ messageId: 'awaitInLoop' }],
    },
  ],
});
