# no-duplicate-logic-block

**Category:** Code Quality | **Severity:** `off` (recommended), `error` (strict)

---

## What it does

Flags consecutive duplicate or near-identical code blocks that should be extracted into a shared function or abstraction.

## Why it matters

AI tools frequently copy-paste logic with slight variations instead of abstracting it. When requirements change, each copy needs to be updated independently — and they often aren't, leading to subtle inconsistencies between similar code paths.

## ❌ Bad Example

```typescript
// Same validation logic duplicated across two routes
router.post('/create-user', async (req, res) => {
  if (!req.body.email || !req.body.email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (!req.body.password || req.body.password.length < 8) {
    return res.status(400).json({ error: 'Password too short' });
  }
  // create user...
});

router.put('/update-user/:id', async (req, res) => {
  if (!req.body.email || !req.body.email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (!req.body.password || req.body.password.length < 8) {
    return res.status(400).json({ error: 'Password too short' });
  }
  // update user...
});
```

## ✅ Good Example

```typescript
// Extract into a shared validation function
function validateUserInput(body: unknown): string | null {
  if (!isObject(body)) return 'Request body required';
  if (!body.email?.includes('@')) return 'Invalid email';
  if (!body.password || body.password.length < 8) return 'Password too short';
  return null;
}

router.post('/create-user', async (req, res) => {
  const error = validateUserInput(req.body);
  if (error) return res.status(400).json({ error });
  // create user...
});

router.put('/update-user/:id', async (req, res) => {
  const error = validateUserInput(req.body);
  if (error) return res.status(400).json({ error });
  // update user...
});
```

## How to fix

Extract the duplicated logic into a named function, middleware, or utility module and call it from each location.
