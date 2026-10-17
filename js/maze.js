import {N,DX,DZ} from './config.js';

// The maze: which partitions are up, how to generate a new one, and what's reachable.
//
// Interior walls live in two arrays of booleans (true = wall present). The outer
// border is always solid and isn't stored.
//
//                  x=0           x=1
//            +-------------+-------------+
//     z=0    |    (0,0)  v[0][0]  (1,0)  |
//            +---h[0][0]---+---h[1][0]---+
//     z=1    |    (0,1)  v[0][1]  (1,1)  |
//            +---h[0][1]---+---h[1][1]---+
//
//     h[x][z]  wall between (x,z) and the square south of it, (x,z+1)    N × (N-1)
//     v[x][z]  wall between (x,z) and the square east of it,  (x+1,z)    (N-1) × N
export const maze={h:null,v:null};   // h[x][z]: wall between (x,z)/(x,z+1); v[x][z]: between (x,z)/(x+1,z)

// Is there a wall on side d of square (x,z)? The edge of the board counts as a wall.
export function wallAt(x,z,d){
  const nx=x+DX[d], nz=z+DZ[d];
  if(nx<0||nz<0||nx>=N||nz>=N) return true;
  if(d===0) return maze.h[x][z-1]; if(d===2) return maze.h[x][z];
  if(d===1) return maze.v[x][z]; return maze.v[x-1][z];
}

// Put up (val=true) or take down (val=false) the wall on side d of square (x,z).
export function setBetween(x,z,d,val){
  if(d===0) maze.h[x][z-1]=val; else if(d===2) maze.h[x][z]=val;
  else if(d===1) maze.v[x][z]=val; else maze.v[x-1][z]=val;
}

// Make a new random maze: start with every wall up, carve a path that visits every
// square (depth-first, so all squares are connected), then open three more walls
// so there are some loops.
export function genMaze(){
  maze.h=[...Array(N)].map(()=>Array(N-1).fill(true));
  maze.v=[...Array(N-1)].map(()=>Array(N).fill(true));
  const seen=new Set(['0,0']), stack=[[0,0]];
  while(stack.length){
    const [x,z]=stack[stack.length-1];
    const opts=[0,1,2,3].filter(d=>{const nx=x+DX[d],nz=z+DZ[d];return nx>=0&&nz>=0&&nx<N&&nz<N&&!seen.has(nx+','+nz)});
    if(!opts.length){stack.pop();continue}
    const d=opts[Math.floor(Math.random()*opts.length)];
    setBetween(x,z,d,false);
    const nx=x+DX[d],nz=z+DZ[d]; seen.add(nx+','+nz); stack.push([nx,nz]);
  }
  for(let i=0;i<3;i++){ // a few loops, as Shannon's partitions often made
    if(Math.random()<.5){maze.h[Math.floor(Math.random()*N)][Math.floor(Math.random()*(N-1))]=false}
    else{maze.v[Math.floor(Math.random()*(N-1))][Math.floor(Math.random()*N)]=false}
  }
}

// Can the mouse get from square a to square b? Flood-fills outward from a.
export function reachable(a,b){
  const q=[[a.x,a.z]], seen=new Set([a.x+','+a.z]);
  while(q.length){const [x,z]=q.shift(); if(x===b.x&&z===b.z) return true;
    for(let d=0;d<4;d++){ if(wallAt(x,z,d)) continue; const k=(x+DX[d])+','+(z+DZ[d]); if(!seen.has(k)){seen.add(k);q.push([x+DX[d],z+DZ[d]])} }}
  return false;
}
