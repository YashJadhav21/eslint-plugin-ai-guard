# no-async-without-await

**Category:** Async Correctness | **Severity:** `warn` (recommended, strict)

---

## What it does

Flags functions declared with the `async` keyword that never use `await` in their body — including arrow functions and function expressions.

## Why it matters

The `async` keyword changes a function's return type to `Promise<T>`. If an `async` function never uses `await`, it's wrapping a synchronous result in a promise unnecessarily. This creates misleading function signatures, forces all callers to `await` a call that doesn't actually do async work, and adds slight overhead.

AI tools add `async` defensively — "it might need to be async later" or because the pattern they copied was async. The result is functions that look async but aren't.

## ❌ Bad Example

```typescript
// async but never awaits — synchronous function masquerading as async
async function getUserName(user: User): Promise<string> {
  return user.firstName + ' ' + user.lastName; // ← no await, no async needed
}

// Causes callers to unnecessarily await a sync operation
const name = await getUserName(user); // ← await is pointless here
```

## ✅ Good Example

```typescript
// Remove async — it's a synchronous function
function getUserName(user: User): string {
  return user.firstName + ' ' + user.lastName;
}

const name = getUserName(user); // ← no await needed
```

## How to fix

Remove the `async` keyword. If the function is expected to become async in the future, that's fine — add `async` when you add the first `await`.

## Configuration

This rule has no options.
