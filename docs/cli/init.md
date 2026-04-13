# ai-guard init

Automatically configure `eslint-plugin-ai-guard` in your project. Detects your ESLint version, generates or patches your config file, and tells you exactly what to install if anything is missing.

---

## Usage

```bash
ai-guard init [options]
```

## Options

| Option | Default | Description |
|---|---|---|
| `--preset <name>` | `recommended` | Preset to apply: `recommended`, `strict`, or `security` |
| `--flat` | off | Force flat config output (`eslint.config.mjs`) |
| `--dry-run` | off | Preview changes without writing files |
| `--help` | — | Show help |

## Examples

```bash
# Auto-detect and configure with recommended preset
ai-guard init

# Configure with strict preset
ai-guard init --preset strict

# Configure for security-focused teams
ai-guard init --preset security

# Preview changes only (no write)
ai-guard init --dry-run

# Force flat config output
ai-guard init --flat
```

## What It Does

1. **Detects your environment** — ESLint version, existing config type, installed packages
2. **Reports missing dependencies** — prints the exact `npm install` command to run; does **not** auto-install anything
3. **Generates or patches config**:
   - If no config exists: generates a fresh `eslint.config.mjs` (ESLint v9) or `.eslintrc.js` (ESLint v8)
   - If a config exists: backs it up (`.bak`) and patches it to add the plugin
4. **Validates the result** — verifies generated config structure and checks ESLint can load it

## Example Output

```
  AI GUARD INIT

  ── Environment ──

  ✔  ESLint 9.1.0 found (v9)
  ✖  eslint-plugin-ai-guard not found

  ── Missing Dependencies ──

  ⚠  The following packages are not installed:

    → eslint-plugin-ai-guard

  Run this first:

    npm install --save-dev eslint-plugin-ai-guard

  Then re-run ai-guard init to complete setup.
```

When all dependencies are present:

```
  ── Configuring ESLint ──

  ✔  Created eslint.config.mjs
     Preset: recommended
     Format: ESLint v9 flat config

  ── Verification ──

  ✔  Config present: eslint.config.mjs

  ── You're all set! 🎉 ──

  ℹ  Run ai-guard run      → scan your project
  ℹ  Run ai-guard doctor   → verify the setup
  ℹ  Run ai-guard baseline → track only new issues over time
```

## Config Backup

If a config file already exists, `init` creates a `.bak` backup before modifying it:

```
eslint.config.mjs      ← modified
eslint.config.mjs.bak  ← original backup
```

## Generated Files

### ESLint v9 (`eslint.config.mjs`)

```javascript
import aiGuardPlugin from 'eslint-plugin-ai-guard';

export default [
  {
    plugins: { 'ai-guard': aiGuardPlugin },
    rules: {
      ...aiGuardPlugin.configs.recommended.rules,
    },
  },
  {
    ignores: ['.next/**', 'dist/**', 'build/**', 'coverage/**', 'out/**'],
  },
];
```

## Important

`ai-guard init` does not install dependencies automatically.
If ESLint or the plugin is missing, it prints the exact install command and exits.

### ESLint v8 (`.eslintrc.js`)

```javascript
module.exports = {
  plugins: ['ai-guard'],
  extends: ['plugin:ai-guard/recommended'],
  ignorePatterns: ['.next/', 'dist/', 'build/', 'coverage/', 'out/'],
};
```
