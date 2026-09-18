import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('platform metadata covers every supported host', () => {
  const out = execFileSync('node', ['scripts/validate-platform-metadata.mjs'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.match(out, /valid/);
});
