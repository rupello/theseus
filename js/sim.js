import {DX,DZ,idx,$} from './config.js';
import {state} from './state.js';
import {wallAt,reachable} from './maze.js';
import {renderMemory,status} from './view.js';
import {mouseG,bodyG,whiskG,placeMouse,cellPos} from './scene/props.js';

// relay timing pulses for the rack display
const pulses={};
export function pulse(name,ms){pulses[name]=performance.now()+ms}
export const pulsing=(name,now)=>(pulses[name]||0)>now;
export const dirOf=a=>((Math.round(-a/(Math.PI/2))%4)+4)%4;

const pms=()=>Math.max(120,dur('turn')*1000*.9);

export function stop(){state.mode='idle';state.queue=[];state.cur=null;placeMouse();mouseG.rotation.y=state.angle;bodyG.position.set(0,0,0);whiskG.scale.set(1,1,1);
  state.headDir=((Math.round(-state.angle/(Math.PI/2))%4)+4)%4}
export function begin(m){
  stop();
  if(!reachable(state.mouse,state.goal)){status('The goal is walled off from the mouse. Open a partition first.');renderMemory();return}
  state.mode=m;
  if(m==='explore'){state.expMoves=0;status('<b>Exploring.</b> Whiskers find each wall; the relay steps to the next direction.')}
  else {state.recMoves=0;state.recallSeen=new Set();status('<b>Running from memory.</b> Following the stored direction in each square.')}
  renderMemory();
}
function finish(){
  const m=state.mode; state.mode='idle';
  if(m==='explore') status(`<b>Goal found</b> in ${state.expMoves} moves. Memory now points the way. Press <b>Run from memory</b>.`);
  else status(`<b>Goal reached</b> in ${state.recMoves} moves, straight from memory.`);
  renderMemory();
}
function pushDir(d,move){
  if(d!==state.headDir){state.queue.push({type:'turn',d});state.headDir=d}
  state.queue.push({type:move?'move':'bump',d});
}
function decide(){
  if(state.mouse.x===state.goal.x&&state.mouse.z===state.goal.z){pulse('BELL',1600);finish();return}
  const i=idx(state.mouse.x,state.mouse.z);
  pulse('SQ1',pms()); pulse('RD',pms()*.8);
  if(state.mode==='recall'){
    const d=state.mem[i];
    if(d<0||wallAt(state.mouse.x,state.mouse.z,d)||state.recallSeen.has(i)){
      state.mode='explore'; state.expMoves=0;
      status(d>=0&&wallAt(state.mouse.x,state.mouse.z,d)?'<b>Memory stale</b>: a wall now blocks the stored path. Re-exploring.':'<b>Memory incomplete</b> for this route. Re-exploring.');
    } else { state.recallSeen.add(i); pushDir(d,true); return }
  }
  // Shannon's rule: start one quarter-turn past the last exit, rotate until a whisker finds no wall.
  // Relays at rest read 00 (north), so an unvisited square is tried from east first, as in the wiring diagram.
  pulse('STEP',pms());
  let d=((state.mem[i]<0?0:state.mem[i])+1)%4;
  for(let k=0;k<4;k++){
    if(!wallAt(state.mouse.x,state.mouse.z,d)){state.mem[i]=d;pulse('WR',pms());renderMemory();pushDir(d,true);return}
    pushDir(d,false);
    d=(d+1)%4;
  }
}
function dur(type){const s=+$('speed').value, k=2.2/s; return (type==='move'?.55:type==='turn'?.28:.32)*k}
function startAction(a){
  state.cur={...a,t:0,dur:dur(a.type),a0:state.angle,from:cellPos(state.mouse.x,state.mouse.z)};
  if(a.type==='turn'){let target=-a.d*Math.PI/2, delta=((target-state.angle)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI; state.cur.a1=state.angle+delta}
  if(a.type==='move'){state.cur.to=cellPos(state.mouse.x+DX[a.d],state.mouse.z+DZ[a.d])}
}
function endAction(){
  const a=state.cur; state.cur=null;
  if(a.type==='turn'){state.angle=a.a1;mouseG.rotation.y=state.angle}
  if(a.type==='move'){state.mouse.x+=DX[a.d];state.mouse.z+=DZ[a.d];placeMouse(); if(state.mode==='explore')state.expMoves++; else if(state.mode==='recall')state.recMoves++;
    if(state.expMoves>3000){status('Stopped after 3000 moves.');stop()} renderMemory()}
  if(a.type==='bump'){bodyG.position.set(0,0,0);whiskG.scale.set(1,1,1);pulse('STEP',pms()*.6)}
}

const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
// advance the queued actions by dt seconds and animate the mouse
export function advance(dt){
if(state.mode!=='idle'||state.cur){
  if(!state.cur&&!state.queue.length&&state.mode!=='idle') decide();
  if(!state.cur&&state.queue.length) startAction(state.queue.shift());
  if(state.cur){
    state.cur.t+=dt/state.cur.dur; const t=Math.min(state.cur.t,1), e=ease(t);
    if(state.cur.type==='turn') mouseG.rotation.y=state.cur.a0+(state.cur.a1-state.cur.a0)*e;
    if(state.cur.type==='move'){mouseG.position.lerpVectors(state.cur.from,state.cur.to,e); bodyG.position.y=Math.abs(Math.sin(t*Math.PI*3))*.012}
    if(state.cur.type==='bump'){const b=Math.sin(t*Math.PI); bodyG.position.set(0,0,-b*.17); whiskG.scale.set(1-b*.35,1,1)}
    if(t>=1) endAction();
  }
}
}
