# no-catch-without-use

**Category:** Error Handling | **Severity:** `off` (recommended), `error` (strict)

---

## What it does

Flags `catch` clauses that declare an error parameter (e.g., `catch (err)`) but never reference that parameter in the catch body.

## Why it matters

If you catch an error and never use the bound variable, you're discarding the error information without even looking at it. This is subtly different from an empty catch (which is `error` level) — the body may have statements, but none of them involve the actual error. It suggests the error was caught accidentally or the handler was written without understanding what the error contains.

## ❌ Bad Example

```typescript
try {
  const data = JSON.parse(input);
  processData(data);
} catch (err) {
  // err is declared but never used
  res.status(400).json({ error: 'Invalid input' });
}
```

## ✅ Good Example

```typescript
try {
  const data = JSON.parse(input);
  processData(data);
} catch (err) {
  // Use err in the response or logging
  const message = err instanceof SyntaxError ? 'Invalid JSON format' : 'Processing failed';
  console.error('Parse error:', err);
  res.status(400).json({ error: message });
}

// Or use _ to explicitly signal you're ignoring it intentionally
try {
  await optionalCleanup();
} catch (_) {
  // intentionally ignored — cleanup is best-effort
}
```

## How to fix

Either use the error variable (log it, include it in the response, wrap it) or rename it to `_` to signal the omission is intentional.
