import { noEmptyCatch } from './error-handling/no-empty-catch';
import { noBroadException } from './error-handling/no-broad-exception';
import { noCatchLogRethrow } from './error-handling/no-catch-log-rethrow';
import { noCatchWithoutUse } from './error-handling/no-catch-without-use';
import { noAsyncArrayCallback } from './async/no-async-array-callback';
import { noFloatingPromise } from './async/no-floating-promise';
import { noAwaitInLoop } from './async/no-await-in-loop';
import { noAsyncWithoutAwait } from './async/no-async-without-await';
import { noRedundantAwait } from './async/no-redundant-await';
import { noHardcodedSecret } from './security/no-hardcoded-secret';
import { noEvalDynamic } from './security/no-eval-dynamic';
import { noSqlStringConcat } from './security/no-sql-string-concat';
import { noUnsafeDeserialize } from './security/no-unsafe-deserialize';
import { requireAuthMiddleware } from './security/require-auth-middleware';
import { requireAuthzCheck } from './security/require-authz-check';
import { noConsoleInHandler } from './quality/no-console-in-handler';
import { noDuplicateLogicBlock } from './logic/no-duplicate-logic-block';

/**
 * All rules exported by the plugin.
 * Each key is the rule name (without the plugin prefix).
 */
export const allRules = {
  'no-empty-catch': noEmptyCatch,
  'no-broad-exception': noBroadException,
  'no-catch-log-rethrow': noCatchLogRethrow,
  'no-catch-without-use': noCatchWithoutUse,
  'no-async-array-callback': noAsyncArrayCallback,
  'no-floating-promise': noFloatingPromise,
  'no-await-in-loop': noAwaitInLoop,
  'no-async-without-await': noAsyncWithoutAwait,
  'no-redundant-await': noRedundantAwait,
  'no-hardcoded-secret': noHardcodedSecret,
  'no-eval-dynamic': noEvalDynamic,
  'no-sql-string-concat': noSqlStringConcat,
  'no-unsafe-deserialize': noUnsafeDeserialize,
  'require-auth-middleware': requireAuthMiddleware,
  'require-authz-check': requireAuthzCheck,
  'no-console-in-handler': noConsoleInHandler,
  'no-duplicate-logic-block': noDuplicateLogicBlock,
} as const;

export type RuleKey = keyof typeof allRules;
