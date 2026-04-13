# ai-guard baseline

Save current findings as a baseline and track only newly introduced issues.

---

## Usage

```bash
ai-guard baseline [options]
```

## Options

| Option | Default | Description |
|---|---|---|
| `--save` | auto | Save current issues to `.ai-guard-baseline.json` |
| `--check` | auto | Compare current scan with baseline and show only new issues |
| `--mode <name>` | `stable` | Match mode: `stable` (file+rule+message) or `strict` (includes line/column) |
| `--path <target>` | `.` | Directory or file to scan |
| `--preset <name>` | `recommended` | `recommended`, `strict`, or `security` |

## Default mode behavior

If no baseline file exists:

- `ai-guard baseline` behaves like `--save`

If baseline file already exists:

- `ai-guard baseline` behaves like `--check`

## Common workflow

```bash
# 1. Save current state
npx ai-guard baseline --save

# 2. Commit baseline file
# git add .ai-guard-baseline.json && git commit -m "chore: add ai-guard baseline"

# 3. In CI, fail only on new issues
npx ai-guard baseline --check

# Optional: strict mode if you want exact location matching
npx ai-guard baseline --save --mode strict
```

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | No new issues since baseline |
| `1` | New issues found, or command failed |

## Notes

- Baseline file path: `.ai-guard-baseline.json`
- Default mode `stable` is less noisy during refactors where line numbers move.
- Share this file in git if you want team-wide consistent baseline behavior.
