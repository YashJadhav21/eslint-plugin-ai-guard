import { describe, it, expect } from 'vitest';
import { runEslint } from '../../cli/utils/eslint-runner';

describe('cli eslint-runner errors', () => {
  it('throws a clear error when target path does not exist', async () => {
    await expect(
      runEslint({
        preset: 'recommended',
        targetPath: 'definitely-does-not-exist-12345.js',
      }),
    ).rejects.toThrow('Path not found: definitely-does-not-exist-12345.js');
  });
});
