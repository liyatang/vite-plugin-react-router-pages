import { Plugin } from 'vite';

interface InConfig {
    pagesPath?: string;
    /** 生成 d.ts 的目录。 默认 ./react-pages.d.ts */
    declarePath?: string;
}
declare function vitePluginReactRouterPages(c?: InConfig): Plugin;

export { vitePluginReactRouterPages as default };
