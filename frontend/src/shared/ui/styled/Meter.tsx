import { Fill, Track } from './Meter.styles';

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
