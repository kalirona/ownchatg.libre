import { Navigate, useParams } from 'react-router-dom';
import DashboardRoute from './Layouts/Dashboard';
import FileDashboardView from '~/components/Files/FileDashboardView';
import VectorStoreView from '~/components/Files/VectorStoreView';
import FilesListView from '~/components/Files/FilesListView';

function PromptsRedirect() {
  const { '*': splat } = useParams();
  const target = splat ? `/prompts/${splat}` : '/prompts/new';
  return <Navigate to={target} replace={true} />;
}

const dashboardRoutes = {
  path: 'd/*',
  element: <DashboardRoute />,
  children: [
    {
      path: 'prompts/*',
      element: <PromptsRedirect />,
    },
    {
      path: 'vector-stores',
      element: <VectorStoreView />,
    },
    {
      path: 'vector-stores/:vectorStoreId',
      element: <VectorStoreView />,
    },
    {
      path: 'files',
      element: <FilesListView />,
    },
    {
      path: 'files/:fileId',
      element: <FilesListView />,
    },
    {
      path: '*',
      element: <Navigate to="/" replace={true} />,
    },
  ],
};

export default dashboardRoutes;
