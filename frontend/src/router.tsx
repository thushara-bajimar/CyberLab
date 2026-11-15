import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { NotFoundPage } from './pages/NotFoundPage'

/** Every page shares the Layout (header, navigation, footer); `*` catches unknown URLs. */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
