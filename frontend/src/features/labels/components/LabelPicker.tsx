import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/app/hooks';

import { useErrorMessage } from '@/shared/i18n/useErrorMessage';
import { Button } from '@/shared/ui/Button';

import { useCreateLabelMutation, useGetLabelsQuery, useSetTaskLabelsMutation } from '../api/labelsApi';
import { selectAllLabels } from '../state/labelSelectors';

/** Tick labels on a task (optimistic), or create a new one and tick it. */
export function LabelPicker({ taskId, labelIds, canEdit }: { taskId: number; labelIds: readonly number[]; canEdit: boolean }) {
  const { t } = useTranslation('work');
  const errorMessage = useErrorMessage();
  useGetLabelsQuery();                                                     // subscribe: keeps the labels cached
  const labels = useAppSelector(selectAllLabels);
  const [setTaskLabels, saving] = useSetTaskLabelsMutation();
  const [createLabel, creating] = useCreateLabelMutation();
  const [name, setName] = useState('');

  function toggle(labelId: number) {
    const next = labelIds.includes(labelId) ? labelIds.filter((id) => id !== labelId) : [...labelIds, labelId];
    void setTaskLabels({ taskId, labelIds: next });
  }

  async function handleCreate() {
    try {
      const label = await createLabel({ name: name.trim(), color: '#64748b' }).unwrap();
      setName('');
      void setTaskLabels({ taskId, labelIds: [...labelIds, label.id] });
    } catch {
      // creating.error renders below
    }
  }

  return (
    <fieldset className="label-picker" disabled={!canEdit}>
      <legend>{t('labels.title')}</legend>
      {labels.map((label) => (
        <label key={label.id} className="checkbox">
          <input type="checkbox" checked={labelIds.includes(label.id)} onChange={() => toggle(label.id)} /> {label.name}
        </label>
      ))}
      {canEdit && (
        <span className="form--inline">
          <input aria-label={t('labels.new')} value={name} onChange={(event) => setName(event.target.value)} maxLength={30} />
          <Button size="sm" disabled={name.trim() === '' || creating.isLoading} onClick={() => void handleCreate()}>
            {t('labels.create')}
          </Button>
        </span>
      )}
      {(saving.error ?? creating.error) && (
        <p role="alert" className="text-danger">
          {errorMessage(saving.error ?? creating.error)}
        </p>
      )}
    </fieldset>
  );
}
