import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ChallengePage } from './pages/ChallengePage'
import { ChallengesPage } from './pages/ChallengesPage'
import { DashboardPage } from './pages/DashboardPage'
import { ModuleDetailPage } from './pages/ModuleDetailPage'
import { ModulesPage } from './pages/ModulesPage'
import { NotFoundPage } from './pages/NotFoundPage'

/** Every page shares the Layout (header, navigation, footer); `*` catches unknown URLs. */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'modules', element: <ModulesPage /> },
      { path: 'modules/:moduleId', element: <ModuleDetailPage /> },
      { path: 'challenges', element: <ChallengesPage /> },
      { path: 'challenges/:challengeId', element: <ChallengePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
