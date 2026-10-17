// Building blocks for describing ladder rungs.
export const no=r=>({t:'no',r}), nc=r=>({t:'nc',r}), lm=r=>({t:'no',r,lm:1});
export const sw=(r,k)=>({t:k||'no',r,inp:1}), pb=(r,k)=>({t:k||'no',r,inp:1,pb:1});
export const par=(...b)=>({t:'par',b});
export const R=(desc,items,coil,tag,load)=>({desc,items,coil,tag,load});
export const NOTE=note=>({note});
export const DISP={Ci:'Cᵢ',Rj:'Rⱼ',M1ij:'M1ᵢⱼ',M0ij:'M0ᵢⱼ'};
