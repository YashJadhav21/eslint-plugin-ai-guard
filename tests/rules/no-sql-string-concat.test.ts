import { RuleTester } from '@typescript-eslint/rule-tester';
import { noSqlStringConcat } from '../../src/rules/security/no-sql-string-concat';
import { describe, it, afterAll } from 'vitest';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('no-sql-string-concat', noSqlStringConcat, {
  valid: [
    // 1. Parameterized query — the correct pattern
    {
      code: `db.query('SELECT * FROM users WHERE id = $1', [userId]);`,
    },
    // 2. Static SQL text in variable (not executed at sink)
    {
      code: `const query = 'SELECT * FROM users';`,
    },
    // 3. Template literal without expressions
    {
      code: 'const query = `SELECT * FROM users WHERE active = true`;',
    },
    // 4. String concatenation without SQL keywords
    {
      code: `const msg = 'Hello ' + name + '!';`,
    },
    // 5. Non-SQL template literal with expressions
    {
      code: 'const msg = `Hello ${name}, welcome!`;',
    },
    // 6. ORM-style query (no raw SQL sink)
    {
      code: `const user = await User.findOne({ email });`,
    },
    // 7. Static SQL concatenation passed to sink
    {
      code: `db.query('SELECT * FROM ' + 'users');`,
    },
    // 8. Template literal with no SQL keywords and expressions
    {
      code: 'const url = `/api/users/${userId}`;',
    },
    // 9. Normal product text containing "create" should not be flagged
    {
      code: 'const msg = `Run ${cmd} to create one.`;',
    },
    // 10. Non-SQL sentence containing "from" should not be flagged
    {
      code: 'const note = `Baseline from: ${preset}`;',
    },
    // 11. Non-SQL concat with dynamic value
    {
      code: `const text = 'Copy from ' + sourcePath + ' to destination';`,
    },
    // 12. Dynamic SQL-like text not sent to a sink should be ignored
    {
      code: 'const sql = `SELECT * FROM users WHERE id = ${userId}`;',
    },
  ],
  invalid: [
    // 1. Template literal SQL injection at sink
    {
      code: 'db.query(`SELECT * FROM users WHERE id = ${userId}`);',
      errors: [{ messageId: 'sqlStringConcat' }],
    },
    // 2. String concat SQL injection at sink
    {
      code: `db.query('SELECT * FROM users WHERE id = ' + userId);`,
      errors: [{ messageId: 'sqlStringConcat' }],
    },
    // 3. INSERT with template literal at sink
    {
      code: 'client.execute(`INSERT INTO users (name) VALUES (${name})`);',
      errors: [{ messageId: 'sqlStringConcat' }],
    },
    // 4. UPDATE via variable then sink
    {
      code: 'const sql = `UPDATE users SET name = ${name} WHERE id = ${id}`; db.execute(sql);',
      errors: [{ messageId: 'sqlStringConcat' }],
    },
    // 5. DELETE with template literal variable at sink
    {
      code: 'let query = `DELETE FROM users WHERE id = ${userId}`; db.query(query);',
      errors: [{ messageId: 'sqlStringConcat' }],
    },
    // 6. Complex SQL with multiple interpolations at sink
    {
      code: 'query(`SELECT * FROM ${table} WHERE ${column} = ${value}`);',
      errors: [{ messageId: 'sqlStringConcat' }],
    },
    // 7. DROP TABLE with interpolation at sink
    {
      code: 'db.run(`DROP TABLE ${tableName}`);',
      errors: [{ messageId: 'sqlStringConcat' }],
    },
    // 8. WHERE clause with string concat
    {
      code: `db.query("SELECT * FROM orders WHERE customer = '" + customerId + "'");`,
      errors: [{ messageId: 'sqlStringConcat' }],
    },
    // 9. EXEC with dynamic input at sink
    {
      code: 'db.execute(`EXEC sp_executesql ${dynamicSql}`);',
      errors: [{ messageId: 'sqlStringConcat' }],
    },
    // 10. Prisma unsafe raw sink
    {
      code: 'prisma.$queryRawUnsafe(`SELECT * FROM ${table}`);',
      errors: [{ messageId: 'sqlStringConcat' }],
    },
  ],
});
