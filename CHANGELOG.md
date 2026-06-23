# Changelog

All notable changes to this project are documented here, following the Keep a Changelog format and semantic versioning.

<!-- <START NEW CHANGELOG ENTRY> -->

## [0.6.9] - 2026-06-23

### Added

- Recover syntax highlighting on rendered Markdown fenced code blocks that render plain when JupyterLab's async highlighter fails - a cold or flaky CodeMirror language-chunk import, or a language registry not yet wired when an early render fires
- `MutationObserver`-based detection over the application shell, re-running the highlight through `IEditorLanguageRegistry` with a bounded, backed-off retry; idempotent per block and content-safe (spans are swapped in only when the highlighted text round-trips exactly, so it never truncates)
- jest unit tests for the detection helpers and a Galata integration test covering activation and recovery

<!-- <END NEW CHANGELOG ENTRY> -->
