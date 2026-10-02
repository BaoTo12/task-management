import { useReducer, useRef } from 'react';
// React's SubmitEvent, not the DOM global of the same name: this import shadows it (13B.03)
import type { SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { PRIORITIES, TASK_STATUSES } from '@/shared/domain/types';
import { useAutosizeTextarea } from '@/shared/hooks/useAutosizeTextarea';
import { Button } from '@/shared/ui/Button';
import { FormField } from '@/shared/ui/forms/FormField';
import { SelectField } from '@/shared/ui/forms/SelectField';

import { DESCRIPTION_MAX, hasErrors, localToday, TITLE_MAX, validateTaskForm } from '../model/task-form';
import { TaskPlacementFields } from './TaskPlacementFields';
import type { TaskFormErrors, TaskFormValues } from '../model/task-form';
import { initTaskForm, isTaskFormDirty, taskFormReducer, visibleError } from '../model/task-form-reducer';

interface TaskFormProps {
  initialValues: TaskFormValues;
  mode: 'create' | 'edit';
  /** May resolve with errors the SERVER found (19.09); they're shown under the fields. */
  onSubmit: (values: TaskFormValues) => Promise<TaskFormErrors | void>;
  onCancel: () => void;
}

export function TaskForm({ initialValues, mode, onSubmit, onCancel }: TaskFormProps) {
  // useReducer with a lazy initialiser (08.07): initTaskForm runs once, not on every render.
  const [state, dispatch] = useReducer(taskFormReducer, initialValues, initTaskForm);
  const { values, submitting } = state;
  // Labels translated (S27). Validation messages come from model/task-form in English: see the S27 notes.
  const { t } = useTranslation(['tasks', 'common']);
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false); // synchronous guard: state updates are not visible until the next render
  const descriptionRef = useAutosizeTextarea(values.description);

  // Derived, not state (08.05): errors are recomputed from the values on every render.
  const errors = validateTaskForm(values, localToday(), mode === 'create');
  const isDirty = isTaskFormDirty(state);
  const errorOf = (field: keyof TaskFormValues) => visibleError(state, errors, field);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault(); // stop the browser's full-page form submission
    if (submittingRef.current) return; // a second click in the same frame sees the ref, not stale state
    dispatch({ type: 'submitAttempted' });
    if (hasErrors(errors)) {
      // 11.07 §3: move focus to the first invalid field, so keyboard and screen-reader users land on the problem.
      // After the next paint: the aria-invalid attributes are written by the render this dispatch causes.
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }

    submittingRef.current = true;
    dispatch({ type: 'submitStarted' });
    try {
      const fromServer = await onSubmit(values);
      dispatch({ type: 'submitFinished', serverErrors: fromServer ?? undefined });
    } catch {
      dispatch({ type: 'submitFinished' });
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <form
      ref={formRef}
      className="form panel form--panel"
      noValidate
      onSubmit={handleSubmit}
      aria-label={mode === 'create' ? t('form.newTitle') : t('form.editTitle')}
    >
      <FormField label={t('form.title')} error={errorOf('title')} help={`${values.title.trim().length}/${TITLE_MAX}`}>
        {(control) => (
          <input
            {...control}
            className="form-field__input"
            value={values.title}
            onChange={(e) => dispatch({ type: 'fieldChanged', field: 'title', value: e.target.value })}
            onBlur={() => dispatch({ type: 'fieldBlurred', field: 'title' })}
            maxLength={TITLE_MAX + 20}
            autoComplete="off"
          />
        )}
      </FormField>

      <FormField label={t('form.description')} error={errorOf('description')}>
        {(control) => (
          <textarea
            {...control}
            ref={descriptionRef}
            className="form-field__input"
            rows={3}
            value={values.description}
            onChange={(e) => dispatch({ type: 'fieldChanged', field: 'description', value: e.target.value })}
            onBlur={() => dispatch({ type: 'fieldBlurred', field: 'description' })}
            maxLength={DESCRIPTION_MAX}
          />
        )}
      </FormField>

      {/* 13B.05: one generic component; T = TaskStatus, then T = Priority, inferred from `options` */}
      <SelectField
        label={t('form.status')}
        options={TASK_STATUSES}
        value={values.status}
        getLabel={(status) => t(`common:status.${status}`)}
        onChange={(status) => dispatch({ type: 'fieldChanged', field: 'status', value: status })}
      />

      <SelectField
        label={t('form.priority')}
        options={PRIORITIES}
        value={values.priority}
        getLabel={(priority) => t(`common:priority.${priority}`)}
        onChange={(priority) => dispatch({ type: 'fieldChanged', field: 'priority', value: priority })}
      />

      <FormField label={t('form.dueDate')} error={errorOf('dueDate')} help={t('form.optional')}>
        {(control) => (
          <input
            {...control}
            className="form-field__input"
            type="date"
            // 11.03 §4: the DOM speaks strings; '' means "no date", converted to null only in toCreateRequest
            value={values.dueDate}
            onChange={(e) => dispatch({ type: 'fieldChanged', field: 'dueDate', value: e.target.value })}
            onBlur={() => dispatch({ type: 'fieldBlurred', field: 'dueDate' })}
          />
        )}
      </FormField>

      <TaskPlacementFields
        projectId={values.projectId}
        assigneeId={values.assigneeId}
        projectError={errorOf('projectId')}
        assigneeError={errorOf('assigneeId')}
        onProjectChange={(projectId) => {
          dispatch({ type: 'fieldChanged', field: 'projectId', value: projectId });
          dispatch({ type: 'fieldChanged', field: 'assigneeId', value: null }); // members differ per project
        }}
        onAssigneeChange={(assigneeId) => dispatch({ type: 'fieldChanged', field: 'assigneeId', value: assigneeId })}
      />

      <div className="form__actions">
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? t('form.saving') : mode === 'create' ? t('form.create') : t('form.save')}
        </Button>
        <Button onClick={() => dispatch({ type: 'reset' })} disabled={!isDirty || submitting}>
          {t('form.reset')}
        </Button>
        <Button onClick={onCancel} disabled={submitting}>
          {t('form.cancel')}
        </Button>
        {isDirty && (
          <span className="text-muted" aria-live="polite">
            {t('form.unsaved')}
          </span>
        )}
      </div>
    </form>
  );
}
