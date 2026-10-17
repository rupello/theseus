import {N} from './config.js';

// Everything the simulation, scene and controls share and change while running.
export const state={
  mem:Array(N*N).fill(-1),   // stored exit per square (0–3 = N E S W), -1 = never left
  mouse:{x:0,z:N-1}, start:{x:0,z:N-1}, goal:{x:N-1,z:0},
  angle:0,                   // mouse heading in radians
  headDir:0,                 // heading as of the end of the queued actions
  mode:'idle',               // 'idle' | 'explore' | 'recall'
  queue:[], cur:null,        // pending actions and the one being animated
  expMoves:0, recMoves:null, recallSeen:null,
  clickMode:'goal',          // what clicking a square does: 'goal' | 'mouse'
};
