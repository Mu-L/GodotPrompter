// Shared harness for the validator tests: drives the real scripts/validate-skills.mjs over a
// throwaway fixture repo rather than re-implementing its regexes.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCRIPT = join(ROOT, 'scripts', 'validate-skills.mjs');

export const GD = '```gdscript\nvar x := 1\n```';
export const CS = '```csharp\nint x = 1;\n```';

// Build a throwaway repo with one skill, run the real validator against it, return its output.
// The validator resolves paths from its own location, so the fixture mirrors the repo layout and
// the script is copied in beside a scripts/ dir.
// CARD_SPECS hard-codes two skill names and errors if they are absent, so the fixture repo has to
// carry stubs for them or every run exits 1 for reasons unrelated to the rule under test.
function writeCardStub(dir, name, marker) {
  const d = join(dir, 'skills', name);
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'SKILL.md'), [
    '---', `name: ${name}`, `description: Use when stubbing ${name} for validator tests.`, '---',
    '', `# ${name}`, '', '**Related skills:** none.', '',
    '## Card', '', `<!-- ${marker}-START -->`, `Stub ${marker} region.`, `<!-- ${marker}-END -->`,
    '', '## Checklist', '', '- [ ] done', '',
  ].join('\n'));
}

export function runValidator({ skillBody = '', referenceBody = null }) {
  const dir = mkdtempSync(join(tmpdir(), 'gp-val-'));
  const skillDir = join(dir, 'skills', 'fixture-skill');
  mkdirSync(skillDir, { recursive: true });
  mkdirSync(join(dir, 'scripts'), { recursive: true });
  cpSync(SCRIPT, join(dir, 'scripts', 'validate-skills.mjs'));
  writeCardStub(dir, 'using-godot-prompter', 'SESSION-CARD');
  writeCardStub(dir, 'godot-mentor', 'MENTOR-CARD');

  writeFileSync(join(skillDir, 'SKILL.md'), [
    '---', 'name: fixture-skill', 'description: Use when testing the validator — fixture.', '---',
    '', '# Fixture Skill', '', '**Related skills:** none.', '',
    skillBody, '', '## Checklist', '', '- [ ] done', '',
  ].join('\n'));

  if (referenceBody !== null) {
    mkdirSync(join(skillDir, 'references'), { recursive: true });
    writeFileSync(join(skillDir, 'references', 'topic.md'), `# Topic\n\n${referenceBody}\n`);
    // Linked from SKILL.md, or orphan-reference fires and muddies the output.
    writeFileSync(join(skillDir, 'SKILL.md'), [
      '---', 'name: fixture-skill', 'description: Use when testing the validator — fixture.', '---',
      '', '# Fixture Skill', '', '**Related skills:** none.', '',
      'See [Topic](references/topic.md).', '', skillBody, '', '## Checklist', '', '- [ ] done', '',
    ].join('\n'));
  }

  let stdout = '';
  let code = 0;
  try {
    stdout = execFileSync(process.execPath, [join(dir, 'scripts', 'validate-skills.mjs')],
      { cwd: dir, encoding: 'utf8' });
  } catch (e) {
    stdout = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    code = e.status ?? 1;
  }
  rmSync(dir, { recursive: true, force: true });
  return { stdout, code };
}
