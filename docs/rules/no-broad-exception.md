# no-broad-exception

**Category:** Error Handling | **Severity:** `warn` (recommended), `error` (strict)

---

## What it does

Flags `catch` clauses that use `catch (e: any)` or `catch (e: unknown)` without then narrowing the type before using the error. Also flags patterns where the error is typed so broadly that all type information is lost.

## Why it matters

When AI generates try/catch blocks, it defaults to the broadest possible catch signature. This hides important information: *what kind of error occurred?* A database connection error needs different handling than a validation error, which needs different handling than a downstream API timeout.

Broad exception catching also makes it impossible for TypeScript to help you — you lose all type safety on the `e` variable, leading to more `e: any` casts and less reliable error handling down the chain.

## ❌ Bad Example

```typescript
try {
  await db.users.create(data);
} catch (e: any) { // ← all type info lost
  console.error(e.message); // might not have .message
  res.status(500).json({ error: e }); // might leak internal details
}
```

## ✅ Good Example

```typescript
try {
  await db.users.create(data);
} catch (err) {
  // Narrow the type before using it
  if (err instanceof DatabaseConstraintError) {
    res.status(409).json({ error: 'User already exists' });
    return;
  }
  if (err instanceof Error) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
  throw err; // re-throw unexpected error types
}
```

## How to fix

Use type narrowing inside the catch block:
1. Check `instanceof Error` or more specific error types
2. Use a type guard utility (`isAxiosError(err)`, `isPrismaError(err)`, etc.)
3. If you truly need to handle unknown errors, use `catch (err: unknown)` and narrow before use

## Configuration

This rule has no options.
