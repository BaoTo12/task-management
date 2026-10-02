import { useTranslation } from 'react-i18next';

import { Arc, CIRCUMFERENCE, Label, RADIUS, SIZE, STROKE, Wrapper } from './ProgressRing.styles';

interface ProgressRingProps {
  done: number;
  total: number;
}

export function ProgressRing({ done, total }: ProgressRingProps) {
  const { t } = useTranslation();
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const offset = CIRCUMFERENCE * (1 - percent / 100);

  return (
    <Wrapper aria-label={t('progressRing', { percent })} role="img">
      <svg width={SIZE} height={SIZE} aria-hidden="true">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={STROKE}
        />
        <Arc cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} $offset={offset} $percent={percent} />
      </svg>
      <Label aria-hidden="true">{percent}%</Label>
    </Wrapper>
  );
}
