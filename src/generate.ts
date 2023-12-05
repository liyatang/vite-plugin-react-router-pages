import path from 'path';
import fs from 'fs-extra';
import { globSync } from 'glob';

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
        return `    '${key}': '${dynamicValue}';`;
      }
      // 避免格式化不一致。key 不包裹 ''
      return `    ${key}: '${dynamicValue}';`;
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

interface Config {
  pagesPath: string;
  declarePath: string;
}

function getFiles(config: Config) {
  // 获取匹配到的文件
  // [ 'src/pages/demo/index.page.tsx', '/src/pages/demo/layout.tsx', 'src/pages/demo/info/index.page.tsx']
  let files = globSync(path.join(config.pagesPath, '**/{index.page,layout}.{jsx,tsx}'));
  // glob 返回 src/pages/xxxx，所以补下 ./
  return files.map((file) => `./${file}`);
}

function generate(config: Config) {
  let files = getFiles(config);

  // 读取模板文件
  const temp = fs.readFileSync(path.resolve(__dirname, './react-pages.temp.mjs'), 'utf-8');
  // 替换模板文件中的占位符，生成 routes and Routes
  return temp
    .replace('const willBeReplaceModules = {};', getModulesString(files))
    .replace('const willBeReplacePagesRoutes = {};', getRoutesString(files));
}

function generateDeclare(config: Config) {
  let files = getFiles(config);

  // 生成 react-pages.d.ts 文件
  if (config.declarePath) {
    fs.writeFileSync(
      path.resolve(process.cwd(), config.declarePath!),
      getDeclareString(files),
      'utf-8'
    );
  }
}

export { generate, generateDeclare };
export type { Config };
