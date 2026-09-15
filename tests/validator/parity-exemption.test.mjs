// Tests for the per-section C#-parity exemption marker in scripts/validate-skills.mjs.
//
// This rule can FAIL CI: a marker with no reason is recorded as an error, and the validator exits
// non-zero on any error, which blocks the release workflow. It had no coverage at all when it
// landed, so these drive the real script over fixture skills in a temp directory rather than
// re-implementing the regex.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runValidator, GD, CS } from './run-validator.mjs';

const MARKER = reason => `<!-- csharp-parity: n/a — ${reason} -->`;

test('a reasoned marker suppresses the missing-C# warning in a reference', () => {
  const { stdout, code } = runValidator({
    referenceBody: `## Only GDScript\n\n${MARKER('no C# counterpart exists')}\n\n${GD}`,
  });
  assert.doesNotMatch(stdout, /csharp-parity-missing-reference/);
  assert.match(stdout, /GDScript-only by design: no C# counterpart exists/);
  assert.equal(code, 0);
});

test('a reasoned marker also works in SKILL.md, as CLAUDE.md documents', () => {
  const { stdout } = runValidator({
    skillBody: `## Only GDScript\n\n${MARKER('GDScript-specific idiom')}\n\n${GD}`,
  });
  assert.doesNotMatch(stdout, /csharp-parity-missing\b/);
  assert.match(stdout, /GDScript-only by design: GDScript-specific idiom/);
});

test('a marker with no reason is an error and fails the run', () => {
  for (const bad of ['<!-- csharp-parity: n/a -->', '<!-- csharp-parity: n/a — -->', '<!-- csharp-parity: n/a-->']) {
    const { stdout, code } = runValidator({ referenceBody: `## S\n\n${bad}\n\n${GD}` });
    assert.match(stdout, /csharp-parity-exempt-no-reason/, `expected an error for ${bad}`);
    assert.equal(code, 1, `validator must exit non-zero for ${bad}`);
  }
});

// Otherwise a reasonless marker lurks on a section that has C# today and only breaks CI later,
// when someone edits that section.
test('a reasonless marker is caught even when the section already has C#', () => {
  const { stdout, code } = runValidator({
    referenceBody: `## Has both\n\n<!-- csharp-parity: n/a -->\n\n${GD}\n\n${CS}`,
  });
  assert.match(stdout, /csharp-parity-exempt-no-reason/);
  assert.equal(code, 1);
});

test('a reason may contain > and < without breaking the match', () => {
  const { stdout, code } = runValidator({
    referenceBody: `## S\n\n<!-- csharp-parity: n/a — depth > 4 per <Control> docs -->\n\n${GD}`,
  });
  assert.match(stdout, /GDScript-only by design: depth > 4 per <Control> docs/);
  assert.equal(code, 0);
});

// A reference that documents the marker must not exempt itself — same self-reference trap the
// card rules guard against.
test('a marker inside a fenced code block does not exempt the section', () => {
  const { stdout } = runValidator({
    referenceBody: `## S\n\nHow to write one:\n\n\`\`\`markdown\n${MARKER('example only')}\n\`\`\`\n\n${GD}`,
  });
  assert.match(stdout, /csharp-parity-missing-reference/);
  assert.doesNotMatch(stdout, /GDScript-only by design: example only/);
});

test('"n/away" is not read as an exemption', () => {
  const { stdout } = runValidator({
    referenceBody: `## S\n\n<!-- csharp-parity: n/away — sneaky -->\n\n${GD}`,
  });
  assert.match(stdout, /csharp-parity-missing-reference/);
});

test('an unmarked GDScript-only section still warns', () => {
  const { stdout, code } = runValidator({ referenceBody: `## S\n\n${GD}` });
  assert.match(stdout, /csharp-parity-missing-reference/);
  assert.equal(code, 0, 'parity gaps are warnings, never errors');
});
