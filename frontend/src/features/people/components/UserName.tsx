import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/app/hooks';

import { selectDisplayName } from '../state/peopleSelectors';

/**
 * A person's name from the normalised people table. The selector takes an ARGUMENT: useAppSelector's callback closes
 * over `id`, and since the result is a string (a primitive), === comparison is enough: no memoization needed.
 */
export function UserName({ id }: { id: number | null | undefined }) {
  const { t } = useTranslation();
  const name = useAppSelector((state) => selectDisplayName(state, id));
  if (id == null) return <span className="text-muted">{t('people.nobody')}</span>;
  return <span>{name ?? t('people.unknown', { id })}</span>;
}
