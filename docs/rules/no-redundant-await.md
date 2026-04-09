# no-redundant-await

**Category:** Async Correctness | **Severity:** `off` (recommended), `error` (strict)

---

## What it does

Flags `return await value` inside async functions when the `await` is not inside a `try/catch/finally` block — where unwrapping the promise before returning is redundant.

## Why it matters

In an `async` function, `return somePromise` and `return await somePromise` are functionally equivalent *unless* the await is inside a `try/catch`. When outside a try/catch, both pass the promise through the async function's implicit wrapping, and the difference is invisible to callers. The extra `await` adds a microtask tick to the callstack with no benefit.

AI tools add `return await` habitually — the pattern "feels safer" — but it's unnecessary overhead.

## ❌ Bad Example

```typescript
// redundant await — no try/catch surrounding it
async function fetchUser(id: string) {
  return await db.users.findOne(id); // ← await not needed here
}
```

## ✅ Good Example

```typescript
// No await needed when returning directly
async function fetchUser(id: string) {
  return db.users.findOne(id);
}

// await IS needed when inside try/catch (not flagged)
async function fetchUserSafe(id: string) {
  try {
    return await db.users.findOne(id); // ← needed: catch gets the rejection
  } catch (err) {
    return null;
  }
}
```

## How to fix

Remove the `await` keyword from `return await expr` when it's not inside a try/catch/finally block.

## Configuration

This rule is `off` in `recommended` because `return await` is a common pattern that many developers intentionally write for consistency. Enable it in `strict` when you want to enforce tighter async discipline.
