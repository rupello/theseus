import {N,C} from '../config.js';

/* ---------- three.js scene ---------- */
// The 3D stage: renderer, camera, lights, bench, cabinet and floor.
//
// World units: one square = 1, y is up, and the board is centred on the origin.
//
//            x: -2.5        0        +2.5
//     z: -2.5   +-----------+-----------+     north, far from the camera
//               |  A1                E1 |
//            0  |           ·           |
//               |  A5                E5 |
//     z: +2.5   +-----------+-----------+
//                           ▲
//                    camera starts here, south and above
export const canvas=document.getElementById('c'), stage=document.getElementById('stage');
export const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;

// Background and fog use the page's panel colour so the stage blends into the card.
export const scene=new THREE.Scene(); scene.background=C('--panel');
scene.fog=new THREE.Fog(scene.background,14,26);
export const camera=new THREE.PerspectiveCamera(42,1,.1,100);
camera.position.set(1.2,6.4,6.2);

// Drag to orbit around the board; zoom is limited and panning is off.
export const controls=new THREE.OrbitControls(camera,canvas);
controls.target.set(0,0,0.2); controls.enableDamping=true; controls.maxPolarAngle=1.35; controls.minDistance=3.5; controls.maxDistance=14; controls.enablePan=false;

// Lights: soft sky/ground fill, a shadow-casting 'sun', and a warm amber glow from the far corner.
scene.add(new THREE.HemisphereLight(0xf4efe2,0x2a3230,.55));
const sun=new THREE.DirectionalLight(0xfff2dc,1.05); sun.position.set(-3.5,7,3); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:1,far:20}); sun.shadow.bias=-.0008;
scene.add(sun);
const fill=new THREE.PointLight(0xf3a93a,.35,10); fill.position.set(3,2,-3); scene.add(fill);

// Wooden bench under the board, and the metal cabinet that held the relays.
const wood=new THREE.MeshStandardMaterial({color:0x3b2a1e,roughness:.8});
const bench=new THREE.Mesh(new THREE.BoxGeometry(7.4,.5,7.4),wood); bench.position.y=-.33; bench.receiveShadow=true; scene.add(bench);
const panelMat=new THREE.MeshStandardMaterial({color:0x56615d,roughness:.6,metalness:.3});
const cab=new THREE.Mesh(new THREE.BoxGeometry(6.4,1.6,6.4),panelMat); cab.position.y=-1.4; scene.add(cab);

// 25 lamps on the cabinet front, one per square in a 5×5 grid. Decoration that
// mirrors the memory: view.js lights a lamp when its square has a stored exit.
export const lampMats=[];
for(let i=0;i<25;i++){
  const m=new THREE.MeshStandardMaterial({color:0x2b2a26,emissive:0x000000,roughness:.4});
  const l=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.04,16),m);
  l.rotation.x=Math.PI/2; l.position.set(-1.2+(i%5)*.6,-1.05-Math.floor(i/5)*.2,3.21); scene.add(l); lampMats.push(m);
}

// Aluminium floor with a faint grid marking the squares. ui.js ray-casts against
// the floor to find which square was clicked.
const floorMat=new THREE.MeshStandardMaterial({color:0xb9bdb6,roughness:.45,metalness:.55});
export const floor=new THREE.Mesh(new THREE.BoxGeometry(N+.2,.08,N+.2),floorMat); floor.position.y=-.04; floor.receiveShadow=true; scene.add(floor);
const grid=new THREE.GridHelper(N,N,0x7c827b,0x7c827b); grid.position.y=.002; grid.material.transparent=true; grid.material.opacity=.55; scene.add(grid);

// Fit the renderer and camera to the stage's current size (called on every resize).
export function resize(){const w=stage.clientWidth,hh=stage.clientHeight;renderer.setSize(w,hh,false);camera.aspect=w/hh;camera.updateProjectionMatrix()}
