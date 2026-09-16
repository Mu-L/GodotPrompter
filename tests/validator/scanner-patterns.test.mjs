// Tests for the `scanner-risky-approval` rule in scripts/validate-skills.mjs.
//
// .github/workflows/plugin-scan.yml runs the HOL plugin-scanner, which marks a file as a "risky
// approval or sandbox default" whenever its text matches one of three patterns, even in a comment
// or in prose. The scan only runs after a push, and release.yml does not wait for it. This rule
// finds the same matches locally, before a push, so it must look at the same files the scanner does.
//
// The literal strings below are safe here: the scanner reads only .md/.json/.toml/.yml/.yaml files.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runValidator, SKILL_BODY_FIRST_LINE } from './run-validator.mjs';

const RULE = /scanner-risky-approval/;

// One sample per scanner pattern: the full-access sandbox mode, a never-ask approval policy, and a
// bypass approval mode.
const SAMPLES = [
  'sandbox_mode = "danger-full-access"',
  'approval_policy = "never"',
  '"approvalMode": "bypass"',
];

for (const sample of SAMPLES) {
  test(`${sample} in a SKILL.md is an error naming the file and line`, () => {
    const { stdout, code } = runValidator({ skillBody: `## Config\n\n${sample}` });
    const hitLine = SKILL_BODY_FIRST_LINE + 2;
    assert.match(stdout, new RegExp(`scanner-risky-approval\\] skills/fixture-skill/SKILL\\.md: line ${hitLine}:`));
    assert.equal(code, 1);
  });
}

// The scanner walks the whole repository, not only skills/ and agents/.
for (const path of ['.codex/agents/x.toml', 'docs/notes.md', 'config/settings.json', '.github/workflows/ci.yml', 'deploy/app.yaml']) {
  test(`a match in ${path} is an error`, () => {
    const { stdout, code } = runValidator({ files: { [path]: `# approval_policy = "never"\n` } });
    assert.match(stdout, RULE);
    assert.match(stdout, new RegExp(path.replace(/\./g, '\\.')));
    assert.equal(code, 1);
  });
}

// Scanning every extension would flag scripts/validate-skills.mjs itself, whose regexes spell the
// patterns out.
test('files the scanner does not read are not flagged', () => {
  const { stdout, code } = runValidator({
    files: { 'scripts/tool.mjs': '// sandbox "danger-full-access"\n', 'notes.txt': 'approval_policy = "never"\n' },
  });
  assert.doesNotMatch(stdout, RULE);
  assert.equal(code, 0);
});

test('directories the scanner skips are not flagged', () => {
  const { stdout, code } = runValidator({
    files: { 'node_modules/pkg/README.md': 'sandbox "danger-full-access"\n', 'dist/out.json': '{"approvalMode": "bypass"}\n' },
  });
  assert.doesNotMatch(stdout, RULE);
  assert.equal(code, 0);
});

// The scanner matches the two approval patterns case-insensitively.
test('the approval policy pattern ignores case', () => {
  const { stdout, code } = runValidator({ files: { 'docs/notes.md': 'APPROVAL_POLICY: "Never"\n' } });
  assert.match(stdout, RULE);
  assert.equal(code, 1);
});

// The scanner matches against the whole file, and its `\s*` crosses line breaks, so a YAML value on
// the next line still counts.
test('a match spanning a line break is an error reported at its first line', () => {
  const { stdout, code } = runValidator({ files: { 'deploy/app.yaml': 'name: app\napproval_policy:\n  "never"\n' } });
  assert.match(stdout, /scanner-risky-approval\] deploy\/app\.yaml: line 2:/);
  assert.equal(code, 1);
});

// CI scans a fresh clone. Ignored local files (agent notes, settings.local.json) never reach it.
test('in a git work tree, an ignored file is not flagged', () => {
  const { stdout, code } = runValidator({
    git: true,
    files: { '.gitignore': 'scratch/\n', 'scratch/brief.md': 'approval_policy = "never"\n' },
  });
  assert.doesNotMatch(stdout, RULE);
  assert.equal(code, 0);
});

// A file written but not yet `git add`ed is the usual case when validating before a commit.
test('in a git work tree, an untracked file that is not ignored is flagged', () => {
  const { stdout, code } = runValidator({
    git: true,
    files: { '.gitignore': 'scratch/\n', 'docs/new-note.md': 'approval_policy = "never"\n' },
  });
  assert.match(stdout, /scanner-risky-approval\] docs\/new-note\.md: line 1:/);
  assert.equal(code, 1);
});
