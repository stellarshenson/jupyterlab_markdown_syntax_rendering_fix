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

test('mounts the highlight style so token classes are coloured', async ({
  page
}) => {
  await page.goto();
  await page.waitForSelector('.jp-LabShell', { timeout: 60000 });

  // The extension injects the CodeMirror highlight StyleModule at startup so
  // rendered Markdown token spans (classes like ͼs) get colour without an
  // editor open. Assert the style element is present and carries those rules.
  await page.waitForFunction(
    () => {
      const style = document.getElementById(
        'jupyterlab-markdown-syntax-rendering-fix-highlight'
      );
      return !!style && /ͼ/.test(style.textContent ?? '');
    },
    { timeout: 30000 }
  );

  // A span carrying a highlight class must resolve to a non-empty colour from
  // the injected rules.
  const colour = await page.evaluate(() => {
    const span = document.createElement('span');
    span.className = 'ͼs';
    span.textContent = 'def';
    document.body.appendChild(span);
    const c = getComputedStyle(span).color;
    span.remove();
    return c;
  });
  expect(colour).toMatch(/^rgb/);
});
