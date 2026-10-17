import {N} from './config.js';

// Everything the simulation, scene and controls share and change while running.
//
// mem holds one stored exit per square, the same value the two memory relays encode:
//
//     mem[i]     -1      0      1      2      3
//     meaning   never   ↑ N    → E    ↓ S    ← W
//     b1 b0      00     00     01     10     11     (a cleared pair reads as north)
//
// cur is the action being animated:
//     { type: 'turn' | 'move' | 'bump', d: direction,
//       t: progress 0→1, dur: seconds, a0/a1: start/end angle, from/to: start/end position }
export const state={
  mem:Array(N*N).fill(-1),   // stored exit per square (0–3 = N E S W), -1 = never left
  mouse:{x:0,z:N-1}, start:{x:0,z:N-1}, goal:{x:N-1,z:0},
  angle:0,                   // mouse heading in radians
  headDir:0,                 // heading as of the end of the queued actions
  mode:'idle',               // 'idle' | 'explore' | 'recall'
  queue:[], cur:null,        // pending actions and the one being animated
  // moves counted this run (recMoves null = no memory run yet); squares already used in a memory run
  expMoves:0, recMoves:null, recallSeen:null,
  clickMode:'goal',          // what clicking a square does: 'goal' | 'mouse'
};
