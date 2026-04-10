<p align="center">
  <h1 align="center">eslint-plugin-ai-guard</h1>
  <p align="center">
    <strong>🛡️ ESLint plugin that catches the code patterns AI tools get wrong most often.</strong>
  </p>
  <p align="center">
    <a href="https://www.npmjs.com/package/eslint-plugin-ai-guard"><img src="https://img.shields.io/npm/v/eslint-plugin-ai-guard.svg?style=flat-square" alt="npm version"></a>
    <a href="https://github.com/YashJadhav21/eslint-plugin-ai-guard/actions"><img src="https://img.shields.io/github/actions/workflow/status/YashJadhav21/eslint-plugin-ai-guard/ci.yml?style=flat-square&label=CI" alt="CI"></a>
    <a href="https://www.npmjs.com/package/eslint-plugin-ai-guard"><img src="https://img.shields.io/npm/dm/eslint-plugin-ai-guard.svg?style=flat-square" alt="downloads"></a>
    <a href="https://github.com/YashJadhav21/eslint-plugin-ai-guard/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/eslint-plugin-ai-guard.svg?style=flat-square" alt="license"></a>
  </p>
</p>

---

AI-generated code has **1.7× more issues** and **2.74× more security vulnerabilities** than human code ([CodeRabbit 2025](https://www.coderabbit.ai/)). Existing linters catch human mistakes — `ai-guard` catches the patterns AI tools consistently get wrong: empty catch blocks, floating promises, async array misuse, and more.

## Install

```bash
npm install --save-dev eslint-plugin-ai-guard
```

## 🚀 Quick Start – CLI (no config needed)

```bash
npx ai-guard run          # recommended preset (lowest noise)
npx ai-guard run --strict
npx ai-guard run --security
npx ai-guard init         # auto-creates ESLint config for you
npx ai-guard doctor       # diagnoses setup issues
npx ai-guard baseline     # track only *new* issues going forward
```
That's it. **Zero configuration required.**

## 🧪 Real-World Usage Philosophy

`ai-guard` is designed for production adoption in existing codebases:

1. **Recommended preset is intentionally low-noise** to avoid overwhelming teams on day one.
2. **Strict preset enables full enforcement** for mature teams that want maximum coverage.
3. **Security preset focuses only on security rules** with critical issues as errors.

## 🎬 Real Workspace Demo

See how `ai-guard` catches a common AI-generated async bug that silent failures in production:

```typescript
// ❌ BAD: AI often forgets to await or wrap in Promise.all
const userIds = [1, 2, 3];
userIds.map(async (id) => {
  return await fetchUser(id);
}); 
// ⚠️ ai-guard flags: Async callback passed to Array.map(). Returns Promise[], not values.

// ✅ GOOD: ai-guard recommended fix
const users = await Promise.all(userIds.map(async (id) => {
  return await fetchUser(id);
}));
// ✨ ai-guard: No issues found.
```

### Terminal Output

![ai-guard linting demo](./assets/example_1.png)
![ai-guard linting demo](./assets/example_2.png)

*The terminal output above shows `ai-guard` catching multiple AI-generated anti-patterns in a single run.*

## Rules (Recommended Preset)

### 🎯 Error Handling

- **`ai-guard/no-empty-catch`** (Error)
  Disallow empty catch blocks. AI tools frequently generate try/catch with empty bodies that silently swallow errors.
- **`ai-guard/no-broad-exception`** (Warn)
  Disallow catching `any` or `unknown` without instance narrowing. AI tools default to `catch (e: any)` which obscures the underlying failure.
- **`ai-guard/no-catch-log-rethrow`** (Off in `recommended`, Error in `strict`)
  Disallow catch blocks that only log and rethrow the same error. AI tools often generate this noisy pattern without adding recovery or context.
- **`ai-guard/no-catch-without-use`** (Off in `recommended`, Error in `strict`)
  Disallow unused catch parameters. AI tools frequently add `catch (e)` while ignoring the error object entirely.
- **`ai-guard/no-duplicate-logic-block`** (Off in `recommended`, Error in `strict`)
  Disallow consecutive duplicated logic blocks. AI tools often copy-paste identical code that should be consolidated.

### ⏱️ Async Stability

- **`ai-guard/no-async-array-callback`** (Warn)
  Disallow async functions in `.map()`, `.filter()`, etc. AI tools frequently suggest `array.map(async ...)` expecting resolved values, creating silent bugs.
- **`ai-guard/no-floating-promise`** (Error)
  Require awaiting or handling promises. AI tools frequently generate un-awaited async calls that silently swallow rejections.
- **`ai-guard/no-await-in-loop`** (Warn)
  Disallow sequential `await` inside loops. AI tools frequently use `for (const x of y) await z(x)` causing O(n) latency instead of parallel `Promise.all()`.
- **`ai-guard/no-async-without-await`** (Warn)
  Disallow async functions that do not use `await`. AI tools frequently add `async` by default, creating misleading function signatures.
- **`ai-guard/no-redundant-await`** (Off in `recommended`, Error in `strict`)
  Disallow redundant `return await` outside try/catch/finally. AI tools often emit this pattern even when returning the Promise directly is equivalent.

### 🛡️ Security

- **`ai-guard/no-hardcoded-secret`** (Error)
  Disallow hardcoded keys/passwords. AI tools frequently provide examples with placeholder secrets that accidentally make it into production.
- **`ai-guard/no-eval-dynamic`** (Error)
  Disallow dynamic `eval()` or `new Function()`.
- **`ai-guard/no-sql-string-concat`** (Warn in `recommended`, Error in `security`/`strict`)
  Disallow variable concatenation/interpolation in SQL queries. AI tools frequently generate dangerous code enabling SQL injection.
- **`ai-guard/no-unsafe-deserialize`** (Warn)
  Disallow `JSON.parse()` on likely untrusted inputs (like `req.body`) without visible validation.
- **`ai-guard/require-auth-middleware`** (Warn)
  Enforce authentication middleware on Express/Fastify routes. AI tools frequently generate unprotected endpoints exposing sensitive data.
- **`ai-guard/require-authz-check`** (Warn in `recommended`/`security`, Error in `strict`)
  Require visible ownership/authorization checks when handlers access resource identifiers (like `req.params.id`).

### 🧹 Code Quality

- **`ai-guard/no-console-in-handler`** (Off in `recommended`, Error in `strict`)
  Disallow `console.*` inside HTTP route handlers. AI tools often leave debug logs in handlers that leak internals and pollute production logs.

### Configs

| Config | Description |
| --- | --- |
| `recommended` | Adoption-first preset: high-confidence issues as `error`, context-sensitive rules as `warn`/`off` |
| `strict` | All rules at `error` — for teams that want maximum coverage |
| `security` | Security-only rules: critical issues at `error`, contextual checks at `warn` |

### Config Examples

#### Flat Config: strict

```javascript
import aiGuard from "eslint-plugin-ai-guard";

export default [
  {
    plugins: { "ai-guard": aiGuard },
    rules: { ...aiGuard.configs.strict.rules }
  }
];
```

#### Flat Config: security

```javascript
import aiGuard from "eslint-plugin-ai-guard";

export default [
  {
    plugins: { "ai-guard": aiGuard },
    rules: { ...aiGuard.configs.security.rules }
  }
];
```

## Why This Exists

AI coding assistants generate code that **looks correct** but has subtle structural issues:

- 🕳️ **Empty catch blocks** — errors vanish silently
- ⏳ **`array.map(async ...)`** — returns `Promise[]`, not resolved values
- 🔥 **Floating promises** — `fetchData()` without `await` = silent failures

These patterns pass TypeScript and existing linters. `ai-guard` catches them.

## Supported Environments

- **ESLint** 8.x and 9.x (flat config)
- **Node.js** ≥ 18
- **TypeScript** and JavaScript

## Development

```bash
git clone https://github.com/YashJadhav21/eslint-plugin-ai-guard.git
cd eslint-plugin-ai-guard
npm install
npm run test        # Run test suite
npm run build       # Build CJS + ESM
npm run typecheck   # TypeScript check
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Rule requests:** Open an issue using the [Rule Request template](https://github.com/YashJadhav21/eslint-plugin-ai-guard/issues/new).

**False positive reports:** Open an issue using the [False Positive template](https://github.com/YashJadhav21/eslint-plugin-ai-guard/issues/new) — we take zero false positives seriously.

## License

[MIT](LICENSE) — free forever. No rules behind a paywall.

---

<p align="center">
  Built to make AI-assisted development safer. ⚡
</p>
