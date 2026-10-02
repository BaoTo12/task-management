import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { fieldErrorsOf } from '@/shared/api/api-error';
import { useErrorMessage } from '@/shared/i18n/useErrorMessage';
import { Button } from '@/shared/ui/Button';

import { useCreateProjectMutation } from '../api/projectsApi';

/** The lamp amber (#rrggbb: the API stores a hex colour, not a CSS variable). */
const DEFAULT_PROJECT_COLOR = '#f5a524';

/** Create a project, then open it. `.unwrap()` turns the mutation's result into a promise that THROWS on error. */
export function NewProjectForm() {
  const { t } = useTranslation('projects');
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const [createProject, { isLoading, error }] = useCreateProjectMutation();
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_PROJECT_COLOR);
  const nameError = fieldErrorsOf(error)?.name;

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const project = await createProject({ name: name.trim(), color }).unwrap();
      navigate(`/projects/${project.id}`);
    } catch {
      // `error` (from the hook) renders the message below
    }
  }

  return (
    <form className="form form--inline" onSubmit={(event) => void handleSubmit(event)}>
      <label>
        {t('form.name')}
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required />
      </label>
      <label>
        {t('form.color')}
        <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
      </label>
      <Button variant="primary" type="submit" disabled={isLoading || name.trim() === ''}>
        {isLoading ? t('form.creating') : t('form.create')}
      </Button>
      {error && (
        <p role="alert" className="text-danger">
          {nameError ?? errorMessage(error)}
        </p>
      )}
    </form>
  );
}
