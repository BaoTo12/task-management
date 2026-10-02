// The styled components of PriorityBar.tsx (styled-components). The component file keeps the logic and the JSX.
import styled from 'styled-components';

import type { Priority } from '@/shared/domain/types';

export const Track = styled.div`
  display: flex;
  gap: 2px;
  width: 48px;
  height: 6px;
`;

export const Segment = styled.span<{ $filled: boolean; $priority: Priority }>`
  flex: 1;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ $filled, $priority, theme }) =>
    $filled ? theme.colors.priority[$priority] : theme.colors.border};
  transition: background-color 150ms ease;
`;
