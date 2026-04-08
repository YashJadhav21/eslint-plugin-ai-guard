import { noEmptyCatch } from './error-handling/no-empty-catch';
import { noAsyncArrayCallback } from './async/no-async-array-callback';
import { noFloatingPromise } from './async/no-floating-promise';

/**
 * All rules exported by the plugin.
 * Each key is the rule name (without the plugin prefix).
 */
export const allRules = {
  'no-empty-catch': noEmptyCatch,
  'no-async-array-callback': noAsyncArrayCallback,
  'no-floating-promise': noFloatingPromise,
} as const;

export type RuleKey = keyof typeof allRules;
