/**
 * Pure DOM helpers for detecting fenced code blocks that rendered without
 * syntax highlighting. Kept free of JupyterLab imports so they can be unit
 * tested directly.
 */

/**
 * Attribute marking a code block this extension has already handled, so the
 * MutationObserver never re-processes the same block.
 */
export const PROCESSED_ATTR = 'data-msrf';

/**
 * Fenced languages rendered by their own renderer (e.g. mermaid -> SVG). They
 * are never plain `pre > code` highlight candidates, so leave them untouched.
 */
export const SKIP_LANGUAGES = new Set(['mermaid']);

/**
 * Extract the CodeMirror language name from a `language-<name>` class token.
 * Returns null when no such class is present.
 */
export function languageFromClass(className: string): string | null {
  const match = /(?:^|\s)language-([\w+#-]+)/.exec(className);
  return match ? match[1] : null;
}

/**
 * A rendered fenced code block has lost its syntax highlighting when it carries
 * a `language-*` class and non-empty text, yet has no child elements - the
 * async highlighter threw and the markdown renderer fell back to a plain
 * `<pre><code>` (cache miss). A correctly highlighted block holds token
 * `<span>` children, so `childElementCount > 0`.
 */
export function needsHighlight(code: HTMLElement): boolean {
  if (code.hasAttribute(PROCESSED_ATTR) || code.childElementCount > 0) {
    return false;
  }
  const language = languageFromClass(code.className);
  if (!language || SKIP_LANGUAGES.has(language)) {
    return false;
  }
  return (code.textContent ?? '').trim().length > 0;
}

/** CSS selector for a fenced code block carrying a language hint. */
const CODE_SELECTOR = 'pre > code[class*="language-"]';

/**
 * Collect the plain `pre > code.language-*` blocks at or under `root` that need
 * their highlighting recovered. `root` itself is considered, since
 * `querySelectorAll` only matches descendants and an observer may hand us the
 * `<code>` element directly.
 */
export function collectPlainBlocks(root: ParentNode): HTMLElement[] {
  const blocks: HTMLElement[] = [];
  const consider = (code: HTMLElement): void => {
    if (needsHighlight(code)) {
      blocks.push(code);
    }
  };
  if (root instanceof HTMLElement && root.matches(CODE_SELECTOR)) {
    consider(root);
  }
  root.querySelectorAll<HTMLElement>(CODE_SELECTOR).forEach(consider);
  return blocks;
}
