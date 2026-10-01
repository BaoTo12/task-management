import { createSelector } from '@reduxjs/toolkit';
import type { EntityState } from '@reduxjs/toolkit';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/app/hooks';

import { useAuth } from '@/features/auth';
import { makeSelectPeople } from '@/features/people';
import { canAddTasks, membersAdapter, selectActiveProjects, useGetMembersQuery, useGetProjectsQuery } from '@/features/projects';

import type { Member } from '@/shared/domain/types';
import { FormField } from '@/shared/ui/forms/FormField';

interface TaskPlacementFieldsProps {
  projectId: number | null;
  assigneeId: number | null;
  projectError?: string;
  assigneeError?: string;
  onProjectChange: (projectId: number | null) => void;
  onAssigneeChange: (assigneeId: number | null) => void;
}

const { selectAll: selectAllMembers } = membersAdapter.getSelectors();

/**
 * Project and assignee: data from THREE caches (projects, the chosen project's members, the people table), joined here.
 * `selectFromResult` keeps only the member ids this component needs from the members cache entry.
 * Rules mirrored from the server (TaskService.checkPlacement): only projects you may add tasks to; in a project,
 * any member who can edit; outside a project, only yourself.
 */
export function TaskPlacementFields(props: TaskPlacementFieldsProps) {
  const { projectId, assigneeId, projectError, assigneeError, onProjectChange, onAssigneeChange } = props;
  const { t } = useTranslation('tasks');
  const { user } = useAuth();
  useGetProjectsQuery();
  const projects = useAppSelector(selectActiveProjects).filter((project) => canAddTasks(project.myRole));
  // selectFromResult runs on every cache update: derive with a MEMOIZED selector, or the new array each time would
  // make the component re-render on every change of any cache entry (the RTK Query docs' pattern).
  const selectEditorIds = useMemo(
    () =>
      createSelector([(data: EntityState<Member, number> | undefined) => data], (data) =>
        data ? selectAllMembers(data).filter((m) => m.role !== 'VIEWER').map((m) => m.userId) : NO_IDS,
      ),
    [],
  );
  const { memberIds } = useGetMembersQuery(projectId ?? skipToken, {
    selectFromResult: ({ data }) => ({ memberIds: selectEditorIds(data) }),
  });
  const selectPeople = useMemo(makeSelectPeople, []);
  const candidates = useAppSelector((state) => selectPeople(state, memberIds));

  return (
    <>
      <FormField label={t('form.project')} error={projectError}>
        {(control) => (
          <select
            {...control}
            className="form-field__input"
            value={projectId ?? ''}
            onChange={(event) => onProjectChange(event.target.value === '' ? null : Number(event.target.value))}
          >
            <option value="">{t('form.noProject')}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        )}
      </FormField>
      <FormField label={t('form.assignee')} error={assigneeError}>
        {(control) => (
          <select
            {...control}
            className="form-field__input"
            value={assigneeId ?? ''}
            onChange={(event) => onAssigneeChange(event.target.value === '' ? null : Number(event.target.value))}
          >
            <option value="">{t('form.unassigned')}</option>
            {projectId === null
              ? user && <option value={user.id}>{t('form.me', { name: user.displayName })}</option>
              : candidates.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.displayName}
                  </option>
                ))}
          </select>
        )}
      </FormField>
    </>
  );
}

const NO_IDS: number[] = [];
