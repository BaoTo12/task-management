import styled from 'styled-components';

import { StyledButton } from './StyledButton';

/**
 * EXTENDING a styled component (09.06 §1): IconButton = StyledButton's rules + its own. The generated class
 * list contains both, so variants ($variant, $size) keep working, and only the square shape is added.
 *
 * `.attrs` layered on top: StyledButton already sets type="button"; here every icon button also gets
 * `aria-label` from its `label` prop, because an icon alone has no accessible name.
 */
export const IconButton = styled(StyledButton).attrs<{ label: string }>(({ label }) => ({
  'aria-label': label,
  title: label,
}))`
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: 1;
`;
