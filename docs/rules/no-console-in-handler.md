# no-console-in-handler

**Category:** Code Quality | **Severity:** `off` (recommended), `error` (strict)

---

## What it does

Flags `console.log()`, `console.debug()`, `console.info()`, `console.warn()`, and `console.error()` calls that appear inside HTTP route handler functions (Express, Fastify route callbacks).

## Why it matters

AI tools leave `console.log` statements in route handlers as debugging artifacts. In production, this creates several problems:

1. **Log noise** — every request triggers console output, overwhelming your log aggregator
2. **Data leaks** — handlers often log `req.body` or database results, which may contain PII, credentials, or proprietary data
3. **Performance** — synchronous console I/O can slow down high-throughput request handlers

## ❌ Bad Example

```typescript
router.post('/login', async (req, res) => {
  console.log('Login attempt:', req.body); // ← logs passwords in plaintext
  const user = await User.findOne({ email: req.body.email });
  console.log('Found user:', user); // ← logs sensitive user data
  res.json({ token: generateToken(user) });
});
```

## ✅ Good Example

```typescript
import { logger } from '../lib/logger'; // your structured logger

router.post('/login', async (req, res) => {
  // Use structured logging with safe fields only
  logger.info('Login attempt', { email: req.body.email });
  const user = await User.findOne({ email: req.body.email });
  logger.debug('Auth successful', { userId: user.id });
  res.json({ token: generateToken(user) });
});
```

## How to fix

Replace `console.*` with a structured logger (Pino, Winston, Bunyan) that:
- Outputs JSON for log aggregation
- Supports log levels that can be toggled by environment
- Redacts sensitive fields automatically

## Configuration

This rule is `off` in `recommended` to allow teams to adopt it gradually. It is `error` in `strict`.
