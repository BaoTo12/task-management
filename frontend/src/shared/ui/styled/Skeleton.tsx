import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  from { background-position: 100% 0; }
  to   { background-position: -100% 0; }
`;

/**
 * A grey placeholder line. Two performance rules from 09.11 in one component:
 *
 * - Rule 2: a value that differs per INSTANCE (the width) goes into `style` through `.attrs()`, not into the
 *   template. Otherwise every distinct width would generate (and inject) a new CSS class.
 * - Static CSS (colours, animation) stays in the template: one class shared by every skeleton.
 */
export const SkeletonLine = styled.div.attrs<{ $width?: string }>(({ $width = '100%' }) => ({
  'aria-hidden': true,
  style: { width: $width },
}))`
  height: 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.surfaceMuted} 0%,
    ${({ theme }) => theme.colors.border} 50%,
    ${({ theme }) => theme.colors.surfaceMuted} 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.2s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** A card-shaped group of lines, matching the real TaskCard's height so nothing jumps on load. */
export const SkeletonCard = styled.div.attrs({ 'aria-hidden': true, className: 'card' })`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2)};
  min-height: 120px;
`;
