# ai-guard ignore

Add default ignore patterns to your ESLint config to reduce noise from generated directories.

---

## Usage

```bash
ai-guard ignore
```

## What it adds

Default ignore patterns include:

- `.next/`
- `dist/`
- `build/`
- `coverage/`
- `out/`
- `node_modules/`

For flat config, the command adds an `ignores` block.
For legacy config, it adds `ignorePatterns`.

## Behavior

- If no config exists, it generates one with default ignores included.
- If a config exists, it creates a `.bak` backup and patches the config.
- If ignore patterns already exist, it leaves the file unchanged.

## Example

```bash
npx ai-guard ignore
```

## Notes

After running this command, scan output is usually cleaner in mixed repos with build artifacts.
