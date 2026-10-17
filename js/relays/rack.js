import {N,COLS,$} from '../config.js';
import {click} from './audio.js';

// The relay rack below the stage: a memory bank (2 relays per square) and a logic
// bank (33 relays). This module builds the graphics; view.js and logic.js switch them.

// One relay graphic: a can with a status dot and its name underneath.
function makeRelay(name,title){
  const r=document.createElement('div'); r.className='relay'; r.title=title||name;
  r.innerHTML='<div class="can"><span class="dot"></span></div><span class="nm"></span>';
  r.querySelector('.nm').textContent=name; r._on=false; return r;
}

// Switch relay graphic r on or off. Clicks only on a real change; returns whether it changed.
export function setRelay(r,on){ if(r._on===on) return false; r._on=on; r.classList.toggle('on',on); click(); return true }

// Memory bank: 25 cells in board order (A1 … E1, A2 … E5), each a pair of relays
// holding the square's stored exit as two bits:
//
//     ┌────────────┐
//     │ C3     → E │    square name, stored exit
//     │  [b1] [b0] │    00 N · 01 E · 10 S · 11 W
//     └────────────┘
const memEl=$('mem');
export const memCells=[];
for(let z=0;z<N;z++)for(let x=0;x<N;x++){
  const c=document.createElement('div'); c.className='mcell';
  const sq=COLS[x]+(z+1);
  c.innerHTML=`<div class="tag"><span>${sq}</span><b>—</b></div><div class="pair"></div>`;
  const b1=makeRelay('b1',`${sq} bit 1`), b0=makeRelay('b0',`${sq} bit 0`);
  c.querySelector('.pair').append(b1,b0); memEl.appendChild(c);
  memCells.push({c,b1,b0,val:c.querySelector('.tag b')});
}

// Logic bank: 33 relays in functional groups, as [group, subtitle, [[relay, meaning], …]].
// The names match the coils on the wiring diagram.
const GROUPS=[
  ['Square selector','from the carriage commutator',[['CA','column A'],['CB','column B'],['CC','column C'],['CD','column D'],['CE','column E'],['R1','row 1'],['R2','row 2'],['R3','row 3'],['R4','row 4'],['R5','row 5']]],
  ['Heading','read from turning-shaft cams',[['D1','heading bit 1'],['D0','heading bit 0'],['STEP','turn 90° clockwise']]],
  ['Sensing','whiskers and carriage',[['WSK','whisker on a partition'],['CTR','carriage centred'],['LEFT','carriage has left centre'],['BACK','backing off a wall'],['MIS','stored heading differs']]],
  ['Drive','carriage under the floor',[['EM','electromagnet holding mouse'],['MX','east–west motor'],['MY','north–south motor'],['POL','motor polarity'],['TURN','turn motor']]],
  ['Sequencer','steps of one decision',[['SQ1','load'],['SQ2','turn'],['SQ3','advance']]],
  ['Mode and memory','strategy and read/write',[['EXPL','exploration strategy'],['GOAL','goal strategy'],['RD','read memory'],['WR','write memory'],['CLR','clear memory']]],
  ['Supervisory','run and goal',[['HOLD','run holding circuit'],['BELL','goal bell']]],
];
const logicEl=$('logic');
export const logicRelays={};
GROUPS.forEach(([name,sub,list])=>{
  const g=document.createElement('div'); g.className='group';
  g.innerHTML=`<div class="gl">${name}<span>${sub}</span></div><div class="rs"></div>`;
  const rs=g.querySelector('.rs');
  list.forEach(([n,t])=>{const r=makeRelay(n,`${n}: ${t}`); logicRelays[n]=r; rs.appendChild(r)});
  logicEl.appendChild(g);
});
