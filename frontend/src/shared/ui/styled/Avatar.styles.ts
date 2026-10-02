// The styled components of Avatar.tsx (styled-components). The component file keeps the logic and the JSX.
import styled from 'styled-components';

export const Circle = styled.span<{ $size: number; $color: string }>`
  display: inline-grid;
  place-items: center;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  color: ${({ theme }) => theme.colors.onInk};
  font-size: ${({ $size }) => Math.round($size * 0.4)}px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  user-select: none;
`;
