import { Mascot } from 'page-mascot';
import { useImperativeHandle, useRef } from 'react';
import type { Ref } from 'react';

import { MASCOT_DIRECTIONS, MASCOT_REACTIONS } from '@/shared/ui/BrandMark';

/** What the login page can ask the droid to do. */
export interface LoginMascotHandle {
  /** A wrong password: four quick boops make page-mascot play its "dizzy" reaction. */
  dizzy: () => void;
}

interface LoginMascotProps {
  size: number;
  /**
   * The droid's name, translated by the caller. page-mascot builds its button's accessible name as
   * "Boop the <label>" (that English prefix is the library's), so pass a short noun: "droid", not a sentence.
   */
  label: string;
  ref?: Ref<LoginMascotHandle>;
}

/**
 * page-mascot's <Mascot>: the droid turns its head toward the pointer and reacts when it's clicked ("booped").
 * The component has no API for reactions, only clicks, so the handle clicks its button: the library itself decides
 * the animation (4 boops within 1.6 s → dizzy), and keyboard/screen-reader users can still boop it themselves.
 * (No reaction on a SUCCESSFUL login: the page navigates away at once, so nobody would see it.)
 */
export function LoginMascot({ size, label, ref }: LoginMascotProps) {
  const wrapper = useRef<HTMLSpanElement>(null);

  useImperativeHandle(ref, () => {
    const boop = () => wrapper.current?.querySelector('button')?.click();
    return {
      dizzy: () => {
        for (let i = 0; i < 4; i++) boop();
      },
    };
  }, []);

  return (
    <span ref={wrapper} style={{ display: 'inline-block', lineHeight: 0 }}>
      <Mascot directions={MASCOT_DIRECTIONS} reactions={MASCOT_REACTIONS} size={size} label={label} />
    </span>
  );
}
