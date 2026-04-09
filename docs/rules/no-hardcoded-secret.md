# no-hardcoded-secret

**Category:** Security | **Severity:** `error` (recommended, strict, security)

---

## What it does

Detects string literals assigned to variables with names that suggest they contain secrets: `password`, `secret`, `apiKey`, `token`, `privateKey`, `credential`, `authToken`, and similar patterns.

## Why it matters

AI tools frequently generate example code with placeholder credentials that look like this:

```typescript
const API_KEY = 'sk-proj-abc123...'; // ← real-looking key
const DB_PASSWORD = 'mypassword123'; // ← placeholder that never gets replaced
```

These values are often copied verbatim into production code, pushed to version control, and exposed publicly. Scanning historical git history for leaked credentials is a standard attack technique. Once a secret is committed, it must be treated as compromised even after deletion.

This is not theoretical — leaked API keys in public repositories are discovered within minutes by automated scanners.

## ❌ Bad Example

```typescript
// Hardcoded credentials — will be committed to version control
const stripeKey = 'sk_live_abc123456789';
const dbPassword = 'SuperSecret123!';
const jwtSecret = 'my-jwt-signing-secret';

// Configuration objects with embedded secrets
const config = {
  apiKey: 'AIzaSyAbc123...',
  authToken: 'Bearer eyJhbGciOiJIUzI1NiJ9...',
};
```

## ✅ Good Example

```typescript
// Read from environment variables
const stripeKey = process.env.STRIPE_SECRET_KEY;
const dbPassword = process.env.DB_PASSWORD;
const jwtSecret = process.env.JWT_SECRET;

// Validate at startup that secrets are present
if (!stripeKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

// Use a secrets manager (AWS SSM, Vault, etc.)
const secret = await secretsManager.getSecretValue({ SecretId: 'prod/stripe/key' });
```

## How to fix

1. Move secrets to environment variables and read them with `process.env.YOUR_SECRET`
2. Use a `.env` file locally (add to `.gitignore`) and a secrets manager in production
3. Rotate any secrets that were previously hardcoded and committed

## Configuration

This rule has no options. It is enabled at `error` in all presets.
