import styled from 'styled-components';

const Track = styled.div`
  position: relative;
  height: 8px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.surfaceMuted};
`;

/**
 * The filled part. Its width changes with the data, so it goes through `.attrs(() => ({ style }))` (09.11 rule 2):
 * one generated class for every bar, and the browser only updates an inline style when the value changes.
 * The colour is a theme reference (a CSS variable), so it lives in the class.
 */
const Fill = styled.div.attrs<{ $percent: number }>(({ $percent }) => ({
  style: { width: `${Math.min(100, Math.max(0, $percent))}%` },
}))<{ $color: string }>`
  height: 100%;
  border-radius: inherit;
  background: ${({ $color }) => $color};
  transition: width ${({ theme }) => theme.motion.normal} ${({ theme }) => theme.motion.easing};
`;

interface MeterProps {
  value: number;
  max: number;
  /** A theme colour (a var() reference), never a value from the API: see 10.10. */
  color: string;
  label: string;
}

/** A horizontal bar with the ARIA meter role: "7 of 20" is announced, not just drawn. */
export function Meter({ value, max, color, label }: MeterProps) {
  const percent = max === 0 ? 0 : (value / max) * 100;
  return (
    <Track role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <Fill $percent={percent} $color={color} />
    </Track>
  );
}
