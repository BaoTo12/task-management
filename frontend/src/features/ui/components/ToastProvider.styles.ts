// The styled components of ToastProvider.tsx (styled-components). The component file keeps the logic and the JSX.
import styled, { css, keyframes } from 'styled-components';

import type { ToastTone } from '@/shared/toast/toast-context';

const slideIn = keyframes`
  from { transform: translateY(16px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`;

export const Viewport = styled.div`
  position: fixed;
  right: ${({ theme }) => theme.space(4)};
  bottom: ${({ theme }) => theme.space(4)};
  z-index: ${({ theme }) => theme.zIndices.toast};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2)};
  max-width: min(360px, calc(100vw - 32px));
`;

const toneStyles = {
  success: css`
    border-left-color: ${({ theme }) => theme.colors.success};
  `,
  error: css`
    border-left-color: ${({ theme }) => theme.colors.danger};
  `,
  info: css`
    border-left-color: ${({ theme }) => theme.colors.lamp};
  `,
} satisfies Record<ToastTone, ReturnType<typeof css>>;

export const Item = styled.div<{ $tone: ToastTone }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(4)}`};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  /* Inked outline + sticker shadow (like a lifted card); the thick left edge carries the tone. */
  border: 1.5px solid ${({ theme }) => theme.colors.ink};
  border-left-width: 4px;
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.ink};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  animation: ${slideIn} 200ms ease-out;

  ${({ $tone }) => toneStyles[$tone]}
`;

export const Close = styled.button.attrs({ type: 'button' })`
  margin-left: auto;
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;
