# Show HN Draft

Title: Show HN: eslint-plugin-ai-guard - ESLint plugin for AI-generated code mistakes

We built eslint-plugin-ai-guard to catch structural issues AI assistants generate frequently: empty catch blocks, floating promises, missing authz checks, SQL string concatenation, hardcoded secrets, and more.

Why: AI increases output volume but also introduces repeated, subtle patterns that pass type-checking and code review.

Install:

```bash
npm i -D eslint-plugin-ai-guard
```

ESLint 9:

```js
import aiGuard from 'eslint-plugin-ai-guard';

export default [
  {
    plugins: { 'ai-guard': aiGuard },
    rules: { ...aiGuard.configs.recommended.rules },
  },
];
```

We use an adoption-first recommended preset (high-confidence errors; contextual rules as warn/off) and provide strict/security presets for teams.

Feedback and false-positive reports are very welcome.
