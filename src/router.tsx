import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppShell } from '@/pages/layout/AppShell';
import { LoadingOverlay } from '@/components/LoadingOverlay';

const DashboardPage = lazy(() => import('@/pages/Dashboard'));
const ScenariosListPage = lazy(() => import('@/pages/ScenariosList'));
const ScenarioEditorPage = lazy(() => import('@/pages/ScenarioEditor'));
const ExecutionViewerPage = lazy(() => import('@/pages/ExecutionViewer'));
const ExecutionsListPage = lazy(() => import('@/pages/ExecutionsList'));
const SessionsListPage = lazy(() => import('@/pages/SessionsList'));
const AtomicsListPage = lazy(() => import('@/pages/AtomicsList'));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingOverlay visible />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <SuspenseWrapper>
            <DashboardPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'scenarios',
        element: (
          <SuspenseWrapper>
            <ScenariosListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'editor/new',
        element: (
          <SuspenseWrapper>
            <ScenarioEditorPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'editor/:id',
        element: (
          <SuspenseWrapper>
            <ScenarioEditorPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'atomics',
        element: (
          <SuspenseWrapper>
            <AtomicsListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'sessions',
        element: (
          <SuspenseWrapper>
            <SessionsListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'executions',
        element: (
          <SuspenseWrapper>
            <ExecutionsListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'execution/:executionId',
        element: (
          <SuspenseWrapper>
            <ExecutionViewerPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
