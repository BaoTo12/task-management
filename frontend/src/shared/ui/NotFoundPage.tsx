import { useTranslation } from 'react-i18next';

import { ButtonLink } from './ButtonLink';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <>
      <h1 className="page__title">{t('notFound.title')}</h1>
      <p className="text-muted">{t('notFound.text')}</p>
      <ButtonLink variant="primary" size="sm" to="/tasks">
        {t('notFound.back')}
      </ButtonLink>
    </>
  );
}
