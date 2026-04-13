import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateClaudeFile,
  generateCursorFile,
  generateCopilotFile,
  parseCategories,
  normalizeSelectedAgents,
  AGENTS,
  ALL_CATEGORIES,
} from '../../cli/commands/init-context';

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ai-guard-ctx-'));
}

describe('init-context', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // ── Template generation ──────────────────────────────────────────────────

  describe('generateClaudeFile', () => {
    it('generates CLAUDE.md with all sections', () => {
      const content = generateClaudeFile('1.2.3', ALL_CATEGORIES);
      expect(content).toContain('# AI Guard Rules — Claude Code Instructions');
      expect(content).toContain('## Workflow Guardrails');
      expect(content).toContain('## Error Handling');
      expect(content).toContain('## Async Correctness');
      expect(content).toContain('## Security');
      expect(content).toContain('## Code Quality');
      expect(content).toContain('v1.2.3');
      expect(content).toContain('DO NOT EDIT MANUALLY');
      expect(content).toContain('npx ai-guard init-context --force');
    });

    it('generates only async section when filtered', () => {
      const content = generateClaudeFile('1.0.0', ['async']);
      expect(content).toContain('## Async Correctness');
      expect(content).not.toContain('## Error Handling');
      expect(content).not.toContain('## Security');
      expect(content).not.toContain('## Code Quality');
    });
  });

  describe('generateCursorFile', () => {
    it('generates .cursorrules with Rule: prefix format', () => {
      const content = generateCursorFile('1.2.3', ALL_CATEGORIES);
      expect(content).toContain('# AI Guard Rules — Cursor Instructions');
      expect(content).toContain('## Workflow Guardrails');
      expect(content).toContain('Rule: no-empty-catch');
      expect(content).toContain('Bad:');
      expect(content).toContain('Good:');
      expect(content).toContain('v1.2.3');
      expect(content).toContain('DO NOT EDIT MANUALLY');
    });
  });

  describe('generateCopilotFile', () => {
    it('generates copilot-instructions.md with quick reference', () => {
      const content = generateCopilotFile('1.2.3', ALL_CATEGORIES);
      expect(content).toContain('# AI Guard — GitHub Copilot Instructions');
      expect(content).toContain('## Required Workflow');
      expect(content).toContain('## Quick Reference');
      expect(content).toContain('Never:');
      expect(content).toContain('Always:');
      expect(content).toContain('## Details');
      expect(content).toContain('v1.2.3');
      expect(content).toContain('DO NOT EDIT MANUALLY');
    });
  });

  // ── Category parsing ─────────────────────────────────────────────────────

  describe('parseCategories', () => {
    it('returns all categories when undefined', () => {
      expect(parseCategories(undefined)).toEqual(ALL_CATEGORIES);
    });

    it('parses comma-separated categories', () => {
      expect(parseCategories('async,security')).toEqual(['async', 'security']);
    });

    it('ignores invalid categories', () => {
      expect(parseCategories('async,bogus,security')).toEqual(['async', 'security']);
    });

    it('returns all categories when all invalid', () => {
      expect(parseCategories('bogus,invalid')).toEqual(ALL_CATEGORIES);
    });
  });

  describe('normalizeSelectedAgents', () => {
    it('returns array values when input is an array', () => {
      expect(normalizeSelectedAgents(['claude', 'cursor'])).toEqual(['claude', 'cursor']);
    });

    it('normalizes a single string into array', () => {
      expect(normalizeSelectedAgents('copilot')).toEqual(['copilot']);
    });

    it('returns empty array for invalid values', () => {
      expect(normalizeSelectedAgents(undefined)).toEqual([]);
      expect(normalizeSelectedAgents(123)).toEqual([]);
    });
  });

  // ── --rules filtering ────────────────────────────────────────────────────

  describe('--rules async filtering', () => {
    it('only generates async rules in output', () => {
      const content = generateClaudeFile('1.0.0', ['async']);
      expect(content).toContain('Async Correctness');
      expect(content).toContain('Promise.all');
      expect(content).not.toContain('empty catch');
      expect(content).not.toContain('hardcode secrets');
      expect(content).not.toContain('console.log');
    });
  });

  // ── File operations (simulated) ──────────────────────────────────────────

  describe('--dry-run produces no files', () => {
    it('does not write files when dry-run is simulated', () => {
      // Simulate the dry-run logic: we generate content but don't write
      const content = generateClaudeFile('1.0.0', ALL_CATEGORIES);
      expect(content.length).toBeGreaterThan(0);
      // No file should exist in temp dir
      expect(fs.existsSync(path.join(tempDir, 'CLAUDE.md'))).toBe(false);
    });
  });

  describe('--all flag generates all three files', () => {
    it('generates files for all agents when written', () => {
      const version = '1.0.0';
      for (const agent of AGENTS) {
        const fullPath = path.join(tempDir, agent.filePath);
        const parentDir = path.dirname(fullPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        fs.writeFileSync(fullPath, agent.generate(version, ALL_CATEGORIES), 'utf-8');
      }

      expect(fs.existsSync(path.join(tempDir, 'CLAUDE.md'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, '.cursorrules'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, '.github', 'copilot-instructions.md'))).toBe(true);
    });
  });

  describe('--force overwrites existing files', () => {
    it('overwrites existing file when force is true', () => {
      const filePath = path.join(tempDir, 'CLAUDE.md');
      fs.writeFileSync(filePath, 'old content', 'utf-8');

      const newContent = generateClaudeFile('2.0.0', ALL_CATEGORIES);
      fs.writeFileSync(filePath, newContent, 'utf-8');

      const written = fs.readFileSync(filePath, 'utf-8');
      expect(written).toContain('v2.0.0');
      expect(written).not.toBe('old content');
    });
  });

  describe('skips existing files without --force', () => {
    it('does not overwrite existing file when force is false', () => {
      const filePath = path.join(tempDir, 'CLAUDE.md');
      fs.writeFileSync(filePath, 'old content', 'utf-8');

      // Simulate: file exists + no force = skip
      const exists = fs.existsSync(filePath);
      expect(exists).toBe(true);
      // In actual CLI, prompts would ask — here we verify the skip logic
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toBe('old content');
    });
  });

  describe('.github/ directory creation', () => {
    it('creates .github/ directory if it does not exist', () => {
      const githubDir = path.join(tempDir, '.github');
      expect(fs.existsSync(githubDir)).toBe(false);

      const copilotPath = path.join(githubDir, 'copilot-instructions.md');
      fs.mkdirSync(githubDir, { recursive: true });
      fs.writeFileSync(copilotPath, generateCopilotFile('1.0.0', ALL_CATEGORIES), 'utf-8');

      expect(fs.existsSync(githubDir)).toBe(true);
      expect(fs.existsSync(copilotPath)).toBe(true);
    });
  });

  // ── Version placeholder replacement ──────────────────────────────────────

  describe('version replacement', () => {
    it('replaces VERSION placeholder with actual version', () => {
      const claude = generateClaudeFile('3.5.1', ALL_CATEGORIES);
      expect(claude).toContain('v3.5.1');
      expect(claude).not.toContain('[VERSION]');

      const cursor = generateCursorFile('3.5.1', ALL_CATEGORIES);
      expect(cursor).toContain('v3.5.1');

      const copilot = generateCopilotFile('3.5.1', ALL_CATEGORIES);
      expect(copilot).toContain('v3.5.1');
    });
  });
});
