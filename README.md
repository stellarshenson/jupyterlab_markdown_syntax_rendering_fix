# jupyterlab_markdown_syntax_rendering_fix

[![GitHub Actions](https://github.com/stellarshenson/jupyterlab_markdown_syntax_rendering_fix/actions/workflows/build.yml/badge.svg)](https://github.com/stellarshenson/jupyterlab_markdown_syntax_rendering_fix/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/jupyterlab_markdown_syntax_rendering_fix.svg)](https://www.npmjs.com/package/jupyterlab_markdown_syntax_rendering_fix)
[![PyPI version](https://img.shields.io/pypi/v/jupyterlab-markdown-syntax-rendering-fix.svg)](https://pypi.org/project/jupyterlab-markdown-syntax-rendering-fix/)
[![Total PyPI downloads](https://static.pepy.tech/badge/jupyterlab-markdown-syntax-rendering-fix)](https://pepy.tech/project/jupyterlab-markdown-syntax-rendering-fix)
[![JupyterLab 4](https://img.shields.io/badge/JupyterLab-4-orange.svg)](https://jupyterlab.readthedocs.io/en/stable/)
[![Brought To You By KOLOMOLO](https://img.shields.io/badge/Brought%20To%20You%20By-KOLOMOLO-00ffff?style=flat)](https://kolomolo.com)
[![Donate PayPal](https://img.shields.io/badge/Donate-PayPal-blue?style=flat)](https://www.paypal.com/donate/?hosted_button_id=B4KPBJDLLXTSA)

JupyterLab 4.x extension that restores syntax-highlight colours in rendered Markdown fenced code blocks when no CodeMirror editor is open.

> [!WARNING]
> This extension is a temporary fix for a JupyterLab 4.x behaviour where rendered Markdown code highlighting depends on a CodeMirror editor having been opened. Once JupyterLab core mounts the highlight style for the Markdown renderer independently, this extension will be obsolete and should not be installed.

## The Problem

Fenced code blocks in rendered Markdown (the Markdown Preview, README files, `.md` documents) appear in a single flat colour instead of syntax-highlighted, even though the highlighter clearly ran.

**Symptoms**:
- bash, python, json and other fenced blocks render in one uniform grey, not coloured tokens
- Opening the same file in the editor, then returning to the preview, makes the colours appear - and they stay for the rest of the session
- Affects any rendered Markdown when the session has not yet opened a CodeMirror editor (notebook cell, file editor, console)

**Root cause - the highlight StyleModule is never mounted**:
- JupyterLab's Markdown renderer highlights code through `@jupyterlab/codemirror`, producing token `<span>`s with CodeMirror's generated highlight classes (e.g. `ͼs`, `ͼ11`)
- Those class names are emitted by a CodeMirror `StyleModule`, and the CSS that gives them colour is mounted only when an `EditorView` is instantiated (via `syntaxHighlighting(jupyterHighlightStyle)`)
- With only Markdown previews open, no `EditorView` exists, so the StyleModule is never mounted - the spans carry the right classes but no colour rule, and inherit the plain code text colour
- Opening any editor mounts the StyleModule document-wide, which is why the workaround of opening the file in the editor fixes the preview

## The Fix

The extension mounts the highlight StyleModule's CSS once at startup, achieving the same effect as opening an editor - without one.

**How it works**:
- On activation, reads the rules from `jupyterHighlightStyle.module` (the same StyleModule the Markdown renderer's spans reference) via `getRules()`
- Injects them into a single `<style>` element in the document head, so every rendered Markdown code block is coloured immediately
- Colours are expressed as `--jp-mirror-editor-*-color` CSS variables, so they resolve through whatever theme is active and update on theme change
- Injection is idempotent (fixed element id) and frontend-only - no server component, no per-render DOM observer

## Requirements

- JupyterLab >= 4.0.0

## Install

To install the extension, execute:

```bash
pip install jupyterlab_markdown_syntax_rendering_fix
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyterlab_markdown_syntax_rendering_fix
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of [yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use `yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab_markdown_syntax_rendering_fix directory

# Set up a virtual environment and install package in development mode
python -m venv .venv
source .venv/bin/activate
pip install --editable "."

# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite

# Rebuild extension TypeScript source after making changes
# IMPORTANT: Unlike the steps above which are performed only once, do this step
# every time you make a change.
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

### Development uninstall

```bash
pip uninstall jupyterlab_markdown_syntax_rendering_fix
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop` command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions` folder is located. Then you can remove the symlink named `jupyterlab_markdown_syntax_rendering_fix` within that folder.

### Testing the extension

#### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
jlpm
jlpm test
```

#### Integration tests

This extension uses [Playwright](https://playwright.dev/docs/intro) for the integration tests (aka user level tests). More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information are provided within the [ui-tests](./ui-tests/README.md) README.
