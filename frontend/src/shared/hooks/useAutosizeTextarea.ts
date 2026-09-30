import { useLayoutEffect, useRef } from 'react';

/**
 * Grows a <textarea> with its content (up to `maxRows`).
 *
 * Why useLayoutEffect, not useEffect (08.14 §1): the height must be MEASURED (scrollHeight) and SET before the
 * browser paints. With useEffect the user would see one frame at the old height, then a jump: a flicker on
 * every keystroke. useLayoutEffect runs after React writes the DOM but before paint, and blocks paint until done,
 * so keep it cheap (one read, one write).
 */
export function useAutosizeTextarea(value: string, maxRows = 10) {
  // React 19: useRef needs an initial value (13B.05); null + the element type = a ref for a DOM node.
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    const lineHeight = Number.parseFloat(getComputedStyle(textarea).lineHeight) || 20;
    textarea.style.height = 'auto'; // shrink first, so deleting text can reduce the height
    textarea.style.height = `${Math.min(textarea.scrollHeight, lineHeight * maxRows)}px`;
  }, [value, maxRows]);

  return ref;
}
