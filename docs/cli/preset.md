# ai-guard preset

Interactively select and apply a preset to your ESLint configuration.

---

## Usage

```bash
ai-guard preset
```

## What it does

1. Prompts you to select one preset:
   - `recommended`
   - `strict`
   - `security`
2. Detects whether your project uses flat config or legacy config.
3. Creates a config if none exists, or patches your existing config.
4. Creates a `.bak` backup before patching existing config files.

## Preset meanings

| Preset | Purpose |
|---|---|
| `recommended` | Adoption-first, low-noise defaults |
| `strict` | All rules at `error` |
| `security` | Security-focused rules only |

## Example

```bash
npx ai-guard preset
```

Then choose from the interactive menu.

## Notes

- This command is interactive, so it is best for local development.
- For CI and scripting, prefer non-interactive commands like `ai-guard init --preset strict`.
