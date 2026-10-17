import {$} from '../config.js';

// Relay click sound, off unless 'Relay clicks' is ticked.

let audio=null, lastClick=0;

// Play one click: a 12 ms burst of noise through a band-pass filter, pitch varied
// a little each time. At most one every 22 ms, so a burst of relays doesn't roar.
export function click(){
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

// Browsers only allow sound after a user action, so create the audio context
// when the box is ticked.
$('snd').addEventListener('change',()=>{try{if($('snd').checked&&!audio)audio=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}});
