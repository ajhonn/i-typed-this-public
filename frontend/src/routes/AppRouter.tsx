import { Navigate, RouterProvider, createBrowserRouter } from 'react-router';
import LearnRoute from '@features/learn/LearnRoute';
import PlaybackRoute from '@features/playback/PlaybackRoute';
import WriteRoute from '@features/write/WriteRoute';
import { ROUTES } from './paths';
import AnalysisRoute from '@features/analysis/AnalysisRoute';

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
    path: ROUTES.analysis,
    element: <AnalysisRoute />,
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
