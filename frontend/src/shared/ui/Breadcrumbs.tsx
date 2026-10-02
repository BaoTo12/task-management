import { Link } from 'react-router';
import type { To } from 'react-router';

import { List } from './Breadcrumbs.styles';

/** The last crumb is the current page: no link. Earlier ones need somewhere to go. */
export type Crumb = { label: string; to: To } | { label: string; to?: never };

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
