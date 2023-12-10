'use strict';

const React = require('react');
const lodashEs = require('lodash-es');
const reactRouterDom = require('react-router-dom');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const React__default = /*#__PURE__*/_interopDefaultCompat(React);

function modulesToPathModules(modules) {
  const pathModules = {};
  Object.keys(modules).forEach((key) => {
    const module = modules[key];
    if (key.includes("/layout.tsx") || key.includes("/layout.jsx")) {
      const path = key.split("/pages").pop().replace("/layout.tsx", "").replace("/layout.jsx", "");
      const setPath = path.slice(1).replace(/\//g, ".children.");
      const lastPath = path.split("/").slice(-1)[0].replace(/\[/g, ":").replace(/\]/g, "");
      lodashEs.set(pathModules, `${setPath}.path`, lastPath);
      lodashEs.set(pathModules, `${setPath}.module`, module);
    } else if (key.includes("/index.page.tsx") || key.includes("/index.page.jsx")) {
      const path = key.split("/pages").pop().replace("/index.page.tsx", "").replace("/index.page.jsx", "");
      const setPath = path.slice(1).replace(/\//g, ".children.");
      const lastPath = path.split("/").slice(-1)[0].replace(/\[/g, ":").replace(/\]/g, "");
      lodashEs.set(pathModules, `${setPath}.path`, lastPath);
      lodashEs.set(pathModules, `${setPath}.children..index`, true);
      lodashEs.set(pathModules, `${setPath}.children..module`, module);
    }
  });
  return pathModules;
}
function fixPathModules(pathModules) {
  function DefaultLayout() {
    return /* @__PURE__ */ React__default.createElement(reactRouterDom.Outlet, null);
  }
  Object.keys(pathModules).forEach((key) => {
    const pathModule = pathModules[key];
    if (pathModule.children) {
      fixPathModules(pathModule.children);
    }
    if (!pathModule.index && !pathModule.path) {
      pathModule.path = key;
      pathModule.module = () => Promise.resolve({ default: DefaultLayout });
    }
  });
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
        const Element = React.lazy(item.module);
        route.element = /* @__PURE__ */ React__default.createElement(React.Suspense, { fallback: /* @__PURE__ */ React__default.createElement(React__default.Fragment, null) }, /* @__PURE__ */ React__default.createElement(Element, null));
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
  fixPathModules(pathModules);
  const values = pathModulesToValues(pathModules);
  return moduleToElement(values);
}
const willBeReplaceModules = {};
const willBeReplacePagesRoutes = {};
const pagesRoutes = modulesToRoutes(willBeReplaceModules);
const PagesRoutes = willBeReplacePagesRoutes;

exports.PagesRoutes = PagesRoutes;
exports.pagesRoutes = pagesRoutes;
