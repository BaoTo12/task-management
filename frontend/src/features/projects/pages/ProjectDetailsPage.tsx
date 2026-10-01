import { skipToken } from '@reduxjs/toolkit/query/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';

import { useAppSelector } from '@/app/hooks';

import { ActivityFeed } from '@/features/activity';

import { isNotFoundError } from '@/shared/api/api-error';
import { useGetTasksQuery } from '@/shared/api/apiSlice';
import { TASK_STATUSES } from '@/shared/domain/types';
import { useErrorMessage } from '@/shared/i18n/useErrorMessage';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { Button } from '@/shared/ui/Button';
import { NotFoundPage } from '@/shared/ui/NotFoundPage';
import { Meter } from '@/shared/ui/styled/Meter';
import { Stack } from '@/shared/ui/styled/Stack';

import { useDeleteProjectMutation, useGetMembersQuery, useGetProjectQuery, useUpdateProjectMutation } from '../api/projectsApi';
import { MembersPanel } from '../components/MembersPanel';
import { canArchive } from '../model/permissions';
import { makeSelectProjectView, projectTasksQuery } from '../state/projectSelectors';

/**
 * One project: progress, its tasks by status, the members (with role management) and the activity feed.
 * Three SUBSCRIPTIONS (project, members, tasks) and ONE structured selector that joins them for rendering.
 */
export function ProjectDetailsPage() {
  const { id: rawId } = useParams();
  const projectId = Number(rawId);
  const valid = Number.isInteger(projectId) && projectId > 0;
  const { t } = useTranslation(['projects', 'common']);
  const errorMessage = useErrorMessage();
  const navigate = useNavigate();

  const { error, isLoading } = useGetProjectQuery(valid ? projectId : skipToken);
  useGetMembersQuery(valid ? projectId : skipToken);
  useGetTasksQuery(valid ? projectTasksQuery(projectId) : skipToken);
  const [updateProject] = useUpdateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();

  // One memoized selector PER PAGE INSTANCE (the factory pattern): its cache is keyed on this page's projectId.
  const selectView = useMemo(makeSelectProjectView, []);
  const view = useAppSelector((state) => selectView(state, projectId));

  if (!valid || isNotFoundError(error)) return <NotFoundPage />;
  if (isLoading || !view.project) return <p className="text-muted">{t('common:loading')}</p>;
  if (error) {
    return (
      <p role="alert" className="text-danger">
        {errorMessage(error)}
      </p>
    );
  }
  const { project, members, tasksByStatus, progress, myRole, canEdit, canManage } = view;

  return (
    <article>
      <Breadcrumbs label={t('common:breadcrumb.label')} items={[{ label: t('title'), to: '/projects' }, { label: project.name }]} />
      <h1 className="page__title">{project.name}</h1>
      {project.description && <p>{project.description}</p>}
      <Meter value={progress.done} max={Math.max(progress.total, 1)} color={project.color} label={t('progress', progress)} />

      <Stack $direction="row" $gap={2}>
        <Link className="btn btn--primary btn--sm" to={`/tasks/new?projectId=${project.id}`}>
          {t('newTask')}
        </Link>
        {canEdit && (
          <Button size="sm" onClick={() => void updateProject({ id: project.id, changes: { name: promptName(project.name) } })}>
            {t('rename')}
          </Button>
        )}
        {canArchive(myRole) && (
          <Button size="sm" onClick={() => void updateProject({ id: project.id, changes: { archived: !project.archived } })}>
            {project.archived ? t('unarchive') : t('archive')}
          </Button>
        )}
        {canArchive(myRole) && (
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              navigate('/projects', { replace: true });
              void deleteProject(project.id);
            }}
          >
            {t('delete')}
          </Button>
        )}
      </Stack>

      <section aria-labelledby="project-tasks">
        <h2 id="project-tasks">{t('tasks')}</h2>
        <div className="board">
          {TASK_STATUSES.map((status) => (
            <div key={status} className="board__column">
              <h3>
                {t(`common:status.${status}`)} ({tasksByStatus[status].length})
              </h3>
              <ul>
                {tasksByStatus[status].map((task) => (
                  <li key={task.id}>
                    <Link to={`/tasks/${task.id}`}>{task.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <MembersPanel projectId={project.id} members={members} myRole={myRole} canManage={canManage} />
      <ActivityFeed kind="project" id={project.id} />
    </article>
  );
}

/** window.prompt keeps the demo small; a real app would use an inline edit (see TaskCard's title editing). */
function promptName(current: string): string {
  const answer = window.prompt('Project name', current);
  return answer?.trim() || current;
}
