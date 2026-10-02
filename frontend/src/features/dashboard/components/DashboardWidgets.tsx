// S21 (21.17): each widget selects ONLY what it shows, so each re-renders only when that data changes.
// Styling: styled-components (S09–S10): Card + component selectors, Meter (attrs → style), Pill (variant maps),
// and useTheme() where a colour must be passed as a VALUE rather than interpolated into CSS.
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useTheme } from 'styled-components';

import { useAppSelector } from '@/app/hooks';

import { PRIORITIES, TASK_STATUSES } from '@/shared/domain/types';
import type { IsoDate } from '@/shared/domain/types';
import { formatDue, formatPercent } from '@/shared/i18n/format';
import { Card, CardActions, CardHeader, CardTitle } from '@/shared/ui/styled/Card';
import { Meter } from '@/shared/ui/styled/Meter';
import { Pill } from '@/shared/ui/styled/Pill';
import { ProgressRing } from '@/shared/ui/styled/ProgressRing';

import {
  selectCompletionRate,
  selectOverdueTasks,
  selectPriorityCounts,
  selectStatusCounts,
} from '../state/dashboardSelectors';

import { BreakdownList, DueText, OverdueList } from './DashboardWidgets.styles';

export function CompletionWidget() {
  const counts = useAppSelector(selectStatusCounts);
  const rate = useAppSelector(selectCompletionRate); // a number: compared with ===
  const total = counts.TODO + counts.IN_PROGRESS + counts.DONE;
  const { t, i18n } = useTranslation('dashboard');
  return (
    <Card aria-labelledby="completion-heading">
      <CardTitle id="completion-heading">{t('completion.heading')}</CardTitle>
      <ProgressRing done={counts.DONE} total={total} />
      {/* `count` picks the plural form; `rate` is just interpolated (25.09) */}
      <p className="text-muted">{t('completion.summary', { count: total, rate: formatPercent(rate / 100, i18n.language) })}</p>
    </Card>
  );
}

export function StatusWidget() {
  const counts = useAppSelector(selectStatusCounts); // memoised: the same object until tasks change
  const total = counts.TODO + counts.IN_PROGRESS + counts.DONE;
  // useTheme() (10.01): the theme as a VALUE, for a prop. Here: each status's colour for its Meter.
  const theme = useTheme();
  const { t } = useTranslation(['dashboard', 'common']);
  return (
    <Card aria-labelledby="status-heading">
      <CardTitle id="status-heading">{t('byStatus')}</CardTitle>
      <BreakdownList>
        {TASK_STATUSES.map((status) => {
          const label = t(`common:status.${status}`);
          return (
            <div key={status}>
              <dt>{label}</dt>
              <dd>{counts[status]}</dd>
              <Meter
                value={counts[status]}
                max={total}
                color={theme.colors.status[status].fg}
                label={t('meter', { label, count: counts[status], total })}
              />
            </div>
          );
        })}
      </BreakdownList>
    </Card>
  );
}

export function PriorityWidget() {
  const counts = useAppSelector(selectPriorityCounts);
  const total = counts.LOW + counts.MEDIUM + counts.HIGH;
  const theme = useTheme();
  const { t } = useTranslation(['dashboard', 'common']);
  return (
    <Card aria-labelledby="priority-heading">
      <CardTitle id="priority-heading">{t('byPriority')}</CardTitle>
      <BreakdownList>
        {PRIORITIES.map((priority) => {
          const label = t(`common:priority.${priority}`);
          return (
            <div key={priority}>
              <dt>{label}</dt>
              <dd>{counts[priority]}</dd>
              <Meter
                value={counts[priority]}
                max={total}
                color={theme.colors.priority[priority]}
                label={t('meter', { label, count: counts[priority], total })}
              />
            </div>
          );
        })}
      </BreakdownList>
    </Card>
  );
}

export function OverdueWidget({ today }: { today: IsoDate }) {
  const overdue = useAppSelector((state) => selectOverdueTasks(state, today));
  const { t, i18n } = useTranslation('dashboard');
  return (
    // `as` (09.08): same Card styles, but an <article>; `$interactive`: hover elevation for a card with links
    <Card as="article" $interactive aria-labelledby="overdue-heading">
      <CardHeader>
        <CardTitle id="overdue-heading">
          {t('overdue.heading')}{' '}
          <Pill $tone={overdue.length > 0 ? 'danger' : 'success'} $appearance="solid">
            {overdue.length}
          </Pill>
        </CardTitle>
        <CardActions>
          <Link to="/tasks">{t('overdue.viewAll')}</Link>
        </CardActions>
      </CardHeader>
      {overdue.length === 0 ? (
        <p className="text-muted">{t('overdue.none')}</p>
      ) : (
        <>
          <p>{t('overdue.summary', { count: overdue.length })}</p>
          <OverdueList>
            {overdue.map((task) => (
              <li key={task.id}>
                <Link to={`/tasks/${task.id}`}>{task.title}</Link>
                {task.dueDate && (
                  <DueText>{t('overdue.due', { when: formatDue(task.dueDate, today, i18n.language) })}</DueText>
                )}
              </li>
            ))}
          </OverdueList>
        </>
      )}
    </Card>
  );
}
