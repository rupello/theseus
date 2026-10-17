import {reduce,$} from './config.js';
import {state} from './state.js';
import {genMaze,reachable} from './maze.js';
import {renderer,scene,camera,controls,stage,resize} from './scene/setup.js';
import {syncWalls} from './scene/walls.js';
import {goalG,cheese,head,placeGoal,placeMouse} from './scene/props.js';
import {begin,advance} from './sim.js';
import {updateLogic} from './relays/logic.js';
import {renderMemory,status} from './view.js';
import {renderSheets} from './ladder/draw.js';
import {renderLegend} from './ladder/legend.js';
import {initHelp} from './ladder/help.js';
import {initUI} from './ui.js';

/* ---------- wiring diagram (relay ladder) ---------- */
renderSheets($('sheets'));
renderLegend();
initHelp();

initUI();

/* ---------- loop ---------- */
new ResizeObserver(resize).observe(stage); resize();
const clock=new THREE.Clock();
function tick(){
  const dt=Math.min(clock.getDelta(),.05), time=clock.elapsedTime;
  advance(dt);
  cheese.rotation.y=time*.6; goalG.position.y=Math.sin(time*2)*.004;
  if(state.mode==='idle'&&!state.cur) head.rotation.y=Math.sin(time*1.3)*.15;
  updateLogic();
  controls.update(); renderer.render(scene,camera); requestAnimationFrame(tick);
}

genMaze(); syncWalls(); placeGoal(); placeMouse(); renderMemory();
if(!reachable(state.mouse,state.goal)){genMaze();syncWalls()}
if(!reduce) setTimeout(()=>begin('explore'),700); else status('Ready. Press <b>Explore</b> to start.');
tick();
