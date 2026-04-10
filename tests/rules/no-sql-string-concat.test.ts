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
    // 2. Static SQL string (no interpolation)
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
    // 6. ORM-style query (no raw SQL)
    {
      code: `const user = await User.findOne({ email });`,
    },
    // 7. Static SQL in concatenation (both sides static)
    {
      code: `const query = 'SELECT * FROM ' + 'users';`,
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
  ],
  invalid: [
    // 1. Template literal SQL injection
    {
      code: 'const query = `SELECT * FROM users WHERE id = ${userId}`;',
      errors: [{ messageId: 'sqlStringConcat' }],
    },
    // 2. String concat SQL injection
    {
      code: `const query = 'SELECT * FROM users WHERE id = ' + userId;`,
      errors: [{ messageId: 'sqlStringConcat' }],
    },
    // 3. INSERT with template literal
    {
      code: 'const query = `INSERT INTO users (name) VALUES (${name})`;',
      errors: [{ messageId: 'sqlStringConcat' }],
    },
    // 4. UPDATE with template literal
    {
      code: 'const query = `UPDATE users SET name = ${name} WHERE id = ${id}`;',
      errors: [{ messageId: 'sqlStringConcat' }],
    },
    // 5. DELETE with template literal
    {
      code: 'const query = `DELETE FROM users WHERE id = ${userId}`;',
      errors: [{ messageId: 'sqlStringConcat' }],
    },
    // 6. Complex SQL with multiple interpolations
    {
      code: 'const query = `SELECT * FROM ${table} WHERE ${column} = ${value}`;',
      errors: [{ messageId: 'sqlStringConcat' }],
    },
    // 7. DROP TABLE with interpolation
    {
      code: 'const query = `DROP TABLE ${tableName}`;',
      errors: [{ messageId: 'sqlStringConcat' }],
    },
    // 8. WHERE clause with string concat
    {
      code: `const query = "SELECT * FROM orders WHERE customer = '" + customerId + "'";`,
      errors: [{ messageId: 'sqlStringConcat' }],
    },
    // 9. EXEC with dynamic input
    {
      code: 'const query = `EXEC sp_executesql ${dynamicSql}`;',
      errors: [{ messageId: 'sqlStringConcat' }],
    },
    // 10. JOIN with template literal
    {
      code: 'const query = `SELECT u.* FROM users u JOIN orders o ON u.id = ${userId}`;',
      errors: [{ messageId: 'sqlStringConcat' }],
    },
  ],
});
