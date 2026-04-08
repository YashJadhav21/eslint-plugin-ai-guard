# 30-Second Demo Script

1. Open project in Cursor or Claude Code.
2. Prompt assistant: "Create an Express route for GET /users/:id that returns the user."
3. Accept generated route without authz checks.
4. Run ESLint with ai-guard recommended.
5. Show `ai-guard/require-authz-check` warning in terminal/editor.
6. Add ownership check (`req.user.id === req.params.id`) or `authorize(...)` helper.
7. Re-run lint and show warning resolved.

Recording notes:
- Keep terminal and editor side by side.
- Keep to ~30 seconds.
- Export as GIF for README + social posts.
