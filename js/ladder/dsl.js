// A tiny language for writing ladder rungs, used by sheets.js.
//
// A rung is a list of items in series (all must close: AND); par(...) holds
// parallel branches (any one closing will do: OR). For example
//
//   R('Start/stop latch', [par([pb('PB-EX')], [no('HOLD')]), nc('BELL')], 'HOLD')
//
// draws as
//
//   48 V ──┬──┤ ├──┬──┤/├────────( HOLD )── return
//          │ PB-EX │   BELL
//          └──┤ ├──┘
//            HOLD

// Contacts on relay r: no = normally open, nc = normally closed, lm = late-make (normally open).
export const no=r=>({t:'no',r}), nc=r=>({t:'nc',r}), lm=r=>({t:'no',r,lm:1});

// Contacts worked by the machine rather than a relay: sw = switch or cam, pb = pushbutton.
// k = 'nc' for one that's closed at rest.
export const sw=(r,k)=>({t:k||'no',r,inp:1}), pb=(r,k)=>({t:k||'no',r,inp:1,pb:1});

// Parallel branches; each argument is a list of items in series.
export const par=(...b)=>({t:'par',b});

// A rung: description, items, the coil it drives, an optional tag such as 'SR'
// (slow-release), and load = true for a device that isn't a relay (drawn as a box).
export const R=(desc,items,coil,tag,load)=>({desc,items,coil,tag,load});

// A line of explanatory text between rungs.
export const NOTE=note=>({note});

// Display names for the memory sheet's generic labels: column i, row j, cell ij.
export const DISP={Ci:'Cᵢ',Rj:'Rⱼ',M1ij:'M1ᵢⱼ',M0ij:'M0ᵢⱼ'};
