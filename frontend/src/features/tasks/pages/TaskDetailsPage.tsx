import { skipToken } from '@reduxjs/toolkit/query/react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';

import { useAppSelector } from '@/app/hooks';

import { ActivityFeed } from '@/features/activity';
import { useAuth } from '@/features/auth';
import { CommentsSection } from '@/features/comments';
import { LabelChips, LabelPicker } from '@/features/labels';
import { UserName } from '@/features/people';
import { rememberLastTask } from '@/features/preferences';
import { selectProjectById } from '@/features/projects';
import { ChecklistSection } from '@/features/subtasks';
import { TimeSection } from '@/features/timeTracking';

import { isNotFoundError } from '@/shared/api/api-error';
import { useDeleteTaskMutation, useGetTaskQuery, usePatchTaskMutation } from '@/shared/api/apiSlice';
import { isPriority } from '@/shared/domain/guards';
import { PRIORITIES } from '@/shared/domain/types';
import { useToday } from '@/shared/hooks/useToday';
import { formatDue } from '@/shared/i18n/format';
import { useErrorMessage } from '@/shared/i18n/useErrorMessage';
import { LinkifiedText } from '@/shared/security/RichText';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { Button } from '@/shared/ui/Button';
import { ButtonLink } from '@/shared/ui/ButtonLink';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import type { ConfirmDialogHandle } from '@/shared/ui/ConfirmDialog';
import { NotFoundPage } from '@/shared/ui/NotFoundPage';
import { Stack } from '@/shared/ui/styled/Stack';

import { PriorityBadge, StatusBadge } from '../components/Badge';
import { PriorityBar } from '../components/PriorityBar';
import { backToListHref, parseTaskId } from '../model/list-link';
import { canEditTask } from '../model/task-access';

export function TaskDetailsPage() {
  const { id: rawId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const backHref = backToListHref(location.state);
  // The dialog's imperative handle (useImperativeHandle inside ConfirmDialog): { confirm(options) → Promise<boolean> }.
  const confirmDialog = useRef<ConfirmDialogHandle>(null);

  const id = parseTaskId(rawId);
  // Its OWN cache entry (getTask(id)): a direct visit to /tasks/5 works without the list (22.09).
  const { data: task, isLoading, error } = useGetTaskQuery(id ?? skipToken);
  const [deleteTask, deletion] = useDeleteTaskMutation();
  const [patchTask] = usePatchTaskMutation();
  const { t, i18n } = useTranslation(['tasks', 'common']);
  const errorMessage = useErrorMessage();
  const today = useToday();
  const loadedId = task?.id;
  const project = useAppSelector((state) => (task?.projectId ? selectProjectById(state, task.projectId) : undefined));
  // 24.16: remember the last task this user OPENED (a session cookie), once it really loaded.
  useEffect(() => {
    if (loadedId !== undefined) rememberLastTask(loadedId);
  }, [loadedId]);

  if (id === null) return <NotFoundPage />;
  // Just deleted, navigation still pending (router updates are transitions, 13.13): show nothing meanwhile.
  if (deletion.isSuccess || deletion.isLoading) return null;
  if (isNotFoundError(error)) return <NotFoundPage />;
  if (isLoading) return <p className="text-muted">{t('common:loading')}</p>;
  if (!task) {
    return (
      <p role="alert" className="text-danger">
        {errorMessage(error)}
      </p>
    );
  }
  const current = task; // a const the async handler can close over safely (05.07 §4)
  const editable = canEditTask(task, user, project?.myRole);

  async function handleDelete() {
    const confirmed = await confirmDialog.current?.confirm({
      title: t('details.delete'),
      message: t('details.deleteConfirm', { title: current.title }),
      confirmLabel: t('details.delete'),
      cancelLabel: t('common:confirm.cancel'),
    });
    if (!confirmed) return;
    // OPTIMISTIC (23.05): leave at once; the lists already hide the task. If the DELETE fails, the task comes back
    // (patch undo) and a listener shows the error toast. Leaving first also unsubscribes getTask(id), so its
    // invalidation removes the entry instead of refetching it: no more wasted GET → 404 (22.09).
    navigate(backHref, { replace: true }); // the deleted URL leaves history
    void deleteTask(current.id);
  }

  function handlePriority(value: string) {
    // OPTIMISTIC via patchTask (23.13): the badge changes now, and rolls back if the server refuses.
    if (isPriority(value) && value !== current.priority) void patchTask({ id: current.id, changes: { priority: value } });
  }

  return (
    <article>
      <Breadcrumbs label={t('details.breadcrumb')} items={[{ label: t('title'), to: backHref }, { label: task.title }]} />
      <h1 className="page__title">{task.title}</h1>
      <Stack $direction="row" $gap={2} $align="center">
        <StatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
        <PriorityBar priority={task.priority} />
        {user && (
          <label className="text-muted">
            {t('details.priority')}{' '}
            <select value={task.priority} onChange={(e) => handlePriority(e.target.value)}>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {t(`common:priority.${priority}`)}
                </option>
              ))}
            </select>
          </label>
        )}
      </Stack>
            {/* `[label](url)` links become SafeLinks (26.06); everything else stays text. */}
      <p>{task.description ? <LinkifiedText text={task.description} /> : <span className="text-muted">{t('details.noDescription')}</span>}</p>
      <p className="text-muted">
        {t('details.due', { date: task.dueDate ? formatDue(task.dueDate, today, i18n.language) : t('details.noDueDate') })}
      </p>
      <Stack $direction="row" $gap={2}>
        <ButtonLink variant="primary" size="sm" to={`/tasks/${task.id}/edit`} state={location.state}>
          {t('details.edit')}
        </ButtonLink>
        <ButtonLink size="sm" to={backHref}>
          {t('details.back')}
        </ButtonLink>
        {/* Hidden for anonymous users: UX only. The API decides who may delete (12.07). */}
        {user && (
          <Button size="sm" variant="danger" onClick={() => void handleDelete()}>
            {t('details.delete')}
          </Button>
        )}
      </Stack>
      <dl className="task__placement">
        <dt>{t('details.project')}</dt>
        <dd>{project ? <Link to={`/projects/${project.id}`}>{project.name}</Link> : t('form.noProject')}</dd>
        <dt>{t('details.assignee')}</dt>
        <dd>
          <UserName id={task.assigneeId} />
        </dd>
      </dl>
      <LabelChips labelIds={task.labelIds} />
      <LabelPicker taskId={task.id} labelIds={task.labelIds} canEdit={editable} />
      <ChecklistSection taskId={task.id} canEdit={editable} />
      <TimeSection taskId={task.id} canEdit={editable} />
      <CommentsSection taskId={task.id} />
      <ActivityFeed kind="task" id={task.id} />
      <ConfirmDialog ref={confirmDialog} />
    </article>
  );
}
