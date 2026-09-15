// Tests for the `gdscript-nonexistent-api` rule in scripts/validate-skills.mjs.
//
// Issue #17: gdscript-advanced shipped `await Signal.any([...])` from v1.7.0 onward. The API has
// never existed in a released Godot, so the example failed to parse for every reader. The rule is
// a denylist of APIs we have already caught being invented, and it is an ERROR — a code example
// that cannot compile must block a release tag.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runValidator } from './run-validator.mjs';

const gd = code => `\`\`\`gdscript\n${code}\n\`\`\``;
const cs = code => `\`\`\`csharp\n${code}\n\`\`\``;

test('Signal.any() in a SKILL.md GDScript block is an error and fails the run', () => {
  const { stdout, code } = runValidator({
    skillBody: `## Async\n\n${gd('var winner := await Signal.any([a.done, timer.timeout])')}`,
  });
  assert.match(stdout, /gdscript-nonexistent-api/);
  assert.match(stdout, /Signal\.any/);
  assert.equal(code, 1);
});

// Pattern X moves examples into references/, so the rule must follow them there.
test('Signal.all() in a reference GDScript block is an error', () => {
  const { stdout, code } = runValidator({
    referenceBody: `## Async\n\n${gd('await Signal.all([a.done, b.done])')}`,
  });
  assert.match(stdout, /gdscript-nonexistent-api/);
  assert.match(stdout, /references\/topic\.md/);
  assert.equal(code, 1);
});

test('ToSignal() in a GDScript block is an error', () => {
  const { stdout, code } = runValidator({
    skillBody: `## Await\n\n${gd('await ToSignal(timer, "timeout")')}`,
  });
  assert.match(stdout, /gdscript-nonexistent-api/);
  assert.match(stdout, /ToSignal/);
  assert.equal(code, 1);
});

test('ToSignal() in a C# block is correct usage and not flagged', () => {
  const { stdout, code } = runValidator({
    skillBody: `## Await\n\n${gd('await timer.timeout')}\n\n${cs('await ToSignal(timer, Timer.SignalName.Timeout);')}`,
  });
  assert.doesNotMatch(stdout, /gdscript-nonexistent-api/);
  assert.equal(code, 0);
});

// Saying the API does not exist is exactly the guidance that stops an agent reaching for it.
test('naming a denylisted API in prose is allowed', () => {
  const { stdout, code } = runValidator({
    skillBody: `## Async\n\nThere is no \`Signal.any()\` in released Godot — see the race below.\n\n${gd('await timer.timeout')}`,
  });
  assert.doesNotMatch(stdout, /gdscript-nonexistent-api/);
  assert.equal(code, 0);
});
