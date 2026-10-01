import { useTranslation } from 'react-i18next';

import { useAuth } from '@/features/auth';
import { PeoplePicker } from '@/features/people';

import { isOneOf } from '@/shared/domain/guards';
import { PROJECT_ROLES } from '@/shared/domain/types';
import type { ProjectRole } from '@/shared/domain/types';
import { useErrorMessage } from '@/shared/i18n/useErrorMessage';
import { Button } from '@/shared/ui/Button';

import { usePutMemberMutation, useRemoveMemberMutation } from '../api/projectsApi';
import { assignableRoles } from '../model/permissions';
import type { MemberRow } from '../state/projectSelectors';

interface MembersPanelProps {
  projectId: number;
  members: MemberRow[];
  myRole: ProjectRole | null;
  canManage: boolean;
}

/** The member list with role changes, removal (optimistic) and an invite through the people picker (pessimistic). */
export function MembersPanel({ projectId, members, myRole, canManage }: MembersPanelProps) {
  const { t } = useTranslation('projects');
  const { user } = useAuth();
  const errorMessage = useErrorMessage();
  const [putMember, putState] = usePutMemberMutation();
  const [removeMember, removeState] = useRemoveMemberMutation();
  const roles = assignableRoles(myRole);

  function changeRole(userId: number, value: string) {
    if (isOneOf(PROJECT_ROLES, value)) void putMember({ projectId, userId, role: value });
  }

  return (
    <section aria-labelledby="members-title">
      <h2 id="members-title">{t('membersTitle', { count: members.length })}</h2>
      <ul className="members">
        {members.map((member) => (
          <li key={member.userId}>
            <span>{member.person?.displayName ?? `#${member.userId}`}</span>{' '}
            {canManage && member.userId !== user?.id ? (
              <select
                aria-label={t('roleOf', { name: member.person?.displayName ?? member.userId })}
                value={member.role}
                onChange={(event) => changeRole(member.userId, event.target.value)}
              >
                {(roles.includes(member.role) ? roles : [member.role, ...roles]).map((role) => (
                  <option key={role} value={role} disabled={!roles.includes(role)}>
                    {t(`role.${role}`)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-muted">{t(`role.${member.role}`)}</span>
            )}
            {(canManage || member.userId === user?.id) && (
              <Button size="sm" variant="danger" onClick={() => void removeMember({ projectId, userId: member.userId })}>
                {member.userId === user?.id ? t('leave') : t('remove')}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {canManage && (
        <PeoplePicker
          label={t('invite')}
          exclude={members.map((member) => member.userId)}
          onPick={(person) => void putMember({ projectId, userId: person.id, role: 'MEMBER' })}
        />
      )}
      {(putState.error ?? removeState.error) && (
        <p role="alert" className="text-danger">
          {errorMessage(putState.error ?? removeState.error)}
        </p>
      )}
    </section>
  );
}
