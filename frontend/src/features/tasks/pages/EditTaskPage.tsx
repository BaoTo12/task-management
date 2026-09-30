import { skipToken } from '@reduxjs/toolkit/query/react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';

import { fieldErrorsOf, isNotFoundError } from '@/shared/api/api-error';
import { useGetTaskQuery, useUpdateTaskMutation } from '@/shared/api/apiSlice';
import { toErrorMessage } from '@/shared/domain/guards';
import { useToast } from '@/shared/toast/toast-context';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';
import { NotFoundPage } from '@/shared/ui/NotFoundPage';

import { TaskForm } from '../components/TaskForm';
import { backToListHref, parseTaskId } from '../model/list-link';
import { hasErrors, pickFormErrors, toCreateRequest, toFormValues } from '../model/task-form';
import type { TaskFormValues } from '../model/task-form';

export function EditTaskPage() {
  const { id: rawId } = useParams();
  const { show } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const id = parseTaskId(rawId);
  // Hooks run before any early return (08.01). `skipToken` = "no request" for an invalid id (22.05).
  const { data: task, isLoading, error } = useGetTaskQuery(id ?? skipToken);
  const [updateTask] = useUpdateTaskMutation();
  const { t } = useTranslation(['tasks', 'common']);

  if (id === null || isNotFoundError(error)) return <NotFoundPage />;
  if (isLoading) return <p className="text-muted">{t('common:loading')}</p>;
  if (!task) {
    return (
      <p role="alert" className="text-danger">
        {toErrorMessage(error)}
      </p>
    );
  }
  const existing = task; // a const the async handler can close over safely (05.07 §4)

  async function handleSubmit(values: TaskFormValues) {
    try {
      const saved = await updateTask({ id: existing.id, request: toCreateRequest(values, existing.categoryId) }).unwrap(); // PUT
      // The success toast comes from a listener (21.15): this page only decides where to go next.
      navigate(`/tasks/${saved.id}`, { replace: true, state: location.state });
    } catch (error) {
      // A 400 with field errors (e.g. duplicate title) → show them in the form, not in a toast (19.09).
      const fieldErrors = pickFormErrors(fieldErrorsOf(error) ?? {});
      if (hasErrors(fieldErrors)) return fieldErrors;
      show({ tone: 'error', message: toErrorMessage(error) });
    }
  }

  return (
    <>
      <Breadcrumbs
        label={t('common:breadcrumb.label')}
        items={[
          { label: t('title'), to: backToListHref(location.state) },
          { label: task.title, to: `/tasks/${task.id}` },
          { label: t('form.editTitle') },
        ]}
      />
      <h1 className="page__title">{t('form.editTitle')}</h1>
      <TaskForm
        key={task.id}
        mode="edit"
        initialValues={toFormValues(task)}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
      />
    </>
  );
}
