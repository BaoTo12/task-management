import styled from 'styled-components';

/**
 * Where the mascot's sprite sheets are served: '/' in dev, '/taskflow/app/' inside the WAR (Vite `base`).
 * `?v=` changes whenever the images are re-exported, so no browser keeps showing an old sheet from its cache
 * (v3: the mirrored top-row corners swapped back, every frame aligned on the body).
 */
const MASCOT_VERSION = 3;
export const MASCOT_DIRECTIONS = `${import.meta.env.BASE_URL}mascots/droid-directions.webp?v=${MASCOT_VERSION}`;
export const MASCOT_REACTIONS = `${import.meta.env.BASE_URL}mascots/droid-reactions.webp?v=${MASCOT_VERSION}`;

/**
 * The logo: the droid looking straight ahead, cut from the same 3×3 sprite sheet the login mascot uses
 * (background-size 300% makes each cell one 0/50/100% step; 50% 50% is the centre cell). One character for the
 * whole product, no separate logo file.
 */
export const BrandMark = styled.span.attrs({ 'aria-hidden': true })<{ $size?: number }>`
  display: inline-block;
  flex-shrink: 0;
  width: ${({ $size = 32 }) => $size}px;
  height: ${({ $size = 32 }) => $size}px;
  background-image: url(${MASCOT_DIRECTIONS});
  background-size: 300% 300%;
  background-position: 50% 50%;
  background-repeat: no-repeat;
`;
