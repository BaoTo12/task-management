// The styled components of Sidebar.tsx (styled-components). The component file keeps the logic and the JSX.
import { Link, NavLink } from 'react-router';
import styled, { css } from 'styled-components';

import { media } from '@/shared/ui/styled/media';

/**
 * The graphite rail: the droid's visor band, in both themes. On wide screens it's a permanent column of the layout;
 * below `lg` it becomes a drawer that slides in over the page (AppLayout owns `open`).
 */
export const Rail = styled.aside<{ $open: boolean }>`
  /* Mobile first: a drawer fixed to the left edge, slid out of view until it's open. */
  position: fixed;
  inset: 0 auto 0 0;
  z-index: ${({ theme }) => theme.zIndices.drawer};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(6)};
  width: min(300px, 86vw);
  height: 100dvh;
  padding: ${({ theme }) => `${theme.space(5)} ${theme.space(3)}`};
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.rail};
  color: ${({ theme }) => theme.colors.railText};
  box-shadow: ${({ theme }) => theme.shadows.md};
  transform: translateX(${({ $open }) => ($open ? '0' : '-105%')});
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  transition:
    transform ${({ theme }) => theme.motion.normal} ${({ theme }) => theme.motion.easing},
    visibility ${({ theme }) => theme.motion.normal};

  /* Desktop: a permanent column of the layout that stays in view while the page scrolls. */
  ${media.lg`
    position: sticky;
    top: 0;
    z-index: auto;
    width: 260px;
    box-shadow: none;
    transform: none;
    visibility: visible;
    transition: none;
  `}
`;

export const RailHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.space(2)};
`;

export const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2.5)};
  color: ${({ theme }) => theme.colors.onRail};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 1.3rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: -0.02em;
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.onRail};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.lamp};
    outline-offset: 4px;
    border-radius: ${({ theme }) => theme.radii.sm};
  }
`;

export const CloseButton = styled.button.attrs({ type: 'button' })`
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.railMuted};

  &:hover {
    color: ${({ theme }) => theme.colors.onRail};
    background: ${({ theme }) => theme.colors.railActive};
  }

  /* Amber on graphite: the lamp has plenty of contrast on the rail. */
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.lamp};
    outline-offset: 2px;
  }

  ${media.lg`
    display: none;
  `}
`;

export const NavList = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const linkStyles = css`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  min-height: 42px;
  padding: 0 ${({ theme }) => theme.space(3)} 0 ${({ theme }) => theme.space(4)};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.railMuted};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-decoration: none;
  transition:
    color ${({ theme }) => theme.motion.fast},
    background-color ${({ theme }) => theme.motion.fast};

  svg {
    flex-shrink: 0;
    width: 19px;
    height: 19px;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.onRail};
    background: ${({ theme }) => theme.colors.railHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.lamp};
    outline-offset: -2px;
  }

  /* The current page: white text and the droid's lamp lit at the left edge. */
  &[aria-current='page'] {
    color: ${({ theme }) => theme.colors.onRail};
    background: ${({ theme }) => theme.colors.railActive};

    &::before {
      content: '';
      position: absolute;
      left: 4px;
      top: 50%;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${({ theme }) => theme.colors.lamp};
      box-shadow: 0 0 10px ${({ theme }) => theme.colors.lamp};
      transform: translateY(-50%);
    }
  }
`;

export const RailNavLink = styled(NavLink)`
  ${linkStyles}
`;

export const LinkLabel = styled.span`
  flex: 1;
  min-width: 0;
`;

export const RailFoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  margin-top: auto;
  padding-top: ${({ theme }) => theme.space(4)};
  border-top: 1px solid ${({ theme }) => theme.colors.railLine};

  select {
    width: 100%;
    color: ${({ theme }) => theme.colors.railText};
    background-color: ${({ theme }) => theme.colors.railField};
    border-color: ${({ theme }) => theme.colors.railLine};

    /* On graphite the bright lamp is the focus colour (the dark amber used on light surfaces is too dim here). */
    &:focus {
      border-color: ${({ theme }) => theme.colors.lamp};
    }
  }

  select option {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.surface};
  }
`;

export const Account = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(2)};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.railField};
`;

export const AccountName = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  line-height: 1.3;

  strong,
  span {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  strong {
    color: ${({ theme }) => theme.colors.onRail};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }

  span {
    color: ${({ theme }) => theme.colors.railMuted};
    font-size: 0.8125rem;
  }
`;

export const LogoutButton = styled.button.attrs({ type: 'button' })`
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.railMuted};

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.onRail};
    background: ${({ theme }) => theme.colors.railActive};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.lamp};
  }
`;
