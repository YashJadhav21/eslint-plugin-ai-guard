# require-auth-middleware

**Category:** Security | **Severity:** `warn` (recommended, security), `error` (strict)

---

## What it does

Flags Express and Fastify route definitions (`router.get`, `router.post`, `router.put`, `router.patch`, `router.delete`, `app.get`, `app.post`, etc.) where no recognized authentication middleware appears in the middleware chain before the route handler.

Recognized auth middleware names include: `authenticate`, `requireAuth`, `isAuthenticated`, `verifyToken`, `authMiddleware`, `checkAuth`, `ensureAuthenticated`, `protect`, `requireLogin`, and configurable custom names.

## Why it matters

AI tools generate route handlers focused on the business logic — the CRUD operations, the database queries, the response formatting. The authentication middleware is a separate concern that often gets omitted, especially when the AI is generating a new route based on an existing pattern that didn't show the full middleware chain.

The result is endpoints that are fully functional but completely unauthenticated. Anyone with a browser or `curl` can access them.

## ❌ Bad Example

```typescript
// No auth middleware — anyone can access this endpoint
router.get('/users/:id/profile', async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});

// No auth on sensitive admin route
app.post('/admin/delete-user', async (req, res) => {
  await User.deleteById(req.body.userId);
  res.json({ success: true });
});
```

## ✅ Good Example

```typescript
// Auth middleware comes before the handler
router.get('/users/:id/profile', authenticate, async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});

// Multiple middleware — auth first
app.post('/admin/delete-user',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    await User.deleteById(req.body.userId);
    res.json({ success: true });
  }
);

// Using a router-level middleware (also ok)
const adminRouter = express.Router();
adminRouter.use(requireAuth); // applies to all routes below
adminRouter.post('/delete-user', async (req, res) => { /* ... */ });
```

## How to fix

Add your authentication middleware function as an argument before the route handler. If you use router-level middleware (`router.use(auth)`) to protect an entire router, you can disable this rule for that file.

## Configuration

The rule accepts custom middleware names:

```js
rules: {
  'ai-guard/require-auth-middleware': ['warn', {
    authMiddlewareNames: ['authenticate', 'requireAuth', 'myCustomAuth'],
  }],
}
```
