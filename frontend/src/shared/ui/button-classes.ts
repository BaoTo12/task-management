// Shared by Button and ButtonLink (13B.06). A plain module, not a component file: Fast Refresh (07.06).

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'md' | 'sm';

/** The design system's .btn modifiers as typed props: a typo like variant="primay" is a compile error. */
export interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** A square, icon-only button (.btn--icon). It has no visible text, so give it an aria-label. */
  icon?: boolean;
}

/** { variant: 'primary', size: 'sm', icon: true } → 'btn btn--primary btn--sm btn--icon' (+ any extra class). */
export function buttonClasses({ variant = 'secondary', size = 'md', icon = false }: ButtonStyleProps, className?: string): string {
  return ['btn', `btn--${variant}`, size === 'sm' && 'btn--sm', icon && 'btn--icon', className].filter(Boolean).join(' ');
}
