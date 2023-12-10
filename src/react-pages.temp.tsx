// @ts-ignore
import React, { lazy, Suspense, ReactNode, ComponentType } from 'react';
import { set } from 'lodash-es';
import { Outlet } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';

type Module = () => Promise<{ default: ComponentType }>;
/*
import('xxx') 统一使用 Module 表示
const modules = {
  './pages/demo/index.page.tsx': Module,
  './pages/demo/layout.tsx': Module,
  './pages/demo/info/index.page.tsx': Module,
};
*/
type Modules = Record<string, () => Module>;

/*
const pathModules = {
  account: {
    path: 'demo',
    module: Module,
    children: {
      '': {
        index: true
        module: Module
      },
      info: {
        path: 'info',
        children: {
          '': {
            index: true
            module: Module
          }
        }
      }
    }
  }
}
*/
type PathModules = Record<
  string,
  {
    path: string;
    index?: true;
    module: Module;
    children?: PathModules;
  }
>;

type PathModulesValues = {
  path: string;
  index?: true;
  module: Module;
  children?: PathModulesValues[];
}[];

function modulesToPathModules(modules: Modules): PathModules {
  const pathModules: PathModules = {};

  Object.keys(modules).forEach((key) => {
    const module: () => Module = modules[key];

    // 如果是 layout
    if (key.includes('/layout.tsx') || key.includes('/layout.jsx')) {
      // ./pages/demo/layout.tsx => /demo
      // ./pages/demo/info/layout.tsx => /demo/info
      const path = key.split('/pages').pop()!.replace('/layout.tsx', '').replace('/layout.jsx', '');

      // /demo => demo => demo
      // /demo/info => demo/info => demo.children.info
      const setPath = path.slice(1).replace(/\//g, '.children.');

      // demo => demo
      // demo/info => info
      // [uuid] => :uuid
      const lastPath = path.split('/').slice(-1)[0].replace(/\[/g, ':').replace(/\]/g, '');

      set(pathModules, `${setPath}.path`, lastPath);
      set(pathModules, `${setPath}.module`, module);
    }
    // 同理
    else if (key.includes('/index.page.tsx') || key.includes('/index.page.jsx')) {
      // ./pages/demo/index.page.tsx => /demo
      // ./pages/demo/info/index.page.tsx => /demo/info
      const path = key
        .split('/pages')
        .pop()!
        .replace('/index.page.tsx', '')
        .replace('/index.page.jsx', '');

      // /demo => demo => demo
      // /demo/info => demo/info => demo.children.info
      const setPath = path.slice(1).replace(/\//g, '.children.');

      // demo => demo
      // demo/info => info
      // [uuid] => :uuid
      const lastPath = path.split('/').slice(-1)[0].replace(/\[/g, ':').replace(/\]/g, '');

      set(pathModules, `${setPath}.path`, lastPath);
      // 见 react-router Router index
      set(pathModules, `${setPath}.children..index`, true);
      set(pathModules, `${setPath}.children..module`, module);
    }
  });

  return pathModules;
}

function fixPathModules(pathModules: PathModules) {
  function DefaultLayout() {
    return <Outlet />;
  }

  Object.keys(pathModules).forEach((key) => {
    const pathModule = pathModules[key];

    // children 则递归
    if (pathModule.children) {
      fixPathModules(pathModule.children);
    }
    // 非 index router 的情况，如果没有 path，则可能是 深层嵌套 router 造成。
    // 需要设置 path 和 默认 element <Outlet>
    if (!pathModule.index && !pathModule.path) {
      pathModule.path = key;
      pathModule.module = () => Promise.resolve({ default: DefaultLayout });
    }
  });
}

function pathModulesToValues(pathModules): PathModulesValues {
  function valuesDeep(obj: PathModules) {
    // {demo home} => [demo, home]
    const arr = Object.values(obj);

    // 递归遍历 children
    return arr.map((item) => {
      if (item.children) {
        return { ...item, children: valuesDeep(item.children) };
      }

      return item;
    });
  }

  return valuesDeep(pathModules);
}

function moduleToElement(pathModulesValues: PathModulesValues): RouteObject[] {
  function deep(arr) {
    return arr.map((item) => {
      const route: RouteObject = {
        path: item.path,
        index: item.index,
      };

      // 如果有 layout
      if (item.module) {
        const Element = lazy(item.module);
        route.element = (
          <Suspense fallback={<></>}>
            <Element />
          </Suspense>
        );
      }

      // 处理 children
      if (item.children) {
        route.children = deep(item.children);
      }

      return route;
    });
  }

  return deep(pathModulesValues);
}

function modulesToRoutes(modules: Modules): RouteObject[] {
  // modules 转换成对象形式
  const pathModules = modulesToPathModules(modules);
  // 修复 pathModules，支持深层嵌套路由
  fixPathModules(pathModules);
  // 再转数组
  const values = pathModulesToValues(pathModules);
  // 转成 route
  return moduleToElement(values);
}

// next line will be replace
const willBeReplaceModules = {};
// next line will be replace
const willBeReplacePagesRoutes = {};

const pagesRoutes = modulesToRoutes(willBeReplaceModules);
const PagesRoutes = willBeReplacePagesRoutes;

export { pagesRoutes, PagesRoutes };
