<p align="center">
  <img src="https://img.shields.io/npm/v/eslint-plugin-ai-guard.svg?style=for-the-badge&color=6366f1" alt="npm version" />
  <img src="https://img.shields.io/github/actions/workflow/status/YashJadhav21/eslint-plugin-ai-guard/ci.yml?style=for-the-badge&label=CI" alt="CI" />
  <img src="https://img.shields.io/npm/dm/eslint-plugin-ai-guard.svg?style=for-the-badge&color=22c55e" alt="downloads" />
  <img src="https://img.shields.io/npm/l/eslint-plugin-ai-guard.svg?style=for-the-badge&color=f59e0b" alt="license" />
</p>

<h1 align="center">eslint-plugin-ai-guard</h1>

<p align="center">
  <strong>The ESLint plugin that catches the bugs AI tools introduce.<br>Zero config. Instant results. 17 rules targeting AI-specific patterns.</strong>
</p>

---

## 🚨 The Problem

AI coding assistants (Copilot, Cursor, Claude, ChatGPT) are now used by **90%+ of developers** — but the code they generate has a problem: **it looks correct and still passes TypeScript checks, while hiding real bugs.**

Studies show AI-generated code has:

- **1.7× more issues** per PR than human code *(CodeRabbit, 470 OSS PRs, 2025)*
- **2.74× more XSS vulnerabilities** *(CodeRabbit, 2025)*
- **45% of AI code** introduces at least one security vulnerability *(Veracode, 2025)*

The patterns are consistent and predictable:

| Pattern | What AI Does | Consequence |
|---|---|---|
| **Floating promises** | `fetchData()` without `await` | Silent failures in production |
| **Empty catch blocks** | `catch (e) {}` | Errors disappear, nothing is logged |
| **`array.map(async ...)`** | Returns `Promise[]`, not resolved values | Silent data corruption |
| **Missing auth middleware** | Routes without authentication | Unauthorized access |
| **SQL string concat** | `"SELECT * WHERE id = " + userId` | SQL injection |
| **Hardcoded secrets** | API keys in source code | Credential leaks |

**Standard ESLint, TypeScript, and existing linters do not catch these.** They were built for human mistakes. AI makes different mistakes — consistently, at scale.

`eslint-plugin-ai-guard` was built specifically for this gap.

---

## ✅ The Solution

`ai-guard` uses AST-based static analysis to detect **17 AI-specific bug patterns** across error handling, async correctness, and security — before they hit production.

It works in two modes:

1. **Zero-config CLI** — `npx ai-guard run` scans any project instantly, no setup required
2. **ESLint plugin** — integrates into your existing linting pipeline and editor

---

## 🚀 Quick Start — Zero Config

No installation, no setup. Run this in any JavaScript or TypeScript project:

```bash
npx ai-guard run
```

**Example output:**

```
  AI GUARD RESULTS

  ✔ Scanned:  src/
  ✔ Duration: 843ms

  Total Issues: 12 errors · 8 warnings

  ── By Rule ──

    • no-floating-promise:      7
    • no-empty-catch:           4
    • no-sql-string-concat:     3
    • require-auth-middleware:  3
    • no-hardcoded-secret:      2
    • no-async-array-callback:  1

  ── Top Files ──

    • src/api/users.ts    (6)
    • src/utils/db.ts     (4)
    • src/routes/auth.ts  (3)

  ── Next Steps ──

  ℹ  Run ai-guard baseline  to save these issues and track only new ones
  ℹ  Run ai-guard init      to wire up ESLint for your editor
```

**No issues?**

```
  ✔  No AI issues found — your code looks clean
```

---

## 📦 Install (Full ESLint Integration)

```bash
npm install --save-dev eslint-plugin-ai-guard
```

> **Peer dependency:** ESLint ≥ 8.0.0

### ESLint v9 — `eslint.config.mjs`

```javascript
import aiGuard from 'eslint-plugin-ai-guard';

export default [
  {
    plugins: { 'ai-guard': aiGuard },
    rules: { ...aiGuard.configs.recommended.rules },
  },
  {
    ignores: ['.next/**', 'dist/**', 'build/**', 'coverage/**'],
  },
];
```

### ESLint v8 — `.eslintrc.json`

```json
{
  "plugins": ["ai-guard"],
  "extends": ["plugin:ai-guard/recommended"],
  "ignorePatterns": [".next/", "dist/", "build/", "coverage/"]
}
```

That's it. **Zero configuration required to get started.**

---

## ⚡ CLI Commands

The `ai-guard` CLI makes onboarding instant. No ESLint knowledge needed.

| Command | Description |
|---|---|
| `ai-guard run` | Scan your project with zero config. The most important command. |
| `ai-guard run --strict` | Use the strict preset — all 17 rules at `error` |
| `ai-guard run --security` | Security rules only |
| `ai-guard run --json` | Machine-readable JSON output for CI |
| `ai-guard init` | Auto-configure your ESLint config (generates or patches safely) |
| `ai-guard doctor` | Diagnose setup issues with exact fix commands |
| `ai-guard preset` | Interactively choose and apply a preset |
| `ai-guard ignore` | Add default ignore patterns (`.next`, `dist`, `build`) |
| `ai-guard baseline` | Save current issues; future runs show only *new* problems |

### Gradual Adoption (Recommended for Existing Projects)

```bash
# Step 1: Scan your project
npx ai-guard run

# Step 2: Save the current state as a baseline
npx ai-guard baseline --save

# Step 3: From now on, only new issues will be flagged
npx ai-guard baseline --check
```

This means you can adopt `ai-guard` on a large existing codebase **without being overwhelmed** on day one.

---

## 📊 Rules

### ⚠️ Error Handling (5 rules)

| Rule | Recommended | Description |
|---|---|---|
| [`no-empty-catch`](docs/rules/no-empty-catch.md) | `error` | Empty catch blocks silently swallow errors |
| [`no-broad-exception`](docs/rules/no-broad-exception.md) | `warn` | `catch (e: any)` hides error taxonomy |
| [`no-catch-log-rethrow`](docs/rules/no-catch-log-rethrow.md) | `off` | Log-then-rethrow adds noise, no recovery |
| [`no-catch-without-use`](docs/rules/no-catch-without-use.md) | `off` | Unused catch parameter `e` |
| [`no-duplicate-logic-block`](docs/rules/no-duplicate-logic-block.md) | `off` | Copy-pasted logic blocks |

### ⏱️ Async Correctness (5 rules)

| Rule | Recommended | Description |
|---|---|---|
| [`no-floating-promise`](docs/rules/no-floating-promise.md) | `error` | Un-awaited async calls silently swallow rejections |
| [`no-async-array-callback`](docs/rules/no-async-array-callback.md) | `warn` | `array.map(async ...)` returns `Promise[]`, not values |
| [`no-await-in-loop`](docs/rules/no-await-in-loop.md) | `warn` | Sequential `await` in loops — should use `Promise.all` |
| [`no-async-without-await`](docs/rules/no-async-without-await.md) | `warn` | `async` function that never uses `await` |
| [`no-redundant-await`](docs/rules/no-redundant-await.md) | `off` | `return await` outside try/catch — redundant wrapper |

### 🛡️ Security (6 rules)

| Rule | Recommended | Description |
|---|---|---|
| [`no-hardcoded-secret`](docs/rules/no-hardcoded-secret.md) | `error` | API keys / passwords in source code |
| [`no-eval-dynamic`](docs/rules/no-eval-dynamic.md) | `error` | `eval()` or `new Function()` with dynamic input |
| [`no-sql-string-concat`](docs/rules/no-sql-string-concat.md) | `warn` | String concatenation in SQL queries |
| [`no-unsafe-deserialize`](docs/rules/no-unsafe-deserialize.md) | `warn` | `JSON.parse()` on untrusted input without validation |
| [`require-auth-middleware`](docs/rules/require-auth-middleware.md) | `warn` | Express/Fastify routes without auth middleware |
| [`require-authz-check`](docs/rules/require-authz-check.md) | `warn` | Route handlers accessing resources without ownership check |

### 🧹 Code Quality (1 rule)

| Rule | Recommended | Description |
|---|---|---|
| [`no-console-in-handler`](docs/rules/no-console-in-handler.md) | `off` | `console.*` inside route handlers leaks internals |

### Presets

| Preset | Use case |
|---|---|
| `recommended` | **Start here.** High-confidence issues at `error`, context-sensitive at `warn`/`off`. Low noise. |
| `strict` | All 17 rules at `error`. For mature codebases ready for full enforcement. |
| `security` | Security rules only. For AppSec teams and security-focused audits. |

---

## 📊 Real-World Results

| Project Type | Issues Found | False Positives |
|---|---|---|
| Clean utility library | 0 | 0 |
| Express.js backend | 400+ | 0 |
| Next.js full-stack app | 180+ | 0 |

The recommended preset is calibrated for **near-zero false positives** on real codebases.

---

## 🧠 Why This Exists

AI models generate code **statistically from training data** — not semantically from understanding your system. They make the same structural mistakes, consistently, at scale:

- They add `async` by default even when not needed
- They generate `catch (e) {}` placeholders and never fill them in
- They write SQL queries by string concatenation because that's the pattern they've seen
- They omit auth middleware because examples they trained on often don't show the full middleware chain

These patterns are **static-detectable** using AST rules. You don't need AI to lint AI code — you need fast, offline, zero-latency static analysis that catches these specific patterns before they hit production.

`ai-guard` is that tool.

---

## 🔧 CI Integration

```yaml
# .github/workflows/ai-guard.yml
name: AI Guard

on: [push, pull_request]

jobs:
  ai-guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx ai-guard run --json --max-warnings 0
```

Or use the ESLint integration in your existing `eslint` CI step — no separate job needed.

---

## 📚 Documentation

- **[Rules →](docs/rules/)** — Full documentation for all 17 rules
- **[CLI Reference →](docs/cli/overview.md)** — All CLI commands with options and examples
- **[Getting Started →](docs/guides/getting-started.md)** — Step-by-step setup guide
- **[Migrating an Existing Project →](docs/guides/migrating-existing-project.md)** — Adopt ai-guard without disruption
- **[CI Integration →](docs/guides/ci-integration.md)** — GitHub Actions, pre-commit hooks, and more

---

## 🛠️ Development

```bash
git clone https://github.com/YashJadhav21/eslint-plugin-ai-guard.git
cd eslint-plugin-ai-guard
npm install
npm run test        # Run test suite
npm run build       # Build plugin + CLI
npm run typecheck   # TypeScript check
```

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

- **Rule requests** → [Open an issue](https://github.com/YashJadhav21/eslint-plugin-ai-guard/issues/new)
- **False positive reports** → We take these seriously. [Report here](https://github.com/YashJadhav21/eslint-plugin-ai-guard/issues/new)
- **Security issues** → Email directly; do not open a public issue

## License

[MIT](LICENSE) — free forever. No rules behind a paywall.

---

<p align="center">
  Built to make AI-assisted development safer. ⚡<br>
  <sub>If this saved you from a production bug, consider giving it a ⭐</sub>
</p>
