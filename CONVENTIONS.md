<!--
CONVENTIONS.md — vendor entry point that delegates to AGENTS.md.
-->

# 📐 CONVENTIONS.md

The authoritative rulebook for every AI coding assistant in this repository
is [`AGENTS.md`](AGENTS.md). Please read it first.

## ⚡ Critical conventions (mirrored from AGENTS.md)

1. **Agents never `git commit` / `git push`.** Append a row to
   [`docs/tracking/tracking.csv`](docs/tracking/tracking.csv) via
   [`xops/agent/tracking_append.sh`](xops/agent/tracking_append.sh) with
   `action=commit, status=completed, commit_sha=pending`, then `git add -A`,
   then stop. The human runs `make git`.

2. **Conventional Commits** in every tracking-row `summary`:
   `type(scope): description`. Valid types: `feat, fix, docs, style,
   refactor, perf, test, chore, ci, build, revert`.

3. **Tests move with code** in the same commit. No `@Skip` / `skip:` /
   `xit(` / deleted assertions to make a gate green.

4. **System-level changes** (`apt`, `systemctl`, global git config, …)
   require explicit per-occurrence confirmation. Inside the workspace, act
   freely.

5. **Read session state** before starting work:
   [`xops/agent/session-bootstrap.sh`](xops/agent/session-bootstrap.sh) →
   surfaces any unresolved `last_failure.json` from a prior session.

6. **Project plan** lives at [`docs/planning/ROADMAP.md`](docs/planning/ROADMAP.md).
   Do not silently re-plan.

7. **Curated skills** at [`.agents/skills/`](.agents/skills/). Load the relevant
   skill before the matching work.

8. **Silmarillion design**: for planning, art, narrative, maps, assets, UI/UX,
   review or verification, load
   [`silmarillion-art-direction`](.agents/skills/silmarillion-art-direction/SKILL.md)
   and its task-specific resources. All clients follow this explicit route.

For the full ruleset (security, communication, model-specific notes), read
[`AGENTS.md`](AGENTS.md).
