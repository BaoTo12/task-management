import { css } from 'styled-components';
import type { Interpolation } from 'styled-components';

import { theme } from '@/shared/theme/theme';

type Breakpoint = keyof typeof theme.breakpoints;

/**
 * Mobile-first media queries as `css` fragments (09.07), the styled-components twin of SCSS respond-to() (03.02).
 * Breakpoints are read from the theme MODULE, not from props: media queries can't use var() (10.04 §5).
 *
 *   const Grid = styled.div`
 *     grid-template-columns: 1fr;
 *     ${media.md`grid-template-columns: repeat(2, 1fr);`}
 *   `;
 */
export const media = Object.fromEntries(
  (Object.keys(theme.breakpoints) as Breakpoint[]).map((name) => [
    name,
    (strings: TemplateStringsArray, ...values: Interpolation<object>[]) => css`
      @media (min-width: ${theme.breakpoints[name]}) {
        ${css(strings, ...values)}
      }
    `,
  ]),
) as Record<Breakpoint, (strings: TemplateStringsArray, ...values: Interpolation<object>[]) => ReturnType<typeof css>>;
