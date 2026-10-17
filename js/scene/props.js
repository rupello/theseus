import {N,C} from '../config.js';
import {state} from '../state.js';
import {scene} from './setup.js';

// The moving parts of the scene: memory arrows on the floor, the goal, and the mouse.

// One arrow per square, shown when that square has a stored exit and rotated
// to point along it (view.js does the showing and rotating).
const arrowShape=new THREE.Shape(); arrowShape.moveTo(0,.13); arrowShape.lineTo(.1,0); arrowShape.lineTo(.035,0); arrowShape.lineTo(.035,-.08); arrowShape.lineTo(-.035,-.08); arrowShape.lineTo(-.035,0); arrowShape.lineTo(-.1,0); arrowShape.closePath();
const arrowGeo=new THREE.ShapeGeometry(arrowShape); arrowGeo.rotateX(-Math.PI/2);
const arrowMat=new THREE.MeshStandardMaterial({color:0xf3a93a,emissive:0xb06a10,emissiveIntensity:.6,roughness:.5});
export const arrows=[];
for(let i=0;i<N*N;i++){
  const g=new THREE.Group(), a=new THREE.Mesh(arrowGeo,arrowMat); a.position.set(0,.008,-.3); g.add(a);
  g.position.set(i%N-N/2+.5,0,Math.floor(i/N)-N/2+.5); g.visible=false; scene.add(g); arrows.push(g);
}

// Goal: a spinning wedge of cheese on a brass plate (main.js spins it).
export const goalG=new THREE.Group();
const plate=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.02,32),new THREE.MeshStandardMaterial({color:0xb08a3e,metalness:.8,roughness:.3})); plate.position.y=.01; plate.receiveShadow=true; goalG.add(plate);
export const cheese=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.14,3,1),new THREE.MeshStandardMaterial({color:0xe8c95a,roughness:.7}));
cheese.position.y=.09; cheese.castShadow=true; goalG.add(cheese);
for(let i=0;i<3;i++){const hole=new THREE.Mesh(new THREE.SphereGeometry(.025,8,8),new THREE.MeshStandardMaterial({color:0xb99a32}));hole.position.set(Math.cos(i*2.1)*.09,.12+i*.015,Math.sin(i*2.1)*.09);goalG.add(hole)}
scene.add(goalG);

// The mouse. Nested groups let each part be animated separately:
//
//     mouseG       position = square, rotation = heading      (sim.js)
//      └─ bodyG    bounce while moving, lunge when bumping    (sim.js)
//          ├─ body, head, nose, ears, eyes, tail   head also wiggles when idle (main.js)
//          └─ whiskG   copper whiskers, squashed against a wall
//
// At rotation 0 the mouse faces north (-z).
export const mouseG=new THREE.Group(), bodyG=new THREE.Group(); mouseG.add(bodyG);
const fur=new THREE.MeshStandardMaterial({color:0x8a7f72,roughness:.85});
const body=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),fur); body.scale.set(.15,.11,.24); body.position.y=.11; body.castShadow=true; bodyG.add(body);
export const head=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),fur); head.scale.set(.09,.08,.12); head.position.set(0,.13,-.2); head.castShadow=true; bodyG.add(head);
const nose=new THREE.Mesh(new THREE.SphereGeometry(.022,12,10),new THREE.MeshStandardMaterial({color:0xd98a8a})); nose.position.set(0,.13,-.32); bodyG.add(nose);
const earMat=new THREE.MeshStandardMaterial({color:0xb79a92,roughness:.7,side:THREE.DoubleSide});
[-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.CircleGeometry(.055,20),earMat); e.position.set(s*.065,.22,-.15); e.rotation.set(-.2,s*.35,0); bodyG.add(e);
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.014,8,8),new THREE.MeshStandardMaterial({color:0x111111,roughness:.2})); eye.position.set(s*.045,.16,-.27); bodyG.add(eye)});
const tail=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0,.07,.22),new THREE.Vector3(.04,.04,.36),new THREE.Vector3(-.05,.02,.48),new THREE.Vector3(.02,.015,.6)]),20,.012,6),new THREE.MeshStandardMaterial({color:0xb79a92}));
tail.castShadow=true; bodyG.add(tail);
export const whiskG=new THREE.Group(); whiskG.position.set(0,.13,-.3); bodyG.add(whiskG);
const wMat=new THREE.LineBasicMaterial({color:C('--copper')});
[-1,1].forEach(s=>[-.04,0,.04].forEach(dy=>{
  const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(s*.1,dy*.6,-.03),new THREE.Vector3(s*.2,dy,-.02+Math.abs(dy))]);
  whiskG.add(new THREE.Line(geo,wMat));
}));
scene.add(mouseG);

// Centre of square (x,z) in world coordinates.
export const cellPos=(x,z)=>new THREE.Vector3(x-N/2+.5,0,z-N/2+.5);

// Move the goal or the mouse model onto the square stored in state.
export function placeGoal(){goalG.position.copy(cellPos(state.goal.x,state.goal.z))}
export function placeMouse(){mouseG.position.copy(cellPos(state.mouse.x,state.mouse.z))}
