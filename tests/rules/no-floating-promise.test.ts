import { RuleTester } from '@typescript-eslint/rule-tester';
import { noFloatingPromise } from '../../src/rules/async/no-floating-promise';
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

ruleTester.run('no-floating-promise', noFloatingPromise, {
  valid: [
    // 1. await on async call
    {
      code: `
        async function main() {
          await fetchData();
        }
      `,
    },
    // 2. .then() chained on call
    {
      code: `fetchData().then(data => console.log(data));`,
    },
    // 3. .catch() chained on call
    {
      code: `fetchData().catch(err => console.error(err));`,
    },
    // 4. Result assigned to variable
    {
      code: `const data = fetchData();`,
    },
    // 5. Regular sync function call (no async-ish name)
    {
      code: `console.log('hello');`,
    },
    // 6. void operator (intentional fire-and-forget)
    {
      code: `void fetchData();`,
    },
    // 7. Returned from function
    {
      code: `
        function wrapper() {
          return fetchData();
        }
      `,
    },
    // 8. Non-async-named function call
    {
      code: `
        doMath();
      `,
    },
    // 9. Method call without async-ish name
    {
      code: `arr.push(1);`,
    },
    // 10. .finally() chained
    {
      code: `fetchData().finally(() => cleanup());`,
    },
    // 11. sync function names that happen to start with get but are clearly sync
    {
      code: `
        const x = getElementById('foo');
      `,
    },
    // 12. Await expression statement inside async function
    {
      code: `
        async function run() {
          await loadUser();
        }
      `,
    },
    // 13. Promise assigned
    {
      code: `const promise = sendEmail();`,
    },
  ],
  invalid: [
    // 1. Bare fetchData() call as statement
    {
      code: `fetchData();`,
      errors: [{ messageId: 'floatingPromise' }],
    },
    // 2. Bare loadUser() call
    {
      code: `loadUser();`,
      errors: [{ messageId: 'floatingPromise' }],
    },
    // 3. Bare saveRecord()
    {
      code: `saveRecord();`,
      errors: [{ messageId: 'floatingPromise' }],
    },
    // 4. Bare deleteItem()
    {
      code: `deleteItem();`,
      errors: [{ messageId: 'floatingPromise' }],
    },
    // 5. Bare createUser()
    {
      code: `createUser();`,
      errors: [{ messageId: 'floatingPromise' }],
    },
    // 6. Bare updateProfile()
    {
      code: `updateProfile();`,
      errors: [{ messageId: 'floatingPromise' }],
    },
    // 7. Bare sendNotification()
    {
      code: `sendNotification();`,
      errors: [{ messageId: 'floatingPromise' }],
    },
    // 8. Bare uploadFile()
    {
      code: `uploadFile();`,
      errors: [{ messageId: 'floatingPromise' }],
    },
    // 9. Bare connectDatabase()
    {
      code: `connectDatabase();`,
      errors: [{ messageId: 'floatingPromise' }],
    },
    // 10. Bare requestPermission()
    {
      code: `requestPermission();`,
      errors: [{ messageId: 'floatingPromise' }],
    },
    // 11. Known async function declared in same file
    {
      code: `
        async function doWork() { return 1; }
        doWork();
      `,
      errors: [{ messageId: 'floatingPromise' }],
    },
    // 12. Async arrow function variable called bare
    {
      code: `
        const processItems = async () => { return 1; };
        processItems();
      `,
      errors: [{ messageId: 'floatingPromise' }],
    },
  ],
});
