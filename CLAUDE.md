# GodotPrompter — Contributor Guidelines

## Project Overview

This is a **documentation/skills repository**. There is no application build/lint, but `node scripts/validate-skills.mjs` checks SKILL.md frontmatter, cross-references, and structure — `validate.yml` runs it plus `npm test` on every PR and push to `master`, and `release.yml` again on the tag. Otherwise, changes are validated by reading skills, verifying code examples in Godot 4.3+, and running the agent integration tests in `tests/agent-integration/TEST_PLAN.md`.

## Supported Platforms

- Claude Code (primary — tool names are canonical)
- GitHub Copilot CLI
- Antigravity (IDE + `agy` CLI) — succeeds Gemini CLI, which Google retired on 2026-06-18
- Codex
- Cursor
- OpenCode
- Grok Build

## Conventions

- Skills use Claude Code tool names as the canonical reference
- Each platform has a tool mapping file in `skills/using-godot-prompter/references/`
- GDScript follows the [Godot style guide](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_styleguide.html) — snake_case functions/variables, PascalCase classes
- C# follows [Godot C# conventions](https://docs.godotengine.org/en/stable/tutorials/scripting/c_sharp/c_sharp_style_guide.html) — PascalCase methods matching the Godot API
- Target Godot 4.3+ minimum — no deprecated methods

## Repository Rules

The layout is self-evident from `ls`; these constraints are not:

- **SKILL.md size:** keep under 16 KB. `validate-skills.mjs` errors at ≥ 16 KB (fails CI) and warns at ≥ 15.5 KB. Overflow goes in `references/` as load-on-demand deep dives (Pattern X).
- **Two hook directories:** `hooks/` (root) ships to plugin users — the SessionStart routing card. `scripts/hooks/` is repo development tooling wired via `.claude/settings.json`, which runs `validate-skill-on-edit.mjs` after every Edit/Write. Never merge them.
- **Card regions:** `using-godot-prompter` (`SESSION-CARD`) and `godot-mentor` (`MENTOR-CARD`) contain marker-delimited regions the hook injects verbatim. `validate-skills.mjs` enforces markers, uniqueness, non-emptiness, and a 3 KB cap. Edit the region, never a copy — and never paste the marker strings into a fenced example, which trips `card-marker-duplicate`.
- **The hook does not reach subagents.** `SessionStart` fires on startup/resume/clear/compact only. A `## GodotPrompter` section in the project's agent instructions file is what subagents read. The offer to add one probes every file a supported host loads (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.github/copilot-instructions.md`, the rules directories) and is suppressed for good by `"section_offer": "declined"` in the project's `~/.godot-prompter/state/` file — probing one filename nagged agent-agnostic repos forever (#15). The probe is deliberately host-agnostic: a section in *any* of those files silences the offer on *every* host, trading a subagent that may stay uninstructed on a host that does not read that file against nagging a repo that has already documented the rule.
- **Hook changes require `npm run test:hooks`.** `node --test tests/hooks/` does *not* work on Node 24 or later (still true on 26, which CI uses) — a directory argument is imported as a module.
- **`AGENTS.md` / `GEMINI.md`** are root @-imports that re-export `using-godot-prompter` for Codex and Antigravity — edit the skill, not these.
- **Two files are generated — never hand-edit them.** `.codex/agents/godot-prompter/*.toml` comes from `agents/*.md` (`npm run sync:codex-agents`); `skills/index.json` comes from skill/agent frontmatter and Related-skills lines (`npm run build:skill-index`). `npm test` fails if either is stale.
- **`.github/workflows/release.yml`** is tag-triggered: it validates, creates the GitHub release, and opens marketplace PRs.
- **`.github/workflows/plugin-scan.yml`** runs the HOL plugin-scanner (the awesome-ai-plugins listing check) on every push to `master` and every PR, and fails below 80/100. It flags a full-access sandbox mode, a never-ask approval policy, or a bypass approval mode written literally in any `.md`/`.json`/`.toml`/`.yml`/`.yaml` file, comments and this file included (patterns: `RISKY_APPROVAL_PATTERNS` in hol-guard's `checks/security.py`), so describe them rather than quoting them. The validator's `scanner-risky-approval` error catches the same text before a push. Every `uses:` must be pinned to a full commit SHA — Dependabot keeps the pins current.
- **`docs/superpowers/notes/`** holds per-release research notes and the C# parity debt list.

## File formats and releases

- Writing or editing a `SKILL.md` or an agent definition → **authoring-godot-prompter-skills**
- Cutting a release or bumping the version → **releasing-godot-prompter** (full command sequence in `CONTRIBUTING.md`)

## Testing

Before merging skill changes:
1. Verify code examples compile and run in Godot 4.3+
2. Ensure C# parity for every GDScript example (unless language-specific)
3. Run agent integration tests from `tests/agent-integration/TEST_PLAN.md` for significant changes

`node scripts/validate-skills.mjs` already enforces frontmatter, cross-references, the size budget, and C# parity — run it rather than checking those by hand. For parity exemptions (`csharp-parity: n/a` markers) see **authoring-godot-prompter-skills**.

Run `npm test` (hooks + validator + generated-metadata checks) after touching `scripts/validate-skills.mjs` — `tests/validator/` covers the parity marker, including the error path that can fail a release tag.
