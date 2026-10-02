// The styled components of ProgressRing.tsx (styled-components). The component file keeps the logic and the JSX.
import styled, { keyframes } from 'styled-components';
import type { DefaultTheme } from 'styled-components';

// The ring's geometry: the styles below AND the SVG in ProgressRing.tsx are drawn from the same numbers.
export const SIZE = 72;
export const STROKE = 8;
export const RADIUS = (SIZE - STROKE) / 2;
export const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Threshold colours from the theme: danger below 34%, warning below 67%, success otherwise. */
function ringColor(percent: number, theme: DefaultTheme): string {
  if (percent < 34) return theme.colors.danger;
  if (percent < 67) return theme.colors.warning;
  return theme.colors.success;
}

const appear = keyframes`
  from { stroke-dashoffset: ${CIRCUMFERENCE}; }
`;

export const Wrapper = styled.figure`
  position: relative;
  width: ${SIZE}px;
  height: ${SIZE}px;
  margin: 0;
`;

export const Arc = styled.circle<{ $offset: number; $percent: number }>`
  fill: none;
  stroke: ${({ $percent, theme }) => ringColor($percent, theme)};
  stroke-width: ${STROKE};
  stroke-linecap: round;
  stroke-dasharray: ${CIRCUMFERENCE};
  stroke-dashoffset: ${({ $offset }) => $offset};
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  transition: stroke-dashoffset 300ms ease, stroke 300ms ease;
  animation: ${appear} 600ms ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
  }
`;

export const Label = styled.figcaption`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 0.875rem;
  font-weight: 600;
`;
