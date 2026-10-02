// The styled components of Tag.tsx (styled-components). The component file keeps the logic and the JSX.
import styled from 'styled-components';

export const Chip = styled.span<{ $bg: string; $fg: string }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $bg }) => $bg};
  color: ${({ $fg }) => $fg};
`;
