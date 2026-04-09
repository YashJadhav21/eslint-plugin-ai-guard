# no-catch-log-rethrow

**Category:** Error Handling | **Severity:** `off` (recommended), `error` (strict)

---

## What it does

Flags catch blocks that contain only a `console.error()` / `console.log()` call followed immediately by rethrowing the same error — with no recovery, transformation, or additional context added.

## Why it matters

A catch block that only logs and rethrows adds noise but no value. The caller still receives the original error, and you've added an extra log entry that tells you nothing the stack trace doesn't already tell you. In high-volume production environments, this pattern floods logs with duplicate errors.

More subtly, it makes engineers feel safe — there's error handling! — while providing no actual recovery. It's the error handling equivalent of a TODO comment.

## ❌ Bad Example

```typescript
try {
  await paymentService.charge(amount);
} catch (err) {
  console.error(err); // ← logs the error
  throw err;          // ← rethrows unchanged — caller sees the same error
}
```

## ✅ Good Example

```typescript
// Add context before rethrowing
try {
  await paymentService.charge(amount);
} catch (err) {
  // Wrap with additional context
  throw new PaymentError(`Failed to charge ${amount}: ${err instanceof Error ? err.message : err}`, { cause: err });
}

// Or handle it properly
try {
  await paymentService.charge(amount);
} catch (err) {
  if (err instanceof InsufficientFundsError) {
    return { success: false, reason: 'insufficient_funds' };
  }
  throw err; // unexpected — let it propagate
}
```

## How to fix

Each catch block should do one of:
1. **Handle** the error and return a value
2. **Transform** the error into a typed error with context (`new AppError(msg, { cause: err })`)
3. **Log with context** that isn't already in the stack trace (user ID, request ID, operation name)
4. Just **re-throw** without logging (the outermost handler will log it once)

## Configuration

This rule is `off` in `recommended` to avoid noise during initial adoption. Enable it in `strict`.
