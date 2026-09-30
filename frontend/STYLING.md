# Styling rules (TaskFlow Web)

The decision guide from 10.07, plus where each system is used in this project.

## Rules

1. **Tokens live in SCSS** (`styles/abstracts/_tokens.scss`). Never hard-code a colour, spacing or radius in a
   component. SCSS: `theme('x')`, `space(n)`. styled-components: `theme.colors.x`, `theme.space(n)`,
   `theme.motion.fast`, `theme.zIndices.toast`.
2. **Shared design-system components are SCSS (BEM)**, wrapped by thin typed React components (`Button`,
   `ButtonLink`, `StatusBadge`, `.card`, forms). They must also work in the JSP portal (10.08).
3. **React-only static structure → CSS Modules** (`*.module.scss` with `@use '@styles/abstracts' as *;`).
4. **Dynamic, prop-driven components → styled-components** with **transient `$props`**, defined at module level
   (09.15), reading `props.theme`. Public props without `$` are filtered with `.withConfig({ shouldForwardProp })`.
5. **Continuous or per-instance values** (widths, progress) → `.attrs(() => ({ style }))` or a CSS custom
   property, never the template (09.11): one class for all instances.
6. **Untrusted values never reach CSS unvalidated** (allow-list: `#rrggbb`, known enums) (10.10).
7. **No second reset.** Global element styles belong to SCSS `base/`; `GlobalStyle` is for React-only globals.
8. **One component, one system.** Don't style the same element with SCSS *and* styled-components (except
   `styled(Component)` bridges for components that accept `className`).
9. **Variants:** one prop per axis, a `css` map per axis, compound variants in a function (10.09). See `Pill`.
10. **Test the output, not the pixels**: `ServerStyleSheet` + `renderToString` (`tests/unit/shared/ui/styled/styled.test.tsx`).

## Where each concept lives

| Concept (lecture) | File |
|---|---|
| Transient props (09.04) | every file in `shared/ui/styled/`, e.g. `Stack.tsx` |
| Variant map with `css` (09.05) | `StyledButton.tsx` |
| Extending `styled(StyledComponent)` (09.06) | `IconButton.tsx` (extends `StyledButton`), `HeaderActions` in `app/AppLayout.tsx` (extends `Stack`) |
| Styling your own / a library component (09.06 §2) | `NavItem.tsx` (`styled(NavLink)`) |
| `css` fragments, conditional fragments (09.07) | `Card.tsx` (`$interactive`), `media.ts` |
| `keyframes` (09.07) | `Spinner.tsx`, `Skeleton.tsx`, `ProgressRing.tsx`, `features/ui/components/ToastProvider.tsx` |
| `.attrs()` static and computed (09.08) | `StyledButton.tsx`, `Spinner.tsx`, `IconButton.tsx`, `Skeleton.tsx`, `HeaderActions` |
| `as` polymorphism (09.08) | `<Stack as="nav">` in `Pager.tsx`, `<Card as="article">` in `DashboardWidgets.tsx` |
| `shouldForwardProp` (09.08 §3) | `NavItem.tsx` |
| Nesting, component selectors, reverse selectors (09.10) | `Card.tsx` (`${Card}:hover &`), `BreakdownList` in `DashboardWidgets.tsx` |
| Performance rules (09.11) | `Meter.tsx`, `Skeleton.tsx` (per-instance values through `style`) |
| `ThemeProvider`, typed `DefaultTheme` (10.01–10.03) | `shared/theme/ThemeProvider.tsx`, `styled.d.ts` |
| Theme as CSS variables, one source of truth (10.04–10.05) | `shared/theme/theme.ts` |
| `useTheme()` for values passed as props (10.01) | `StatusWidget` / `PriorityWidget` in `DashboardWidgets.tsx` |
| `createGlobalStyle` (10.06) | `shared/theme/GlobalStyle.ts` |
| Responsive helpers (03.02 in CSS-in-JS) | `media.ts`, used by `DashboardPage.tsx` |
| Variants at scale, compound variants (10.09) | `Pill.tsx` |
| CSS injection defence (10.10) | `Tag.tsx` + `shared/domain/color.ts` |
| Testing styled components (10.11) | `tests/unit/shared/ui/styled/styled.test.tsx` |
