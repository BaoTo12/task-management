import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { UserSummary } from '@/shared/domain/types';
import { useDebounce } from '@/shared/hooks/useDebounce';

import { useLazySearchUsersQuery } from '../api/usersApi';

interface PeoplePickerProps {
  label: string;
  /** People not to offer (already members). */
  exclude?: readonly number[];
  onPick: (user: UserSummary) => void;
}

/**
 * Search-as-you-type with a LAZY query: `trigger(q)` runs the request when WE decide (after the debounce), and
 * `preferCacheValue: true` reuses a cached answer for a query typed before.
 */
export function PeoplePicker({ label, exclude = [], onPick }: PeoplePickerProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const [text, setText] = useState('');
  const debounced = useDebounce(text.trim(), 250);
  const [trigger, { data: found = [], isFetching }] = useLazySearchUsersQuery();

  useEffect(() => {
    if (debounced.length > 0) void trigger(debounced, true);
  }, [debounced, trigger]);

  const options = found.filter((user) => !exclude.includes(user.id));
  return (
    <div className="people-picker">
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} type="search" value={text} onChange={(event) => setText(event.target.value)} autoComplete="off" />
      {isFetching && <span className="text-muted">{t('loading')}</span>}
      {debounced.length > 0 && !isFetching && options.length === 0 && <p className="text-muted">{t('people.noMatch')}</p>}
      <ul className="people-picker__results">
        {options.map((user) => (
          <li key={user.id}>
            <button
              type="button"
              className="btn btn--sm btn--secondary"
              onClick={() => {
                onPick(user);
                setText('');
              }}
            >
              {user.displayName} <span className="text-muted">@{user.username}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
