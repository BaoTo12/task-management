import styled, { css } from 'styled-components';

/**
 * A surface for grouped content (dashboard widgets, panels).
 *
 * Concepts in this file:
 * - `as` polymorphism (09.08): <Card as="article">, <Card as="li"> keep the styles, change the element.
 * - Component selectors (09.10): Card styles its own CardActions, and CardActions reacts to its parent Card.
 * - Conditional `css` fragments (09.07): `$interactive` adds hover elevation only when asked.
 */
export const Card = styled.section<{ $interactive?: boolean; $padding?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme, $padding = 4 }) => theme.space($padding)};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  ${({ $interactive, theme }) =>
    $interactive &&
    css`
      transition:
        box-shadow ${theme.motion.fast} ${theme.motion.easing},
        transform ${theme.motion.fast} ${theme.motion.easing};

      &:hover,
      &:focus-within {
        box-shadow: ${theme.shadows.md};
        transform: translateY(-1px);
      }
    `}
`;

export const CardHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(2)};
`;

export const CardTitle = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textMuted};
`;

/**
 * Secondary actions (e.g. "View all"): faded until the card is hovered or focused.
 * `${Card}:hover &` is a REVERSE component selector: "me, when inside a hovered Card" (09.10 §2).
 * It works because Card is a styled component with a stable generated class.
 */
export const CardActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space(2)};
  opacity: 0.6;
  transition: opacity ${({ theme }) => theme.motion.fast};

  ${Card}:hover &,
  ${Card}:focus-within & {
    opacity: 1;
  }
`;
