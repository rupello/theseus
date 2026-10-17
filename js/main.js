// Theseus: Claude Shannon's maze-solving mouse (Bell Labs, 1950).
// Entry point: builds the page, then runs the render loop.
//
// How the modules fit together (arrows point at what each one uses):
//
//   main.js ── startup and the frame loop
//     │
//     ├─ ui.js ────────── pointer, buttons, keys ─────────► sim, maze, view
//     ├─ sim.js ───────── decides and animates each step ─► view, scene/props
//     ├─ view.js ──────── memory display, status line ────► relays/rack, scene
//     ├─ relays/logic.js  the 33 logic relays, per frame ─► relays/rack, ladder/draw
//     ├─ relays/rack.js   relay bank graphics (+ audio.js clicks)
//     ├─ scene/           three.js: setup (renderer, floor), walls, props (mouse, goal)
//     ├─ ladder/          the wiring diagram: dsl + sheets (data), draw, legend, help
//     └─ state.js, maze.js, config.js ── shared data and constants
//
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
// Draw the four ladder sheets, the symbol key and the help dialog once at startup.
renderSheets($('sheets'));
renderLegend();
initHelp();

// Wire up the canvas, buttons and keyboard.
initUI();

/* ---------- loop ---------- */
//
//   every frame:  advance(dt) ──► idle animations ──► updateLogic() ──► render
//                 move the mouse   cheese spin,         relay rack and
//                                  head wiggle          ladder lights
new ResizeObserver(resize).observe(stage); resize();
const clock=new THREE.Clock();

// One animation frame. dt is capped at 50 ms so a slow or hidden tab doesn't make the mouse jump.
function tick(){
  const dt=Math.min(clock.getDelta(),.05), time=clock.elapsedTime;
  advance(dt);
  cheese.rotation.y=time*.6; goalG.position.y=Math.sin(time*2)*.004;
  if(state.mode==='idle'&&!state.cur) head.rotation.y=Math.sin(time*1.3)*.15;
  updateLogic();
  controls.update(); renderer.render(scene,camera); requestAnimationFrame(tick);
}

// Startup: random maze, place everything, show the empty memory. If the maze happens to
// seal off the goal, generate once more. Then start exploring after a short pause.
genMaze(); syncWalls(); placeGoal(); placeMouse(); renderMemory();
if(!reachable(state.mouse,state.goal)){genMaze();syncWalls()}
if(!reduce) setTimeout(()=>begin('explore'),700); else status('Ready. Press <b>Explore</b> to start.');
tick();
