import { createLogger } from 'vite';
import path from 'path';
import fs from 'fs-extra';
import { globSync } from 'glob';

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
  const arr = files.filter((item) => item.includes("/index.page.tsx")).map((item) => {
    const value = item.split("/pages").pop().replace("/index.page.tsx", "");
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
  const arr = files.filter((item) => item.includes("/index.page.tsx")).map((item) => {
    const value = item.split("/pages").pop().replace("/index.page.tsx", "");
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
  let files = globSync(path.join(config.pagesPath, "**/{index.page,layout}.{jsx,tsx}"));
  return files.map((file) => `./${file}`);
}
function generate(config) {
  let files = getFiles(config);
  const temp = fs.readFileSync(path.resolve(__dirname, "./react-pages.temp.mjs"), "utf-8");
  return temp.replace("const willBeReplaceModules = {};", getModulesString(files)).replace("const willBeReplacePagesRoutes = {};", getRoutesString(files));
}
function generateDeclare(config) {
  let files = getFiles(config);
  if (config.declarePath) {
    fs.writeFileSync(
      path.resolve(process.cwd(), config.declarePath),
      getDeclareString(files),
      "utf-8"
    );
  }
}

const logger = createLogger("info", { prefix: "[vite-plugin-react-router-pages]" });
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

export { vitePluginReactRouterPages as default };
