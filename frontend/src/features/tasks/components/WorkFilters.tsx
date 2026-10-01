import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/app/hooks';

import { makeSelectTaskIdsByLabel, selectAllLabels, useGetLabelsQuery } from '@/features/labels';
import { selectActiveProjects } from '@/features/projects';

import { Stack } from '@/shared/ui/styled/Stack';

import { selectTasks } from '../state/taskSelectors';

/** Built ONCE at module level: the inverted index over the app-wide task list (one shared memoized instance). */
const selectTaskIdsByLabel = makeSelectTaskIdsByLabel(selectTasks);

interface WorkFiltersProps {
  projectId: number | null;
  labelId: number | null;
  mine: boolean;
  onChange: (name: 'project' | 'label' | 'mine', value: string | null) => void;
}

/**
 * The team filters of the list: project, label (with how many tasks carry each one, from the inverted index), and
 * "assigned to me". They only write URL parameters; TasksPage turns them into the server query.
 */
export function WorkFilters({ projectId, labelId, mine, onChange }: WorkFiltersProps) {
  const { t } = useTranslation('tasks');
  useGetLabelsQuery();
  const projects = useAppSelector(selectActiveProjects);
  const labels = useAppSelector(selectAllLabels);
  const byLabel = useAppSelector(selectTaskIdsByLabel);

  return (
    <Stack $direction="row" $gap={3} $align="center" $wrap>
      <label>
        {t('filters.project')}{' '}
        <select value={projectId ?? ''} onChange={(event) => onChange('project', event.target.value || null)}>
          <option value="">{t('filters.allProjects')}</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t('filters.label')}{' '}
        <select value={labelId ?? ''} onChange={(event) => onChange('label', event.target.value || null)}>
          <option value="">{t('filters.allLabels')}</option>
          {labels.map((label) => (
            <option key={label.id} value={label.id}>
              {label.name} ({byLabel[label.id]?.length ?? 0})
            </option>
          ))}
        </select>
      </label>
      <label>
        <input type="checkbox" checked={mine} onChange={(event) => onChange('mine', event.target.checked ? '1' : null)} />{' '}
        {t('filters.mine')}
      </label>
    </Stack>
  );
}
