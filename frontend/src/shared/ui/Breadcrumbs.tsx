import { Link } from 'react-router';
import type { To } from 'react-router';
import styled from 'styled-components';

/** The last crumb is the current page: no link. Earlier ones need somewhere to go. */
export type Crumb = { label: string; to: To } | { label: string; to?: never };

const List = styled.ol`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(1)};
  margin: 0 0 ${({ theme }) => theme.space(2)};
  padding: 0;
  list-style: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  /* the separator is decoration: CSS content, so screen readers don't read "greater than" between items */
  li + li::before {
    content: '›';
    margin-right: ${({ theme }) => theme.space(1)};
  }
`;

/**
 * 12.10: "where am I?" navigation for nested pages (Tasks › Fix login bug › Edit).
 * <nav aria-label> + <ol> + aria-current="page": the WAI-ARIA breadcrumb pattern.
 * `to` accepts a string or a partial path, so the Tasks crumb can return to the FILTERED list (backToListHref).
 */
export function Breadcrumbs({ items, label }: { items: readonly Crumb[]; label: string }) {
  return (
    <nav aria-label={label}>
      <List>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${index}-${item.label}`}>
              {item.to !== undefined && !isLast ? (
                <Link to={item.to}>{item.label}</Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </List>
    </nav>
  );
}
