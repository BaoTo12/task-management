import styled, { css } from 'styled-components';
import type { DefaultTheme, RuleSet } from 'styled-components';

/**
 * A counter / label pill with variants AT SCALE (10.09):
 * - one prop per axis ($tone, $appearance), a union per prop: no `isRed isSmall isOutlined` explosion;
 * - one `css` map per axis;
 * - COMPOUND variants for the combinations the axes can't express alone.
 */
/** 'lamp' is the bright amber: for pills on the graphite rail, where 'primary' (dark amber) would be too dim. */
export type PillTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'lamp';
export type PillAppearance = 'soft' | 'solid' | 'outline';

const toneColor = (theme: DefaultTheme, tone: PillTone): string =>
  ({
    neutral: theme.colors.textMuted,
    primary: theme.colors.primary,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    lamp: theme.colors.lamp,
  })[tone];

type PillProps = { $tone?: PillTone; $appearance?: PillAppearance };

const appearances = {
  soft: css<PillProps>`
    color: ${({ theme, $tone = 'neutral' }) => toneColor(theme, $tone)};
    background: color-mix(in srgb, ${({ theme, $tone = 'neutral' }) => toneColor(theme, $tone)} 15%, transparent);
  `,
  solid: css<PillProps>`
    color: ${({ theme }) => theme.colors.onPrimary};
    background: ${({ theme, $tone = 'neutral' }) => toneColor(theme, $tone)};
  `,
  outline: css<PillProps>`
    color: ${({ theme, $tone = 'neutral' }) => toneColor(theme, $tone)};
    border-color: currentColor;
  `,
} satisfies Record<PillAppearance, RuleSet<PillProps>>;

/** Compound variants: white text on yellow is unreadable, so solid + warning gets dark text. */
const compound = ({ $tone, $appearance }: PillProps) =>
  $appearance === 'solid' &&
  $tone === 'warning' &&
  css`
    color: ${({ theme }) => theme.colors.text};
  `;

export const Pill = styled.span<PillProps>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  padding: 0 ${({ theme }) => theme.space(2)};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  line-height: 1.6;
  white-space: nowrap;

  ${({ $appearance = 'soft' }) => appearances[$appearance]}
  ${compound}
`;
