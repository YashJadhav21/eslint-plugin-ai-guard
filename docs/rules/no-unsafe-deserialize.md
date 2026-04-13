# no-unsafe-deserialize

**Category:** Security | **Severity:** `warn` (recommended, security), `error` (strict)

---

## What it does

Flags calls to `JSON.parse()` where the argument appears to come from an untrusted external source — `req.body`, `req.query`, `req.params`, `event.body`, socket message data, or similar — without a visible schema validation step before or after the parse.

## Why it matters

`JSON.parse()` itself doesn't execute code, but accepting unvalidated JSON from an external source and using it directly creates implicit trust in attacker-controlled data. The parsed object can have unexpected shapes, missing required fields, or injected properties (`__proto__`, `constructor`) that can break your application logic or enable prototype pollution.

AI tools generate `JSON.parse(req.body)` patterns directly because that's the simplest way to get structured data from a request.

## ❌ Bad Example

```typescript
// No validation — trusting external JSON completely
app.post('/webhook', (req, res) => {
  const payload = JSON.parse(req.body); // ← shape is unknown
  processOrder(payload.orderId, payload.amount); // ← what if these are undefined?
});

// Socket handler — same problem
socket.on('message', (data) => {
  const msg = JSON.parse(data);
  db.insert(msg); // ← inserting attacker-controlled data
});
```

## ✅ Good Example

```typescript
import { z } from 'zod';

const WebhookPayload = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'GBP']),
});

app.post('/webhook', (req, res) => {
  try {
    const raw = JSON.parse(req.body);
    const payload = WebhookPayload.parse(raw); // ← validates shape and types
    processOrder(payload.orderId, payload.amount);
  } catch (err) {
    res.status(400).json({ error: 'Invalid payload' });
  }
});
```

## How to fix

Always validate the parsed JSON against an expected schema:
- **Zod**: `schema.parse(JSON.parse(data))`
- **Joi**: `schema.validate(JSON.parse(data))`
- **TypeBox**: `Value.Check(schema, JSON.parse(data))`
- **AJV**: compile and run a JSON Schema validator

## Configuration

This rule has no options.
