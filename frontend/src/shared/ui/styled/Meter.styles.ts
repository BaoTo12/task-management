// The styled components of Meter.tsx (styled-components). The component file keeps the logic and the JSX.
import styled from 'styled-components';

export const Track = styled.div`
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
export const Fill = styled.div.attrs<{ $percent: number }>(({ $percent }) => ({
  style: { width: `${Math.min(100, Math.max(0, $percent))}%` },
}))<{ $color: string }>`
  height: 100%;
  border-radius: inherit;
  background: ${({ $color }) => $color};
  transition: width ${({ theme }) => theme.motion.normal} ${({ theme }) => theme.motion.easing};
`;
