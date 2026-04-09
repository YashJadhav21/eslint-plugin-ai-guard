# CI Integration

Add `ai-guard` to your CI pipeline to automatically block new AI-generated code issues on every pull request.

---

## GitHub Actions

### Basic setup (runs on every PR)

```yaml
# .github/workflows/ai-guard.yml
name: AI Guard

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  ai-guard:
    name: AI Code Quality Check
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Run ai-guard
        run: npx ai-guard run --json --max-warnings 0
```

### Using the baseline (recommended for existing projects)

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
          cache: npm
      - run: npm ci

      # Only fail if NEW issues are introduced (baseline is committed to repo)
      - name: Check for new AI issues
        run: npx ai-guard baseline --check
```

### Using the ESLint integration in an existing ESLint job

If you already run ESLint in CI, just add the plugin to your config and the existing job will cover it:

```yaml
- name: Lint
  run: npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0
```

---

## Pre-commit Hooks

Block commits that introduce new AI issues using [husky](https://typicode.github.io/husky) and [lint-staged](https://github.com/okonet/lint-staged):

### Setup

```bash
npm install --save-dev husky lint-staged
npx husky init
```

### `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### `package.json`

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "ai-guard run --path"
    ]
  }
}
```

---

## GitLab CI

```yaml
# .gitlab-ci.yml
ai-guard:
  stage: test
  image: node:20
  script:
    - npm ci
    - npx ai-guard run --json --max-warnings 0
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

---

## Bitbucket Pipelines

```yaml
# bitbucket-pipelines.yml
pipelines:
  pull-requests:
    '**':
      - step:
          name: AI Guard
          image: node:20
          caches:
            - node
          script:
            - npm ci
            - npx ai-guard run --json --max-warnings 0
```

---

## CI Configuration Tips

### Fail only on errors, allow warnings

```bash
# Exit 1 only if there are errors (exit 0 on warnings)
npx ai-guard run
```

### Fail on any issue at all

```bash
# --max-warnings 0 makes warnings also fail CI
npx ai-guard run --max-warnings 0
```

### Only fail on new issues (baseline mode)

```bash
# Commit .ai-guard-baseline.json to the repo first
npx ai-guard baseline --check
```

### Parse JSON output for custom reporting

```bash
result=$(npx ai-guard run --json)
total=$(echo "$result" | jq '.totalIssues')
echo "ai-guard found $total issues"
```

---

## `--max-warnings` Reference

| Value | Behavior |
|---|---|
| Not set | Warnings allowed; fails only on errors |
| `0` | Any warning causes exit code 1 |
| `N` | Fails if warnings exceed N |
