# Getting Started with ai-guard

This guide walks you through installing and configuring `ai-guard` in a new or existing JavaScript/TypeScript project. If you're adopting it on a large existing codebase, see [Migrating an Existing Project](migrating-existing-project.md) instead.

---

## Step 1 — Instant Scan (No Setup Required)

Before installing anything, you can scan your project right now:

```bash
npx ai-guard run
```

This uses the programmatic ESLint API internally — no `eslint.config.mjs`, no `.eslintrc`, no dependencies to install. The results appear in under a second for most projects.

**Example output:**

```
  AI GUARD RESULTS

  ✔ Scanned:  .
  ✔ Duration: 843ms

  Total Issues: 12 errors · 8 warnings

  ── By Rule ──

    • no-floating-promise:     7
    • no-empty-catch:          4
    • no-sql-string-concat:    3
    • require-auth-middleware: 3

  ── Top Files ──

    • src/api/users.ts    (6)
    • src/utils/db.ts     (4)
```

---

## Step 2 — Install the Plugin

```bash
npm install --save-dev eslint-plugin-ai-guard
```

> **Peer dependency:** ESLint ≥ 8.0.0 is required. If you don't have it, install it too:
> ```bash
> npm install --save-dev eslint eslint-plugin-ai-guard
> ```

---

## Step 3 — Configure ESLint

### Option A — Auto-configure (recommended)

The CLI can generate or patch your ESLint config automatically:

```bash
npx ai-guard init
```

This detects your ESLint version, generates the appropriate config format (flat config for v9, legacy for v8), and adds default ignores for `dist`, `build`, `.next`, and `coverage`.

### Option B — Manual configuration

**ESLint v9 — `eslint.config.mjs`:**

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

**ESLint v8 — `.eslintrc.json`:**

```json
{
  "plugins": ["ai-guard"],
  "extends": ["plugin:ai-guard/recommended"],
  "ignorePatterns": [".next/", "dist/", "build/", "coverage/"]
}
```

---

## Step 4 — Run a Scan

```bash
npx ai-guard run
```

Or use ESLint directly:

```bash
npx eslint . --ext .ts,.tsx,.js,.jsx
```

---

## Step 5 — Add to Your Editor

With `eslint-plugin-ai-guard` in your ESLint config, most editors will pick it up automatically:

- **VS Code**: Install the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint). Issues appear inline.
- **Cursor / Windsurf / Zed**: Built-in ESLint support — works automatically.
- **JetBrains IDEs**: Go to Settings → Languages → JavaScript → Code Quality → ESLint.

---

## Step 6 — Add to CI

See the [CI Integration Guide](ci-integration.md) for GitHub Actions, pre-commit hooks, and more.

---

## Verify Your Setup

```bash
npx ai-guard doctor
```

This checks:
- ESLint is installed
- Plugin is installed
- Config is present
- Plugin is wired in the config
- ESLint version is compatible

---

## What's Next

- [Migrating an Existing Project →](migrating-existing-project.md)
- [CI Integration →](ci-integration.md)
- [Rules Reference →](../rules/README.md)
- [CLI Reference →](../cli/overview.md)
