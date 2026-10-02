import styled, { css } from 'styled-components';

type Variant = 'primary' | 'secondary' | 'danger';
type Size = 'md' | 'sm';

// Transient props ($-prefixed) are used for styling and NOT forwarded to the DOM.
interface StyledButtonProps {
  $variant?: Variant;
  $size?: Size;
}

const variantStyles = {
  primary: css`
    background: ${({ theme }) => theme.colors.lamp};
    color: ${({ theme }) => theme.colors.onLamp};
    border-color: ${({ theme }) => theme.colors.ink};
    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.lampHover};
    }
  `,
  secondary: css`
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
    border-color: ${({ theme }) => theme.colors.borderStrong};
    &:hover:not(:disabled) {
      border-color: ${({ theme }) => theme.colors.ink};
    }
  `,
  danger: css`
    background: transparent;
    color: ${({ theme }) => theme.colors.danger};
    border-color: ${({ theme }) => theme.colors.danger};
    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.danger};
      color: ${({ theme }) => theme.colors.onDanger};
    }
  `,
} satisfies Record<Variant, ReturnType<typeof css>>;

/**
 * A styled-components version of the design-system button, for comparison (09.05). The app's real buttons are
 * <Button>/<ButtonLink> (the .btn classes); this one and IconButton are the course's teaching examples.
 */
export const StyledButton = styled.button.attrs({ type: 'button' })<StyledButtonProps>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radii.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  line-height: 1.25;
  cursor: pointer;
  transition:
    background-color ${({ theme }) => theme.motion.fast} ${({ theme }) => theme.motion.easing},
    border-color ${({ theme }) => theme.motion.fast} ${({ theme }) => theme.motion.easing};
  padding: ${({ $size = 'md', theme }) => ($size === 'sm' ? `${theme.space(1)} ${theme.space(3)}` : `${theme.space(2)} ${theme.space(4)}`)};
  font-size: ${({ $size = 'md', theme }) => ($size === 'sm' ? theme.fontSizes.xs : theme.fontSizes.sm)};

  ${({ $variant = 'secondary' }) => variantStyles[$variant]}

  /* The same focus colour as the .btn classes: --color-primary keeps 3:1 against light AND dark surfaces. */
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
