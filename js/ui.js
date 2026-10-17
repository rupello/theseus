import {N,$} from './config.js';
import {state} from './state.js';
import {maze,genMaze,reachable} from './maze.js';
import {canvas,camera,floor} from './scene/setup.js';
import {hitMeshes,syncWalls,ghostH,ghostV,ghostCell} from './scene/walls.js';
import {placeGoal,placeMouse} from './scene/props.js';
import {stop,begin,pulse} from './sim.js';
import {renderMemory,status} from './view.js';

/* ---------- interaction ---------- */
//
//   on the 3D board                      buttons and keys
//   click a wall slot → toggle wall      Explore (1), Run from memory (2)
//   click a square    → move goal or     Clear memory, New maze
//                       place mouse      "Clicking a square" toggle
//   drag              → orbit camera

// Attach every handler. Called once from main.js.
export function initUI(){
  const ray=new THREE.Raycaster(), ptr=new THREE.Vector2();
  // What's under the pointer: {slot} for a wall slot, {cell:{x,z}} for a floor square,
  // or null. Casts a ray from the camera through the pointer position.
  function pick(e){
    const r=canvas.getBoundingClientRect(); ptr.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
    ray.setFromCamera(ptr,camera);
    const hits=ray.intersectObjects([...hitMeshes,floor]);
    if(!hits.length) return null;
    const o=hits[0].object;
    if(o.userData.slot) return {slot:o.userData.slot};
    const p=hits[0].point, x=Math.floor(p.x+N/2), z=Math.floor(p.z+N/2);
    if(x<0||z<0||x>=N||z>=N) return null;
    return {cell:{x,z}};
  }
  // A press and release less than 5 px apart is a click; anything more is an orbit drag.
  let down=null;
  canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY}});
  // Hover preview: highlight the wall slot or square that a click would change.
  canvas.addEventListener('pointermove',e=>{
    const p=pick(e); ghostH.visible=ghostV.visible=ghostCell.visible=false; canvas.style.cursor='grab';
    if(!p) return; canvas.style.cursor='pointer';
    if(p.slot){const g=p.slot.type==='h'?ghostH:ghostV; g.position.copy(p.slot.mesh.position); g.visible=true}
    else {ghostCell.position.x=p.cell.x-N/2+.5; ghostCell.position.z=p.cell.z-N/2+.5; ghostCell.visible=true}
  });
  canvas.addEventListener('pointerleave',()=>{ghostH.visible=ghostV.visible=ghostCell.visible=false});
  // Click: toggle a wall, or move the goal / place the mouse, depending on the toggle.
  // Any change that walls off the goal stops the current run.
  canvas.addEventListener('pointerup',e=>{
    if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5){down=null;return} down=null;
    const p=pick(e); if(!p) return;
    if(p.slot){
      const s=p.slot, arr=s.type==='h'?maze.h:maze.v; arr[s.x][s.z]=!arr[s.x][s.z]; syncWalls();
      if(state.mode!=='idle'&&!reachable(state.mouse,state.goal)){stop();status('That partition sealed off the goal. Run stopped.')}
      else if(state.mode==='idle') status(arr[s.x][s.z]?'Partition added.':'Partition removed.');
    } else if(state.clickMode==='goal'){
      state.goal={...p.cell}; placeGoal();
      if(state.mode!=='idle'&&!reachable(state.mouse,state.goal)){stop();status('The new goal square is walled off.')}
      else if(state.mode==='idle') status('Goal moved. The stored memory still points to the old goal.');
      renderMemory();
    } else {
      stop(); state.mouse={...p.cell}; state.start={...p.cell}; placeMouse(); status('Mouse placed. Press <b>Explore</b> or <b>Run from memory</b>.'); renderMemory();
    }
  });
  // Put the mouse back on the square it started from.
  function toStart(){stop();state.mouse={...state.start};placeMouse()}
  // Both runs start from the start square. Clear memory and New maze also flash relay CLR.
  $('bExplore').onclick=()=>{toStart();begin('explore')};
  $('bRecall').onclick=()=>{toStart();begin('recall')};
  $('bClear').onclick=()=>{stop();pulse('CLR',500);state.mem.fill(-1);state.expMoves=0;state.recMoves=null;status('Memory cleared. All relays released.');renderMemory()};
  $('bNew').onclick=()=>{stop();pulse('CLR',500);genMaze();syncWalls();state.mem.fill(-1);state.expMoves=0;state.recMoves=null;state.mouse={...state.start};placeMouse();status('New maze. Memory cleared.');renderMemory()};
  // "Clicking a square" toggle: moves the goal, or places the mouse.
  $('mGoal').onclick=()=>{state.clickMode='goal';$('mGoal').setAttribute('aria-pressed','true');$('mMouse').setAttribute('aria-pressed','false')};
  $('mMouse').onclick=()=>{state.clickMode='mouse';$('mMouse').setAttribute('aria-pressed','true');$('mGoal').setAttribute('aria-pressed','false')};
  // Keys 1 and 2 press Explore and Run from memory, except while typing in an input.
  addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return; if(e.key==='1')$('bExplore').click(); if(e.key==='2')$('bRecall').click()});
}
