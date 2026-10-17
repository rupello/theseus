import {N,ARROW,C,idx,$} from './config.js';
import {state} from './state.js';
import {setRelay,memCells} from './relays/rack.js';
import {arrows} from './scene/props.js';
import {lampMats} from './scene/setup.js';

// Keeps the page's displays of the mouse's memory and progress up to date.
const amber=C('--amber');

// Show state.mem everywhere it appears: the memory-bank relay pairs and square labels,
// the arrows on the floor, the lamps on the cabinet front, and the counters.
export function renderMemory(){
  let n=0, bits=0;
  for(let i=0;i<N*N;i++){
    const d=state.mem[i], m=memCells[i];
    setRelay(m.b1,d>=0&&!!(d&2)); setRelay(m.b0,d>=0&&!!(d&1));
    bits+=(m.b1._on?1:0)+(m.b0._on?1:0);
    m.val.textContent=d<0?'—':ARROW[d]+' '+'NESW'[d];
    m.c.classList.toggle('sel',i===idx(state.mouse.x,state.mouse.z)); m.c.classList.toggle('goal',i===idx(state.goal.x,state.goal.z));
    arrows[i].visible=d>=0; if(d>=0){arrows[i].rotation.y=-d*Math.PI/2;n++}
    lampMats[i].emissive.copy(d>=0?amber:new THREE.Color(0)); lampMats[i].emissiveIntensity=i===idx(state.mouse.x,state.mouse.z)?1.4:.7;
    lampMats[i].color.set(d>=0?0x6b4a18:0x2b2a26);
  }
  $('sMem').textContent=n+'/25'; $('memCount').textContent=`${bits} of 50 energised`; $('sExp').textContent=state.expMoves; $('sRec').textContent=state.recMoves==null?'—':state.recMoves;
}

// Set the status line. Takes HTML, so messages can use <b>.
export function status(html){$('status').innerHTML=html}
