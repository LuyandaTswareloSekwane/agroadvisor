import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute';
import { AppLayout } from './components/layout/AppLayout';
import { PageLoader } from './components/ui/PageLoader';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';

// Loaded on demand: the map library is large and only this page needs it.
const FarmProfilePage = lazy(() =>
  import('./pages/FarmProfilePage').then((module) => ({ default: module.FarmProfilePage })),
);
const LessonsPage = lazy(() =>
  import('./pages/LessonsPage').then((module) => ({ default: module.LessonsPage })),
);
const FarmMemoryPage = lazy(() =>
  import('./pages/FarmMemoryPage').then((module) => ({ default: module.FarmMemoryPage })),
);
const CommunityPage = lazy(() =>
  import('./pages/CommunityPage').then((module) => ({ default: module.CommunityPage })),
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          {
            path: 'farm',
            element: (
              <Suspense fallback={<PageLoader />}>
                <FarmProfilePage />
              </Suspense>
            ),
          },
          {
            path: 'lessons',
            element: (
              <Suspense fallback={<PageLoader />}>
                <LessonsPage />
              </Suspense>
            ),
          },
          {
            path: 'memory',
            element: (
              <Suspense fallback={<PageLoader />}>
                <FarmMemoryPage />
              </Suspense>
            ),
          },
          {
            path: 'community',
            element: (
              <Suspense fallback={<PageLoader />}>
                <CommunityPage />
              </Suspense>
            ),
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
