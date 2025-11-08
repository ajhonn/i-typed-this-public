import { Navigate, RouterProvider, createBrowserRouter } from 'react-router';
import LearnRoute from '@features/learn/LearnRoute';
import PlaybackRoute from '@features/playback/PlaybackRoute';
import WriteRoute from '@features/write/WriteRoute';
import { ROUTES } from './paths';

export const appRoutes = [
  {
    path: '/',
    element: <Navigate to={ROUTES.write} replace />,
  },
  {
    path: ROUTES.write,
    element: <WriteRoute />,
  },
  {
    path: ROUTES.playback,
    element: <PlaybackRoute />,
  },
  {
    path: ROUTES.learn,
    element: <LearnRoute />,
  },
];

const router = createBrowserRouter(appRoutes);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
