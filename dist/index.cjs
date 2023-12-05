'use strict';

const vite = require('vite');
const path = require('path');
const fs = require('fs-extra');
const glob = require('glob');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const path__default = /*#__PURE__*/_interopDefaultCompat(path);
const fs__default = /*#__PURE__*/_interopDefaultCompat(fs);

function getModulesString(files) {
  return `
const willBeReplaceModules = {
${files.map((item) => {
    return `  '${item}': () => import('${item}'),`;
  }).join("\n")}
};
`;
}
function getRoutesString(files) {
  const arr = files.filter((item) => item.match(/index\.page\.(j|t)sx/g)).map((item) => {
    const value = item.split("/pages").pop().replace(/\/index\.page\.(j|t)sx/g, "");
    const key = value.slice(1).replace(/\//g, "_").toUpperCase();
    const dynamicValue = value.replace(/\[/g, ":").replace(/\]/g, "");
    return `  '${key}': '${dynamicValue}',`;
  });
  return `
const willBeReplacePagesRoutes = {
${arr.join("\n")}
};
`;
}
function getDeclareString(files) {
  const arr = files.filter((item) => item.match(/index\.page\.(j|t)sx/g)).map((item) => {
    const value = item.split("/pages").pop().replace(/\/index\.page\.(j|t)sx/g, "");
    const key = value.slice(1).replace(/\//g, "_").toUpperCase();
    const dynamicValue = value.replace(/\[/g, ":").replace(/\]/g, "");
    if (key.includes("[")) {
      return `    '${key}': '${dynamicValue}';`;
    }
    return `    ${key}: '${dynamicValue}';`;
  });
  return `declare module 'virtual:react-pages' {
  import type { RouteObject } from 'react-router-dom';

  export const pagesRoutes: RouteObject[];

  export const PagesRoutes: {
${arr.join("\n")}
  };
}
`;
}
function getFiles(config) {
  let files = glob.globSync(path__default.join(config.pagesPath, "**/{index.page,layout}.{jsx,tsx}"));
  return files.map((file) => `./${file}`);
}
function generate(config) {
  let files = getFiles(config);
  const temp = fs__default.readFileSync(path__default.resolve(__dirname, "./react-pages.temp.mjs"), "utf-8");
  return temp.replace("const willBeReplaceModules = {};", getModulesString(files)).replace("const willBeReplacePagesRoutes = {};", getRoutesString(files));
}
function generateDeclare(config) {
  let files = getFiles(config);
  if (config.declarePath) {
    const file = path__default.resolve(process.cwd(), config.declarePath);
    fs__default.writeFileSync(file, getDeclareString(files), "utf-8");
    const prettier = path__default.resolve("./node_modules/.bin/prettier");
    if (fs__default.existsSync(prettier)) {
      require("child_process").execSync(`${prettier} --write ${file}`);
    }
  }
}

const logger = vite.createLogger("info", { prefix: "[vite-plugin-react-router-pages]" });
function vitePluginReactRouterPages(c) {
  const virtualModuleId = "virtual:react-pages";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;
  const config = {
    pagesPath: "./src/pages",
    declarePath: "./react-pages.d.ts"
  };
  Object.assign(config, c);
  return {
    name: "vite-plugin-react-router-v6-pages",
    enforce: "pre",
    //
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        generateDeclare(config);
        return generate(config);
      }
    },
    configureServer(server) {
      const listener = (file = "") => {
        if (file.includes("/src/pages/")) {
          logger.info("generate react-pages.d.ts");
          generateDeclare(config);
        }
      };
      server.watcher.on("add", listener);
      server.watcher.on("change", listener);
      server.watcher.on("unlink", listener);
    }
  };
}

module.exports = vitePluginReactRouterPages;
