// The styled components of AppLayout.tsx (styled-components). The component file keeps the logic and the JSX.
import { Link } from 'react-router';
import styled from 'styled-components';

import { Button } from '@/shared/ui/Button';
import { media } from '@/shared/ui/styled/media';

/**
 * The app shell, mobile first:
 *   phone/tablet   top bar (menu · brand · actions) + search on its own row; the sidebar is a drawer
 *   desktop (lg+)  graphite sidebar | top bar (search · actions) over the page
 */
export const Shell = styled.div`
  min-height: 100dvh;

  ${media.lg`
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
  `}
`;

export const Column = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100dvh;
`;

export const Topbar = styled.header`
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndices.header};
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  grid-template-areas:
    'menu brand . actions'
    'search search search search';
  align-items: center;
  gap: ${({ theme }) => `${theme.space(3)} ${theme.space(2)}`};
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(4)}`};
  background: color-mix(in srgb, ${({ theme }) => theme.colors.background} 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  ${media.md`
    grid-template-columns: auto auto minmax(0, 28rem) 1fr auto;
    grid-template-areas: 'menu brand search . actions';
    padding: ${({ theme }) => `${theme.space(3)} ${theme.space(6)}`};
  `}

  ${media.lg`
    grid-template-columns: minmax(0, 30rem) 1fr auto;
    grid-template-areas: 'search . actions';
    padding: ${({ theme }) => `${theme.space(3)} ${theme.space(8)}`};
  `}
`;

/** The design system's square icon button, placed in the grid and hidden once the sidebar is permanent. */
export const MenuButton = styled(Button)`
  grid-area: menu;

  ${media.lg`
    display: none;
  `}
`;

export const MobileBrand = styled(Link)`
  grid-area: brand;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 1.15rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-decoration: none;

  ${media.lg`
    display: none;
  `}
`;

export const SearchSlot = styled.div`
  grid-area: search;
  min-width: 0;
`;

export const Actions = styled.div`
  grid-area: actions;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space(2)};
  min-width: 0;
`;

export const Main = styled.main`
  flex: 1;
  width: 100%;
  max-width: 1240px;
  padding: ${({ theme }) => `${theme.space(6)} ${theme.space(4)} ${theme.space(12)}`};

  &:focus {
    outline: none;
  }

  ${media.md`
    padding: ${({ theme }) => `${theme.space(8)} ${theme.space(6)} ${theme.space(16)}`};
  `}

  ${media.lg`
    padding: ${({ theme }) => `${theme.space(8)} ${theme.space(8)} ${theme.space(16)}`};
  `}
`;

/** Dims the page behind the open drawer; a click on it closes the drawer. */
export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: calc(${({ theme }) => theme.zIndices.drawer} - 1);
  background: ${({ theme }) => theme.colors.scrim};

  ${media.lg`
    display: none;
  `}
`;
