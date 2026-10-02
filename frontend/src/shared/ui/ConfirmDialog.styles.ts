// The styled components of ConfirmDialog.tsx (styled-components). The component file keeps the logic and the JSX.
import styled from 'styled-components';

export const Dialog = styled.dialog`
  max-width: min(420px, calc(100vw - 32px));
  padding: ${({ theme }) => theme.space(5)};
  /* An inked sticker, like a lifted card: the dialog is the one thing to deal with right now. */
  border: 1.5px solid ${({ theme }) => theme.colors.ink};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme }) => theme.shadows.ink};

  &::backdrop {
    background: ${({ theme }) => theme.colors.scrim};
  }

  h2 {
    margin: 0 0 ${({ theme }) => theme.space(2)};
    font-size: ${({ theme }) => theme.fontSizes.lg};
  }
`;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space(2)};
  margin-top: ${({ theme }) => theme.space(4)};
`;
