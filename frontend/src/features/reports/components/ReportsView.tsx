import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { formatDate, formatPercent } from '@/shared/i18n/format';
import { Button } from '@/shared/ui/Button';
import { Stack } from '@/shared/ui/styled/Stack';

import type { ChartMode } from '../legacy/actions';
import type { ReportsViewModel } from '../legacy/selectors';

import styles from './ReportsView.module.scss';

/**
 * PRESENTATIONAL ("dumb") component: props in, JSX out. It knows nothing about Redux; ReportsContainer connects it.
 * The container/presentational split was THE classic React-Redux pattern before hooks.
 */
export interface ReportsViewProps extends ReportsViewModel {
  onRangeChange: (from: string, to: string) => void;
  onChartModeChange: (mode: ChartMode) => void;
  onRefresh: () => void;
}

const Bar = styled.span<{ $share: number }>`
  display: inline-block;
  height: 0.75rem;
  width: ${({ $share }) => Math.round($share * 100)}%;
  min-width: 2px;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 2px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 8rem 1fr 3rem;
  gap: 0.5rem;
  align-items: center;
`;

export function ReportsView(props: ReportsViewProps) {
  const { status, error, summary, filters, chartMode, completionRate, statusRows, priorityRows, busiestDay, daySeries } = props;
  const { t, i18n } = useTranslation(['reports', 'common']);

  return (
    <section className={styles.reports}>
      <Stack $direction="row" $gap={2} $align="center" $wrap>
        <label>
          {t('from')}{' '}
          <input
            type="date"
            value={filters.from ?? summary?.from ?? ''}
            onChange={(event) => props.onRangeChange(event.target.value, filters.to ?? summary?.to ?? event.target.value)}
          />
        </label>
        <label>
          {t('to')}{' '}
          <input
            type="date"
            value={filters.to ?? summary?.to ?? ''}
            onChange={(event) => props.onRangeChange(filters.from ?? summary?.from ?? event.target.value, event.target.value)}
          />
        </label>
        <Button size="sm" onClick={() => props.onChartModeChange(chartMode === 'bars' ? 'table' : 'bars')}>
          {chartMode === 'bars' ? t('asTable') : t('asBars')}
        </Button>
        <Button size="sm" onClick={props.onRefresh} disabled={status === 'loading'}>
          {status === 'loading' ? t('common:loading') : t('refresh')}
        </Button>
      </Stack>

      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {summary && (
        <>
          <p className={styles.stats}>
            {t('totals', { ...summary.totals })} · {t('completion', { rate: formatPercent(completionRate, i18n.language) })}
            {busiestDay && <> · {t('busiest', { date: formatDate(busiestDay.date, i18n.language), count: busiestDay.count })}</>}
          </p>

          <h2>{t('byStatus')}</h2>
          {statusRows.map((row) => (
            <Row key={row.key}>
              <span>{t(`common:status.${row.key}`)}</span>
              {chartMode === 'bars' ? <Bar $share={row.share} /> : <span />}
              <span>{row.value}</span>
            </Row>
          ))}

          <h2>{t('byPriority')}</h2>
          {priorityRows.map((row) => (
            <Row key={row.key}>
              <span>{t(`common:priority.${row.key}`)}</span>
              {chartMode === 'bars' ? <Bar $share={row.share} /> : <span />}
              <span>{row.value}</span>
            </Row>
          ))}

          <h2>{t('perDay')}</h2>
          {daySeries.map((day) => (
            <Row key={day.date}>
              <span>{formatDate(day.date, i18n.language)}</span>
              {chartMode === 'bars' ? <Bar $share={day.share} /> : <span />}
              <span>{day.count}</span>
            </Row>
          ))}
        </>
      )}
    </section>
  );
}
