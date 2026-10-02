import { useCallback, useSyncExternalStore } from 'react';

/**
 * `true` while the CSS media query matches, re-rendering when it starts or stops matching (window resize, device
 * rotation). useSyncExternalStore subscribes to the MediaQueryList like any external store; outside a browser
 * (tests without matchMedia) it reports `false`.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false,
  );
}
