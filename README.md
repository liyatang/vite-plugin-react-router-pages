# vite-plugin-react-router-pages

基于文件的约定式路由插件。

## 介绍

特性

- vite + react + react-router v6
- 嵌套路由 nested
- 页面组件 index.page.tsx
- 布局组件 layout.tsx
- 动态路径 `:name`
- lazy + code-splitting
- 路由类型支持 `PagesRoutes.xxxx`

目录结构

```js
[you project name]
- src
  - pages
    - home
      - index.page.tsx // 页面组件
      - layout.tsx  // 布局组件
    - user
      - [userUUID] // 动态路径
        - index.page.tsx
        - layout.tsx
      - setting // 可不提供 layout.tsx，默认 layout 为 <Outlet />
        - email
          - index.page.tsx // 嵌套路由
- react-pages.d.ts // vite 启动生成的的类型文件
```

已知不支持

- 可选路径 `:name?`，_没想好怎么在文件路径上提现，如果你有好的想法，请联系我。_

## DEMO

见 [./examples/react](./examples/react)

## 安装

### 1 Install

```bash
npm i -D vite-plugin-react-router-pages
```

### 2 Vite config

添加插件 `vite-plugin-react-router-pages` 到 `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pages from 'vite-plugin-react-router-pages';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), pages()],
});
```

### 3 tsconfig.json

vite 启动后会插件会生成 `react-pages.d.ts`，可添加到 `tsconfig.json`，以便获得 typescript 支持。

```json
{
  "compilerOptions": {
    "types": ["vite/client", "./react-pages.d.ts"]
  }
}
```

## 使用

### 1 virtual:react-pages

导入 `import { pagesRoutes, PagesRoutes } from "virtual:react-pages";`

其中

- `pagesRoutes` 是 `RouteObject[]`, 可以直接用于 `useRoutes(pagesRoutes)`。
- `PagesRoutes` 存储路由路径，可通过 `PagesRoutes.HOME` 访问页面路径。

```tsx
import { useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter as Router,
  useRoutes,
  Navigate,
  useNavigate,
  generatePath,
} from 'react-router-dom';
import { pagesRoutes, PagesRoutes } from 'virtual:react-pages';

const routes = [
  {
    path: '/',
    element: <Navigate to={PagesRoutes.HOME} />,
  },
  ...pagesRoutes,
];

console.log(routes);

function App() {
  const navigate = useNavigate();
  const handleClick = useCallback(() => {
    navigate(generatePath(PagesRoutes['USER_[USERUUID]'], { userUUID: 'danzi' }));
  }, [navigate]);

  return (
    <div className="app">
      <button onClick={handleClick}>navigate user/danzi</button>
      {useRoutes(routes)}
    </div>
  );
}

const app = createRoot(document.getElementById('root')!);
app.render(
  <Router>
    <App />
  </Router>
);
```

### 2 类型支持

由于 `react-pages.d.ts` 的类型支持，你可以很方便的获取到路由路径。

![](./img/1.jpg)

对于动态路径，如 `/user/:userUUID`，通过 `PagesRoutes['USER_[USERUUID]']` 访问，由于路径上清晰的提现了参数 `[USERUUID]`，你可以很方便知道参数是 `userUUID`。

```tsx
import { useNavigate, generatePath } from 'react-router-dom';

navigate(generatePath(PagesRoutes['USER_[USERUUID]'], { userUUID: 'danzi' }));
```

## Configuration

```ts
interface Config {
  /** 默认 ./src/pages/ */
  pagesPath?: string;
  /** 生成 d.ts 的目录。 默认 ./react-pages.d.ts */
  declarePath?: string;
}
```

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pages from 'vite-plugin-react-router-pages';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    pages({
      pagesPath: './src/pages/',
      declarePath: './react-pages.d.ts',
    }),
  ],
});
```

## FAQ

### 1. 为什么不使用 vite-plugin-pages

- vite-plugin-pages 的 React 部分是 **experimental** 的，不稳定。其实现覆盖 Vue React Solid，不免有些复杂，不好 fork 来改。
- 我看到基于约定式路由能做更多事情，比如生成 `PagesRoutes`，and more。
- 研究后发现，非常容易实现，且社区没有一个相对成熟的。

## 开发

1 安装依赖 `pnpm i`
2 运行 demo `cd examples/react` `pnpm dev`
3 开发调试，修改代码后在根目录 `pnpm build`，再跑第 2 步看效果。

## 交流

<img src="./img/wechat.jpg" width="150px" />
