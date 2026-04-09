# no-await-in-loop

**Category:** Async Correctness | **Severity:** `warn` (recommended), `error` (strict)

---

## What it does

Flags `await` expressions that appear directly inside `for`, `while`, `do...while`, and `for...of` loop bodies.

## Why it matters

Using `await` inside a loop turns parallel work into sequential work. If you need to fetch 10 users, a loop with `await` makes 10 serial network requests — each one waiting for the previous to finish. The total time is the sum of all individual request times. With `Promise.all`, all 10 requests run in parallel and the total time is the time of the slowest one.

AI tools generate sequential loops because that's the natural control flow pattern. The correct parallel pattern requires more explicit code.

## ❌ Bad Example

```typescript
// Sequential — takes O(n × latency) time
const results = [];
for (const userId of userIds) {
  const user = await fetchUser(userId); // ← waits for each one
  results.push(user);
}

// Also flagged — same pattern with while
let i = 0;
while (i < ids.length) {
  await processItem(ids[i]);
  i++;
}
```

## ✅ Good Example

```typescript
// Parallel — takes O(max latency) time
const results = await Promise.all(
  userIds.map((userId) => fetchUser(userId))
);

// For sequential processing (intentional), use a comment or configure the rule
// Sequential processing required (external API rate limit)
for (const item of items) {
  await processWithRateLimit(item); // eslint-disable-line ai-guard/no-await-in-loop
}

// Or use Promise.allSettled for partial failure tolerance
const settled = await Promise.allSettled(
  userIds.map((userId) => fetchUser(userId))
);
```

## How to fix

- Replace `for` loop + `await` with `await Promise.all(arr.map(...))`
- If sequential processing is genuinely needed (rate limits, dependencies between items), add a comment explaining why and disable the rule for that line

## Configuration

This rule has no options.
