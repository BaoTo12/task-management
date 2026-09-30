import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/hooks';

import { selectionCleared } from '@/features/ui';

import { apiSlice, useDeleteTasksMutation } from '@/shared/api/apiSlice';
import { formatList } from '@/shared/i18n/format';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import type { ConfirmDialogHandle } from '@/shared/ui/ConfirmDialog';
import { Stack } from '@/shared/ui/styled/Stack';

import { selectTasks } from '../state/taskSelectors';

/**
 * S27 bulk actions on the selected tasks (ui.selectedTaskIds, since S15).
 * - Mark done: one optimistic PATCH per task (23.05), so each card flips at once and rolls back on its own.
 * - Delete: ONE `deleteTasks` mutation, optimistic removal from every list; partial failures come back with the
 *   LIST refetch, and a toast counts them. Failed ids stay selected (uiSlice), ready for a retry.
 */
export function BulkBar() {
  const selectedIds = useAppSelector((state) => state.ui.selectedTaskIds);
  const dispatch = useAppDispatch();
  const [deleteTasks, { isLoading: isDeleting }] = useDeleteTasksMutation();
  const allTasks = useAppSelector(selectTasks); // memoised: the same array until the list changes
  const confirmDialog = useRef<ConfirmDialogHandle>(null);
  const { t, i18n } = useTranslation(['tasks', 'common']);

  if (selectedIds.length === 0) return null;
  const count = selectedIds.length;

  function completeAll() {
    for (const id of selectedIds) {
      void dispatch(apiSlice.endpoints.patchTask.initiate({ id, changes: { status: 'DONE' } }));
    }
    dispatch(selectionCleared());
  }

  async function deleteAll() {
    // Name the tasks when there are few (Intl.ListFormat, 25.10): "Delete “A”, “B”, and “C”?"; count them otherwise.
    const titles = allTasks.filter((task) => selectedIds.includes(task.id)).map((task) => `“${task.title}”`);
    const message =
      titles.length > 0 && titles.length <= 3
        ? t('bulk.deleteListConfirm', { titles: formatList(titles, i18n.language) })
        : t('bulk.deleteConfirm', { count });
    const confirmed = await confirmDialog.current?.confirm({
      title: t('bulk.delete'),
      message,
      confirmLabel: t('bulk.delete'),
      cancelLabel: t('common:confirm.cancel'),
    });
    if (!confirmed) return;
    void deleteTasks([...selectedIds]);
  }

  return (
    <Stack role="toolbar" aria-label={t('bulk.label')} $direction="row" $gap={2} $align="center" $wrap>
      <strong>{t('bulk.selected', { count })}</strong>
      <Button size="sm" variant="primary" onClick={completeAll}>
        {t('bulk.complete')}
      </Button>
      <Button size="sm" variant="danger" onClick={() => void deleteAll()} disabled={isDeleting}>
        {t('bulk.delete')}
      </Button>
      <Button size="sm" variant="secondary" onClick={() => dispatch(selectionCleared())}>
        {t('bulk.clear')}
      </Button>
      <ConfirmDialog ref={confirmDialog} />
    </Stack>
  );
}
