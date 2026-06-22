# jupyterlab_markdown_syntax_rendering_fix

[![GitHub Actions](https://github.com/stellarshenson/jupyterlab_markdown_syntax_rendering_fix/actions/workflows/build.yml/badge.svg)](https://github.com/stellarshenson/jupyterlab_markdown_syntax_rendering_fix/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/jupyterlab_markdown_syntax_rendering_fix.svg)](https://www.npmjs.com/package/jupyterlab_markdown_syntax_rendering_fix)
[![PyPI version](https://img.shields.io/pypi/v/jupyterlab-markdown-syntax-rendering-fix.svg)](https://pypi.org/project/jupyterlab-markdown-syntax-rendering-fix/)
[![Total PyPI downloads](https://static.pepy.tech/badge/jupyterlab-markdown-syntax-rendering-fix)](https://pepy.tech/project/jupyterlab-markdown-syntax-rendering-fix)
[![JupyterLab 4](https://img.shields.io/badge/JupyterLab-4-orange.svg)](https://jupyterlab.readthedocs.io/en/stable/)
[![Brought To You By KOLOMOLO](https://img.shields.io/badge/Brought%20To%20You%20By-KOLOMOLO-00ffff?style=flat)](https://kolomolo.com)
[![Donate PayPal](https://img.shields.io/badge/Donate-PayPal-blue?style=flat)](https://www.paypal.com/donate/?hosted_button_id=B4KPBJDLLXTSA)

Fenced code blocks in rendered Markdown sometimes appear plain and uncoloured - the highlighting silently fails when a CodeMirror language chunk loads late or the language registry is not yet ready, and JupyterLab falls back to plain text. This extension restores the highlighting that was lost to that race.

## Features

- **Recovers lost highlighting** - re-applies syntax highlighting to fenced code blocks that rendered plain because the async highlighter missed the cache
- **Language agnostic** - works for any fenced language (bash, python, json, ...), independent of mermaid
- **Targets the cold-load race** - handles the case where a language chunk imports late or the registry is wired after an early render
- **Frontend only** - pure TypeScript labextension, no server component

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
