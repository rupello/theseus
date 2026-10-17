import {$} from '../config.js';
import {E,drawContact,BR} from './draw.js';

// help dialog: symbol legend + worked example, drawn with the same primitives as the diagram
export function initHelp(){
  const syms=[
    [{t:'no',r:'SQ1'},'Normally open contact','Open at rest. Closes when relay SQ1 is energised.'],
    [{t:'nc',r:'SQ2'},'Normally closed contact','Closed at rest. Opens when relay SQ2 is energised.'],
    [{t:'no',r:'CX',inp:1},'Switch or cam','Copper: a contact on the machine itself, worked by the carriage, shaft or whiskers rather than a relay.'],
    [{t:'no',r:'PB-EX',inp:1,pb:1},'Pushbutton','Closes only while pressed. A slashed pushbutton (like Stop) opens while pressed.'],
    ['coil','Relay coil','The end of every rung. Energised when the rung conducts; it then switches every contact with its name.'],
    ['load','Load','A device that is not a relay, here the goal bell.'],
    ['branch','Junction','A dot where a rung splits into parallel branches or rejoins.'],
    ['lit','Live state','Amber: contact closed or coil energised right now.'],
  ];
  const host=$('helpSyms');
  syms.forEach(([sym,name,txt])=>{
    const d=document.createElement('div'); d.className='li';
    const s=E('svg',{viewBox:'0 0 70 44',width:70,height:44,'aria-hidden':'true'},d);
    const y=29;
    if(sym==='coil'){E('line',{x1:0,y1:y,x2:21,y2:y,class:'w'},s);E('circle',{cx:35,cy:y,r:13,class:'s cf'},s);E('line',{x1:49,y1:y,x2:70,y2:y,class:'w'},s);const t=E('text',{x:35,y:y-18,class:'nm','text-anchor':'middle'},s);t.textContent='HOLD'}
    else if(sym==='load'){E('line',{x1:0,y1:y,x2:21,y2:y,class:'w'},s);E('rect',{x:21,y:y-11,width:28,height:22,rx:3,class:'s cf'},s);E('line',{x1:49,y1:y,x2:70,y2:y,class:'w'},s);const t=E('text',{x:35,y:y-16,class:'nm','text-anchor':'middle'},s);t.textContent='bell'}
    else if(sym==='branch'){E('line',{x1:0,y1:18,x2:70,y2:18,class:'w'},s);E('line',{x1:0,y1:38,x2:70,y2:38,class:'w'},s);E('line',{x1:20,y1:18,x2:20,y2:38,class:'w'},s);E('line',{x1:50,y1:18,x2:50,y2:38,class:'w'},s);E('circle',{cx:20,cy:18,r:2.6,class:'dot'},s);E('circle',{cx:50,cy:18,r:2.6,class:'dot'},s)}
    else if(sym==='lit'){const g=E('g',{class:'on'},s);drawContact(g,{t:'no',r:'WSK'},4,y,false)}
    else drawContact(s,sym,4,y,false);
    const p=document.createElement('div'); p.innerHTML=`<strong>${name}</strong>${txt}`; d.appendChild(p); host.appendChild(d);
  });
  // worked example: start/stop latch
  const ex=$('helpEx'), y1=58, y2=y1+BR, L=24, Rr=600, cx=480;
  E('line',{x1:L,y1:4,x2:L,y2:132,class:'rail'},ex); E('line',{x1:Rr,y1:4,x2:Rr,y2:132,class:'rail'},ex);
  const t=E('text',{x:L+10,y:20,class:'desc'},ex); t.textContent='Start button, or HOLD’s own contact, keeps the HOLD coil energised until the bell rings';
  E('line',{x1:L,y1:y1,x2:L+30,y2:y1,class:'w'},ex);
  drawContact(ex,{t:'no',r:'PB-EX',inp:1,pb:1},L+44,y1,false);
  drawContact(ex,{t:'no',r:'HOLD'},L+44,y2,false);
  E('line',{x1:L+30,y1:y1,x2:L+44,y2:y1,class:'w'},ex); E('line',{x1:L+30,y1:y2,x2:L+44,y2:y2,class:'w'},ex);
  E('line',{x1:L+30,y1:y1,x2:L+30,y2:y2,class:'w'},ex);
  E('line',{x1:L+106,y1:y2,x2:L+120,y2:y2,class:'w'},ex); E('line',{x1:L+120,y1:y2,x2:L+120,y2:y1,class:'w'},ex);
  E('circle',{cx:L+30,cy:y1,r:2.2,class:'dot'},ex); E('circle',{cx:L+120,cy:y1,r:2.2,class:'dot'},ex);
  E('line',{x1:L+106,y1:y1,x2:L+120,y2:y1,class:'w'},ex);
  drawContact(ex,{t:'nc',r:'BELL'},L+150,y1,false); E('line',{x1:L+120,y1:y1,x2:L+150,y2:y1,class:'w'},ex);
  E('line',{x1:L+212,y1:y1,x2:cx-14,y2:y1,class:'w'},ex);
  E('circle',{cx,cy:y1,r:14,class:'s cf'},ex); const cn=E('text',{x:cx,y:y1-20,class:'nm','text-anchor':'middle'},ex); cn.textContent='HOLD';
  E('line',{x1:cx+14,y1:y1,x2:Rr,y2:y1,class:'w'},ex);
  const a1=E('text',{x:L+75,y:y2+28,class:'xr','text-anchor':'middle'},ex); a1.textContent='holds itself in';
  const a2=E('text',{x:L+181,y:y1+30,class:'xr','text-anchor':'middle'},ex); a2.textContent='breaks to stop';
  const dlg=$('help');
  $('helpOpen').addEventListener('click',()=>{ if(dlg.showModal) dlg.showModal(); else dlg.setAttribute('open','') });
  $('helpClose').addEventListener('click',()=>dlg.close());
  dlg.addEventListener('click',e=>{ if(e.target===dlg) dlg.close() });
}
