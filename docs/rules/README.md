# Rules Reference

All 17 rules provided by `eslint-plugin-ai-guard`, organized by category.

---

## ⚠️ Error Handling

| Rule | Recommended | Strict | Description |
|---|---|---|---|
| [no-empty-catch](no-empty-catch.md) | `error` | `error` | Empty catch blocks silently discard errors |
| [no-broad-exception](no-broad-exception.md) | `warn` | `error` | `catch (e: any)` loses all type information |
| [no-catch-log-rethrow](no-catch-log-rethrow.md) | `off` | `error` | Log-then-rethrow adds noise, no recovery |
| [no-catch-without-use](no-catch-without-use.md) | `off` | `error` | Catch parameter declared but never used |
| [no-duplicate-logic-block](no-duplicate-logic-block.md) | `off` | `error` | Copy-pasted logic blocks that should be extracted |

## ⏱️ Async Correctness

| Rule | Recommended | Strict | Description |
|---|---|---|---|
| [no-floating-promise](no-floating-promise.md) | `error` | `error` | Async call without `await` or `.catch()` |
| [no-async-array-callback](no-async-array-callback.md) | `warn` | `error` | `array.map(async ...)` returns `Promise[]`, not values |
| [no-await-in-loop](no-await-in-loop.md) | `warn` | `error` | Sequential `await` in loops — use `Promise.all` |
| [no-async-without-await](no-async-without-await.md) | `warn` | `error` | `async` function that never uses `await` |
| [no-redundant-await](no-redundant-await.md) | `off` | `error` | `return await` outside try/catch is redundant |

## 🛡️ Security

| Rule | Recommended | Security | Strict | Description |
|---|---|---|---|---|
| [no-hardcoded-secret](no-hardcoded-secret.md) | `error` | `error` | `error` | API keys / passwords in source code |
| [no-eval-dynamic](no-eval-dynamic.md) | `error` | `error` | `error` | `eval()` or `new Function()` with dynamic content |
| [no-sql-string-concat](no-sql-string-concat.md) | `warn` | `error` | `error` | SQL queries built with string concatenation |
| [no-unsafe-deserialize](no-unsafe-deserialize.md) | `warn` | `warn` | `error` | `JSON.parse()` on untrusted input without validation |
| [require-auth-middleware](require-auth-middleware.md) | `warn` | `warn` | `error` | Express/Fastify routes without auth middleware |
| [require-authz-check](require-authz-check.md) | `warn` | `warn` | `error` | No ownership check when accessing resources by ID |

## 🧹 Code Quality

| Rule | Recommended | Strict | Description |
|---|---|---|---|
| [no-console-in-handler](no-console-in-handler.md) | `off` | `error` | `console.*` inside HTTP route handlers |

---

## Preset Comparison

| Preset | Use Case | All 17 Rules? |
|---|---|---|
| `recommended` | Start here — low noise, high-value rules enabled | No — off/warn for noisy rules |
| `strict` | Maximum enforcement — mature codebase | Yes — all at `error` |
| `security` | Security audit focus | Security rules only |
