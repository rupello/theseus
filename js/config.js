// Shared constants and tiny helpers.
export const N=5, H=0.32, T=0.06;
export const DX=[0,1,0,-1], DZ=[-1,0,1,0], ARROW=['↑','→','↓','←'], NAMES=['north','east','south','west'];
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const css = getComputedStyle(document.documentElement);
export const C = n => new THREE.Color(css.getPropertyValue(n).trim());
export const COLS='ABCDE';
export const idx=(x,z)=>z*N+x;
export const $=id=>document.getElementById(id);
