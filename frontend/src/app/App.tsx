import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';

import { LoginPage, RequireAuth } from '@/features/auth';
import { NotificationsPage } from '@/features/notifications';
import { SettingsPage } from '@/features/preferences';
import { ProjectDetailsPage, ProjectsPage } from '@/features/projects';
import { EditTaskPage, NewTaskPage, TaskDetailsPage, TasksPage } from '@/features/tasks';

import { NotFoundPage } from '@/shared/ui/NotFoundPage';
import { LoadingBlock, Spinner } from '@/shared/ui/styled/Spinner';

import { AppLayout } from './AppLayout';

// Code splitting (12.09): the dashboard's code is downloaded on first visit.
// React.lazy expects a default export; our modules use named exports, so we adapt it.
const DashboardPage = lazy(() =>
  import('@/features/dashboard').then((module) => ({ default: module.DashboardPage })),
);
// The legacy reports screen is big and rarely used: its own chunk too. (Its REDUCER is in the root reducer
// anyway: classic code has no injection mechanism, which is one of the things MIGRATION.md fixes.)
const ReportsPage = lazy(() => import('@/features/reports').then((module) => ({ default: module.ReportsPage })));

const pageFallback = (
  <LoadingBlock>
    <Spinner aria-label="Loading" />
  </LoadingBlock>
);

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="login" element={<LoginPage />} />
        {/* S24: every page below needs a session (the API answers 401 otherwise). One guard for all. */}
        <Route element={<RequireAuth />}>
          <Route index element={<Navigate to="/tasks" replace />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/new" element={<NewTaskPage />} />
          <Route path="tasks/:id" element={<TaskDetailsPage />} />
          <Route path="tasks/:id/edit" element={<EditTaskPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route
            path="reports"
            element={
              <Suspense fallback={pageFallback}>
                <ReportsPage />
              </Suspense>
            }
          />
          <Route
            path="dashboard"
            element={
              <Suspense
                fallback={
                  <LoadingBlock>
                    <Spinner aria-label="Loading dashboard" />
                  </LoadingBlock>
                }
              >
                <DashboardPage />
              </Suspense>
            }
          />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
