# Changelog

All notable changes to this project are documented here, following the Keep a Changelog format and semantic versioning.

## [Unreleased]

### Fixed

- Rendered Markdown code blocks now show syntax-highlight colours without a CodeMirror editor open. The token spans were always generated with the correct highlight classes (e.g. `ͼs`), but the CodeMirror highlight `StyleModule` that colours those classes is mounted only when an `EditorView` is created - so with only Markdown previews open the spans inherited the plain code colour and looked unhighlighted. The extension now mounts that StyleModule's rules at startup via `injectHighlightRules`; colours resolve through `--jp-mirror-editor-*-color` variables and track the active theme

### Changed

- Replace the previous `MutationObserver` re-highlight and language-chunk warming approach - which targeted a missing-spans cache miss that did not occur in practice - with the single `injectHighlightRules` fix above, removing the per-render DOM observer and its retry machinery

<!-- <START NEW CHANGELOG ENTRY> -->

## [0.6.9] - 2026-06-23

### Added

- Recover syntax highlighting on rendered Markdown fenced code blocks that render plain when JupyterLab's async highlighter fails - a cold or flaky CodeMirror language-chunk import, or a language registry not yet wired when an early render fires
- `MutationObserver`-based detection over the application shell, re-running the highlight through `IEditorLanguageRegistry` with a bounded, backed-off retry; idempotent per block and content-safe (spans are swapped in only when the highlighted text round-trips exactly, so it never truncates)
- jest unit tests for the detection helpers and a Galata integration test covering activation and recovery

<!-- <END NEW CHANGELOG ENTRY> -->
