import { expect, test } from '@jupyterlab/galata';

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({ autoGoto: false });

test('should emit an activation console message', async ({ page }) => {
  const logs: string[] = [];

  page.on('console', message => {
    logs.push(message.text());
  });

  await page.goto();

  expect(
    logs.filter(
      s =>
        s ===
        'JupyterLab extension jupyterlab_markdown_syntax_rendering_fix is activated!'
    )
  ).toHaveLength(1);
});

test('recovers highlighting on a plain rendered code block', async ({
  page
}) => {
  await page.goto();
  await page.waitForSelector('.jp-LabShell', { timeout: 60000 });

  // Inject a plain (unhighlighted) fenced code block, exactly as the markdown
  // renderer emits on a highlight cache miss: a language class and text, but no
  // token <span> children.
  await page.evaluate(() => {
    const container = document.createElement('div');
    container.className = 'jp-RenderedMarkdown';
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.className = 'language-python';
    code.textContent = 'import os\nprint(os.getcwd())\n';
    pre.appendChild(code);
    container.appendChild(pre);
    // Append inside the shell, which the extension observes.
    (document.querySelector('.jp-LabShell') ?? document.body).appendChild(
      container
    );
  });

  // The extension's observer must recover it: the block gains token spans and is
  // marked processed.
  await page.waitForFunction(
    () => {
      const code = document.querySelector(
        '.jp-RenderedMarkdown code.language-python'
      );
      return (
        !!code &&
        code.getAttribute('data-msrf') === '1' &&
        code.querySelectorAll('span').length > 0
      );
    },
    { timeout: 30000 }
  );

  const spanCount = await page
    .locator('.jp-RenderedMarkdown code.language-python span')
    .count();
  expect(spanCount).toBeGreaterThan(0);
});
