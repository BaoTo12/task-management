import { contrastText, isSafeHexColor } from '@/shared/domain/color';

import { Chip } from './Tag.styles';

/** Steel (styles/abstracts/_variables.scss): a hex, because contrastText() needs real channel values. */
const FALLBACK = '#5f6570';

interface TagProps {
  label: string;
  /** Comes from the API (category colour): untrusted, validated before it reaches CSS. */
  color: string;
}

export function Tag({ label, color }: TagProps) {
  const bg = isSafeHexColor(color) ? color : FALLBACK;
  return (
    <Chip $bg={bg} $fg={contrastText(bg)}>
      {label}
    </Chip>
  );
}
