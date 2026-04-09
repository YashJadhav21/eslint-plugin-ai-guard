# no-empty-catch

**Category:** Error Handling | **Severity:** `error` (recommended, strict)

---

## What it does

Flags `catch` blocks that contain no statements. An empty catch block catches an error and immediately discards it, hiding failures from the rest of the application.

## Why it matters

Empty catch blocks are the most common AI-generated error handling pattern. AI tools frequently generate scaffolding code with `try/catch` structures where the catch body is left empty — either as a placeholder or because the training data included examples where errors were intentionally silenced.

In production, this means a database write fails, an API call times out, or a file operation errors — and your application continues as if nothing happened. Users see incorrect data or missing UI state with no error in any log.

## ❌ Bad Example

```typescript
// The error is caught and immediately discarded
async function saveUser(data: User) {
  try {
    await db.users.insert(data);
  } catch (e) {
    // ← nothing here — the error silently disappears
  }
}

// Also flagged: comments don't count as statements
try {
  await fetchData();
} catch (err) {
  // TODO: handle this later
}
```

## ✅ Good Example

```typescript
// Log the error
async function saveUser(data: User) {
  try {
    await db.users.insert(data);
  } catch (err) {
    console.error('Failed to save user:', err);
    throw err; // re-throw so the caller knows
  }
}

// Or use a typed error handler
try {
  await fetchData();
} catch (err) {
  if (err instanceof NetworkError) {
    return { error: 'Network unavailable', retry: true };
  }
  throw err;
}
```

## How to fix

At minimum, **log the error**. Preferably:

1. Log with context (`console.error` or your logger)
2. Re-throw if the caller needs to know
3. Return a typed error value if this is expected to fail
4. If silencing is truly intentional, add a comment explaining why: `// intentionally ignoring — event is best-effort`

## Configuration

This rule has no options. It is enabled at `error` level in `recommended` and `strict` presets.
