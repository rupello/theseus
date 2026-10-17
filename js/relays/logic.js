import {N,COLS,idx,$} from '../config.js';
import {state} from '../state.js';
import {pulsing,dirOf} from '../sim.js';
import {setRelay,logicRelays,memCells} from './rack.js';
import {updateSchematic} from '../ladder/draw.js';

// Logic relays: each frame, work out what every relay in the reconstruction would be
// doing given the simulation's current state, then light the rack and the diagram.

// The way the mouse faces right now, 0–3.
function headingNow(){return dirOf(state.angle)}

// Build S, a map from every relay and machine contact name to on/off, and apply it.
//
// Most relays follow the progress t (0 → 1) of the current action:
//
//   move   t: 0   .15                          .85   1
//             ├WR─┤                                  │   write memory as it leaves
//             ├────────────── SQ3 (advance) ─────────┤
//             │   ├────────── LEFT (off centre) ─────┤
//      CTR    █████                            ███████   centred at both ends
//
//   bump   t: 0  .12      .35  .5  .6            .92  1
//             ├───── SQ3 ──────┤├───── BACK ──────────┤
//                ├─── LEFT ────┤
//                         ├WSK─────┤                     whisker touches the wall
//      CTR    ████                               ██████
//
//   turn   t: 0   .15                  .85   1
//             ├──────── TURN, SQ2 ───────────┤
//      DET    █████                    ███████           turning shaft at a detent
//
// SQ1, RD, STEP and CLR are timed pulses from sim.js instead.
export function updateLogic(){
  const now=performance.now(), S={};
  const x=state.mouse.x, y=state.mouse.z;
  const mt=state.cur&&state.cur.type==='move'?state.cur.t:-1, bt=state.cur&&state.cur.type==='bump'?state.cur.t:-1, tt=state.cur&&state.cur.type==='turn'?state.cur.t:-1;
  // Carriage centred in a square, and which column/row segment it's on.
  const ctr=!(mt>.15&&mt<.85)&&!(bt>.12&&bt<.92);
  S.CX=S.CY=S.CTR=ctr;
  for(let k=0;k<N;k++){S['X'+COLS[k]]=S['C'+COLS[k]]=ctr&&x===k; S['Y'+(k+1)]=S['R'+(k+1)]=ctr&&y===k}
  // Heading cams on the turning shaft: read the old heading for the first half of a
  // turn, the new one after. D1 D0 encode it as 00 N, 01 E, 10 S, 11 W.
  const det=!(tt>.15&&tt<.85);
  const hd=tt>=0?dirOf(tt<.5?state.cur.a0:state.cur.a1):headingNow();
  ['HN','HE','HS','HW'].forEach((k,j)=>S[k]=det&&hd===j);
  S.DET=det; S.D1=S.HS||S.HW; S.D0=S.HE||S.HW;
  // Whisker, goal pin and the run mode.
  S.W=S.WSK=bt>.35&&bt<.6;
  S.G=S.BELL=x===state.goal.x&&y===state.goal.z;
  S.HOLD=state.mode!=='idle'; S.EXPL=state.mode==='explore'; S.GOAL=state.mode==='recall';
  // Reading memory: MIS = the stored exit differs from where the shaft points.
  S.SQ1=pulsing('SQ1',now); S.RD=pulsing('RD',now);
  const st=state.mem[idx(x,y)]<0?0:state.mem[idx(x,y)];
  S.MIS=S.RD&&det&&st!==hd;
  // The decision sequence: SQ1 load, SQ2 turn, SQ3 advance, then BACK after a bump.
  S.TURN=tt>=0; S.SQ2=tt>=0; S.STEP=pulsing('STEP',now);
  S.SQ3=mt>=0||(bt>=0&&bt<.5); S.LEFT=mt>.15||(bt>.12&&bt<.5); S.BACK=bt>=.5;
  S.WR=mt>=0&&mt<.15; S.CLR=pulsing('CLR',now);
  // Drive: the electromagnet holds the mouse; MX/MY pick the east–west or north–south
  // motor from D0, and POL sets which way it runs (reversed when backing off).
  S.EM=S.HOLD||!!state.cur;
  const drv=S.SQ3||S.BACK; S.MX=drv&&S.D0; S.MY=drv&&!S.D0; S.POL=(S.D1!==S.D0)!==S.BACK;
  // Light the rack, update its count, and light the ladder diagram.
  let n=0;
  for(const k in logicRelays){setRelay(logicRelays[k],!!S[k]); if(S[k]) n++}
  $('logCount').textContent=`${n} of 33 energised`;
  updateSchematic(S,x,y,memCells);
}
