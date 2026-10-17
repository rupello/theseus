import {N,COLS,idx,$} from '../config.js';
import {state} from '../state.js';
import {pulsing,dirOf} from '../sim.js';
import {setRelay,logicRelays,memCells} from './rack.js';
import {updateSchematic} from '../ladder/draw.js';

// Work out every logic relay from the simulation each frame, then light the rack and the ladder.
function headingNow(){return dirOf(state.angle)}

export function updateLogic(){
  const now=performance.now(), S={};
  const x=state.mouse.x, y=state.mouse.z;
  const mt=state.cur&&state.cur.type==='move'?state.cur.t:-1, bt=state.cur&&state.cur.type==='bump'?state.cur.t:-1, tt=state.cur&&state.cur.type==='turn'?state.cur.t:-1;
  const ctr=!(mt>.15&&mt<.85)&&!(bt>.12&&bt<.92);
  S.CX=S.CY=S.CTR=ctr;
  for(let k=0;k<N;k++){S['X'+COLS[k]]=S['C'+COLS[k]]=ctr&&x===k; S['Y'+(k+1)]=S['R'+(k+1)]=ctr&&y===k}
  const det=!(tt>.15&&tt<.85);
  const hd=tt>=0?dirOf(tt<.5?state.cur.a0:state.cur.a1):headingNow();
  ['HN','HE','HS','HW'].forEach((k,j)=>S[k]=det&&hd===j);
  S.DET=det; S.D1=S.HS||S.HW; S.D0=S.HE||S.HW;
  S.W=S.WSK=bt>.35&&bt<.6;
  S.G=S.BELL=x===state.goal.x&&y===state.goal.z;
  S.HOLD=state.mode!=='idle'; S.EXPL=state.mode==='explore'; S.GOAL=state.mode==='recall';
  S.SQ1=pulsing('SQ1',now); S.RD=pulsing('RD',now);
  const st=state.mem[idx(x,y)]<0?0:state.mem[idx(x,y)];
  S.MIS=S.RD&&det&&st!==hd;
  S.TURN=tt>=0; S.SQ2=tt>=0; S.STEP=pulsing('STEP',now);
  S.SQ3=mt>=0||(bt>=0&&bt<.5); S.LEFT=mt>.15||(bt>.12&&bt<.5); S.BACK=bt>=.5;
  S.WR=mt>=0&&mt<.15; S.CLR=pulsing('CLR',now);
  S.EM=S.HOLD||!!state.cur;
  const drv=S.SQ3||S.BACK; S.MX=drv&&S.D0; S.MY=drv&&!S.D0; S.POL=(S.D1!==S.D0)!==S.BACK;
  let n=0;
  for(const k in logicRelays){setRelay(logicRelays[k],!!S[k]); if(S[k]) n++}
  $('logCount').textContent=`${n} of 33 energised`;
  updateSchematic(S,x,y,memCells);
}
