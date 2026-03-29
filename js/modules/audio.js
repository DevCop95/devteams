window.addEventListener('beforeunload',()=>teardownPathWorker(false));

  if(localStorage.getItem('theme')==='light')document.body.classList.add('light-mode');
'use strict';
/*  STATE  */
let activeAg='ceo',simOn=false,step=-1,autoM=false,spd=1400,typing=false;
let _sessionGKey='';
try{_sessionGKey=sessionStorage.getItem('gk')||'';}catch(e){}
let GKEY=_sessionGKey||(localStorage.getItem('gk')||''),GMOD=localStorage.getItem('gm')||'llama-3.3-70b-versatile';
if(GKEY){
  try{sessionStorage.setItem('gk',GKEY);}catch(e){}
  localStorage.removeItem('gk');
}
const DEAD=['llama3-8b-8192','llama3-70b-8192','mixtral-8x7b-32768','gemma2-9b-it','llama-3.1-70b-versatile'];
if(DEAD.includes(GMOD)){GMOD='llama-3.3-70b-versatile';localStorage.setItem('gm',GMOD);}
if(GKEY){
  document.getElementById('keyinp').value=GKEY;
  document.getElementById('msel').value=GMOD;
  updApiUI();
}

let meetSpeaker=null;
let _meetingActive=false,_meetingRunId=0;
const _bootTime=Date.now();
const _moods={};
const MOOD_COLS={happy:'#0fa855',stressed:'#cc3344',focused:'#3a8ccc',idle:'#444444'};
function setMood(k,mood){_moods[k]=mood;const ag=AG[k];if(!ag)return;ag.halo.material.color.setStyle(MOOD_COLS[mood]||'#444');ag.halo.material.opacity=mood==='idle'?0:.18;showToast(`${ACFG[k].name.split(' ')[0]} → ${mood}`,MOOD_COLS[mood],k);}
function updateMoods(){Object.keys(ACFG).forEach(k=>{const ag=AG[k];if(!ag)return;const s=ag.state;const cur=_moods[k]||'idle';let next=cur;if(s==='working'&&ag.stateTime>10)next='focused';else if(s==='thinking'&&ag.stateTime>8)next='stressed';else if(s==='idle'&&ag.stateTime>15)next='happy';else if(s==='idle')next='idle';if(next!==cur)setMood(k,next);});}
let _meetCurrentLog=null;
let profileKey=null;

/*  SOUND  */
let sndOn=localStorage.getItem('snd')!=='0';let audioCtx=null;
function getACtx(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();return audioCtx;}
function tone(f,t,v=0.1,tp='sine'){try{const c=getACtx(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=f;o.type=tp;g.gain.setValueAtTime(v,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+t);o.start();o.stop(c.currentTime+t);}catch(e){}}
function playCmp(){if(!sndOn)return;tone(523,'sine',.09);setTimeout(()=>tone(659,.11),80);setTimeout(()=>tone(784,.18),165);}
function playTk(){if(!sndOn)return;tone(440,.06,.05);}
function playNt(){if(!sndOn)return;tone(1047,.07,.06);}
function syncSoundBtn(){
  const b=document.getElementById('sndBtn');
  if(!b)return;
  b.classList.toggle('sa-on',sndOn);
  b.title=sndOn?'Audio activado':'Audio silenciado';
  b.innerHTML=sndOn
    ? `<span class="menu-ico"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg></span><span class="menu-lbl">Audio</span>`
    : `<span class="menu-ico"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg></span><span class="menu-lbl">Audio</span>`;
}
function toggleSound(){
  sndOn=!sndOn;
  localStorage.setItem('snd',sndOn?'1':'0');
  if(!sndOn){
    if(typeof _musicOn!=='undefined'&&_musicOn)stopGenerativeMusic();
    if(typeof _sa3dOn!=='undefined'&&_sa3dOn){
      _sa3dOn=false;
      if(_hvacGain&&_sACtx)try{_hvacGain.gain.setTargetAtTime(0,_sACtx.currentTime,.3);}catch(e){}
    }
  }
  syncSoundBtn();
  showToast(sndOn?'Audio activado':'Audio silenciado');
}
syncSoundBtn();

/*  #9 AUDIO 3D ESPACIAL  */
let _sACtx=null,_hvacGain=null,_sa3dOn=false;
function _getSA(){if(!_sACtx){_sACtx=new(window.AudioContext||window.webkitAudioContext)();if(_sACtx.state==='suspended')_sACtx.resume();}return _sACtx;}
function _startAmbient(){
  if(!_sa3dOn||!sndOn||_hvacGain)return;
  try{const ctx=_getSA(),sr=ctx.sampleRate;const buf=ctx.createBuffer(2,sr*5,sr);
  for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);let b=0;for(let i=0;i<d.length;i++){b=0.9975*b+(Math.random()*2-1)*0.042;d[i]=Math.max(-1,Math.min(1,b));}}
  const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;
  const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=380;
  const gn=ctx.createGain();gn.gain.value=0;
  src.connect(lp);lp.connect(gn);gn.connect(ctx.destination);src.start();
  gn.gain.setTargetAtTime(0.022,ctx.currentTime,1.4);_hvacGain=gn;_schedKbd();}catch(e){}
}
function _schedKbd(){if(!_sACtx||!_sa3dOn)return;setTimeout(()=>{_bgKeyClick();_schedKbd();},400+Math.random()*1600);}
function _bgKeyClick(){
  if(!_sa3dOn||!sndOn||!_sACtx)return;
  try{const ctx=_sACtx,o=ctx.createOscillator(),g=ctx.createGain(),pan=ctx.createStereoPanner?ctx.createStereoPanner():null;
  o.type='square';o.frequency.value=1800+Math.random()*3200;
  g.gain.setValueAtTime(0.004,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+.055);
  if(pan){pan.pan.value=(Math.random()-.5)*1.6;o.connect(g);g.connect(pan);pan.connect(ctx.destination);}else{o.connect(g);g.connect(ctx.destination);}
  o.start();o.stop(ctx.currentTime+.06);}catch(e){}
}
function updateAudioListener(){
  if(!_sACtx||!camera||!_sa3dOn)return;
  const ctx=_sACtx,p=camera.position;
  const fwd=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
  const up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
  try{if(ctx.listener.positionX){const t=ctx.currentTime;ctx.listener.positionX.setTargetAtTime(p.x,t,.015);ctx.listener.positionY.setTargetAtTime(p.y,t,.015);ctx.listener.positionZ.setTargetAtTime(p.z,t,.015);ctx.listener.forwardX.setTargetAtTime(fwd.x,t,.015);ctx.listener.forwardY.setTargetAtTime(fwd.y,t,.015);ctx.listener.forwardZ.setTargetAtTime(fwd.z,t,.015);ctx.listener.upX.setTargetAtTime(up.x,t,.015);ctx.listener.upY.setTargetAtTime(up.y,t,.015);ctx.listener.upZ.setTargetAtTime(up.z,t,.015);}else{ctx.listener.setPosition(p.x,p.y,p.z);ctx.listener.setOrientation(fwd.x,fwd.y,fwd.z,up.x,up.y,up.z);}}catch(e){}
}
function playAgentSpatialSound(key,type){
  if(!_sa3dOn||!sndOn||!AG||!AG[key])return;
  try{const ctx=_getSA();if(ctx.state==='suspended')ctx.resume();
  const ag=AG[key],gp=ag.group.position;
  const panner=ctx.createPanner();panner.panningModel='HRTF';panner.distanceModel='inverse';panner.refDistance=4;panner.maxDistance=30;panner.rolloffFactor=1.4;panner.coneInnerAngle=360;
  if(panner.positionX){panner.positionX.setValueAtTime(gp.x,ctx.currentTime);panner.positionY.setValueAtTime(gp.y+1.6,ctx.currentTime);panner.positionZ.setValueAtTime(gp.z,ctx.currentTime);}else{panner.setPosition(gp.x,gp.y+1.6,gp.z);}
  const gn=ctx.createGain();panner.connect(gn);gn.connect(ctx.destination);
  if(type==='step'){
    const o1=ctx.createOscillator(),o2=ctx.createOscillator();o1.type='sine';o1.frequency.setValueAtTime(90,ctx.currentTime);o1.frequency.exponentialRampToValueAtTime(28,ctx.currentTime+.13);o2.type='sawtooth';o2.frequency.value=155+Math.random()*70;
    const g2=ctx.createGain();g2.gain.setValueAtTime(0.055,ctx.currentTime);g2.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+.065);
    gn.gain.setValueAtTime(0.26,ctx.currentTime);gn.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+.17);
    o1.connect(panner);o2.connect(g2);g2.connect(panner);o1.start();o1.stop(ctx.currentTime+.18);o2.start();o2.stop(ctx.currentTime+.07);
  }else if(type==='key'){
    const o=ctx.createOscillator();o.type='square';o.frequency.value=1600+Math.random()*3200;
    gn.gain.setValueAtTime(0.065,ctx.currentTime);gn.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+.06);
    o.connect(panner);o.start();o.stop(ctx.currentTime+.065);
  }else if(type==='voice'){
    const o=ctx.createOscillator();o.type='sine';o.frequency.value=290+Math.random()*170;
    gn.gain.setValueAtTime(0.055,ctx.currentTime);gn.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+.22);
    o.connect(panner);o.start();o.stop(ctx.currentTime+.24);
  }}catch(e){}
}
function toggle3DAudio(){
  _sa3dOn=!_sa3dOn;const btn=document.getElementById('sa3dBtn');
  if(_sa3dOn){btn.classList.add('sa-on');btn.textContent='🎧 3D';_startAmbient();showToast('🎧 Audio 3D activo · muevete y escucha','#00bcd4');}
  else{btn.classList.remove('sa-on');btn.textContent='🎧 3D';if(_hvacGain&&_sACtx)try{_hvacGain.gain.setTargetAtTime(0,_sACtx.currentTime,.3);}catch(e){}showToast('🎧 Audio 3D desactivado');}
}

// MÚSICA GENERATIVA
let _musicOn=false,_musicLoop=null,_mCtx=null;
const _SCALES={
  working:[220,246.9,261.6,293.6,329.6,349.2,392,440],
  relaxed:[261.6,293.6,329.6,349.2,392,440,493.9,523.3],
  stressed:[233.1,261.6,277.2,311.1,349.2,369.9,415.3,466.2],
  meeting:[293.6,329.6,369.9,392,440,493.9,523.3,587.3]
};
function _getMCtx(){if(!_mCtx)_mCtx=new(window.AudioContext||window.webkitAudioContext)();return _mCtx;}
function _getMusicMode(){
  const wc=Object.values(AG).filter(a=>a.state==='working').length;
  if(meetSpeaker)return'meeting';if(wc>4)return'stressed';if(wc>1)return'working';return'relaxed';
}
function _mNote(freq,when,dur,vol=0.035,type='sine'){
  try{const ctx=_getMCtx();const o=ctx.createOscillator();const g=ctx.createGain();
  o.type=type;o.frequency.value=freq;
  g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(vol,when+.06);g.gain.exponentialRampToValueAtTime(.001,when+dur);
  const m=ctx.createGain();m.gain.value=.15;o.connect(g);g.connect(m);m.connect(ctx.destination);o.start(when);o.stop(when+dur+.05);}catch(e){}
}
let _mBeat=0;
function startGenerativeMusic(){
  if(_musicOn)return;_musicOn=true;
  document.getElementById('musicBtn').classList.add('fps-on');
  const ctx=_getMCtx();if(ctx.state==='suspended')ctx.resume();
  _musicLoop=setInterval(()=>{
    if(!_musicOn)return;
    const mode=_getMusicMode(),scale=_SCALES[mode];
    const bpm=mode==='stressed'?130:mode==='working'?105:mode==='meeting'?88:78;
    const bd=60/bpm,now=ctx.currentTime;
    if(_mBeat%2===0)_mNote(scale[0]/2,now,bd*1.6,.055,'triangle');
    if(_mBeat%4===0)[0,2,4].forEach((idx,i)=>_mNote(scale[idx],now+i*.018,bd*3,.022,'sine'));
    _mNote(scale[Math.floor(Math.random()*scale.length)]*2,now,bd*(Math.random()<.3?1.8:1),.012,'sine');
    // Hihat noise
    if(Math.random()>.45){try{const c2=_getMCtx();const buf=c2.createBuffer(1,c2.sampleRate*.04,c2.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,1.8);const src=c2.createBufferSource();src.buffer=buf;const gn=c2.createGain();gn.gain.value=.03;const hp=c2.createBiquadFilter();hp.type='highpass';hp.frequency.value=8000;src.connect(hp);hp.connect(gn);gn.connect(c2.destination);src.start(now);}catch(e){}}
    _mBeat=(_mBeat+1)%16;
  },Math.floor(60000/120)); // 120bpm interval base
  showToast('🎵 Musica generativa ON','#9060cc');
}
function stopGenerativeMusic(){
  _musicOn=false;clearInterval(_musicLoop);_musicLoop=null;
  document.getElementById('musicBtn')?.classList.remove('fps-on');
  showToast('🎵 Musica OFF');
}
function toggleGenerativeMusic(){_musicOn?stopGenerativeMusic():startGenerativeMusic();}