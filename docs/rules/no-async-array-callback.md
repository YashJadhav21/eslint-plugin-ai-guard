# no-async-array-callback

**Category:** Async Correctness | **Severity:** `warn` (recommended), `error` (strict)

---

## What it does

Flags `async` functions passed as callbacks to `Array.prototype.map()`, `Array.prototype.filter()`, `Array.prototype.forEach()`, and `Array.prototype.find()` without the result being wrapped in `Promise.all()` or `Promise.allSettled()`.

## Why it matters

This is one of the most common silent bugs in AI-generated code. When you pass an `async` callback to `.map()`, the method does not know the callback is async — it simply calls it and stores the returned `Promise` in the result array. You get an array of unresolved `Promise` objects, not the values you expected.

The code runs without errors or warnings. TypeScript does not catch it. The bug only surfaces when you try to use the "results" and get `[Promise { <pending> }, Promise { <pending> }]` instead of actual data.

## ❌ Bad Example

```typescript
// Returns Promise<User>[] — not User[]
const users = userIds.map(async (id) => {
  return await fetchUser(id); // ← each call returns a pending Promise
});

// users is Promise<User>[], not User[]!
console.log(users[0]); // Promise { <pending> }

// forEach with async — rejections are completely unhandled
userIds.forEach(async (id) => {
  await sendNotification(id); // ← if this throws, it's unhandled
});
```

## ✅ Good Example

```typescript
// Wrap with Promise.all — runs all fetches in parallel
const users = await Promise.all(
  userIds.map(async (id) => fetchUser(id))
);

// users is User[] ✔
console.log(users[0]); // { id: 1, name: 'Alice' }

// For sequential processing (not parallel), use a for...of loop
for (const id of userIds) {
  await sendNotification(id);
}

// For handling partial failures, use Promise.allSettled
const results = await Promise.allSettled(
  userIds.map((id) => fetchUser(id))
);
const successful = results
  .filter((r) => r.status === 'fulfilled')
  .map((r) => (r as PromiseFulfilledResult<User>).value);
```

## How to fix

- For **parallel execution** (fetch all at once): wrap with `await Promise.all(arr.map(async ...))`
- For **sequential execution**: use a `for...of` loop with `await` inside
- For **partial failure tolerance**: use `await Promise.allSettled(...)`

## Configuration

```js
rules: {
  'ai-guard/no-async-array-callback': 'warn', // default in recommended
  'ai-guard/no-async-array-callback': 'error', // strict
}
```
