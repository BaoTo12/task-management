import { skipToken } from '@reduxjs/toolkit/query/react';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';

import { useAppSelector } from '@/app/hooks';

import { ActivityFeed } from '@/features/activity';

import { isNotFoundError } from '@/shared/api/api-error';
import { useGetTasksQuery } from '@/shared/api/apiSlice';
import { isSafeHexColor } from '@/shared/domain/color';
import { TASK_STATUSES } from '@/shared/domain/types';
import { useErrorMessage } from '@/shared/i18n/useErrorMessage';
import { theme } from '@/shared/theme/theme';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { Button } from '@/shared/ui/Button';
import { ButtonLink } from '@/shared/ui/ButtonLink';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import type { ConfirmDialogHandle } from '@/shared/ui/ConfirmDialog';
import { NotFoundPage } from '@/shared/ui/NotFoundPage';
import { Meter } from '@/shared/ui/styled/Meter';

import { useDeleteProjectMutation, useGetMembersQuery, useGetProjectQuery, useUpdateProjectMutation } from '../api/projectsApi';
import { MembersPanel } from '../components/MembersPanel';
import { canArchive } from '../model/permissions';
import { makeSelectProjectView, projectTasksQuery } from '../state/projectSelectors';

import styles from './ProjectDetailsPage.module.scss';

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
  const confirmDialog = useRef<ConfirmDialogHandle>(null);

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
  // The colour comes from the API: untrusted, so it's validated before it reaches CSS (like Tag does).
  const progressColor = isSafeHexColor(project.color) ? project.color : theme.colors.primary;

  function handleRename() {
    // window.prompt keeps the demo small; a real app would use an inline edit (see TaskCard's title editing).
    const answer = window.prompt(t('renamePrompt'), project.name)?.trim();
    if (!answer || answer === project.name) return; // cancelled or unchanged: no request
    void updateProject({ id: project.id, changes: { name: answer } });
  }

  async function handleDelete() {
    const confirmed = await confirmDialog.current?.confirm({
      title: t('delete'),
      message: t('deleteConfirm', { name: project.name }),
      confirmLabel: t('delete'),
      cancelLabel: t('common:confirm.cancel'),
    });
    if (!confirmed) return;
    // Leave first (the page would otherwise refetch a project that no longer exists), then delete.
    navigate('/projects', { replace: true });
    void deleteProject(project.id);
  }

  return (
    <article>
      <Breadcrumbs label={t('common:breadcrumb.label')} items={[{ label: t('title'), to: '/projects' }, { label: project.name }]} />
      <header className="detail-head">
        <h1 className="page__title">{project.name}</h1>
        {project.description && <p className="detail-head__lead">{project.description}</p>}
        <Meter value={progress.done} max={Math.max(progress.total, 1)} color={progressColor} label={t('progress', progress)} />
      </header>

      <div className="toolbar">
        <ButtonLink variant="primary" size="sm" to={`/tasks/new?projectId=${project.id}`}>
          {t('newTask')}
        </ButtonLink>
        {canEdit && (
          <Button size="sm" onClick={handleRename}>
            {t('rename')}
          </Button>
        )}
        {canArchive(myRole) && (
          <Button size="sm" onClick={() => void updateProject({ id: project.id, changes: { archived: !project.archived } })}>
            {project.archived ? t('unarchive') : t('archive')}
          </Button>
        )}
        {canArchive(myRole) && (
          <Button size="sm" variant="danger" onClick={() => void handleDelete()}>
            {t('delete')}
          </Button>
        )}
      </div>

      <section aria-labelledby="project-tasks">
        <h2 id="project-tasks" className={styles.sectionTitle}>
          {t('tasks')}
        </h2>
        <div className={styles.board}>
          {TASK_STATUSES.map((status) => (
            <div key={status} className={styles.column}>
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

      <div className={`detail-layout ${styles.people}`}>
        <MembersPanel projectId={project.id} members={members} myRole={myRole} canManage={canManage} />
        <ActivityFeed kind="project" id={project.id} />
      </div>
      <ConfirmDialog ref={confirmDialog} />
    </article>
  );
}
