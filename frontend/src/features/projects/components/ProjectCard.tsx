import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { Project } from '@/shared/domain/types';
import { Card, CardHeader, CardTitle } from '@/shared/ui/styled/Card';
import { Pill } from '@/shared/ui/styled/Pill';
import { Tag } from '@/shared/ui/styled/Tag';

/** memo: the list re-renders when ONE project changes; the others' props (same entity objects) are unchanged. */
export const ProjectCard = memo(function ProjectCard({ project }: { project: Project }) {
  const { t } = useTranslation('projects');
  return (
    <Card $interactive>
      <CardHeader>
        <Tag label="" color={project.color} />
        <CardTitle>
          <Link to={`/projects/${project.id}`}>{project.name}</Link>
        </CardTitle>
        {project.archived && <Pill $tone="neutral">{t('archived')}</Pill>}
      </CardHeader>
      {project.description && <p className="text-muted">{project.description}</p>}
      <p className="text-muted">
        {t(`role.${project.myRole}`)} · {t('members', { count: project.memberCount })}
      </p>
    </Card>
  );
});
