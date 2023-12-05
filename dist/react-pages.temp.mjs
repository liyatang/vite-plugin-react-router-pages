import React, { lazy, Suspense } from 'react';
import { set } from 'lodash-es';

function modulesToPathModules(modules) {
  const pathModules = {};
  Object.keys(modules).forEach((key) => {
    const module = modules[key];
    if (key.includes("/layout.tsx")) {
      const path = key.split("/pages").pop().replace("/layout.tsx", "");
      const setPath = path.slice(1).replace(/\//g, ".children.");
      const lastPath = path.split("/").slice(-1)[0].replace(/\[/g, ":").replace(/\]/g, "");
      set(pathModules, `${setPath}.path`, lastPath);
      set(pathModules, `${setPath}.module`, module);
    } else if (key.includes("/index.page.tsx")) {
      const path = key.split("/pages").pop().replace("/index.page.tsx", "");
      const setPath = path.slice(1).replace(/\//g, ".children.");
      const lastPath = path.split("/").slice(-1)[0].replace(/\[/g, ":").replace(/\]/g, "");
      set(pathModules, `${setPath}.path`, lastPath);
      set(pathModules, `${setPath}.children..index`, true);
      set(pathModules, `${setPath}.children..module`, module);
    }
  });
  return pathModules;
}
function pathModulesToValues(pathModules) {
  function valuesDeep(obj) {
    const arr = Object.values(obj);
    return arr.map((item) => {
      if (item.children) {
        return { ...item, children: valuesDeep(item.children) };
      }
      return item;
    });
  }
  return valuesDeep(pathModules);
}
function moduleToElement(pathModulesValues) {
  function deep(arr) {
    return arr.map((item) => {
      const route = {
        path: item.path,
        index: item.index
      };
      if (item.module) {
        const Element = lazy(item.module);
        route.element = /* @__PURE__ */ React.createElement(Suspense, { fallback: /* @__PURE__ */ React.createElement(React.Fragment, null) }, /* @__PURE__ */ React.createElement(Element, null));
      }
      if (item.children) {
        route.children = deep(item.children);
      }
      return route;
    });
  }
  return deep(pathModulesValues);
}
function modulesToRoutes(modules) {
  const pathModules = modulesToPathModules(modules);
  const values = pathModulesToValues(pathModules);
  return moduleToElement(values);
}
const willBeReplaceModules = {};
const willBeReplacePagesRoutes = {};
const pagesRoutes = modulesToRoutes(willBeReplaceModules);
const PagesRoutes = willBeReplacePagesRoutes;

export { PagesRoutes, pagesRoutes };
