import {N,H,T,DX,DZ,ARROW,reduce,C,COLS,idx,$} from './config.js';
import {maze,wallAt,genMaze,reachable} from './maze.js';
import {renderSheets,updateSchematic} from './ladder/draw.js';
import {renderLegend} from './ladder/legend.js';
import {initHelp} from './ladder/help.js';


/* ---------- three.js scene ---------- */
const canvas=document.getElementById('c'), stage=document.getElementById('stage');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;
const scene=new THREE.Scene(); scene.background=C('--panel');
scene.fog=new THREE.Fog(scene.background,14,26);
const camera=new THREE.PerspectiveCamera(42,1,.1,100);
camera.position.set(1.2,6.4,6.2);
const controls=new THREE.OrbitControls(camera,canvas);
controls.target.set(0,0,0.2); controls.enableDamping=true; controls.maxPolarAngle=1.35; controls.minDistance=3.5; controls.maxDistance=14; controls.enablePan=false;

scene.add(new THREE.HemisphereLight(0xf4efe2,0x2a3230,.55));
const sun=new THREE.DirectionalLight(0xfff2dc,1.05); sun.position.set(-3.5,7,3); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:1,far:20}); sun.shadow.bias=-.0008;
scene.add(sun);
const fill=new THREE.PointLight(0xf3a93a,.35,10); fill.position.set(3,2,-3); scene.add(fill);

// bench / cabinet
const wood=new THREE.MeshStandardMaterial({color:0x3b2a1e,roughness:.8});
const bench=new THREE.Mesh(new THREE.BoxGeometry(7.4,.5,7.4),wood); bench.position.y=-.33; bench.receiveShadow=true; scene.add(bench);
const panelMat=new THREE.MeshStandardMaterial({color:0x56615d,roughness:.6,metalness:.3});
const cab=new THREE.Mesh(new THREE.BoxGeometry(6.4,1.6,6.4),panelMat); cab.position.y=-1.4; scene.add(cab);
// relay rack lamps on cabinet front (decor, mirrors memory)
const lampMats=[];
for(let i=0;i<25;i++){
  const m=new THREE.MeshStandardMaterial({color:0x2b2a26,emissive:0x000000,roughness:.4});
  const l=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.04,16),m);
  l.rotation.x=Math.PI/2; l.position.set(-1.2+(i%5)*.6,-1.05-Math.floor(i/5)*.2,3.21); scene.add(l); lampMats.push(m);
}
// aluminium floor
const floorMat=new THREE.MeshStandardMaterial({color:0xb9bdb6,roughness:.45,metalness:.55});
const floor=new THREE.Mesh(new THREE.BoxGeometry(N+.2,.08,N+.2),floorMat); floor.position.y=-.04; floor.receiveShadow=true; scene.add(floor);
const grid=new THREE.GridHelper(N,N,0x7c827b,0x7c827b); grid.position.y=.002; grid.material.transparent=true; grid.material.opacity=.55; scene.add(grid);

const wallMat=new THREE.MeshStandardMaterial({color:0xd7dad3,roughness:.35,metalness:.65});
const postMat=new THREE.MeshStandardMaterial({color:0x8b918a,roughness:.4,metalness:.7});
for(let i=0;i<=N;i++)for(let j=0;j<=N;j++){
  const p=new THREE.Mesh(new THREE.BoxGeometry(.1,H+.03,.1),postMat); p.position.set(i-N/2,(H+.03)/2,j-N/2); p.castShadow=true; scene.add(p);
}
[[0,-N/2,N+.06,T],[0,N/2,N+.06,T],[-N/2,0,T,N+.06],[N/2,0,T,N+.06]].forEach(([x,z,w,d])=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,H,d),wallMat); m.position.set(x,H/2,z); m.castShadow=m.receiveShadow=true; scene.add(m);
});
// interior partitions + hit boxes
const slots=[], hitMeshes=[];
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
function syncWalls(){slots.forEach(s=>s.mesh.visible= s.type==='h'?maze.h[s.x][s.z]:maze.v[s.x][s.z])}

// hover ghosts
const ghostMat=new THREE.MeshStandardMaterial({color:0xf3a93a,emissive:0xf3a93a,emissiveIntensity:.6,transparent:true,opacity:.35,depthWrite:false});
const ghostH=new THREE.Mesh(new THREE.BoxGeometry(.9,H+.02,T+.03),ghostMat), ghostV=new THREE.Mesh(new THREE.BoxGeometry(T+.03,H+.02,.9),ghostMat);
const ghostCell=new THREE.Mesh(new THREE.PlaneGeometry(.92,.92),new THREE.MeshBasicMaterial({color:0xf3a93a,transparent:true,opacity:.18,depthWrite:false}));
ghostCell.rotation.x=-Math.PI/2; ghostCell.position.y=.006;
[ghostH,ghostV,ghostCell].forEach(g=>{g.visible=false;scene.add(g)});

// memory arrows on the floor
const arrowShape=new THREE.Shape(); arrowShape.moveTo(0,.13); arrowShape.lineTo(.1,0); arrowShape.lineTo(.035,0); arrowShape.lineTo(.035,-.08); arrowShape.lineTo(-.035,-.08); arrowShape.lineTo(-.035,0); arrowShape.lineTo(-.1,0); arrowShape.closePath();
const arrowGeo=new THREE.ShapeGeometry(arrowShape); arrowGeo.rotateX(-Math.PI/2);
const arrowMat=new THREE.MeshStandardMaterial({color:0xf3a93a,emissive:0xb06a10,emissiveIntensity:.6,roughness:.5});
const arrows=[];
for(let i=0;i<N*N;i++){
  const g=new THREE.Group(), a=new THREE.Mesh(arrowGeo,arrowMat); a.position.set(0,.008,-.3); g.add(a);
  g.position.set(i%N-N/2+.5,0,Math.floor(i/N)-N/2+.5); g.visible=false; scene.add(g); arrows.push(g);
}

// goal: a wedge of cheese on a brass plate
const goalG=new THREE.Group();
const plate=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.02,32),new THREE.MeshStandardMaterial({color:0xb08a3e,metalness:.8,roughness:.3})); plate.position.y=.01; plate.receiveShadow=true; goalG.add(plate);
const cheese=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.14,3,1),new THREE.MeshStandardMaterial({color:0xe8c95a,roughness:.7}));
cheese.position.y=.09; cheese.castShadow=true; goalG.add(cheese);
for(let i=0;i<3;i++){const hole=new THREE.Mesh(new THREE.SphereGeometry(.025,8,8),new THREE.MeshStandardMaterial({color:0xb99a32}));hole.position.set(Math.cos(i*2.1)*.09,.12+i*.015,Math.sin(i*2.1)*.09);goalG.add(hole)}
scene.add(goalG);

// the mouse
const mouseG=new THREE.Group(), bodyG=new THREE.Group(); mouseG.add(bodyG);
const fur=new THREE.MeshStandardMaterial({color:0x8a7f72,roughness:.85});
const body=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),fur); body.scale.set(.15,.11,.24); body.position.y=.11; body.castShadow=true; bodyG.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),fur); head.scale.set(.09,.08,.12); head.position.set(0,.13,-.2); head.castShadow=true; bodyG.add(head);
const nose=new THREE.Mesh(new THREE.SphereGeometry(.022,12,10),new THREE.MeshStandardMaterial({color:0xd98a8a})); nose.position.set(0,.13,-.32); bodyG.add(nose);
const earMat=new THREE.MeshStandardMaterial({color:0xb79a92,roughness:.7,side:THREE.DoubleSide});
[-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.CircleGeometry(.055,20),earMat); e.position.set(s*.065,.22,-.15); e.rotation.set(-.2,s*.35,0); bodyG.add(e);
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.014,8,8),new THREE.MeshStandardMaterial({color:0x111111,roughness:.2})); eye.position.set(s*.045,.16,-.27); bodyG.add(eye)});
const tail=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0,.07,.22),new THREE.Vector3(.04,.04,.36),new THREE.Vector3(-.05,.02,.48),new THREE.Vector3(.02,.015,.6)]),20,.012,6),new THREE.MeshStandardMaterial({color:0xb79a92}));
tail.castShadow=true; bodyG.add(tail);
const whiskG=new THREE.Group(); whiskG.position.set(0,.13,-.3); bodyG.add(whiskG);
const wMat=new THREE.LineBasicMaterial({color:C('--copper')});
[-1,1].forEach(s=>[-.04,0,.04].forEach(dy=>{
  const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(s*.1,dy*.6,-.03),new THREE.Vector3(s*.2,dy,-.02+Math.abs(dy))]);
  whiskG.add(new THREE.Line(geo,wMat));
}));
scene.add(mouseG);

/* ---------- simulation ---------- */
let mem=Array(N*N).fill(-1);
let mouse={x:0,z:N-1}, angle=0, start={x:0,z:N-1}, goal={x:N-1,z:0};
let mode='idle', queue=[], cur=null, expMoves=0, recMoves=null, recallSeen=null, clickMode='goal';
const cellPos=(x,z)=>new THREE.Vector3(x-N/2+.5,0,z-N/2+.5);

const amber=C('--amber');

/* ---------- relay rack ---------- */
let audio=null, lastClick=0;
function click(){
  if(!$('snd').checked) return;
  const now=performance.now(); if(now-lastClick<22) return; lastClick=now;
  try{
    if(!audio) audio=new (window.AudioContext||window.webkitAudioContext)();
    const len=Math.floor(audio.sampleRate*.012), buf=audio.createBuffer(1,len,audio.sampleRate), ch=buf.getChannelData(0);
    for(let i=0;i<len;i++) ch[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);
    const src=audio.createBufferSource(), f=audio.createBiquadFilter(), g=audio.createGain();
    f.type='bandpass'; f.frequency.value=2600+Math.random()*900; f.Q.value=2.5; g.gain.value=.35;
    src.buffer=buf; src.connect(f).connect(g).connect(audio.destination); src.start();
  }catch(e){}
}
$('snd').addEventListener('change',()=>{try{if($('snd').checked&&!audio)audio=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}});

function makeRelay(name,title){
  const r=document.createElement('div'); r.className='relay'; r.title=title||name;
  r.innerHTML='<div class="can"><span class="dot"></span></div><span class="nm"></span>';
  r.querySelector('.nm').textContent=name; r._on=false; return r;
}
function setRelay(r,on){ if(r._on===on) return false; r._on=on; r.classList.toggle('on',on); click(); return true }

// memory bank: 25 squares × (b1,b0)
const memEl=$('mem'), memCells=[];
for(let z=0;z<N;z++)for(let x=0;x<N;x++){
  const c=document.createElement('div'); c.className='mcell';
  const sq=COLS[x]+(z+1);
  c.innerHTML=`<div class="tag"><span>${sq}</span><b>—</b></div><div class="pair"></div>`;
  const b1=makeRelay('b1',`${sq} bit 1`), b0=makeRelay('b0',`${sq} bit 0`);
  c.querySelector('.pair').append(b1,b0); memEl.appendChild(c);
  memCells.push({c,b1,b0,val:c.querySelector('.tag b')});
}

// logic bank: 40 relays by function
const GROUPS=[
  ['Square selector','from the carriage commutator',[['CA','column A'],['CB','column B'],['CC','column C'],['CD','column D'],['CE','column E'],['R1','row 1'],['R2','row 2'],['R3','row 3'],['R4','row 4'],['R5','row 5']]],
  ['Heading','read from turning-shaft cams',[['D1','heading bit 1'],['D0','heading bit 0'],['STEP','turn 90° clockwise']]],
  ['Sensing','whiskers and carriage',[['WSK','whisker on a partition'],['CTR','carriage centred'],['LEFT','carriage has left centre'],['BACK','backing off a wall'],['MIS','stored heading differs']]],
  ['Drive','carriage under the floor',[['EM','electromagnet holding mouse'],['MX','east–west motor'],['MY','north–south motor'],['POL','motor polarity'],['TURN','turn motor']]],
  ['Sequencer','steps of one decision',[['SQ1','load'],['SQ2','turn'],['SQ3','advance']]],
  ['Mode and memory','strategy and read/write',[['EXPL','exploration strategy'],['GOAL','goal strategy'],['RD','read memory'],['WR','write memory'],['CLR','clear memory']]],
  ['Supervisory','run and goal',[['HOLD','run holding circuit'],['BELL','goal bell']]],
];
const logicEl=$('logic'), logicRelays={};
GROUPS.forEach(([name,sub,list])=>{
  const g=document.createElement('div'); g.className='group';
  g.innerHTML=`<div class="gl">${name}<span>${sub}</span></div><div class="rs"></div>`;
  const rs=g.querySelector('.rs');
  list.forEach(([n,t])=>{const r=makeRelay(n,`${n}: ${t}`); logicRelays[n]=r; rs.appendChild(r)});
  logicEl.appendChild(g);
});
const pulses={};
function pulse(name,ms){pulses[name]=performance.now()+ms}
const pulsing=(name,now)=>(pulses[name]||0)>now;
const dirOf=a=>((Math.round(-a/(Math.PI/2))%4)+4)%4;
function headingNow(){return dirOf(angle)}

/* ---------- wiring diagram (relay ladder) ---------- */
renderSheets($('sheets'));
renderLegend();
initHelp();

function updateLogic(){
  const now=performance.now(), S={};
  const x=mouse.x, y=mouse.z;
  const mt=cur&&cur.type==='move'?cur.t:-1, bt=cur&&cur.type==='bump'?cur.t:-1, tt=cur&&cur.type==='turn'?cur.t:-1;
  const ctr=!(mt>.15&&mt<.85)&&!(bt>.12&&bt<.92);
  S.CX=S.CY=S.CTR=ctr;
  for(let k=0;k<N;k++){S['X'+COLS[k]]=S['C'+COLS[k]]=ctr&&x===k; S['Y'+(k+1)]=S['R'+(k+1)]=ctr&&y===k}
  const det=!(tt>.15&&tt<.85);
  const hd=tt>=0?dirOf(tt<.5?cur.a0:cur.a1):headingNow();
  ['HN','HE','HS','HW'].forEach((k,j)=>S[k]=det&&hd===j);
  S.DET=det; S.D1=S.HS||S.HW; S.D0=S.HE||S.HW;
  S.W=S.WSK=bt>.35&&bt<.6;
  S.G=S.BELL=x===goal.x&&y===goal.z;
  S.HOLD=mode!=='idle'; S.EXPL=mode==='explore'; S.GOAL=mode==='recall';
  S.SQ1=pulsing('SQ1',now); S.RD=pulsing('RD',now);
  const st=mem[idx(x,y)]<0?0:mem[idx(x,y)];
  S.MIS=S.RD&&det&&st!==hd;
  S.TURN=tt>=0; S.SQ2=tt>=0; S.STEP=pulsing('STEP',now);
  S.SQ3=mt>=0||(bt>=0&&bt<.5); S.LEFT=mt>.15||(bt>.12&&bt<.5); S.BACK=bt>=.5;
  S.WR=mt>=0&&mt<.15; S.CLR=pulsing('CLR',now);
  S.EM=S.HOLD||!!cur;
  const drv=S.SQ3||S.BACK; S.MX=drv&&S.D0; S.MY=drv&&!S.D0; S.POL=(S.D1!==S.D0)!==S.BACK;
  let n=0;
  for(const k in logicRelays){setRelay(logicRelays[k],!!S[k]); if(S[k]) n++}
  $('logCount').textContent=`${n} of 33 energised`;
  updateSchematic(S,x,y,memCells);
}
const pms=()=>Math.max(120,dur('turn')*1000*.9);

function renderMemory(){
  let n=0, bits=0;
  for(let i=0;i<N*N;i++){
    const d=mem[i], m=memCells[i];
    setRelay(m.b1,d>=0&&!!(d&2)); setRelay(m.b0,d>=0&&!!(d&1));
    bits+=(m.b1._on?1:0)+(m.b0._on?1:0);
    m.val.textContent=d<0?'—':ARROW[d]+' '+'NESW'[d];
    m.c.classList.toggle('sel',i===idx(mouse.x,mouse.z)); m.c.classList.toggle('goal',i===idx(goal.x,goal.z));
    arrows[i].visible=d>=0; if(d>=0){arrows[i].rotation.y=-d*Math.PI/2;n++}
    lampMats[i].emissive.copy(d>=0?amber:new THREE.Color(0)); lampMats[i].emissiveIntensity=i===idx(mouse.x,mouse.z)?1.4:.7;
    lampMats[i].color.set(d>=0?0x6b4a18:0x2b2a26);
  }
  $('sMem').textContent=n+'/25'; $('memCount').textContent=`${bits} of 50 energised`; $('sExp').textContent=expMoves; $('sRec').textContent=recMoves==null?'—':recMoves;
}
function status(html){$('status').innerHTML=html}
function placeGoal(){goalG.position.copy(cellPos(goal.x,goal.z))}
function placeMouse(){mouseG.position.copy(cellPos(mouse.x,mouse.z))}

function stop(){mode='idle';queue=[];cur=null;placeMouse();mouseG.rotation.y=angle;bodyG.position.set(0,0,0);whiskG.scale.set(1,1,1);
  headDir=((Math.round(-angle/(Math.PI/2))%4)+4)%4}
function begin(m){
  stop();
  if(!reachable(mouse,goal)){status('The goal is walled off from the mouse. Open a partition first.');renderMemory();return}
  mode=m;
  if(m==='explore'){expMoves=0;status('<b>Exploring.</b> Whiskers find each wall; the relay steps to the next direction.')}
  else {recMoves=0;recallSeen=new Set();status('<b>Running from memory.</b> Following the stored direction in each square.')}
  renderMemory();
}
function finish(){
  const m=mode; mode='idle';
  if(m==='explore') status(`<b>Goal found</b> in ${expMoves} moves. Memory now points the way. Press <b>Run from memory</b>.`);
  else status(`<b>Goal reached</b> in ${recMoves} moves, straight from memory.`);
  renderMemory();
}
let headDir=0; // heading as of the end of the queued actions
function pushDir(d,move){
  if(d!==headDir){queue.push({type:'turn',d});headDir=d}
  queue.push({type:move?'move':'bump',d});
}
function decide(){
  if(mouse.x===goal.x&&mouse.z===goal.z){pulse('BELL',1600);finish();return}
  const i=idx(mouse.x,mouse.z);
  pulse('SQ1',pms()); pulse('RD',pms()*.8);
  if(mode==='recall'){
    const d=mem[i];
    if(d<0||wallAt(mouse.x,mouse.z,d)||recallSeen.has(i)){
      mode='explore'; expMoves=0;
      status(d>=0&&wallAt(mouse.x,mouse.z,d)?'<b>Memory stale</b>: a wall now blocks the stored path. Re-exploring.':'<b>Memory incomplete</b> for this route. Re-exploring.');
    } else { recallSeen.add(i); pushDir(d,true); return }
  }
  // Shannon's rule: start one quarter-turn past the last exit, rotate until a whisker finds no wall.
  // Relays at rest read 00 (north), so an unvisited square is tried from east first, as in the wiring diagram.
  pulse('STEP',pms());
  let d=((mem[i]<0?0:mem[i])+1)%4;
  for(let k=0;k<4;k++){
    if(!wallAt(mouse.x,mouse.z,d)){mem[i]=d;pulse('WR',pms());renderMemory();pushDir(d,true);return}
    pushDir(d,false);
    d=(d+1)%4;
  }
}
// fix pushDir ordering with heading tracking
function dur(type){const s=+$('speed').value, k=2.2/s; return (type==='move'?.55:type==='turn'?.28:.32)*k}
function startAction(a){
  cur={...a,t:0,dur:dur(a.type),a0:angle,from:cellPos(mouse.x,mouse.z)};
  if(a.type==='turn'){let target=-a.d*Math.PI/2, delta=((target-angle)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI; cur.a1=angle+delta}
  if(a.type==='move'){cur.to=cellPos(mouse.x+DX[a.d],mouse.z+DZ[a.d])}
}
function endAction(){
  const a=cur; cur=null;
  if(a.type==='turn'){angle=a.a1;mouseG.rotation.y=angle}
  if(a.type==='move'){mouse.x+=DX[a.d];mouse.z+=DZ[a.d];placeMouse(); if(mode==='explore')expMoves++; else if(mode==='recall')recMoves++;
    if(expMoves>3000){status('Stopped after 3000 moves.');stop()} renderMemory()}
  if(a.type==='bump'){bodyG.position.set(0,0,0);whiskG.scale.set(1,1,1);pulse('STEP',pms()*.6)}
}

/* ---------- interaction ---------- */
const ray=new THREE.Raycaster(), ptr=new THREE.Vector2();
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
let down=null;
canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY}});
canvas.addEventListener('pointermove',e=>{
  const p=pick(e); ghostH.visible=ghostV.visible=ghostCell.visible=false; canvas.style.cursor='grab';
  if(!p) return; canvas.style.cursor='pointer';
  if(p.slot){const g=p.slot.type==='h'?ghostH:ghostV; g.position.copy(p.slot.mesh.position); g.visible=true}
  else {ghostCell.position.x=p.cell.x-N/2+.5; ghostCell.position.z=p.cell.z-N/2+.5; ghostCell.visible=true}
});
canvas.addEventListener('pointerleave',()=>{ghostH.visible=ghostV.visible=ghostCell.visible=false});
canvas.addEventListener('pointerup',e=>{
  if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5){down=null;return} down=null;
  const p=pick(e); if(!p) return;
  if(p.slot){
    const s=p.slot, arr=s.type==='h'?maze.h:maze.v; arr[s.x][s.z]=!arr[s.x][s.z]; syncWalls();
    if(mode!=='idle'&&!reachable(mouse,goal)){stop();status('That partition sealed off the goal. Run stopped.')}
    else if(mode==='idle') status(arr[s.x][s.z]?'Partition added.':'Partition removed.');
  } else if(clickMode==='goal'){
    goal={...p.cell}; placeGoal();
    if(mode!=='idle'&&!reachable(mouse,goal)){stop();status('The new goal square is walled off.')}
    else if(mode==='idle') status('Goal moved. The stored memory still points to the old goal.');
    renderMemory();
  } else {
    stop(); mouse={...p.cell}; start={...p.cell}; placeMouse(); status('Mouse placed. Press <b>Explore</b> or <b>Run from memory</b>.'); renderMemory();
  }
});
function toStart(){stop();mouse={...start};placeMouse()}
$('bExplore').onclick=()=>{toStart();begin('explore')};
$('bRecall').onclick=()=>{toStart();begin('recall')};
$('bClear').onclick=()=>{stop();pulse('CLR',500);mem.fill(-1);expMoves=0;recMoves=null;status('Memory cleared. All relays released.');renderMemory()};
$('bNew').onclick=()=>{stop();pulse('CLR',500);genMaze();syncWalls();mem.fill(-1);expMoves=0;recMoves=null;mouse={...start};placeMouse();status('New maze. Memory cleared.');renderMemory()};
$('mGoal').onclick=()=>{clickMode='goal';$('mGoal').setAttribute('aria-pressed','true');$('mMouse').setAttribute('aria-pressed','false')};
$('mMouse').onclick=()=>{clickMode='mouse';$('mMouse').setAttribute('aria-pressed','true');$('mGoal').setAttribute('aria-pressed','false')};
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return; if(e.key==='1')$('bExplore').click(); if(e.key==='2')$('bRecall').click()});

/* ---------- loop ---------- */
function resize(){const w=stage.clientWidth,hh=stage.clientHeight;renderer.setSize(w,hh,false);camera.aspect=w/hh;camera.updateProjectionMatrix()}
new ResizeObserver(resize).observe(stage); resize();
const clock=new THREE.Clock(); const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
function tick(){
  const dt=Math.min(clock.getDelta(),.05), time=clock.elapsedTime;
  if(mode!=='idle'||cur){
    if(!cur&&!queue.length&&mode!=='idle') decide();
    if(!cur&&queue.length) startAction(queue.shift());
    if(cur){
      cur.t+=dt/cur.dur; const t=Math.min(cur.t,1), e=ease(t);
      if(cur.type==='turn') mouseG.rotation.y=cur.a0+(cur.a1-cur.a0)*e;
      if(cur.type==='move'){mouseG.position.lerpVectors(cur.from,cur.to,e); bodyG.position.y=Math.abs(Math.sin(t*Math.PI*3))*.012}
      if(cur.type==='bump'){const b=Math.sin(t*Math.PI); bodyG.position.set(0,0,-b*.17); whiskG.scale.set(1-b*.35,1,1)}
      if(t>=1) endAction();
    }
  }
  cheese.rotation.y=time*.6; goalG.position.y=Math.sin(time*2)*.004;
  if(mode==='idle'&&!cur) head.rotation.y=Math.sin(time*1.3)*.15;
  updateLogic();
  controls.update(); renderer.render(scene,camera); requestAnimationFrame(tick);
}

genMaze(); syncWalls(); placeGoal(); placeMouse(); renderMemory();
if(!reachable(mouse,goal)){genMaze();syncWalls()}
if(!reduce) setTimeout(()=>begin('explore'),700); else status('Ready. Press <b>Explore</b> to start.');
tick();
