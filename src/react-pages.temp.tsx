import React, { lazy, Suspense } from 'react';
import { set } from 'lodash-es';
import type { RouteObject } from 'react-router-dom';

/*
import('xxx') 统一使用 Module 表示
const modules = {
  './pages/demo/index.page.tsx': Module,
  './pages/demo/layout.tsx': Module,
  './pages/demo/info/index.page.tsx': Module,
};
*/
type Modules = Record<string, () => Promise<any>>;

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
  { path: string; index?: true; module: Promise<any>; children?: PathModules }
>;

type PathModulesValues = {
  path: string;
  index?: true;
  module: Promise<any>;
  children?: PathModulesValues[];
}[];

function modulesToPathModules(modules: Modules): PathModules {
  const pathModules: PathModules = {};

  Object.keys(modules).forEach((key) => {
    const module: () => Promise<any> = modules[key];

    // 如果是 layout
    if (key.includes('/layout.tsx')) {
      // ./pages/demo/layout.tsx => /demo
      // ./pages/demo/info/layout.tsx => /demo/info
      const path = key.split('/pages').pop()!.replace('/layout.tsx', '');

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
    else if (key.includes('/index.page.tsx')) {
      // ./pages/demo/index.page.tsx => /demo
      // ./pages/demo/info/index.page.tsx => /demo/info
      const path = key.split('/pages').pop()!.replace('/index.page.tsx', '');

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
  // 转换成对象形式
  const pathModules = modulesToPathModules(modules);
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
