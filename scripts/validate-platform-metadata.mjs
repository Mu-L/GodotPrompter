#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const MATRIX_PATH = join(ROOT, 'tests', 'agent-integration', 'host-smoke-matrix.json');
const EXPECTED_HOSTS = [
  'Claude Code',
  'GitHub Copilot CLI',
  'Cursor',
  'Codex',
  'Antigravity',
  'OpenCode',
  'Grok Build',
];

const matrix = JSON.parse(readFileSync(MATRIX_PATH, 'utf8'));
if (!Array.isArray(matrix.hosts)) {
  console.error('host-smoke-matrix.json must contain a hosts array.');
  process.exit(1);
}

const names = matrix.hosts.map(host => host.name);
const missing = EXPECTED_HOSTS.filter(name => !names.includes(name));
const extra = names.filter(name => !EXPECTED_HOSTS.includes(name));
if (missing.length || extra.length) {
  if (missing.length) console.error(`Missing hosts: ${missing.join(', ')}`);
  if (extra.length) console.error(`Unexpected hosts: ${extra.join(', ')}`);
  process.exit(1);
}

for (const host of matrix.hosts) {
  for (const key of ['name', 'install', 'instructionsPath', 'status', 'verificationDoc', 'discoverability']) {
    if (!host[key]) {
      console.error(`${host.name}: missing required key ${key}`);
      process.exit(1);
    }
  }

  if (!Array.isArray(host.checks) || host.checks.length === 0) {
    console.error(`${host.name}: checks must be a non-empty array`);
    process.exit(1);
  }

  for (const check of host.checks) {
    for (const key of ['id', 'goal', 'prompt', 'expected']) {
      if (!check[key]) {
        console.error(`${host.name}: check missing ${key}`);
        process.exit(1);
      }
    }
  }

  const filePath = join(ROOT, host.verificationDoc);
  if (!existsSync(filePath)) {
    console.error(`${host.name}: referenced file does not exist: ${host.verificationDoc}`);
    process.exit(1);
  }
}

console.log('Platform metadata is valid.');
