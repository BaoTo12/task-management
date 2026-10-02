// The styled components of Breadcrumbs.tsx (styled-components). The component file keeps the logic and the JSX.
import styled from 'styled-components';

export const List = styled.ol`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(1)};
  margin: 0 0 ${({ theme }) => theme.space(2)};
  padding: 0;
  list-style: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  /* the separator is decoration: CSS content, so screen readers don't read "greater than" between items */
  li + li::before {
    content: '›';
    margin-right: ${({ theme }) => theme.space(1)};
  }
`;
