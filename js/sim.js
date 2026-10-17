import {DX,DZ,idx,$} from './config.js';
import {state} from './state.js';
import {wallAt,reachable} from './maze.js';
import {renderMemory,status} from './view.js';
import {mouseG,bodyG,whiskG,placeMouse,cellPos} from './scene/props.js';

// The simulation: picks where the mouse goes next and animates each step.
//
//   advance(dt), every frame
//      │
//      ├─ queue empty? ───────► decide() ── fills the queue, e.g. [turn, bump, turn, move]
//      ├─ nothing running? ───► startAction(next in queue)
//      └─ animate state.cur ──► endAction() when its progress t reaches 1
//
// Modes:
//
//      idle ──Explore──────────► explore ──goal──► idle
//      idle ──Run from memory──► recall ───goal──► idle
//                                   │  memory missing, blocked or going in circles
//                                   └────────────► explore
//
// Relay timing pulses: some rack relays only flash briefly. pulse('RD', 300) keeps
// relay RD lit for 300 ms; pulsing('RD', now) asks whether it still is.
const pulses={};
export function pulse(name,ms){pulses[name]=performance.now()+ms}
export const pulsing=(name,now)=>(pulses[name]||0)>now;

// Heading angle (radians) → direction 0–3. Angle 0 faces north, and turning
// clockwise is a negative rotation in three.js, hence -a.
export const dirOf=a=>((Math.round(-a/(Math.PI/2))%4)+4)%4;

// Pulse length that follows the speed slider; at least 120 ms so it stays visible.
const pms=()=>Math.max(120,dur('turn')*1000*.9);

// Halt any run: empty the queue, snap the mouse back to the middle of its square,
// and reset headDir to the way it really faces.
export function stop(){state.mode='idle';state.queue=[];state.cur=null;placeMouse();mouseG.rotation.y=state.angle;bodyG.position.set(0,0,0);whiskG.scale.set(1,1,1);
  state.headDir=((Math.round(-state.angle/(Math.PI/2))%4)+4)%4}

// Start a run in mode 'explore' or 'recall', unless the goal is walled off.
export function begin(m){
  stop();
  if(!reachable(state.mouse,state.goal)){status('The goal is walled off from the mouse. Open a partition first.');renderMemory();return}
  state.mode=m;
  if(m==='explore'){state.expMoves=0;status('<b>Exploring.</b> Whiskers find each wall; the relay steps to the next direction.')}
  else {state.recMoves=0;state.recallSeen=new Set();status('<b>Running from memory.</b> Following the stored direction in each square.')}
  renderMemory();
}

// The mouse is on the goal: go idle and report the move count.
function finish(){
  const m=state.mode; state.mode='idle';
  if(m==='explore') status(`<b>Goal found</b> in ${state.expMoves} moves. Memory now points the way. Press <b>Run from memory</b>.`);
  else status(`<b>Goal reached</b> in ${state.recMoves} moves, straight from memory.`);
  renderMemory();
}

// Queue a step towards direction d: a turn first if the mouse isn't facing d,
// then a move into the next square (move=true) or a bump against a wall.
function pushDir(d,move){
  if(d!==state.headDir){state.queue.push({type:'turn',d});state.headDir=d}
  state.queue.push({type:move?'move':'bump',d});
}

// Choose the next step from the mouse's square and queue it. Walls are known up
// front, so a whole decision (every bump, then the move) is queued at once.
//
//   Explore: try exits clockwise, starting one past the stored exit. The first open
//   side wins and is written back to memory:
//
//       stored → E      tries   S ──► W ──► N ──► E
//                               wall   open
//                               bump   move, store W
//
//   Recall: follow the stored exit; fall back to exploring if it's missing,
//   now blocked by a wall, or leads back to a square already used this run.
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

// Seconds an action takes at the current speed (slider 1–12): moves are slowest, turns quickest.
function dur(type){const s=+$('speed').value, k=2.2/s; return (type==='move'?.55:type==='turn'?.28:.32)*k}

// Begin animating action a from where the mouse is now. Turns take the short way round.
function startAction(a){
  state.cur={...a,t:0,dur:dur(a.type),a0:state.angle,from:cellPos(state.mouse.x,state.mouse.z)};
  if(a.type==='turn'){let target=-a.d*Math.PI/2, delta=((target-state.angle)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI; state.cur.a1=state.angle+delta}
  if(a.type==='move'){state.cur.to=cellPos(state.mouse.x+DX[a.d],state.mouse.z+DZ[a.d])}
}

// Finish the current action: commit the new heading or square and count the move.
// A runaway run is stopped after 3000 moves.
function endAction(){
  const a=state.cur; state.cur=null;
  if(a.type==='turn'){state.angle=a.a1;mouseG.rotation.y=state.angle}
  if(a.type==='move'){state.mouse.x+=DX[a.d];state.mouse.z+=DZ[a.d];placeMouse(); if(state.mode==='explore')state.expMoves++; else if(state.mode==='recall')state.recMoves++;
    if(state.expMoves>3000){status('Stopped after 3000 moves.');stop()} renderMemory()}
  if(a.type==='bump'){bodyG.position.set(0,0,0);whiskG.scale.set(1,1,1);pulse('STEP',pms()*.6)}
}

// Ease-in-out: slow start, fast middle, slow end.
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;

// Run the simulation for dt seconds and animate the mouse.
//
//   turn  rotate from angle a0 to a1
//   move  slide to the next square, with a little bounce
//   bump  lunge at the wall and back; whiskers squash at the halfway point, t = 0.5
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
