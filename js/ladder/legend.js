import {$} from '../config.js';
import {E,drawContact} from './draw.js';

// legend symbols
export function renderLegend(){
  const items=[[{t:'no'},'Normally open contact: closes when its relay operates'],[{t:'nc'},'Normally closed contact: opens when its relay operates'],
    [{t:'no',inp:1},'Switch or cam on the machine'],[{t:'no',inp:1,pb:1},'Pushbutton'],['coil','Relay coil; SR marks slow-release'],['lit','Lit: contact closed or coil energised, live']];
  const host=$('lgd');
  items.forEach(([sym,txt])=>{
    const d=document.createElement('div'); d.className='li';
    const s=E('svg',{viewBox:'0 0 62 36',width:62,height:36,'aria-hidden':'true'},d);
    if(sym==='coil'){E('line',{x1:0,y1:22,x2:17,y2:22,class:'w'},s);E('circle',{cx:31,cy:22,r:12,class:'s cf'},s);E('line',{x1:45,y1:22,x2:62,y2:22,class:'w'},s);const t=E('text',{x:31,y:25.5,class:'tg','text-anchor':'middle'},s);t.textContent='SR'}
    else if(sym==='lit'){const g=E('g',{class:'on'},s);drawContact(g,{t:'no'},0,22,false)}
    else drawContact(s,sym,0,22,false);
    const p=document.createElement('span'); p.textContent=txt; d.appendChild(p); host.appendChild(d);
  });
}
