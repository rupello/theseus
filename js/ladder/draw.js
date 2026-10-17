import {$,idx,COLS} from '../config.js';
import {DISP} from './dsl.js';
import {SHEETS} from './sheets.js';

// Draws the ladder sheets as SVG and lights them from relay state.
//
// Layout of one rung (SVG units):
//
//   X0-18   X0                                         COILX            WD-24
//     │  12 ├──┤ ├──┤/├──┬──┤ ├──┬───────────────────────( SQ1 )───────────│
//     │       ←CW→       │       │                         SR  13 /17      │
//     │                  └──┤ ├──┘  ← parallel branch, BR lower            │
//    48 V      rung no.      ↑PP    contacts                 coil  xrefs   return
//
//   CW   width of one contact      BR   height of one branch row
//   PP   padding either side of a parallel block
const SV='http://www.w3.org/2000/svg';

// Create an SVG element with attributes a, appended to p if given.
export function E(tag,a,p){const e=document.createElementNS(SV,tag);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
export const CW=62, BR=44, PP=14, X0=64, WD=1000, COILX=WD-250;

// Everything that lights up: {el, r: relay name, k: 'no' | 'nc' | 'coil'}.
const live=[];

// Measure a series of items: w = width, h = rows tall. Stores each parallel
// block's size on it (_w, _h) for drawSeries to use.
function meas(items){let w=0,h=1;for(const it of items){if(it.t==='par'){let bw=0,bh=0;it.b.forEach(b=>{const m=meas(b);b._h=m.h;bw=Math.max(bw,m.w);bh+=m.h});it._w=bw+PP*2;it._h=bh;w+=it._w;h=Math.max(h,bh)}else w+=CW}return{w,h}}

// Draw one contact with its left end at (x,y):
//
//     ──┤ ├──   normally open      ──┤/├──   normally closed      ─┬─
//                                                                 ──┤ ├──  pushbutton
//
// track = true registers it for live lighting (the legend and help copies don't).
export function drawContact(g,it,x,y,track){
  const c=x+CW/2, gp=E('g',{class:'ct'+(it.inp?' in':'')},g);
  E('line',{x1:x,y1:y,x2:c-6,y2:y,class:'w'},gp); E('line',{x1:c+6,y1:y,x2:x+CW,y2:y,class:'w'},gp);
  E('line',{x1:c-6,y1:y-10,x2:c-6,y2:y+10,class:'s'},gp); E('line',{x1:c+6,y1:y-10,x2:c+6,y2:y+10,class:'s'},gp);
  if(it.t==='nc') E('line',{x1:c-11,y1:y+11,x2:c+11,y2:y-11,class:'s'},gp);
  if(it.pb){E('line',{x1:c,y1:y-10,x2:c,y2:y-17,class:'s'},gp);E('line',{x1:c-6,y1:y-17,x2:c+6,y2:y-17,class:'s'},gp)}
  if(it.r){const t=E('text',{x:c,y:y-(it.pb?21:15),class:'nm','text-anchor':'middle'},gp); t.textContent=DISP[it.r]||it.r;
    if(it.lm){const s=E('tspan',{class:'tg',dx:'3'},t); s.textContent='LM'}}
  if(track) live.push({el:gp,r:it.r,k:it.t});
}

// Draw items left to right starting at (x,y), recursing into parallel blocks.
// Returns the x where the series ends.
function drawSeries(g,items,x,y){
  for(const it of items){
    if(it.t==='par'){
      let yy=y,last=y; const xr=x+it._w;
      it.b.forEach(b=>{E('line',{x1:x,y1:yy,x2:x+PP,y2:yy,class:'w'},g); const ex=drawSeries(g,b,x+PP,yy); E('line',{x1:ex,y1:yy,x2:xr,y2:yy,class:'w'},g); last=yy; yy+=b._h*BR});
      E('line',{x1:x,y1:y,x2:x,y2:last,class:'w'},g); E('line',{x1:xr,y1:y,x2:xr,y2:last,class:'w'},g);
      E('circle',{cx:x,cy:y,r:2.2,class:'dot'},g); E('circle',{cx:xr,cy:y,r:2.2,class:'dot'},g);
      x=xr;
    } else { drawContact(g,it,x,y,true); x+=CW }
  }
  return x;
}

// Rungs are numbered continuously across sheets; allRungs keeps them for crossRefs.
let rungNo=0; const allRungs=[];

// Draw one sheet into host: heading, both rails, then each rung (description,
// number, contacts, coil, and an empty slot for its cross-references).
function renderSheet(sh,k,host){
  const wrap=document.createElement('div'); wrap.className='sheet';
  wrap.innerHTML=`<h3><span class="sn">Sheet ${k+1}</span>${sh.title}${sh.mem?' · square <span id="memsq">A1</span>':''}</h3><div class="scroll"></div><p class="legend">${sh.inputs}</p>`;
  host.appendChild(wrap);
  const rows=sh.rungs.map(r=>r.note?{r,h:26}:{r,h:34+meas(r.items).h*BR});
  const H=rows.reduce((a,b)=>a+b.h,0)+8;
  const svg=E('svg',{viewBox:`0 0 ${WD} ${H}`,width:WD,height:H,class:'lad',role:'img','aria-label':`Ladder diagram, ${sh.title}`},wrap.querySelector('.scroll'));
  E('line',{x1:X0-18,y1:0,x2:X0-18,y2:H,class:'rail'},svg); E('line',{x1:WD-24,y1:0,x2:WD-24,y2:H,class:'rail'},svg);
  let y=4;
  rows.forEach(({r,h})=>{
    if(r.note){const t=E('text',{x:X0,y:y+17,class:'note'},svg);t.textContent=r.note;y+=h;return}
    r.no=++rungNo; allRungs.push(r);
    const g=E('g',{},svg), ry=y+48;
    if(r.desc){const d=E('text',{x:X0,y:y+12,class:'desc'},g); d.textContent=r.desc}
    const n=E('text',{x:X0-26,y:ry+4,class:'rn','text-anchor':'end'},g); n.textContent=r.no;
    E('line',{x1:X0-18,y1:ry,x2:X0,y2:ry,class:'w'},g);
    const ex=drawSeries(g,r.items,X0,ry);
    E('line',{x1:ex,y1:ry,x2:COILX-15,y2:ry,class:'w'},g);
    const cg=E('g',{class:'coil'},g);
    if(r.load) E('rect',{x:COILX-15,y:ry-12,width:30,height:24,rx:3,class:'s cf'},cg);
    else E('circle',{cx:COILX,cy:ry,r:14,class:'s cf'},cg);
    const cn=E('text',{x:COILX,y:ry-20,class:'nm','text-anchor':'middle'},cg); cn.textContent=DISP[r.coil]||r.coil;
    if(r.tag){const t=E('text',{x:COILX,y:ry+3.5,class:'tg','text-anchor':'middle'},cg);t.textContent=r.tag}
    E('line',{x1:COILX+15,y1:ry,x2:WD-24,y2:ry,class:'w'},g);
    r._xr=E('text',{x:COILX+22,y:ry+17,class:'xr'},g);
    live.push({el:cg,r:r.load?'BELL':r.coil,k:'coil'});
    y+=h;
  });
}

// Next to each coil, list the rungs that use that relay's contacts ('/' = normally
// closed), so a signal can be followed from sheet to sheet. Generic Ci/Rj contacts
// count for every column/row relay.
function crossRefs(){
  const uses=[];
  const walk=(items,no)=>items.forEach(it=>{if(it.t==='par')it.b.forEach(b=>walk(b,no));else if(!it.inp)uses.push({r:it.r,no,nc:it.t==='nc'})});
  allRungs.forEach(r=>walk(r.items,r.no));
  const match=(coil,r)=>r===coil||(r==='Ci'&&/^C[A-E]$/.test(coil))||(r==='Rj'&&/^R[1-5]$/.test(coil));
  allRungs.forEach(r=>{ if(r.load) return;
    const seen=new Set(), list=[];
    uses.filter(u=>match(r.coil,u.r)).forEach(u=>{const k=(u.nc?'/':'')+u.no; if(!seen.has(k)){seen.add(k);list.push(k)}});
    r._xr.textContent=list.join(' ');
  });
}

// Draw all sheets, then fill in the cross-references.
export function renderSheets(host){
  SHEETS.forEach((s,k)=>renderSheet(s,k,host));
  crossRefs();
}

// Light each tracked contact and coil from relay state S (from logic.js). A normally
// closed contact is lit when its relay is off. The memory sheet shows the square under
// the carriage, so Ci, Rj, M1ij and M0ij refer to that square.
let lastSq='';
export function updateSchematic(S,x,y,memCells){
  const i=idx(x,y), m=memCells[i];
  const val=r=>{ if(r==='Ci') return !!S['C'+COLS[x]]; if(r==='Rj') return !!S['R'+(y+1)];
    if(r==='M1ij') return m.b1._on; if(r==='M0ij') return m.b0._on; return !!S[r] };
  for(const L of live){const on=val(L.r); const act=L.k==='nc'?!on:on; if(L._a!==act){L._a=act;L.el.classList.toggle('on',act)}}
  const sq=COLS[x]+(y+1); if(sq!==lastSq){lastSq=sq; const e=$('memsq'); if(e) e.textContent=sq}
}
