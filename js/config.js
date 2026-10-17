// Shared constants and tiny helpers used by every module.
//
// The board is N×N squares. A square is addressed (x,z): x runs west→east,
// z runs north→south, so z=0 is the far side of the board from the camera.
//
//            x=0   1    2    3    4
//     z=0   [A1] [B1] [C1] [D1] [E1]      goal starts at E1
//       1   [A2]  ·    ·    ·   [E2]
//       2   [A3]  ·    ·    ·   [E3]
//       3   [A4]  ·    ·    ·   [E4]
//       4   [A5] [B5] [C5] [D5] [E5]      mouse starts at A5
//
// Directions are numbered clockwise from north:
//
//                 0 N  (z-1)
//                    ↑
//     3 W (x-1)  ←   ·   →  1 E (x+1)
//                    ↓
//                 2 S  (z+1)

// N board size in squares · H wall height · T wall thickness (world units, 1 = one square)
export const N=5, H=0.32, T=0.06;

// Step taken by moving in direction d: (x+DX[d], z+DZ[d]); arrow and name for display.
export const DX=[0,1,0,-1], DZ=[-1,0,1,0], ARROW=['↑','→','↓','←'], NAMES=['north','east','south','west'];

// True if the visitor asked for less motion: then nothing starts running by itself.
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Read a colour token from the CSS (e.g. C('--amber')) so 3D colours match the page.
export const css = getComputedStyle(document.documentElement);
export const C = n => new THREE.Color(css.getPropertyValue(n).trim());

// Column letters for square names: (x,z) → COLS[x] + (z+1), e.g. (2,0) → 'C1'.
export const COLS='ABCDE';

// Square (x,z) → index 0…24 into per-square arrays, row by row: A1 B1 … E1 A2 … E5.
export const idx=(x,z)=>z*N+x;

// Shorthand for document.getElementById.
export const $=id=>document.getElementById(id);
