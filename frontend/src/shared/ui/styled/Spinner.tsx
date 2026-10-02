import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

type SpinnerSize = 'sm' | 'md' | 'lg';
const SIZE_PX: Record<SpinnerSize, number> = { sm: 16, md: 24, lg: 40 };

/**
 * A loading indicator for Suspense fallbacks and pending buttons.
 *
 * - `keyframes` (09.07): the animation name is generated and scoped, no global @keyframes clash.
 * - `.attrs()` with a FUNCTION (09.08): accessibility attributes computed from props, so every caller gets
 *   role="status" and a label without remembering to pass them. Callers pass a translated `aria-label`; the
 *   English 'Loading' is only for AppProviders' fallback, which renders BEFORE any translation has loaded.
 */
export const Spinner = styled.span.attrs<{ $size?: SpinnerSize; 'aria-label'?: string }>((props) => ({
  role: 'status',
  'aria-label': props['aria-label'] ?? 'Loading',
}))`
  display: inline-block;
  flex-shrink: 0;
  width: ${({ $size = 'md' }) => SIZE_PX[$size]}px;
  height: ${({ $size = 'md' }) => SIZE_PX[$size]}px;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 700ms linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation-duration: 2s;
  }
`;

/** Centres a spinner with an optional text: the app's standard "page is loading" block. */
export const LoadingBlock = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(8)} 0;
  color: ${({ theme }) => theme.colors.textMuted};
`;
