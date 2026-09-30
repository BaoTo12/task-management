import { NavLink } from 'react-router';
import styled from 'styled-components';

/**
 * The header's navigation link: a styled version of React Router's NavLink.
 *
 * - `styled(Component)` (09.06 §2): styling a component we don't own. It works because NavLink forwards
 *   `className` to its <a>: any component that does that can be styled.
 * - NavLink marks the current page with `aria-current="page"`, so the active style needs no class juggling.
 * - `.withConfig({ shouldForwardProp })` (09.08 §3): `compact` is a PUBLIC prop without `$` (nicer for callers),
 *   so it would reach NavLink and then the DOM (<a compact>: a React warning). We stop it here.
 */
export const NavItem = styled(NavLink).withConfig({
  shouldForwardProp: (prop) => prop !== 'compact',
})<{ compact?: boolean }>`
  position: relative;
  padding: ${({ theme, compact }) => (compact ? theme.space(1) : `${theme.space(1)} ${theme.space(3)}`)};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-decoration: none;
  transition: color ${({ theme }) => theme.motion.fast}, background-color ${({ theme }) => theme.motion.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.surfaceMuted};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focusRing};
    outline-offset: 2px;
  }

  &[aria-current='page'] {
    color: ${({ theme }) => theme.colors.primary};

    /* an underline bar under the active link */
    &::after {
      content: '';
      position: absolute;
      inset: auto ${({ theme }) => theme.space(3)} -2px;
      height: 2px;
      border-radius: ${({ theme }) => theme.radii.full};
      background: currentColor;
    }
  }
`;
