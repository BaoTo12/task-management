import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/hooks';

import { useErrorMessage } from '@/shared/i18n/useErrorMessage';
import { redoAction, undoAction } from '@/shared/state/undoable';
import { Button } from '@/shared/ui/Button';
import { Meter } from '@/shared/ui/styled/Meter';
import { Stack } from '@/shared/ui/styled/Stack';

import {
  useAddSubtaskMutation,
  useDeleteSubtaskMutation,
  useGetSubtasksQuery,
  useReorderSubtasksMutation,
  useUpdateSubtaskMutation,
} from '../api/subtasksApi';
import { draftClosed, draftStarted, itemMoved, itemRenamed } from '../state/checklistDraft';
import { selectCanRedoDraft, selectCanUndoDraft, selectChecklistDraft, selectIsEditingChecklist } from '../state/checklistSelectors';

/**
 * A task's checklist. Two modes:
 *   normal: tick, add, delete, each an RTK Query mutation (ticking is optimistic)
 *   edit:   a LOCAL draft (Redux, with undo/redo) for order and titles; Save sends ONE reorder request
 */
export function ChecklistSection({ taskId, canEdit }: { taskId: number; canEdit: boolean }) {
  const { t } = useTranslation('work');
  const dispatch = useAppDispatch();
  const errorMessage = useErrorMessage();
  const { data: subtasks = [], isLoading } = useGetSubtasksQuery(taskId);
  const [addSubtask, adding] = useAddSubtaskMutation();
  const [updateSubtask] = useUpdateSubtaskMutation();
  const [deleteSubtask] = useDeleteSubtaskMutation();
  const [reorderSubtasks, reordering] = useReorderSubtasksMutation();
  const [title, setTitle] = useState('');

  const editing = useAppSelector((state) => selectIsEditingChecklist(state, taskId));
  const draft = useAppSelector(selectChecklistDraft);
  const undoable = useAppSelector(selectCanUndoDraft);
  const redoable = useAppSelector(selectCanRedoDraft);
  const done = subtasks.filter((subtask) => subtask.done).length;

  async function handleAdd(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (title.trim() === '') return;
    try {
      await addSubtask({ taskId, title: title.trim() }).unwrap();
      setTitle('');
    } catch {
      // adding.error renders below
    }
  }

  async function handleSaveDraft() {
    const renamed = draft.items.filter((item) => subtasks.find((s) => s.id === item.id)?.title !== item.title);
    try {
      await Promise.all(renamed.map((item) => updateSubtask({ taskId, id: item.id, changes: { title: item.title } }).unwrap()));
      await reorderSubtasks({ taskId, ids: draft.items.map((item) => item.id) }).unwrap();
      dispatch(draftClosed());
    } catch {
      // reordering.error renders below; the draft stays open
    }
  }

  return (
    <section aria-labelledby="checklist-title" className="checklist">
      <h2 id="checklist-title">{t('checklist.title', { done, total: subtasks.length })}</h2>
      {subtasks.length > 0 && <Meter value={done} max={subtasks.length} label={t('checklist.progress', { done, total: subtasks.length })} />}
      {isLoading && <p className="text-muted">{t('loading')}</p>}

      {editing ? (
        <>
          <ol>
            {draft.items.map((item, index) => (
              <li key={item.id}>
                <input
                  key={item.title /* undo/redo changes the title: a new key remounts the uncontrolled input */}
                  aria-label={t('checklist.rename')}
                  defaultValue={item.title}
                  onBlur={(event) => dispatch(itemRenamed(item.id, event.target.value))}
                />
                <Button size="sm" aria-label={t('checklist.up')} disabled={index === 0} onClick={() => dispatch(itemMoved({ from: index, to: index - 1 }))}>
                  ↑
                </Button>
                <Button
                  size="sm"
                  aria-label={t('checklist.down')}
                  disabled={index === draft.items.length - 1}
                  onClick={() => dispatch(itemMoved({ from: index, to: index + 1 }))}
                >
                  ↓
                </Button>
              </li>
            ))}
          </ol>
          <Stack $direction="row" $gap={2}>
            <Button size="sm" disabled={!undoable} onClick={() => dispatch(undoAction('checklistDraft'))}>
              {t('checklist.undo')}
            </Button>
            <Button size="sm" disabled={!redoable} onClick={() => dispatch(redoAction('checklistDraft'))}>
              {t('checklist.redo')}
            </Button>
            <Button size="sm" variant="primary" disabled={reordering.isLoading} onClick={() => void handleSaveDraft()}>
              {t('checklist.save')}
            </Button>
            <Button size="sm" onClick={() => dispatch(draftClosed())}>
              {t('checklist.cancel')}
            </Button>
          </Stack>
        </>
      ) : (
        <ul className="checklist__items">
          {subtasks.map((subtask) => (
            <li key={subtask.id} className={subtask.done ? 'checklist__item--done' : undefined}>
              <label>
                <input
                  type="checkbox"
                  checked={subtask.done}
                  disabled={!canEdit}
                  onChange={() => void updateSubtask({ taskId, id: subtask.id, changes: { done: !subtask.done } })}
                />{' '}
                {subtask.title}
              </label>
              {canEdit && (
                <Button size="sm" variant="danger" aria-label={t('checklist.delete')} onClick={() => void deleteSubtask({ taskId, id: subtask.id })}>
                  ×
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && !editing && (
        <Stack $direction="row" $gap={2}>
          <form className="form--inline" onSubmit={(event) => void handleAdd(event)}>
            <input aria-label={t('checklist.new')} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} />
            <Button size="sm" type="submit" disabled={adding.isLoading}>
              {t('checklist.add')}
            </Button>
          </form>
          {subtasks.length > 1 && (
            <Button size="sm" onClick={() => dispatch(draftStarted(taskId, subtasks))}>
              {t('checklist.edit')}
            </Button>
          )}
        </Stack>
      )}
      {(adding.error ?? reordering.error) && (
        <p role="alert" className="text-danger">
          {errorMessage(adding.error ?? reordering.error)}
        </p>
      )}
    </section>
  );
}
