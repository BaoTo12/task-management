import type { Priority, TaskStatus } from '@/shared/domain/types';

/** `var(--color-…)` references to the custom properties emitted by styles/base/_root.scss (03.13). */
const cssVar = (name: string) => `var(--color-${name})`;

const status = (s: string) => ({ bg: cssVar(`status-${s}-bg`), fg: cssVar(`status-${s}-fg`) });

/**
 * The styled-components theme. It contains NO literal colours: every colour is a reference to a
 * CSS custom property owned by the SCSS design system. Light/dark switching happens in CSS
 * (data-theme on <html>), so this object never changes, and styled components don't re-render.
 */
export const theme = {
  colors: {
    primary: cssVar('primary'),
    primaryHover: cssVar('primary-hover'),
    onPrimary: cssVar('on-primary'),
    danger: cssVar('danger'),
    dangerHover: cssVar('danger-hover'),
    success: cssVar('success'),
    warning: cssVar('warning'),
    text: cssVar('text'),
    textMuted: cssVar('text-muted'),
    border: cssVar('border'),
    surface: cssVar('surface'),
    surfaceMuted: cssVar('surface-muted'),
    background: cssVar('background'),
    focusRing: cssVar('focus-ring'),
    status: {
      TODO: status('todo'),
      IN_PROGRESS: status('in-progress'),
      DONE: status('done'),
    } satisfies Record<TaskStatus, { bg: string; fg: string }>,
    priority: {
      LOW: cssVar('priority-low'),
      MEDIUM: cssVar('priority-medium'),
      HIGH: cssVar('priority-high'),
    } satisfies Record<Priority, string>,
  },
  /** Same 4px scale as SCSS space() (03.04). */
  space: (n: number) => `${n * 4}px`,
  radii: { sm: '4px', md: '6px', lg: '8px', full: '999px' },
  /** Same values as SCSS $breakpoints (03.02): media queries can't use var(). */
  breakpoints: { sm: '480px', md: '768px', lg: '1024px', xl: '1280px' },
  fontSizes: { xs: '0.75rem', sm: '0.875rem', md: '1rem', lg: '1.125rem', xl: '1.5rem' },
  fontWeights: { regular: 400, medium: 500, bold: 700 },
  /** Shadows reference the text colour through color-mix, so they follow light/dark without a second value. */
  shadows: {
    sm: '0 1px 2px color-mix(in srgb, var(--color-text) 8%, transparent)',
    md: '0 4px 12px color-mix(in srgb, var(--color-text) 12%, transparent)',
  },
  /** One place for durations: components never hard-code 150ms (and GlobalStyle honours reduced motion). */
  motion: { fast: '150ms', normal: '300ms', slow: '600ms', easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  /** The only z-index values the app uses: named layers instead of 9999 wars. */
  zIndices: { header: 10, dropdown: 20, toast: 30 },
} as const;

export type AppTheme = typeof theme;
