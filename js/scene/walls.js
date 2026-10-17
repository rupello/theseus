import {N,H,T} from '../config.js';
import {maze} from '../maze.js';
import {scene} from './setup.js';

const wallMat=new THREE.MeshStandardMaterial({color:0xd7dad3,roughness:.35,metalness:.65});
const postMat=new THREE.MeshStandardMaterial({color:0x8b918a,roughness:.4,metalness:.7});
for(let i=0;i<=N;i++)for(let j=0;j<=N;j++){
  const p=new THREE.Mesh(new THREE.BoxGeometry(.1,H+.03,.1),postMat); p.position.set(i-N/2,(H+.03)/2,j-N/2); p.castShadow=true; scene.add(p);
}
[[0,-N/2,N+.06,T],[0,N/2,N+.06,T],[-N/2,0,T,N+.06],[N/2,0,T,N+.06]].forEach(([x,z,w,d])=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,H,d),wallMat); m.position.set(x,H/2,z); m.castShadow=m.receiveShadow=true; scene.add(m);
});
// interior partitions + hit boxes
const slots=[];
export const hitMeshes=[];
const hitMat=new THREE.MeshBasicMaterial({visible:false});
function addSlot(type,x,z){
  const horiz=type==='h';
  const geo=horiz?new THREE.BoxGeometry(1-.1,H,T):new THREE.BoxGeometry(T,H,1-.1);
  const m=new THREE.Mesh(geo,wallMat); m.castShadow=m.receiveShadow=true;
  const px=horiz? x-N/2+.5 : x-N/2+1, pz=horiz? z-N/2+1 : z-N/2+.5;
  m.position.set(px,H/2,pz); scene.add(m);
  const hit=new THREE.Mesh(horiz?new THREE.BoxGeometry(.8,H+.1,.26):new THREE.BoxGeometry(.26,H+.1,.8),hitMat);
  hit.position.copy(m.position); hit.userData={slot:{type,x,z,mesh:m}}; scene.add(hit); hitMeshes.push(hit);
  slots.push({type,x,z,mesh:m});
}
for(let x=0;x<N;x++)for(let z=0;z<N-1;z++)addSlot('h',x,z);
for(let x=0;x<N-1;x++)for(let z=0;z<N;z++)addSlot('v',x,z);
export function syncWalls(){slots.forEach(s=>s.mesh.visible= s.type==='h'?maze.h[s.x][s.z]:maze.v[s.x][s.z])}

// hover ghosts
const ghostMat=new THREE.MeshStandardMaterial({color:0xf3a93a,emissive:0xf3a93a,emissiveIntensity:.6,transparent:true,opacity:.35,depthWrite:false});
export const ghostH=new THREE.Mesh(new THREE.BoxGeometry(.9,H+.02,T+.03),ghostMat), ghostV=new THREE.Mesh(new THREE.BoxGeometry(T+.03,H+.02,.9),ghostMat);
export const ghostCell=new THREE.Mesh(new THREE.PlaneGeometry(.92,.92),new THREE.MeshBasicMaterial({color:0xf3a93a,transparent:true,opacity:.18,depthWrite:false}));
ghostCell.rotation.x=-Math.PI/2; ghostCell.position.y=.006;
[ghostH,ghostV,ghostCell].forEach(g=>{g.visible=false;scene.add(g)});
