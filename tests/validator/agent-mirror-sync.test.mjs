import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('Codex agent mirrors are synced from Markdown sources', () => {
  const out = execFileSync('node', ['scripts/sync-codex-agents.mjs', '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.match(out, /in sync/);
});
