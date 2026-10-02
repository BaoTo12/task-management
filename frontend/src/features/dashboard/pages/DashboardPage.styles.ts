// The styled components of DashboardPage.tsx (styled-components). The component file keeps the logic and the JSX.
import styled from 'styled-components';

import { media } from '@/shared/ui/styled/media';

/** One column on phones, two from the md breakpoint: the `media` helper instead of a CSS Module + respond-to(). */
export const WidgetGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(4)};
  grid-template-columns: 1fr;

  ${media.md`
    grid-template-columns: repeat(2, 1fr);
  `}
`;

export const Customize = styled.fieldset`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(3)};
  align-items: center;
  margin: 0 0 ${({ theme }) => theme.space(6)};
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
  border: 1.5px dashed ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.lg};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  legend {
    padding: 0 ${({ theme }) => theme.space(1)};
  }

  label {
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.space(2)};
  }
`;
