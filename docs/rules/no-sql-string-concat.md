# no-sql-string-concat

**Category:** Security | **Severity:** `warn` (recommended), `error` (strict, security)

---

## What it does

Flags string concatenation or template literal interpolation where the surrounding context suggests the string is a SQL query — variable names, method names, or assignment targets that contain `sql`, `query`, `select`, `insert`, `update`, `delete`, or `where`.

## Why it matters

SQL injection is consistently one of the most critical and most exploited vulnerability types (OWASP Top 10, every year). AI tools generate SQL-by-string-concatenation patterns because this is how SQL has been written in tutorials and examples for decades — the training data is full of it.

A user controlling `req.params.id` can pass `1 OR 1=1 --` and bypass authentication, extract the entire database, or delete records. This is exploitable by a beginner with a browser or `curl`.

## ❌ Bad Example

```typescript
// Template literal — interpolates user input directly into the query
const query = `SELECT * FROM users WHERE id = ${req.params.id}`;
await db.execute(query);

// String concatenation — same vulnerability
const sql = 'SELECT * FROM orders WHERE user_id = ' + userId;
const results = await connection.query(sql);

// Builds conditions with user-controlled data
const whereClause = 'status = ' + req.body.status;
const fullQuery = `SELECT * FROM products WHERE ${whereClause}`;
```

## ✅ Good Example

```typescript
// Parameterized queries — user input is never interpreted as SQL
const query = 'SELECT * FROM users WHERE id = ?';
const [rows] = await db.execute(query, [req.params.id]);

// Named parameters (varies by driver)
const { rows } = await pool.query(
  'SELECT * FROM orders WHERE user_id = $1',
  [userId]
);

// ORMs handle parameterization automatically
const user = await User.findOne({ where: { id: req.params.id } });
const products = await Product.findAll({ where: { status: req.body.status } });
```

## How to fix

Always use **parameterized queries** (also called prepared statements). Pass user-controlled values as parameters, never interpolated into the query string. Every major database driver supports this:

- **`mysql2`**: `db.execute(sql, [params])`
- **`pg`**: `pool.query(sql, [params])`
- **`better-sqlite3`**: `stmt.get(params)`
- **ORMs** (Prisma, TypeORM, Sequelize): use their query builders — they parameterize automatically

## Configuration

```js
rules: {
  'ai-guard/no-sql-string-concat': 'warn', // default in recommended
  'ai-guard/no-sql-string-concat': 'error', // strict and security presets
}
```
