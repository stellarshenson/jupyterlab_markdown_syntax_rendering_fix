<!-- @import /home/lab/.claude/CLAUDE.md -->

# Project-Specific Configuration

This file imports workspace-level configuration from `/home/lab/.claude/CLAUDE.md` (user home).
All workspace rules apply. Project-specific rules below strengthen or extend them.

The `/home/lab/.claude/` directory contains additional instruction files and skills referenced
by that CLAUDE.md. Consult it to discover all applicable standards.

## Mandatory Bans (Reinforced)

The following workspace rules are STRICTLY ENFORCED for this project:

- **No automatic git tags** - only create tags when user explicitly requests
- **No automatic version changes** - only modify version in package.json/pyproject.toml/etc. when user explicitly requests
- **No automatic publishing** - never run `make publish`, `npm publish`, `twine upload`, or similar without explicit user request
- **No manual package installs if Makefile exists** - use `make install` or equivalent Makefile targets, not direct `pip install`/`uv install`/`npm install`
- **No automatic git commits or pushes** - only when user explicitly requests

## Project Context

JupyterLab 4 frontend extension (`kind: frontend`, copier template `jupyterlab/extension-template` v4.6.2).
Single TypeScript plugin at `src/index.ts`, no Python server component.

**Purpose**: Fix the intermittent loss of syntax highlighting in rendered Markdown fenced code blocks.

**Root cause** (reconstructed from the shipped JupyterLab 4.6 `jlab_core` bundle): `marked` runs in async
mode. An async highlighter (`g`) writes a `lang|text` cache by awaiting `registry.highlight(...)`, which lazily
dynamic-imports the CodeMirror language chunk. The synchronous code renderer reads that cache and, on any miss,
falls back to a plain uncoloured `<pre><code>`. A miss occurs whenever the async highlight threw - the language
chunk's lazy `spec.load()` import rejected (chunk-load flake/timeout, often behind the JupyterHub proxy) or the
language registry was not yet wired when an early render fired. The `catch` swallows the error
(`console.error("Failed to highlight ...")`), the cache stays empty, and the renderer ships plain text. The
failure is independent of mermaid - it reproduces on bash/python/json fences with zero mermaid present.

**Implication for the fix**: the durable fix is to retry or re-run the highlight after the language chunk loads;
the only built-in workaround is re-rendering (reload tab / reopen preview) once chunks are warm.

## Journal Rules (Project-Specific)

- **APPEND ONLY**: New journal entries MUST be appended at the end of the file, never inserted between existing entries
- Entries maintain strict chronological order by position - the last entry in the file is always the most recent work
- Never reorder, move, or insert entries out of sequence
- The Stellars **journal plugin** is the canonical tool for this file: create via `/journal:create`, append via `/journal:update`, archive via `/journal:archive`. The `journal:journal` skill auto-triggers on any mention of "journal" and runs `journal-tools check` after every write
- Direct edits to `JOURNAL.md` are a last resort - prefer the plugin so modus secundis format, continuous numbering and append-only order are enforced automatically

## Required Workspace Skills

These skills MUST be consulted when working on this project (located at `/home/lab/.claude/skills/`, invocable by name):

- **jupyterlab-extension** (`/home/lab/.claude/skills/jupyterlab-extension/SKILL.md`) - extension development guidelines, testing strategy, jupyter-releaser CI/CD workflows, common caveats, TypeScript compatibility, syntax highlighting
- **playwright** (`/home/lab/.claude/skills/playwright/SKILL.md`) - browser automation for screenshots and UI verification, serving local files, connecting to authenticated JupyterHub

## Strengthened Rules

- **Install with `make install`** - all package install/build goes through the Makefile (`make install`, `make build`, `make test`). Never run `pip install`, `jlpm install`, `jlpm build`, `npm install` directly while a Makefile target exists
- **Always track `package.json` and `package-lock.json`** - both files are committed artefacts; never gitignore or omit `package-lock.json`, and stage both whenever dependencies change
- **Keep the Makefile current** - before any build/release work, compare the version header of the local `Makefile` (line 1, currently `version 1.32`) against the canonical `/home/lab/workspace/private/jupyterlab/@utils/jupyterlab-extensions/Makefile`. As soon as the canonical file is a newer version, replace the local `Makefile` with it
