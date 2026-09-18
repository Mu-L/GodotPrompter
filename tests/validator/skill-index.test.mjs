import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('skill index is current', () => {
  const out = execFileSync('node', ['scripts/generate-skill-index.mjs', '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.match(out, /up to date/);
});
