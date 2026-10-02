import styled from 'styled-components';

type AvatarSize = 'sm' | 'md' | 'lg';
const SIZE_PX: Record<AvatarSize, number> = { sm: 24, md: 32, lg: 48 };

// A fixed palette: colours come from OUR list, never from user input (see 10.10). The "Lamp & ink" hues
// (styles/abstracts/_variables.scss), each dark enough for white initials (≥ 4.5:1).
const PALETTE = ['#9a5600', '#ce2c31', '#218358', '#1b6f68', '#5f6570', '#3a3f48'] as const;

function colorFor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length] ?? PALETTE[0];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const Circle = styled.span<{ $size: number; $color: string }>`
  display: inline-grid;
  place-items: center;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  color: ${({ theme }) => theme.colors.onInk};
  font-size: ${({ $size }) => Math.round($size * 0.4)}px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  user-select: none;
`;

interface AvatarProps {
  name: string;
  size?: AvatarSize;
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  return (
    <Circle $size={SIZE_PX[size]} $color={colorFor(name)} title={name} aria-label={name} role="img">
      {initials(name)}
    </Circle>
  );
}
