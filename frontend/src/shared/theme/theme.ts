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
    primarySoft: cssVar('primary-soft'),
    onPrimary: cssVar('on-primary'),
    /** The amber fill (primary buttons, the active-nav lamp) and the graphite text that sits on it. */
    lamp: cssVar('lamp'),
    lampHover: cssVar('lamp-hover'),
    onLamp: cssVar('on-lamp'),
    /** Outline colour of "inked" surfaces. */
    ink: cssVar('ink'),
    danger: cssVar('danger'),
    dangerHover: cssVar('danger-hover'),
    success: cssVar('success'),
    warning: cssVar('warning'),
    text: cssVar('text'),
    textMuted: cssVar('text-muted'),
    border: cssVar('border'),
    borderStrong: cssVar('border-strong'),
    surface: cssVar('surface'),
    surfaceMuted: cssVar('surface-muted'),
    background: cssVar('background'),
    /** The graphite sidebar (and the login bench): the same band in both themes. */
    rail: cssVar('rail'),
    railText: cssVar('rail-text'),
    railMuted: cssVar('rail-muted'),
    /** Strong text, white tints and lines ON the rail. */
    onRail: cssVar('on-rail'),
    railHover: cssVar('rail-hover'),
    railActive: cssVar('rail-active'),
    railField: cssVar('rail-field'),
    railLine: cssVar('rail-line'),
    railShadow: cssVar('rail-shadow'),
    /** The white "sticker" surfaces that sit on the rail (the login porthole and speech bubble). */
    paper: cssVar('paper'),
    paperMuted: cssVar('paper-muted'),
    onPaper: cssVar('on-paper'),
    onPaperMuted: cssVar('on-paper-muted'),
    /** Text on an ink or danger fill. */
    onInk: cssVar('on-ink'),
    onDanger: cssVar('on-danger'),
    /** Dims the page behind the mobile drawer. */
    scrim: cssVar('scrim'),
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
  radii: { sm: '6px', md: '8px', lg: '12px', xl: '18px', full: '999px' },
  /** Same values as SCSS $breakpoints (03.02): media queries can't use var(). */
  breakpoints: { sm: '480px', md: '768px', lg: '1024px', xl: '1280px' },
  fontSizes: { xs: '0.75rem', sm: '0.875rem', md: '1rem', lg: '1.125rem', xl: '1.5rem' },
  fontWeights: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  /** Same stacks as SCSS $font-family-base / $font-family-display. */
  fonts: {
    body: "'Be Vietnam Pro', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    display: "'Bricolage Grotesque Variable', 'Be Vietnam Pro', ui-sans-serif, system-ui, sans-serif",
  },
  /** Shadows reference the text colour through color-mix, so they follow light/dark without a second value. */
  shadows: {
    sm: '0 1px 2px color-mix(in srgb, var(--color-text) 8%, transparent)',
    md: '0 6px 20px color-mix(in srgb, var(--color-text) 14%, transparent)',
    /** The offset "sticker" shadow, same as SCSS $shadow-ink. */
    ink: '3px 3px 0 var(--color-ink)',
  },
  /** One place for durations: components never hard-code 150ms (and GlobalStyle honours reduced motion). */
  motion: { fast: '150ms', normal: '300ms', slow: '600ms', easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  /** The only z-index values the app uses: named layers instead of 9999 wars. */
  zIndices: { header: 10, drawer: 15, dropdown: 20, toast: 30 },
} as const;

export type AppTheme = typeof theme;
