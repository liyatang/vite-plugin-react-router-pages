declare module 'virtual:react-pages' {
  import type { RouteObject } from 'react-router-dom';

  export const pagesRoutes: RouteObject[];

  export const PagesRoutes: {
    USER: '/user';
    'USER_[USERUUID]': '/user/:userUUID';
    'USER_[USERUUID]_INFO': '/user/:userUUID/info';
    HOME: '/home';
    DEMO: '/demo';
  };
}
