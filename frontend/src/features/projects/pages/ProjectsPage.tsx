import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/app/hooks';

import { useErrorMessage } from '@/shared/i18n/useErrorMessage';

import { useGetProjectsQuery } from '../api/projectsApi';
import { ProjectCard } from '../components/ProjectCard';
import { NewProjectForm } from '../components/NewProjectForm';
import { selectAllProjects } from '../state/projectSelectors';

import styles from './ProjectsPage.module.scss';

/**
 * The query hook SUBSCRIBES (keeps the cache entry alive, gives the status); the selector READS the normalised data.
 * Both point at the same cache entry, so there is exactly one request.
 */
export function ProjectsPage() {
  const { t } = useTranslation('projects');
  const errorMessage = useErrorMessage();
  const { isLoading, error } = useGetProjectsQuery();
  const projects = useAppSelector(selectAllProjects);

  return (
    <section>
      <div className="page-head">
        <h1 className="page__title">{t('title')}</h1>
      </div>
      <div className={`panel ${styles.newProject}`}>
        <NewProjectForm />
      </div>
      {isLoading && <p className="text-muted">{t('loading')}</p>}
      {error && (
        <p role="alert" className="text-danger">
          {errorMessage(error)}
        </p>
      )}
      {!isLoading && projects.length === 0 && <p className="text-muted">{t('empty')}</p>}
      <div className={styles.grid}>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
