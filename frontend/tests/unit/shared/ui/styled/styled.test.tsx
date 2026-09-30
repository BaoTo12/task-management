// 10.11: testing styled components WITHOUT a browser. What to test: the CSS a component produces for its
// props, which attributes reach the DOM, and security-relevant behaviour (10.10). What NOT to test: pixels.
// ServerStyleSheet collects the CSS that rendering generates, exactly as server-side rendering would.

import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { ServerStyleSheet, ThemeProvider } from 'styled-components';
import { describe, expect, it } from 'vitest';

import { theme } from '@/shared/theme/theme';
import { IconButton } from '@/shared/ui/styled/IconButton';
import { NavItem } from '@/shared/ui/styled/NavItem';
import { Pill } from '@/shared/ui/styled/Pill';
import { SkeletonLine } from '@/shared/ui/styled/Skeleton';
import { Spinner } from '@/shared/ui/styled/Spinner';
import { Stack } from '@/shared/ui/styled/Stack';
import { Tag } from '@/shared/ui/styled/Tag';

/** Renders with the app's theme; returns the HTML and the CSS styled-components generated for it. */
function render(element: ReactElement) {
  const sheet = new ServerStyleSheet();
  try {
    const html = renderToString(sheet.collectStyles(<ThemeProvider theme={theme}>{element}</ThemeProvider>));
    return { html, css: sheet.getStyleTags() };
  } finally {
    sheet.seal();
  }
}

describe('transient props (09.04)', () => {
  it('styles with $props but never writes them to the DOM', () => {
    const { html, css } = render(<Stack $direction="row" $gap={3} />);
    expect(css).toContain('flex-direction:row');
    expect(css).toContain('gap:12px');
    expect(html).not.toMatch(/\$direction|\$gap|direction=/);
  });
});

describe('.attrs() (09.08)', () => {
  it('Spinner always gets role="status" and a default label, which callers can override', () => {
    expect(render(<Spinner />).html).toContain('aria-label="Loading"');
    expect(render(<Spinner aria-label="Saving" />).html).toContain('aria-label="Saving"');
    expect(render(<Spinner />).html).toContain('role="status"');
  });

  it('SkeletonLine puts the per-instance width in `style`, not in a new class (09.11 rule 2)', () => {
    const a = render(<SkeletonLine $width="60%" />);
    const b = render(<SkeletonLine $width="40%" />);
    expect(a.html).toContain('width:60%');
    // Same class for both widths: the width did not generate CSS.
    const classOf = (html: string) => html.match(/class="([^"]+)"/)?.[1];
    expect(classOf(a.html)).toBe(classOf(b.html));
  });
});

describe('extending (09.06)', () => {
  it('IconButton keeps StyledButton rules and adds its own, with a computed aria-label', () => {
    const { html, css } = render(<IconButton label="Theme" />);
    expect(html).toContain('aria-label="Theme"');
    expect(html).toContain('type="button"'); // from StyledButton's attrs
    expect(css).toContain('width:32px'); // IconButton's own rule
    expect(css).toContain('cursor:pointer'); // inherited rule
  });
});

describe('shouldForwardProp (09.08 §3)', () => {
  it('NavItem consumes `compact` instead of forwarding it to <a>', () => {
    const { html } = render(
      <MemoryRouter>
        <NavItem to="/login" compact>
          Log in
        </NavItem>
      </MemoryRouter>,
    );
    expect(html).toContain('href="/login"');
    expect(html).not.toContain('compact');
  });
});

describe('variants and compound variants (10.09)', () => {
  it('solid + warning switches to dark text; solid + danger keeps light text', () => {
    expect(render(<Pill $tone="warning" $appearance="solid" />).css).toContain(`color:${theme.colors.text}`);
    expect(render(<Pill $tone="danger" $appearance="solid" />).css).toContain(`color:${theme.colors.onPrimary}`);
  });
});

describe('CSS injection defence (10.10)', () => {
  it('Tag refuses a colour that is not a plain hex value', () => {
    const { css } = render(<Tag label="x" color="red;} body{display:none" />);
    expect(css).not.toContain('display:none');
    expect(css).toContain('#64748b'); // the fallback
  });
});
