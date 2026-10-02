// The styled components of ReportsView.tsx (styled-components). The component file keeps the logic and the JSX.
import styled from 'styled-components';

export const Bar = styled.span<{ $share: number }>`
  display: inline-block;
  height: 0.75rem;
  width: ${({ $share }) => Math.round($share * 100)}%;
  min-width: 2px;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 2px;
`;

export const Row = styled.div`
  display: grid;
  grid-template-columns: 8rem 1fr 3rem;
  gap: 0.5rem;
  align-items: center;
`;
