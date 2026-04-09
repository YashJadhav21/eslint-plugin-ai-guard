# no-eval-dynamic

**Category:** Security | **Severity:** `error` (recommended, strict, security)

---

## What it does

Flags calls to `eval()` or `new Function()` where the argument is not a string literal — i.e., where any variable, expression, or template literal with dynamic content is passed.

## Why it matters

`eval()` and `new Function()` execute arbitrary JavaScript at runtime. When the argument is user-controlled (from `req.body`, `req.query`, a database value, or any external source), this is a direct code injection vulnerability. An attacker can execute any code on your server with the same permissions as your Node.js process.

AI tools sometimes generate `eval()` usage when implementing dynamic expression evaluators, template engines, or configuration parsers — because `eval` is the simplest way to run a string as code. The safer alternatives (expression parsers, sandboxed VMs, dedicated template engines) require more code.

## ❌ Bad Example

```typescript
// User-controlled input passed to eval — direct RCE vulnerability
app.post('/calculate', (req, res) => {
  const result = eval(req.body.expression); // ← arbitrary code execution
  res.json({ result });
});

// new Function with dynamic content
const fn = new Function('x', userProvidedCode); // ← code injection
fn(data);

// Template literal — still dynamic even if it looks controlled
const code = `return ${req.query.formula}`;
const fn = new Function(code); // ← flagged
```

## ✅ Good Example

```typescript
// Use a safe expression library instead of eval
import { evaluate } from 'mathjs';

app.post('/calculate', (req, res) => {
  try {
    const result = evaluate(req.body.expression); // sandboxed, no code injection
    res.json({ result });
  } catch {
    res.status(400).json({ error: 'Invalid expression' });
  }
});

// For template rendering, use a dedicated template engine
import { render } from 'mustache';
const output = render(template, data); // ← no eval, no injection

// Static eval is fine (literal string only, no user input)
const result = eval('2 + 2'); // ← not flagged (literal)
```

## How to fix

- For **math expressions**: use `mathjs`, `expr-eval`, or `jexl`
- For **template rendering**: use Mustache, Handlebars, Nunjucks, or similar
- For **JSON evaluation**: use `JSON.parse()` — never `eval()`
- For **sandboxed code execution**: use Node.js `vm.runInNewContext()` with strict resource limits

## Configuration

This rule has no options. It is enabled at `error` in all presets.
