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
