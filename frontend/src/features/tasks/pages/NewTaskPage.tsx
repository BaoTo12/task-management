import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';

import { fieldErrorsOf } from '@/shared/api/api-error';
import { useAddTaskMutation } from '@/shared/api/apiSlice';
import { toErrorMessage } from '@/shared/domain/guards';
import { useToast } from '@/shared/toast/toast-context';
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs';

import { TaskForm } from '../components/TaskForm';
import { EMPTY_TASK_FORM, hasErrors, pickFormErrors, toCreateRequest } from '../model/task-form';
import type { TaskFormValues } from '../model/task-form';

export function NewTaskPage() {
  // A mutation hook returns [trigger, result]. We only need the trigger: TaskForm shows its own
  // "saving" state while onSubmit's promise is pending.
  const [addTask] = useAddTaskMutation();
  const { t } = useTranslation('tasks');
  const { show } = useToast();
  const navigate = useNavigate();
  // /tasks/new?projectId=1 (the project page's "New task" link) starts the form inside that project.
  const [searchParams] = useSearchParams();
  const presetProject = Number(searchParams.get('projectId')) || null;
  const initialValues = useMemo<TaskFormValues>(() => ({ ...EMPTY_TASK_FORM, projectId: presetProject }), [presetProject]);

  async function handleSubmit(values: TaskFormValues) {
    try {
      // unwrap(): resolves with the created Task, or throws the base query's error (22.07)
      const created = await addTask(toCreateRequest(values)).unwrap();
      // The success toast comes from a listener (21.15); the list refetches because addTask invalidates 'Task' (22.08).
      navigate(`/tasks/${created.id}`, { replace: true });
    } catch (error) {
      // A 400 with field errors (e.g. duplicate title) → show them in the form, not in a toast (19.09).
      // The error is our axiosBaseQuery's ApiErrorPayload (22.03).
      const fieldErrors = pickFormErrors(fieldErrorsOf(error) ?? {});
      if (hasErrors(fieldErrors)) return fieldErrors;
      show({ tone: 'error', message: toErrorMessage(error) });
    }
  }

  return (
    <>
      <Breadcrumbs label={t('common:breadcrumb.label')} items={[{ label: t('title'), to: '/tasks' }, { label: t('form.newTitle') }]} />
      <h1 className="page__title">{t('form.newTitle')}</h1>
      <TaskForm mode="create" initialValues={initialValues} onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
    </>
  );
}
