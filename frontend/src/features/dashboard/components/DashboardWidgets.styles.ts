// The styled components of DashboardWidgets.tsx (styled-components). The component file keeps the logic and the JSX.
import styled from 'styled-components';

/** A label + number + bar row. Nesting (09.10 §1): the <dt>/<dd> rules live with the list that owns them. */
export const BreakdownList = styled.dl`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  margin: 0;

  div {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: ${({ theme }) => theme.space(1)};
  }

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    margin: 0;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }

  /* the Meter spans both columns, under its label and number */
  div > :last-child {
    grid-column: 1 / -1;
  }
`;

export const OverdueList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1)};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const DueText = styled.span`
  margin-left: ${({ theme }) => theme.space(1)};
  color: ${({ theme }) => theme.colors.danger};
`;
