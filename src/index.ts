import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the jupyterlab_markdown_syntax_rendering_fix extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_markdown_syntax_rendering_fix:plugin',
  description: 'Jupyterlab extension to fix a common issue with Markdown renderer where some race condition causes for the fenced code block to not have proper syntax highlighting',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension jupyterlab_markdown_syntax_rendering_fix is activated!');
  }
};

export default plugin;
