import { createLogger } from 'vite';
import type { Plugin } from 'vite';
import { generate, generateDeclare } from './generate';
import type { Config } from './generate';

const logger = createLogger('info', { prefix: '[vite-plugin-react-router-pages]' });

interface InConfig {
  // 默认 ./src/pages
  pagesPath?: string;
  /** 生成 d.ts 的目录。 默认 ./react-pages.d.ts */
  declarePath?: string;
}

export default function vitePluginReactRouterPages(c?: InConfig): Plugin {
  const virtualModuleId = 'virtual:react-pages';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  const config: Config = {
    pagesPath: './src/pages',
    declarePath: './react-pages.d.ts',
  };

  Object.assign(config, c);

  return {
    name: 'vite-plugin-react-router-v6-pages',
    enforce: 'pre', //
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        logger.info('generate react-pages.d.ts');
        generateDeclare(config);
        return generate(config);
      }
    },
    configureServer(server) {
      const listener = (file = '') => {
        if (
          file.includes('/src/pages/') &&
          (file.includes('/index.page.') || file.includes('/layout.'))
        ) {
          logger.info(`generate react-pages.d.ts ${file}`);
          generateDeclare(config);
        }
      };
      // file has been added
      server.watcher.on('add', listener);
      // file has been removed
      server.watcher.on('unlink', listener);
    },
  };
}
