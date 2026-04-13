import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import plugin from '../../src/index';

describe('plugin metadata', () => {
  it('keeps meta.name and meta.version aligned with package.json', () => {
    const pkgPath = path.join(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
      name: string;
      version: string;
    };

    expect(plugin.meta.name).toBe(pkg.name);
    expect(plugin.meta.version).toBe(pkg.version);
  });
});
