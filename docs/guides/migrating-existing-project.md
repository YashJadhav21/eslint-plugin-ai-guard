# Migrating an Existing Project

This guide covers adopting `ai-guard` on a large existing codebase without disrupting your team or breaking CI.

The challenge: running `ai-guard` on an existing project often reveals hundreds of issues on day one. Most of these are existing problems, not new ones. The goal is to prevent *new* issues while giving the team time to fix existing ones gradually.

---

## The Baseline Approach (Recommended)

The `baseline` command solves the disruption problem:

```bash
# Step 1: Run a scan to see what exists
npx ai-guard run

# Step 2: Save every current issue as the baseline
npx ai-guard baseline --save

# Step 3: Commit the baseline file
git add .ai-guard-baseline.json
git commit -m "chore: add ai-guard baseline"

# Step 4: From now on, only check for NEW issues
npx ai-guard baseline --check
```

Now your CI only fails if someone introduces a **new** issue — not for pre-existing ones. The baseline file is committed to the repository, so it's shared across the team.

---

## Gradual Rule Adoption

If you want to start with fewer rules before enabling everything:

1. Start with `recommended` preset (low noise):

```bash
npx ai-guard init --preset recommended
```

2. After the team is comfortable, upgrade to `strict`:

```bash
npx ai-guard init --preset strict
```

3. For security-focused reviews, run `security` preset:

```bash
npx ai-guard run --security
```

---

## Fixing Existing Issues

Once the baseline is in place, you can work through existing issues at your own pace:

```bash
# See all current issues (not just new ones)
npx ai-guard run

# Focus on a specific rule
npx eslint src --rule '{"ai-guard/no-floating-promise": "error"}' --no-eslintrc

# Focus on a specific directory
npx ai-guard run --path src/api
```

After fixing a batch of issues, update the baseline:

```bash
npx ai-guard baseline --save
git add .ai-guard-baseline.json
git commit -m "fix: resolve floating promise issues in src/api"
```

---

## Suppressing Specific Violations

For issues you've reviewed and intentionally accepted, use ESLint's standard inline suppression:

```typescript
// This floating promise is intentional — fire-and-forget analytics
sendAnalyticsEvent(event); // eslint-disable-line ai-guard/no-floating-promise
```

Or suppress for a whole file:

```typescript
/* eslint-disable ai-guard/no-console-in-handler */
// This is a debug endpoint — console logging is intentional
```

---

## Directory-Level Suppression

Add patterns to ignore third-party, generated, or legacy code:

```javascript
// eslint.config.mjs
export default [
  {
    plugins: { 'ai-guard': aiGuard },
    rules: { ...aiGuard.configs.recommended.rules },
  },
  {
    // Exclude legacy code from ai-guard rules
    files: ['src/legacy/**'],
    rules: {
      'ai-guard/no-empty-catch': 'off',
      'ai-guard/no-floating-promise': 'off',
    },
  },
  {
    ignores: ['.next/**', 'dist/**', 'build/**', 'coverage/**'],
  },
];
```

---

## Recommended Migration Timeline

| Week | Action |
|---|---|
| 1 | Run `npx ai-guard run`, review results, save baseline |
| 1 | Add to CI using `ai-guard baseline --check` |
| 2–4 | Fix high-severity issues (`no-hardcoded-secret`, `no-floating-promise`) |
| 4–6 | Enable additional rules, update baseline after each batch of fixes |
| 6+ | Consider upgrading to `strict` preset |
