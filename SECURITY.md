# Security Policy

## Supported versions

Only the latest release receives fixes. Update to the newest version before reporting.

| Version | Supported |
| ------- | --------- |
| 1.13.x  | Yes       |
| < 1.13  | No        |

## Scope

GodotPrompter is mostly Markdown, but some of it runs on your machine:

- `hooks/` — the SessionStart hook (`session-start`, `run-hook.cmd`) that runs when a supported
  agent starts a session. It looks for a `project.godot` near the working directory, reads its
  `config/features` line, and reads a per-project state file under `~/.godot-prompter/state/`
  that the agent writes when you opt into mentor mode or decline a setup offer.
- `.opencode/plugins/godot-prompter.js` — the OpenCode plugin entry point.
- Agent definitions and manifests (`agents/`, `.codex/`, `.claude-plugin/`, `.cursor-plugin/`,
  `plugin.json`) that configure how host agents load the skills.

Report a vulnerability if one of these can execute unintended commands, read or write outside
its intended paths, leak data, or weaken the host agent's approval or sandbox settings. The
same goes for a skill that instructs an agent to do something unsafe, such as disabling
safeguards or running untrusted code.

An inaccurate or outdated Godot example is not a security issue; open a regular
[issue](https://github.com/jame581/GodotPrompter/issues) instead.

## Reporting a vulnerability

Please do not open a public issue. Report privately through GitHub:
[Report a vulnerability](https://github.com/jame581/GodotPrompter/security/advisories/new).

Include the affected version, the platform and agent host, reproduction steps, and the impact.
GodotPrompter is maintained by one person, so responses are best-effort. Confirmed issues are
fixed in a patch release and credited in `CHANGELOG.md` unless you prefer otherwise.
