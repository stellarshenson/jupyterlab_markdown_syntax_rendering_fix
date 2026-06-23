import {
  PROCESSED_ATTR,
  collectPlainBlocks,
  languageFromClass,
  needsHighlight
} from '../highlight';

/** Build a `pre > code` block with the given class and inner HTML. */
function block(className: string, inner: string): HTMLElement {
  const pre = document.createElement('pre');
  const code = document.createElement('code');
  code.className = className;
  code.innerHTML = inner;
  pre.appendChild(code);
  return code;
}

describe('languageFromClass', () => {
  it('extracts the language from a language-* class', () => {
    expect(languageFromClass('language-bash')).toBe('bash');
  });

  it('finds the token among other classes', () => {
    expect(languageFromClass('hljs language-python foo')).toBe('python');
  });

  it('keeps symbol-bearing language names', () => {
    expect(languageFromClass('language-c++')).toBe('c++');
    expect(languageFromClass('language-c#')).toBe('c#');
  });

  it('returns null without a language class', () => {
    expect(languageFromClass('hljs')).toBeNull();
    expect(languageFromClass('')).toBeNull();
  });
});

describe('needsHighlight', () => {
  it('flags a plain block with a language and text', () => {
    expect(needsHighlight(block('language-bash', 'pip install x'))).toBe(true);
  });

  it('ignores a block that already has token spans', () => {
    expect(
      needsHighlight(block('language-bash', '<span class="tok">pip</span>'))
    ).toBe(false);
  });

  it('ignores an already-processed block', () => {
    const code = block('language-bash', 'pip install x');
    code.setAttribute(PROCESSED_ATTR, '1');
    expect(needsHighlight(code)).toBe(false);
  });

  it('ignores blocks without a language class', () => {
    expect(needsHighlight(block('', 'plain text'))).toBe(false);
  });

  it('ignores empty or whitespace-only blocks', () => {
    expect(needsHighlight(block('language-bash', '   '))).toBe(false);
  });

  it('skips languages owned by other renderers (mermaid)', () => {
    expect(needsHighlight(block('language-mermaid', 'graph TD; A-->B'))).toBe(
      false
    );
  });
});

describe('collectPlainBlocks', () => {
  it('returns only the plain language blocks under a root', () => {
    const root = document.createElement('div');
    root.appendChild(block('language-bash', 'echo hi').parentElement!);
    root.appendChild(
      block('language-python', '<span class="tok">import os</span>')
        .parentElement!
    );
    root.appendChild(block('language-json', '{"a": 1}').parentElement!);
    root.appendChild(
      block('language-mermaid', 'graph TD; A-->B').parentElement!
    );

    const found = collectPlainBlocks(root);
    const langs = found.map(c => languageFromClass(c.className));
    expect(langs).toEqual(['bash', 'json']);
  });

  it('matches a bare code element passed as the root', () => {
    const code = block('language-bash', 'echo hi');
    expect(collectPlainBlocks(code)).toEqual([code]);
  });

  it('returns an empty list when everything is already highlighted', () => {
    const root = document.createElement('div');
    root.appendChild(
      block('language-bash', '<span class="tok">echo</span>').parentElement!
    );
    expect(collectPlainBlocks(root)).toHaveLength(0);
  });
});
