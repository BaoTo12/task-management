// The styled components of NotificationBell.tsx (styled-components). The component file keeps the logic and the JSX.
import styled, { css, keyframes } from 'styled-components';

import { ButtonLink } from '@/shared/ui/ButtonLink';

const ring = keyframes`
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(12deg); }
  75% { transform: rotate(-12deg); }
`;

/** The design system's square icon button (.btn--icon), plus room for the count and the ring animation. */
export const Bell = styled(ButtonLink)<{ $ringing: boolean }>`
  position: relative;

  svg {
    ${({ $ringing }) => $ringing && css`animation: ${ring} 0.4s ease-in-out 2;`}
  }

  @media (prefers-reduced-motion: reduce) {
    svg {
      animation: none;
    }
  }
`;

/** Unread count: the amber lamp with graphite text, the same signal colour as everywhere else. */
export const Count = styled.span`
  position: absolute;
  top: -7px;
  right: -7px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border: 1.5px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.lamp};
  color: ${({ theme }) => theme.colors.onLamp};
  font-size: 0.6875rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  line-height: 17px;
  text-align: center;
`;
