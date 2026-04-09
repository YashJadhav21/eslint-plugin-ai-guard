# no-floating-promise

**Category:** Async Correctness | **Severity:** `error` (recommended, strict)

---

## What it does

Flags async function calls that are not `await`ed and have no `.catch()` handler attached — known as "floating promises." The call is made, but its result (including any rejection) is silently discarded.

## Why it matters

When an async function rejects and nothing is listening, Node.js silently ignores it. There is no error in the console, no stack trace, no crash — the failure simply disappears.

This is one of the most common patterns in AI-generated backend code because AI models learn from examples that often show only the "happy path." The `await` is omitted, the promise floats, and the bug only surfaces in production when data is missing or a user action silently fails.

## ❌ Bad Example

```typescript
// No await — if sendEmail rejects, the error is silently lost
function createUser(data: UserData) {
  sendWelcomeEmail(data.email); // ← floating promise
  return db.users.create(data);
}

// Common AI pattern: calling async functions inside callbacks
router.post('/order', (req, res) => {
  processPayment(req.body); // ← floating promise — payment may fail silently
  res.json({ status: 'ok' });
});
```

## ✅ Good Example

```typescript
// Await the async call
async function createUser(data: UserData) {
  await sendWelcomeEmail(data.email);
  return db.users.create(data);
}

// Or handle errors explicitly using .catch()
router.post('/order', (req, res) => {
  processPayment(req.body)
    .then(() => res.json({ status: 'ok' }))
    .catch((err) => {
      console.error('Payment failed:', err);
      res.status(500).json({ error: 'Payment processing failed' });
    });
});
```

## How to fix

1. Add `await` before the async call (requires the parent function to be `async`)
2. Attach `.catch((err) => ...)` to handle the rejection explicitly
3. Store the promise in a variable and handle it before the function returns

## Configuration

This rule has no options. It is enabled at `error` level in `recommended` and `strict` presets.

```js
// eslint.config.mjs
rules: {
  'ai-guard/no-floating-promise': 'error',
}
```
