import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IEditorLanguageRegistry } from '@jupyterlab/codemirror';
import {
  PROCESSED_ATTR,
  collectPlainBlocks,
  languageFromClass
} from './highlight';

/** How many times to attempt recovery (only a thrown highlight is retried). */
const MAX_ATTEMPTS = 4;

/** Base retry delay; backs off 750/1500/3000ms (~5s total) so a slow chunk import can settle. */
const BASE_RETRY_DELAY_MS = 750;

/** Blocks currently being recovered, to dedupe concurrent observer callbacks. */
const inFlight = new WeakSet<HTMLElement>();

const delay = (ms: number): Promise<void> =>
  new Promise(resolve => {
    window.setTimeout(resolve, ms);
  });

/**
 * Recover highlighting on a single plain block, and mark it with a terminal
 * `data-msrf` state so it is processed at most once:
 *
 * - `1`       success - token spans written
 * - `plain`   highlight ran cleanly but produced no tokens (span-less content) -
 *             not a failure, the original plain text is left untouched
 * - `skipped` the language is unsupported (`findBest` miss) - deterministic, so
 *             no retry and no warning
 * - `failed`  the highlight threw on every attempt - left as plain text, no
 *             regression vs without this extension
 *
 * Only a thrown highlight is retried, since that is the one transient case (a
 * cold/flaky CodeMirror language-chunk import). Retrying is effective, not
 * theatre: `highlight()` awaits `getLanguage()` internally, which caches the
 * loaded support on the spec only on success (`spec.support = await spec.load()`)
 * - a rejected load throws and leaves `spec.support` unset, and webpack resets a
 * failed chunk load, so each attempt genuinely re-runs the dynamic import.
 * Retries back off over ~5s; a chunk that never loads within that window stays
 * plain until the block is re-rendered (reload / reopen). Concurrent callbacks
 * are deduped via `inFlight`.
 */
async function rehighlight(
  code: HTMLElement,
  languages: IEditorLanguageRegistry
): Promise<void> {
  const language = languageFromClass(code.className);
  if (!language || inFlight.has(code) || code.hasAttribute(PROCESSED_ATTR)) {
    return;
  }
  const text = code.textContent ?? '';
  inFlight.add(code);
  try {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const spec = languages.findBest(language);
      if (!spec) {
        // Unsupported language - a synchronous registry miss is deterministic,
        // so retrying cannot help. Leave it plain, no warning.
        code.setAttribute(PROCESSED_ATTR, 'skipped');
        return;
      }
      const host = document.createElement('div');
      try {
        await languages.highlight(text, spec, host);
      } catch {
        // The one retryable case: a transient chunk-load flake.
        if (attempt < MAX_ATTEMPTS) {
          await delay(BASE_RETRY_DELAY_MS * 2 ** (attempt - 1));
          // The host may have been re-rendered during the back-off; a fresh node
          // is handled independently, so stop working this detached one.
          if (!code.isConnected) {
            return;
          }
          continue;
        }
        code.setAttribute(PROCESSED_ATTR, 'failed');
        console.warn(
          `[jupyterlab_markdown_syntax_rendering_fix] gave up re-highlighting ${language} after ${MAX_ATTEMPTS} attempts`
        );
        return;
      }
      // The node may have been re-rendered during the await; a fresh node is
      // handled independently, so don't write to a detached one.
      if (!code.isConnected) {
        return;
      }
      // Highlight ran without throwing. Commit the swap only when the rendered
      // text round-trips exactly - never replace the block with a truncated or
      // divergent fragment (worse than leaving it plain). An empty result is
      // deterministic for the content (a parser that failed to load throws
      // rather than resolving empty), so it is terminal, not retried.
      if (host.childElementCount > 0 && host.textContent === text) {
        // Set the marker in the same synchronous frame as the write so the
        // observer's async callback sees data-msrf and skips the spans we add.
        code.setAttribute(PROCESSED_ATTR, '1');
        code.replaceChildren(...Array.from(host.childNodes));
      } else {
        if (host.childElementCount > 0) {
          // Spans were produced but the text did not round-trip - surface this
          // rare case rather than silently suppressing a possibly-correct render.
          console.warn(
            `[jupyterlab_markdown_syntax_rendering_fix] skipped re-highlight of ${language}: highlighted text did not match source`
          );
        }
        code.setAttribute(PROCESSED_ATTR, 'plain');
      }
      return;
    }
  } finally {
    inFlight.delete(code);
  }
}

/**
 * Initialization data for the jupyterlab_markdown_syntax_rendering_fix extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_markdown_syntax_rendering_fix:plugin',
  description:
    'Jupyterlab extension to fix a common issue with Markdown renderer where some race condition causes for the fenced code block to not have proper syntax highlighting',
  autoStart: true,
  requires: [IEditorLanguageRegistry],
  activate: (app: JupyterFrontEnd, languages: IEditorLanguageRegistry) => {
    console.log(
      'JupyterLab extension jupyterlab_markdown_syntax_rendering_fix is activated!'
    );

    const scan = (root: ParentNode): void => {
      for (const code of collectPlainBlocks(root)) {
        rehighlight(code, languages).catch(error => {
          console.warn(
            '[jupyterlab_markdown_syntax_rendering_fix] unexpected error while re-highlighting',
            error
          );
        });
      }
    };

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType !== Node.ELEMENT_NODE) {
            return;
          }
          const element = node as HTMLElement;
          // Skip pure observer churn: CodeMirror editors mutate on every
          // keystroke and never hold rendered markdown, and the token spans this
          // extension itself writes land under an already-processed code block.
          if (element.closest('.cm-editor, code[data-msrf]')) {
            return;
          }
          scan(element);
        });
      }
    });

    // Observe the application shell rather than document.body: rendered markdown
    // lives in the shell (notebook cells, markdown preview). Markdown rendered in
    // body-level overlays (completer / hover docstrings) is intentionally not
    // covered - a deliberate tradeoff to avoid observing the high-churn overlay
    // layer; such code blocks recover on the next in-shell render or a reload.
    const root = app.shell.node;
    observer.observe(root, { childList: true, subtree: true });

    // Recover any markdown already rendered before this extension activated.
    scan(root);
  }
};

export default plugin;
