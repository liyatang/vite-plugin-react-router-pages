import path from 'path';
import fs from 'fs-extra';
import { globSync } from 'glob';
import type { Plugin } from 'vite';

interface Config {
  // 默认 ['./src/pages/**/index.page.tsx', './src/pages/**/layout.tsx']
  glob: string | string[];
  /** 生成 d.ts 的目录。 默认 ./react-pages.d.ts */
  declarePath: string;
}
interface InConfig {
  glob?: string | string[];
  declarePath?: string;
}

function getModulesString(files: string[]) {
  return `
const willBeReplaceModules = {
${files
  .map((item) => {
    // ./src/pages/demo/index.page.tsx 转成 './pages/demo/index.page.tsx': () => import('./pages/demo/index.page.tsx'),
    return `  '${item}': () => import('${item}'),`;
  })
  .join('\n')}
};
`;
}

function getRoutesString(files: string[]) {
  const arr = files
    .filter((item) => item.includes('/index.page.tsx'))
    .map((item) => {
      // ./src/pages/demo/index.page.tsx => DEMO: '/demo'
      // ./src/pages/demo/info/index.page.tsx => DEMO: '/demo/info'
      // ./src/pages/demo/[userUUID]/index.page.tsx => DEMO_[USERUUID]: '/demo/:userUUID'
      const value = item.split('/pages').pop()!.replace('/index.page.tsx', '');
      const key = value.slice(1).replace(/\//g, '_').toUpperCase();
      const dynamicValue = value.replace(/\[/g, ':').replace(/\]/g, '');
      return `  '${key}': '${dynamicValue}',`;
    });

  return `
const willBeReplacePagesRoutes = {
${arr.join('\n')}
};
`;
}

function getDeclareString(files: string[]) {
  const arr = files
    .filter((item) => item.includes('/index.page.tsx'))
    .map((item) => {
      // ./src/pages/demo/index.page.tsx => DEMO: '/demo'
      // ./src/pages/demo/info/index.page.tsx => DEMO: '/demo/info'
      const value = item.split('/pages').pop()!.replace('/index.page.tsx', '');
      const key = value.slice(1).replace(/\//g, '_').toUpperCase();
      const dynamicValue = value.replace(/\[/g, ':').replace(/\]/g, '');

      if (key.includes('[')) {
        return `    '${key}': '${dynamicValue}'`;
      }
      // 避免格式化不一致。key 不包裹 ''
      return `    ${key}: '${dynamicValue}'`;
    });

  return `declare module 'virtual:react-pages' {
  import type { RouteObject } from 'react-router-dom';

  export const pagesRoutes: RouteObject[];

  export const PagesRoutes: {
${arr.join('\n')}
  };
}
`;
}

export default function vitePluginReactRouterPages(c: InConfig): Plugin {
  const virtualModuleId = 'virtual:react-pages';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  const config: Config = {
    glob: ['./src/pages/**/index.page.tsx', './src/pages/**/layout.tsx'],
    declarePath: './react-pages.d.ts',
  };

  Object.assign(config, c);

  return {
    name: 'vite-plugin-react-router-v6-pages', // 必须的，将会在 warning 和 error 中显示
    enforce: 'pre', // 强制在其他插件之前执行
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        // 获取匹配到的文件
        // [ 'src/pages/demo/index.page.tsx', '/src/pages/demo/layout.tsx', 'src/pages/demo/info/index.page.tsx']
        let files = globSync(config.glob);
        // glob 返回 src/pages/xxxx，所以补下 ./
        files = files.map((file) => `./${file}`);

        if (config.declarePath) {
          // 生成 react-pages.d.ts 文件
          fs.writeFileSync(
            path.resolve(process.cwd(), config.declarePath!),
            getDeclareString(files),
            'utf-8'
          );
        }

        // 读取模板文件
        const temp = fs.readFileSync(path.resolve(__dirname, './react-pages.temp.mjs'), 'utf-8');
        // 替换模板文件中的占位符，生成 routes and Routes
        return temp
          .replace('const willBeReplaceModules = {};', getModulesString(files))
          .replace('const willBeReplacePagesRoutes = {};', getRoutesString(files));
      }
    },
  };
}
