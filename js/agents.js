// agents.js - Three.js and Agents movement/behaviors
import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
window.THREE = THREE;

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
    ? `<span class="menu-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg></span><span class="menu-lbl">Audio</span>`
    : `<span class="menu-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg></span><span class="menu-lbl">Audio</span>`;
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

/* #10 MODO DÍA/NOCHE */
let dayMode=localStorage.getItem('dayMode')!=='0';
if(!dayMode)document.body.classList.add('night-mode');

function syncDayNightBtn(){
  const btn=document.getElementById('dnBtn');
  if(!btn)return;
  btn.className=dayMode?'header-menu-btn':'header-menu-btn night';
  btn.title=dayMode?'Modo dia [N]':'Modo noche [N]';
  btn.innerHTML=dayMode
    ? `<span class="menu-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <!-- Luna -->
  <path d="M21 12.79A9 9 0 1 1 11.21 3 
           7 7 0 0 0 21 12.79z"></path>

  <!-- Rayos del sol (ciclo) -->
  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41
           M17.66 17.66l1.41 1.41M2 12h2M20 12h2"></path>
</svg></span><span class="menu-lbl">Dia / Noche</span>`
    : `<span class="menu-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="4"></circle>
  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
</svg></span><span class="menu-lbl">Dia / Noche</span>`;
}
syncDayNightBtn();

const _dayAmbCol=new THREE.Color(0x262626),_nightAmbCol=new THREE.Color(0x08080f);
const _dayFogCol=new THREE.Color(0x0a0a0a),_nightFogCol=new THREE.Color(0x040407);

// #12 Auto day/night by real clock
let _autoDayNight=localStorage.getItem('autoDayNight')==='1';

//  CICLO LABORAL 
let _workState='working';
const _workDone={arrive:false,lunch:false,back:false,coffee:false,leave:false};
function checkWorkCycle(){
  const now=new Date(),h=now.getHours(),mins=h*60+now.getMinutes();
  // 9:00  llegada
  if(mins>=540&&mins<543&&!_workDone.arrive){
    _workDone.arrive=true;_workDone.lunch=false;_workDone.back=false;_workDone.leave=false;
    showToast('🌅 9:00  El equipo Dev Teams llega a la oficina','#c8a040');
    Object.entries(AG).forEach(([k,ag],i)=>{
      setTimeout(()=>{
        // Entran desde la puerta
        ag.group.position.set(-22+(Math.random()-.5)*3,0,16);
        ag.moveTo(ACFG[k].homeX,ACFG[k].homeZ);
        const _greets={ceo:['Buenos dias equipo 💼','Arrancamos el sprint 🚀','¡A trabajar!'],pm:['Hola! Tengo el roadmap 📋','¡Buenos dias!','Sprint listo 📊'],devbe:['Sistema online ⚡','Buenos dias, a codear','Commits pendientes 💻'],devfe:['Buenos dias! Storybook up','UI lista 🎨','¡A darle!'],qa:['Testing mode ON 🧪','Buenos dias equipo','Bugs detectados? 🐞'],devops:['Infra estable ✅','Buenos dias! k8s OK','Pods running 🟢'],ux:['Diseños listos ✨','Buenos dias!','Figma abierto 🎯'],data:['Metricas cargadas 📈','Buenos dias!','Dashboard listo 📊']};
        ag.say((_greets[k]||['Buenos dias! ☀'])[Math.floor(Math.random()*3)]);
        try{if(!_doorOpen)toggleDoor();}catch(e){}
      },i*1200);
    });
    setTimeout(()=>{try{if(_doorOpen)toggleDoor();}catch(e){}},12000);
  }
  // 13:00  almuerzo
  if(mins>=780&&mins<783&&!_workDone.lunch){
    _workDone.lunch=true;
    showToast('13:00 - Hora del almuerzo','#c8a040');
    Object.entries(AG).forEach(([k,ag],i)=>{
      setTimeout(()=>{
        ag.moveTo(-20+Math.random()*4,11+Math.random()*3);
        ag.say(['almuerzo!','pausa','a comer'][Math.floor(Math.random()*3)]);
      },i*600);
    });
  }
  // 14:00  regresan
  if(mins>=840&&mins<843&&!_workDone.back){
    _workDone.back=true;
    showToast('💼 14:00  Equipo regresa al trabajo','#0fa855');
    Object.entries(AG).forEach(([k,ag],i)=>{
      setTimeout(()=>{ag.moveTo(ACFG[k].homeX,ACFG[k].homeZ);ag.say('De vuelta 💪');},i*500);
    });
  }
  // 15:30  pausa cafe
  if(mins>=930&&mins<933&&!_workDone.coffee){
    _workDone.coffee=true;
    showToast('☕ 15:30  Pausa cafe','#8b4513');
    const goers=Object.keys(ACFG).slice(0,4);
    goers.forEach((k,i)=>{setTimeout(()=>{AG[k]?.moveTo(-21.5+Math.random()*2,12.5);AG[k]?.say('☕ cafe!');if(k==='devbe')yaredDrinkCoffee();},i*700);});
    setTimeout(()=>goers.forEach(k=>AG[k]?.back()),5000);
  }
  // 18:00  salida
  if(mins>=1080&&mins<1083&&!_workDone.leave){
    _workDone.leave=true;
    showToast('🌆 18:00  Fin del dia laboral','#9060cc');
    Object.entries(AG).forEach(([k,ag],i)=>{
      setTimeout(()=>{
        ag.say(['¡Hasta mañana!','Chao equipo 👋','Buenas noches 🌙'][Math.floor(Math.random()*3)]);
        setTimeout(()=>{
          try{if(!_doorOpen)toggleDoor();}catch(e){}
          ag.moveTo(-22+Math.random()*2,15.5);
        },1500);
      },i*900);
    });
    setTimeout(()=>{try{if(_doorOpen)toggleDoor();}catch(e){}},16000);
    if(!dayMode){}else toggleDayNight(); // anochecer
  }
}

function updateAutoDayNight(){
  if(!_autoDayNight)return;
  const now=new Date();
  const h=now.getHours(),m=now.getMinutes();
  const mins=h*60+m;
  const isDawn=mins>=420&&mins<450;
  const isDusk=mins>=1140&&mins<1170;
  const shouldBeDay=mins>=435&&mins<1155;

  if(isDawn||isDusk){
    if(isDawn&&!dayMode){
      dayMode=true;
      localStorage.setItem('dayMode','1');
      document.body.classList.remove('night-mode');
      syncDayNightBtn();
      showToast('🌅 Amanecer automatico','#c8a040');
    }
    if(isDusk&&dayMode){
      dayMode=false;
      localStorage.setItem('dayMode','0');
      document.body.classList.add('night-mode');
      syncDayNightBtn();
      showToast('🌆 Anochecer automatico','#3a8ccc');
    }
  }else if(shouldBeDay!==dayMode){
    toggleDayNight();
  }
}

function toggleAutoDayNight(){
  _autoDayNight=!_autoDayNight;
  localStorage.setItem('autoDayNight',_autoDayNight?'1':'0');
  showToast(_autoDayNight?'🕒 Ciclo automatico activado':'🕒 Ciclo manual','#c8a040');
  updateAutoDayNight();
}
function _rebuildSkyline(){
  if(window._skylineMesh){
    scene.remove(window._skylineMesh);
    if(window._skylineTex)window._skylineTex.dispose();
  }
  if(window._skylineFrame){
    window._skylineFrame.forEach(m => scene.remove(m));
  }
  window._skylineMesh=null;window._skylineTex=null;window._skylineFrame=[];

  // Marco de ventana perimetral robusto y mas alto
  const fMat = new THREE.MeshLambertMaterial({color:0x0a0c0e});
  const b1=bx(48.4, .2, .25, fMat, 0, 1.1, -19.78); // Abajo
  const b2=bx(48.4, .2, .25, fMat, 0, 6.3, -19.78); // Arriba
  const b3=bx(.2, 5.2, .25, fMat, -24.2, 3.7, -19.78); // Izquierda
  const b4=bx(.2, 5.2, .25, fMat, 24.2, 3.7, -19.78); // Derecha
  window._skylineFrame = [b1,b2,b3,b4];

  const W=3072,H=512,cv=document.createElement('canvas');
  cv.width=W;cv.height=H;
  const ctx=cv.getContext('2d');
  ctx.scale(3,1.7);
  const sky=ctx.createLinearGradient(0,0,0,300);
  sky.addColorStop(0,dayMode?'#1a3a6a':'#02040e');
  sky.addColorStop(1,dayMode?'#c87040':'#08080a');
  ctx.fillStyle=sky;ctx.fillRect(-100,-100,1200,600); 
  if(!dayMode){
    for(let i=0;i<120;i++){
      ctx.fillStyle=`rgba(255,255,255,${.2+Math.random()*.8})`;
      ctx.fillRect(Math.random()*1024,Math.random()*300*.55,1,1);
    }
  }
  ctx.fillStyle='#090910';ctx.fillRect(-50,180,100,120);
  ctx.fillRect(950,180,100,120);
  
  [[0,190,75,110],[75,175,55,125],[130,155,85,145],
    [215,135,42,165],[257,165,68,135],[325,148,48,152],
    [373,128,95,172],[468,155,58,145],[526,138,75,162],
    [601,118,48,182],[649,148,88,152],[737,168,65,132],
    [802,138,78,162],[880,158,144,142]
  ].forEach(([x,y,w])=>{
    ctx.fillStyle='#090910';ctx.fillRect(x,y,w,300-y);
    for(let wy=y+10;wy<300-20;wy+=17)
      for(let wx=x+7;wx<x+w-7;wx+=13)
        if(Math.random()>.42){
          ctx.fillStyle=dayMode
            ?`rgba(200,180,100,.25)`
            :`rgba(255,220,80,${.08+Math.random()*.38})`;
          ctx.fillRect(wx,wy,5,8);
        }
  });
  // Torre del Reloj
  ctx.fillStyle='#12101a';ctx.fillRect(458,55,32,245);
  ctx.fillStyle='#1a1420';ctx.beginPath();ctx.moveTo(458,55);ctx.lineTo(474,25);ctx.lineTo(490,55);ctx.fill();
  ctx.fillStyle='rgba(200,160,64,.55)';ctx.beginPath();ctx.arc(474,90,13,0,Math.PI*2);ctx.fill();
  // Sol o Luna
  if(dayMode){
    ctx.fillStyle='#f0c040';ctx.beginPath();ctx.arc(820,75,22,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(240,192,64,.12)';ctx.beginPath();ctx.arc(820,75,42,0,Math.PI*2);ctx.fill();
  }else{
    ctx.fillStyle='#c8c090';ctx.beginPath();ctx.arc(820,55,14,0,Math.PI*2);ctx.fill();
  }
  const tex=_tuneTexture(new THREE.CanvasTexture(cv),{anisotropy:8});
  const mesh=new THREE.Mesh(
    new THREE.PlaneGeometry(48,5.2),
    new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:.82})
  );
  mesh.position.set(0,3.7,-19.82);
  scene.add(mesh);
  window._skylineMesh=mesh;
  window._skylineTex=tex;
}
//  PARALLAX SKYLINE 
function updateSkylineParallax(){
  if(!window._skylineMesh)return;
  // Desplazar sutilmente segun angulo de camara
  const px=Math.sin(orb.theta)*.12;
  window._skylineMesh.position.x+=(px-window._skylineMesh.position.x)*.04;
}

function toggleTheme(){
  const isLight=document.body.classList.contains('light-mode');
  if(isLight){
    document.body.classList.remove('light-mode');
    localStorage.setItem('theme','dark');
    showToast('🌑 Tema oscuro activado');
  }else{
    document.body.classList.add('light-mode');
    localStorage.setItem('theme','light');
    showToast('☀ Tema claro Linear activado','#0a8a44');
  }
}
function toggleDayNight(){
  dayMode=!dayMode;
  localStorage.setItem('dayMode',dayMode?'1':'0');
  document.body.classList.toggle('night-mode',!dayMode);
  syncDayNightBtn();

  if(!dayMode){
    unlockAchievement('night_owl');
    showToast('🌙 Modo Noche','#3a8ccc');
  }else{
    showToast('☀️ Modo Dia','#c8a040');
  }

  _rebuildSkyline();
}

function lerpDayNight(dt){
  if(!_ambLight||!scene)return;const s=dt*1.35;
  _ambLight.intensity+=((dayMode?1.2:.3)-_ambLight.intensity)*s;
  _ambLight.color.lerp(dayMode?_dayAmbCol:_nightAmbCol,s*.7);
  if(_sunLight){_sunLight.intensity+=((dayMode?1.5:0)-_sunLight.intensity)*s;_sunLight.castShadow=_sunLight.intensity>.05;}
  _zoneLights.forEach((l,i)=>{l.intensity+=(_zoneLightBaseInt[i]*(dayMode?1:.12)-l.intensity)*s;});
  Object.entries(deskLights).forEach(([k,l])=>{
    const atDesk=typeof _isAgentAtDesk==='function'&&_isAgentAtDesk(k,2.65);
    const base=dayMode?(atDesk?.3:.05):(atDesk?1.05:.16);
    const tI=(k===activeAg&&simOn?0.55:0)+base;
    l.intensity+=(tI-l.intensity)*Math.min(s*.5,.05);
    l.distance+=((dayMode?(atDesk?5:3.2):(atDesk?10:5))-l.distance)*s;
  });
  scene.fog.color.lerp(dayMode?_dayFogCol:_nightFogCol,s*.5);
}

/*  TOAST  */
let _toastStack=[];
function escapeRegExp(txt){return String(txt).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function getRichTextSegments(text,allowEmphasis=true){
  const source=String(text??'');
  if(!allowEmphasis)return[{em:false,text:source}];
  const emStore=[];
  const tokenized=source.replace(/<em>([\s\S]*?)<\/em>/gi,(_,inner)=>{
    const idx=emStore.push(inner)-1;
    return `\uE000${idx}\uE001`;
  });
  return tokenized.split(/(\uE000\d+\uE001|\*\*[\s\S]+?\*\*)/g).filter(Boolean).reduce((acc,part)=>{
    const token=part.match(/^\uE000(\d+)\uE001$/);
    const seg=token?{em:true,text:emStore[Number(token[1])]||''}:part.startsWith('**')&&part.endsWith('**')&&part.length>=4?{em:true,text:part.slice(2,-2)}:{em:false,text:part};
    if(!seg.text)return acc;
    const prev=acc[acc.length-1];
    if(prev&&prev.em===seg.em)prev.text+=seg.text;
    else acc.push(seg);
    return acc;
  },[]);
}
function appendRichText(container,text,highlight=''){
  const query=String(highlight||'');
  const matcher=query?new RegExp(`(${escapeRegExp(query)})`,'gi'):null;
  String(text??'').split('\n').forEach((line,idx)=>{
    if(idx)container.appendChild(document.createElement('br'));
    const parts=matcher?line.split(matcher):[line];
    parts.forEach(part=>{
      if(!part)return;
      if(matcher&&part.toLowerCase()===query.toLowerCase()){
        const mark=document.createElement('mark');
        mark.style.background='#c8a04044';
        mark.style.color='var(--gold)';
        mark.textContent=part;
        container.appendChild(mark);
      }else container.appendChild(document.createTextNode(part));
    });
  });
}
function renderRichTextSegments(el,segments,{cursor=false,highlight=''}={}){
  if(!el)return;
  const frag=document.createDocumentFragment();
  segments.forEach(seg=>{
    const target=seg.em?document.createElement('em'):frag;
    appendRichText(target,seg.text,highlight);
    if(seg.em)frag.appendChild(target);
  });
  if(cursor){const cur=document.createElement('span');cur.className='tcur';frag.appendChild(cur);}
  el.replaceChildren(frag);
  el.dataset.rawText=segments.map(seg=>seg.text).join('');
}
function renderRichText(el,text,{allowEmphasis=true,cursor=false,highlight=''}={}){
  renderRichTextSegments(el,getRichTextSegments(text,allowEmphasis),{cursor,highlight});
}


function escapeHtml(str=''){
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function safeTextToHtml(str=''){
  return escapeHtml(str).replace(/\n/g,'<br>');
}

function dismissToast(t){
  if(!t)return;
  t.style.transition='opacity .3s, transform .3s';
  t.style.opacity='0';
  t.style.transform='translateX(20px)';
  setTimeout(()=>{
    t.remove();
    _toastStack=_toastStack.filter(x=>x!==t);
    _toastStack.forEach((toast,i)=>{toast.style.bottom=(58+i*46)+'px';});
  },320);
}

function showToast(msg,col='#0fa855',agentKey=null){
  if(_toastStack.length>=4){
    const old=_toastStack.shift();
    old?.remove();
  }

  const t=document.createElement('div');
  t.style.cssText=`position:fixed;bottom:${58+_toastStack.length*46}px;right:14px;background:var(--bg2);border:1px solid ${col}44;border-left:3px solid ${col};color:var(--t1);font-family:var(--mono);font-size:17px;padding:7px 12px;z-index:500;animation:fadeUp .2s ease-out;pointer-events:all;white-space:nowrap;display:flex;align-items:center;gap:8px;min-width:180px;max-width:280px;cursor:pointer;transition:bottom .2s`;

  const dot=document.createElement('span');
  dot.style.cssText=`width:6px;height:6px;border-radius:50%;background:${agentKey&&ACFG[agentKey]?ACFG[agentKey].col:col};flex-shrink:0`;

  const body=document.createElement('span');
  body.style.cssText='flex:1;overflow:hidden;text-overflow:ellipsis';
  body.textContent=String(msg);

  const close=document.createElement('button');
  close.type='button';
  close.textContent='×';
  close.style.cssText='background:none;border:none;color:var(--t3);font-size:14px;cursor:pointer;margin-left:4px;flex-shrink:0';
  close.onclick=e=>{
    e.stopPropagation();
    clearTimeout(timer);
    dismissToast(t);
  };

  t.appendChild(dot);
  t.appendChild(body);
  t.appendChild(close);

  document.body.appendChild(t);
  _toastStack.push(t);

  const timer=setTimeout(()=>dismissToast(t),3200);
  t.addEventListener('click',()=>{
    clearTimeout(timer);
    dismissToast(t);
  });
}

function openApi(){setApiProvider(API_PROVIDER,{quiet:true});updateApiModalUI();document.getElementById('apiOv').classList.add('show');}
function closeApi(e){if(!e||e.target===document.getElementById('apiOv'))document.getElementById('apiOv').classList.remove('show');}

function providerConfig(provider=API_PROVIDER){return API_PROVIDERS[provider]||API_PROVIDERS.groq;}
function providerLabel(provider=API_PROVIDER){return providerConfig(provider).label;}
function providerInstruction(provider=API_PROVIDER){return providerConfig(provider).instruction;}
function providerDocs(provider=API_PROVIDER){return providerConfig(provider).docsUrl;}
function hasActiveKey(){return !!GKEY;}
function loadProviderKey(provider){try{return sessionStorage.getItem(PROVIDER_KEY_NAMES[provider])||localStorage.getItem(PROVIDER_KEY_NAMES[provider])||'';}catch(e){return '';}}
function persistProviderKey(provider,key){try{if(key)sessionStorage.setItem(PROVIDER_KEY_NAMES[provider],key);}catch(e){};localStorage.removeItem(PROVIDER_KEY_NAMES[provider]);}
function clearStoredProviderKey(provider){try{sessionStorage.removeItem(PROVIDER_KEY_NAMES[provider]);}catch(e){};localStorage.removeItem(PROVIDER_KEY_NAMES[provider]);}
function renderApiModelOptions(provider=API_PROVIDER){
  const sel=document.getElementById('msel');
  if(!sel)return;
  sel.innerHTML='';
  const models=providerConfig(provider).models;
  models.forEach(m=>{
    const opt=document.createElement('option');
    opt.value=m;
    opt.textContent=m.replace(provider+'/',provider==='openrouter'?'OR/':'');
    sel.appendChild(opt);
  });
  if(models.includes(GMOD)){
    sel.value=GMOD;
  }else{
    GMOD=models[0]||providerConfig(provider).defaultModel;
    sel.value=GMOD;
  }
  document.getElementById('modelBadge')?.setAttribute('data-provider',provider);
}

function updateApiModalUI(){
  const title=document.getElementById('apiTitle');
  if(title)title.textContent=`${providerLabel()} API Key`;
  const instr=document.getElementById('apiInstruction');
  if(instr)instr.innerHTML=`${providerInstruction()} <a href="${providerDocs()}" target="_blank" style="color:var(--acc)">docs</a>`;
  const note=document.getElementById('apiProviderNote');
  if(note)note.textContent=`Modelos sugeridos: ${providerConfig().models.join(', ')}`;
  document.querySelectorAll('#apiProviderToggle .api-provider-btn')
    .forEach(btn=>btn.classList.toggle('active',btn.dataset.provider===API_PROVIDER));
}

function setApiProvider(provider,{quiet=false}={}){
  if(!API_PROVIDERS[provider])return;
  API_PROVIDER=provider;
  localStorage.setItem('apiProvider',provider);
  GKEY=loadProviderKey(provider);
  GMOD=localStorage.getItem(MODEL_STORAGE_KEYS[provider])||providerConfig(provider).defaultModel;
  renderApiModelOptions(provider);
  document.getElementById('msel').value=GMOD;
  const keyinp = document.getElementById('keyinp');
  if (keyinp) keyinp.value = GKEY;
  updApiUI();
  updateApiModalUI();
  if(!quiet){
    showToast(`${providerLabel()} activo. Antes de aplicar la nueva ruta, confirmemos.`,providerConfig(provider).accent);
  }
};
// (function(){setApiProvider(API_PROVIDER,{quiet:true});})();

let _apiPresenceTimer=hasActiveKey()?(110+Math.random()*70):(35+Math.random()*45);
let _apiPresenceMode=hasActiveKey()?'live':'demo';
let _apiCelebrateBusy=false;
let _lastApiPresenceMsg='';
let _lastApiPresenceAgent='';
let _apiDemoPool=[];
let _apiLivePool=[];
const IMPROVEMENT_REPOS=['AutoGPT visualizers','Three.js multi-agent dashboards','AgentSim orchestration','Open-source AI worker agencies','Multi-agent operations playbooks'];
function inspectImprovementHeuristics(){
  if(typeof AG==='undefined')return[];
  const suggestions=[];
  if(!hasActiveKey()){
    suggestions.push({title:`Sin conexión ${providerLabel()}`,detail:`Conecta ${providerLabel()} y verifica la API antes de ejecutar flujos.`});
  }
  const stuck=Object.entries(AG).find(([k,ag])=>ag&&ag.state==='thinking'&&ag.stateTime>22);
  if(stuck){
    const name=ACFG[stuck[0]]?.name.split(' ')[0]||stuck[0];
    suggestions.push({title:`${name} atascado`,detail:`Lleva ${Math.floor(stuck[1].stateTime)}s pensando. Facilita asistencia.`});
  }
  if(_eventLog.length>30){
    suggestions.push({title:'Command Center saturado',detail:'Revisa el volumen de eventos y considera resumir o capsular mensajes.'});
  }
  return suggestions;
}
function renderImprovementRepos(){
  const repoEl=document.getElementById('improveRepos');
  if(!repoEl)return;
  repoEl.innerHTML=IMPROVEMENT_REPOS.map(repo=>`<div class="improve-repo"><strong>${repo}</strong></div>`).join('');
}
function updateImprovementPanel(){
  const statusEl=document.getElementById('improveStatus');
  const listEl=document.getElementById('improveList');
  const guardNote={title:'Confirma antes de alternar la API',detail:`Antes de aplicar cambios entre ${providerLabel()} y otras APIs, dime para revisar riesgos.`};
  const suggestions=inspectImprovementHeuristics();
  const items=[guardNote,...suggestions].slice(0,3);
  if(listEl)listEl.innerHTML=items.map(entry=>`<div class="improve-item"><strong>${entry.title}</strong><span>${entry.detail}</span></div>`).join('');
  if(statusEl)statusEl.textContent=suggestions.length?'Hallazgos':'Sin hallazgos';
  renderImprovementRepos();
}

async function _probeApiKey(){
  if(!GKEY)return false;
  const provider=providerConfig();
  try{
    const r=await fetch(provider.endpoint,{
      method:'POST',
      headers:{
        'Authorization':`Bearer ${GKEY}`,
        'Content-Type':'application/json',
        'HTTP-Referer': window.location.href.startsWith('file:') ? 'https://dev-teams-local.app' : window.location.href,
        'X-Title': 'Dev Teams AI'
      },
      body:JSON.stringify({
        model: GMOD || provider.defaultModel || 'openrouter/auto',
        messages:[
          {role:'user',content:'Hi'}
        ]
      })
    });
    if(!r.ok){
      if(r.status===401 || r.status===403){
        return false; // Authentication failed
      }
      if(r.status===402){
        showToast(`${providerLabel()}: Fondos insuficientes (402). Verifique su cuenta.`,'#cc3344');
        return true; // Key is technically valid, just out of money for this model
      }
      if(r.status===429){
        showToast(`${providerLabel()}: Demasiadas peticiones (429). Reintente más tarde.`,'#cc3344');
        return true; // Rate limited, key is valid
      }
      if(r.status===404){
        showToast(`${providerLabel()}: Modelo '${GMOD}' no encontrado (404).`,`#cc3344`);
        return true; // Key is valid, wrong model
      }
      if(r.status===400){
        showToast(`${providerLabel()}: Petición rechazada (400). Posible modelo incompatible.`,`#cc3344`);
        return true; // Bad request, but key is likely fine
      }
      return true; // Assume key is valid for other transient errors
    }
    return true;
  }catch(e){
    return false;
  }
}

function _pickPresenceAgents(count=3){
  const pool=Object.keys(AG).filter(k=>AG[k]&&['idle','walking','reading'].includes(AG[k].state));
  const src=(pool.length?pool:Object.keys(ACFG)).filter(k=>k!==_lastApiPresenceAgent);

  if(src.length>=count)return src.sort(()=>Math.random()-.5).slice(0,count);
  return (pool.length?pool:Object.keys(ACFG)).sort(()=>Math.random()-.5).slice(0,count);
}

async function _celebrateApiConnection(){
  if(_apiCelebrateBusy)return;
  _apiCelebrateBusy=true;

  const ordered=['ceo','pm','devbe',..._pickPresenceAgents(5)]
    .filter((k,i,arr)=>AG[k]&&arr.indexOf(k)===i)
    .slice(0,3);

  const fallbackByRole={
    ceo:'Creador, Groq ya esta conectado. Ahora si podemos coordinar en serio.',
    pm:'Perfecto. Salimos de demo mode y ya tenemos contexto real.',
    devbe:'Gracias, creador. Ya tenemos conexion real para trabajar mejor.'
  };

  for(let i=0;i<ordered.length;i++){
    const k=ordered[i];
    const ag=AG[k];
    const cfg=ACFG[k];
    if(!ag||!cfg)continue;

    let msg=fallbackByRole[k]||`Creador, ya tenemos ${providerLabel()} conectado.`;

    if(GKEY){
      const res=await groq([
        {role:'system',content:mkSys(k)},
        {role:'user',content:`Tu creador acaba de conectar una API key valida de ${providerLabel()}. Responde con una sola frase breve, natural y distinta al ultimo mensaje. Debes decir que ya no estan en demo mode y que ahora si tienen conexion real. Ultimo mensaje: "${_lastApiPresenceMsg}". Maximo 16 palabras.`}
      ],()=>{},32);
      if(res)msg=res.trim();
    }

    if(!msg||msg===_lastApiPresenceMsg){
      msg=fallbackByRole[k]||'Creador, ya tenemos Groq conectado.';
    }

    _lastApiPresenceMsg=msg;
    _lastApiPresenceAgent=k;

    ag.setState('thinking');
    if (typeof enhanceThinkingVisual === 'function') enhanceThinkingVisual(k);
    ag.say(msg.slice(0,48));
    showToast(`${cfg.name.split(' ')[0]}: ${msg.slice(0,68)}`,cfg.col,k);
    try{logEvent('api',`${providerLabel()} online`,msg,cfg.col,k);}catch(e){}
    await new Promise(r=>setTimeout(r,550));
    if(ag.state==='thinking')ag.setState('idle');
  }

  _apiCelebrateBusy=false;
}

function _emitDemoPresenceLine(){
  const base=[
    'Creador, seguimos en demo mode.',
    `Aun estamos desconectados de ${providerLabel()}, creador.`,
    'Seguimos en modo demo. Cuando quieras nos conectas.',
    'Creador, aun no tenemos conexion real para pensar mejor.',
    `Seguimos simulando. Falta la API key real de ${providerLabel()}.`
  ];

  if(!_apiDemoPool.length){
    _apiDemoPool=base
      .filter(msg=>msg!==_lastApiPresenceMsg)
      .sort(()=>Math.random()-.5);
    if(!_apiDemoPool.length)_apiDemoPool=base.slice().sort(()=>Math.random()-.5);
  }

  const picks=_pickPresenceAgents(1);
  const k=picks[0];
  const ag=AG[k];
  const cfg=ACFG[k];
  if(!ag||!cfg)return;

  const msg=_apiDemoPool.shift();
  _lastApiPresenceMsg=msg;
  _lastApiPresenceAgent=k;

  ag.say(msg.slice(0,48));
  showToast(`${cfg.name.split(' ')[0]}: ${msg}`,cfg.col,k);
}


async function _emitLivePresenceLine(){
  const picks=_pickPresenceAgents(1);
  const k=picks[0];
  const ag=AG[k];
  const cfg=ACFG[k];
  if(!ag||!cfg||!GKEY)return;

  const fallback=[
    `Creador, seguimos conectados a ${providerLabel()} y listos para trabajar.`,
    `Seguimos online con ${providerLabel()}. Ya no estamos en demo mode.`,
    `Conexion estable con ${providerLabel()}, creador. Todo listo.`
  ];

  let msg='';
  const res=await groq([
    {role:'system',content:mkSys(k)},
    {role:'user',content:`Habla con tu creador en una frase breve. Dile que siguen conectados a Groq y ya no estan en demo mode. No repitas literalmente este ultimo mensaje: "${_lastApiPresenceMsg}". Maximo 14 palabras.`}
  ],()=>{},28);

  if(res)msg=res.trim();

  if(!msg||msg===_lastApiPresenceMsg){
    if(!_apiLivePool.length){
      _apiLivePool=fallback
        .filter(x=>x!==_lastApiPresenceMsg)
        .sort(()=>Math.random()-.5);
      if(!_apiLivePool.length)_apiLivePool=fallback.slice().sort(()=>Math.random()-.5);
    }
    msg=_apiLivePool.shift();
  }

  _lastApiPresenceMsg=msg;
  _lastApiPresenceAgent=k;

  ag.say(msg.slice(0,48));
  showToast(`${cfg.name.split(' ')[0]}: ${msg.slice(0,68)}`,cfg.col,k);
}


async function updateApiPresenceChatter(dt){
  _apiPresenceTimer-=dt;
  if(_apiPresenceTimer>0)return;
  if(_demoTourOn)return;
  if(_meetingActive)return;
  if(_apiCelebrateBusy)return;

  if(hasActiveKey()){
    _apiPresenceMode='live';
    _apiPresenceTimer=120+Math.random()*110;
    await _emitLivePresenceLine();
  }else{
    _apiPresenceMode='demo';
    _apiPresenceTimer=55+Math.random()*70;
    _emitDemoPresenceLine();
  }
}

async function saveKey(){
  const nextKey=document.getElementById('keyinp').value.trim();
  const nextModel=document.getElementById('msel').value;

  GMOD=nextModel;
  localStorage.setItem('gm',GMOD);
  localStorage.setItem(MODEL_STORAGE_KEYS[API_PROVIDER],GMOD);

  if(!nextKey){
    GKEY='';
    clearStoredProviderKey(API_PROVIDER);
    updApiUI();
    closeApi();
    _apiPresenceMode='demo';
    _apiPresenceTimer=12;
    showToast(`Seguimos en demo mode para ${providerLabel()}`,'#c8a040');
    return;
  }

  GKEY=nextKey;
  persistProviderKey(API_PROVIDER,GKEY);
  updApiUI();
  closeApi();
  showToast(`Validando API key ${providerLabel()}...`,'#3a8ccc');

  const ok=await _probeApiKey();

  if(!ok){
    GKEY='';
    clearStoredProviderKey(API_PROVIDER);
    updApiUI();
    _apiPresenceMode='demo';
    _apiPresenceTimer=10;
    showToast(`API key invalida o sin acceso a ${providerLabel()}`,'#cc3344');
    return;
  }

  _apiPresenceMode='live';
  _apiPresenceTimer=140+Math.random()*80;
  showToast(`${providerLabel()} conectado.` ,providerConfig().accent);
  await _celebrateApiConnection();
}

function clearKey(){
  GKEY='';
  clearStoredProviderKey(API_PROVIDER);
  document.getElementById('keyinp').value='';
  updApiUI();
  _apiPresenceMode='demo';
  _apiPresenceTimer=10;
  showToast(`${providerLabel()} desconectado. Volvimos a demo mode.`,'#c8a040');
}

function updApiUI(){
  const b=document.getElementById('apiBadge');
  const m=document.getElementById('modelBadge');
  if(GKEY){
    b.className='badge conn';
    b.textContent=`${providerLabel()} online`;
    m.style.display='';
    m.textContent=GMOD;
  }else{
    b.className='badge';
    b.textContent='demo mode';
    m.style.display='none';
  }
}

/*  AGENT CONFIGS  */

const ACFG={
// Colores MUY contrastados tipo Claw3D
ceo:  {name:'Ana Garcia',    role:'CEO',             col:'#c8a040',homeX:-22,homeZ:-12, bodyC:0xc8a040,pantsC:0x2a2010,skinC:0xf0c8a0,hairC:0x0a0806},
pm:   {name:'Sofia Castro',  role:'Product Manager', col:'#5b9bd5',homeX:-22.9,homeZ:7.8,  bodyC:0x1a5fa8,pantsC:0x0e1a28,skinC:0xc8946a,hairC:0x180e06},
devbe:{name:'Yared Henriquez',role:'Founder & Architect',col:'#3a8ccc',homeX:-9,homeZ:-12, bodyC:0x1a4a8a,pantsC:0x0e1428,skinC:0x5c3418,hairC:0x080808},
devfe:{name:'Diego Herrera', role:'Dev Frontend',    col:'#9060cc',homeX:0, homeZ:-12, bodyC:0x6030aa,pantsC:0x1a0828,skinC:0xecd4b8,hairC:0x060406},
qa:   {name:'Marta Lopez',   role:'QA Engineer',     col:'#d97020',homeX:11,homeZ:-12, bodyC:0xd97020,pantsC:0x1c0a00,skinC:0xd4926a,hairC:0x3a1008},
devops:{name:'Luis Mendoza', role:'DevOps Engineer', col:'#4caf50',homeX:23.5,homeZ:-10.2, bodyC:0x2a8a30,pantsC:0x0e1a0e,skinC:0x3c2010,hairC:0x040404},
ux:   {name:'Valentina Ramos',role:'UX Designer',    col:'#e91e8c',homeX:-22.6,homeZ:-1.4,  bodyC:0xc8106a,pantsC:0x280418,skinC:0xf4d0b8,hairC:0x0c0608},
data: {name:'Andres Torres', role:'Data Analyst',    col:'#00bcd4',homeX:9, homeZ:-.4,  bodyC:0x0898aa,pantsC:0x041018,skinC:0xa07848,hairC:0x100c06},
};

let _uiMode='launch';
let _eventLog=[];
try{_eventLog=JSON.parse(localStorage.getItem('eventLog')||'[]');}catch(e){}
let _demoTourOn=false;

function saveEventLog(){
  try{localStorage.setItem('eventLog',JSON.stringify(_eventLog.slice(0,120)));}catch(e){}
}
function fmtEventTime(ts){
  try{return new Date(ts).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'});}
  catch(e){return '--:--';}
}
function renderEventFeed(limit=6){
  const el=document.getElementById('eventFeed');
  if(!el)return;
  if(!_eventLog.length){
    el.innerHTML='<div class="ops-item"><strong>Sin actividad aun</strong><span>Inicia una demo, reunion o tarea para poblar la linea operativa.</span><small>esperando eventos</small></div>';
    return;
  }
  el.innerHTML=_eventLog.slice(0,limit).map(ev=>`
    <div class="ops-item" style="border-left-color:${ev.col||'#0fa855'}">
      <strong>${escapeHtml(ev.title||'Evento')}</strong>
      <span>${escapeHtml(ev.detail||'')}</span>
      <small>${fmtEventTime(ev.ts)}${ev.agKey&&ACFG[ev.agKey]?` · ${ACFG[ev.agKey].name.split(' ')[0]}`:''}</small>
    </div>
  `).join('');
}

function clearEventLog(){
  _eventLog=[];
  saveEventLog();
  renderEventFeed();
  refreshOpsBar();
  if(typeof renderDashboard==='function'&&currentPanel==='dash')renderDashboard();
  showToast('Command Center limpio','#c8a040');
}
let _logRenderTimer=null;
function logEvent(type,title,detail='',col='#0fa855',agKey=''){
  _eventLog.unshift({id:Date.now()+Math.random(),ts:Date.now(),type,title,detail,col,agKey});
  if(_eventLog.length>120)_eventLog.pop();
  saveEventLog();
  clearTimeout(_logRenderTimer);
  _logRenderTimer=setTimeout(()=>{
    renderEventFeed();
    refreshOpsBar();
    if(typeof renderDashboard==='function'&&currentPanel==='dash')renderDashboard();
  },120);
}
function setUIMode(mode){
  _uiMode='launch';
  document.body.dataset.uiMode='launch';
  refreshOpsBar();
}
function toggleUIMode(){}

function _activeAgentsCount(){
  if(typeof AG==='undefined'||!AG)return 0;
  return Object.values(AG).filter(ag=>ag&&ag.state&&ag.state!=='idle').length;
}

function _nextActionFor(agKey){
  return {
    ceo:'Comunicar prioridades y convertir acuerdos en tareas',
    pm:'Bajar decisiones a roadmap y owners',
    devbe:'Validar arquitectura y desbloquear ejecucion',
    devfe:'Cerrar UI y preparar handoff',
    qa:'Confirmar riesgos y liberar con evidencia',
    devops:'Asegurar deploy y monitoreo post-release',
    ux:'Convertir hallazgos en cambios concretos',
    data:'Actualizar metricas y compartir lectura ejecutiva'
  }[agKey]||'Validar resultado y definir siguiente paso';
}
function _riskFor(agKey){
  return {
    ceo:'Prioridades sin owner claro',
    pm:'Roadmap sin fecha o criterio de cierre',
    devbe:'Bloqueos tecnicos no visibilizados',
    devfe:'Cambio visual sin validacion final',
    qa:'Hallazgos sin reproducibilidad',
    devops:'Deploy sin monitoreo suficiente',
    ux:'Decisiones sin validacion de usuario',
    data:'Lectura de metricas sin contexto operativo'
  }[agKey]||'Falta seguimiento posterior';
}
function appendOutcomeCard(target,{title='Resumen operativo',ownerKey='ceo',outcome='',nextStep='',risk=''}={}){
  const host=typeof target==='string'?document.getElementById(target):target;
  if(!host)return;
  const cfg=ACFG[ownerKey]||ACFG.ceo;
  const card=document.createElement('div');
  card.className='demo-outcome';
  card.style.borderLeftColor=cfg.col;
  card.innerHTML=`
    <div class="ttl">${escapeHtml(title)}</div>
    <div class="row"><b>Responsable:</b> ${escapeHtml(cfg.name)}</div>
    <div class="row"><b>Resultado:</b> ${safeTextToHtml(outcome||'Resultado registrado')}</div>
    <div class="row"><b>Siguiente paso:</b> ${safeTextToHtml(nextStep||_nextActionFor(ownerKey))}</div>
    <div class="row"><b>Riesgo:</b> ${safeTextToHtml(risk||_riskFor(ownerKey))}</div>
  `;
  host.appendChild(card);
}
async function runAgentFlowDemo(agentKey){
  selAgent(agentKey);
  await sleep(250);
  while(step<SCN[agentKey].stages.length-1){
    await nextStep();
    await sleep(spd<=180?120:320);
  }
}
async function startDemoTour(){
  if(_demoTourOn)return;
  _demoTourOn=true;
  setUIMode('launch');

  switchPanel('flujo');
  refreshOpsBar();
  showToast('Demo guiada iniciada','#0fa855');
  logEvent('demo','Demo guiada iniciada','Recorrido visible con escena, flujo y command center','#0fa855','ceo');

  try{
    await runAgentFlowDemo('ceo');
    await sleep(700);

    switchPanel('flujo');
    await runMeeting();
    await sleep(700);

    switchPanel('status');
    await executeTask('Preparar release v1: prioridades, validacion QA y despliegue controlado',['pm','devbe','qa','devops'],{origin:'demo'});
    await sleep(400);

    switchPanel('dash');
    renderDashboard();

    showToast('Demo guiada finalizada ✓','#0fa855');
    logEvent('demo','Demo guiada finalizada','Cierre en dashboard con actividad real','#0fa855','ceo');
  }catch(e){
    console.error(e);
    showToast('La demo se interrumpio','#cc3344');
    logEvent('demo','Demo interrumpida','Revisa consola y retoma desde el panel de flujo','#cc3344','ceo');
  }finally{
    _demoTourOn=false;
    refreshOpsBar();
  }
}


/*  A* PATHFINDING (main-thread fallback)  */

const GW=58,GH=42,GS=1.0,GOX=-29,GOZ=-21;
let NAV=null;
const OBS=[
  {cx:-22,cz:-14,hw:2.8,hd:1.4},{cx:-27,cz:-13,hw:0.6,hd:3.5},{cx:-25.5,cz:-10,hw:1.5,hd:0.8},
  {cx:-22,cz:-10,hw:2.0,hd:0.9},
  {cx:-9,cz:-14,hw:3.2,hd:1.4},{cx:-4,cz:-16,hw:1.0,hd:2.5},{cx:-4,cz:-13,hw:1.0,hd:2.2},
  {cx:0,cz:-14,hw:2.8,hd:1.4},{cx:4.5,cz:-16,hw:0.9,hd:2.5},
  {cx:11,cz:-14,hw:2.6,hd:1.4},{cx:15.5,cz:-11,hw:0.8,hd:2.5},
  {cx:21,cz:-14,hw:2.2,hd:1.4},{cx:25.5,cz:-13,hw:1.2,hd:4.0},{cx:27,cz:-8,hw:0.6,hd:3.5},
  {cx:-14,cz:-2,hw:2.4,hd:1.3},{cx:-19,cz:-2,hw:0.8,hd:3.5},
  {cx:-3,cz:-2,hw:2.2,hd:1.3},{cx:-7.5,cz:-2,hw:0.5,hd:3.0},
  {cx:9,cz:-2,hw:2.8,hd:1.3},
  {cx:0,cz:9,hw:2.0,hd:2.0},
  {cx:-22,cz:11.5,hw:1.3,hd:1.1},{cx:19,cz:9,hw:2.2,hd:1.6},{cx:26,cz:5,hw:0.6,hd:0.6},
  {cx:13,cz:15.5,hw:5.2,hd:0.9},
];
const NAV_PAD=0.8;
function buildNav(){
  NAV=new Uint8Array(GW*GH);
  OBS.forEach(o=>{
    const x0=Math.floor((o.cx-o.hw-NAV_PAD-GOX)/GS)-1,x1=Math.ceil((o.cx+o.hw+NAV_PAD-GOX)/GS)+1;
    const z0=Math.floor((o.cz-o.hd-NAV_PAD-GOZ)/GS)-1,z1=Math.ceil((o.cz+o.hd+NAV_PAD-GOZ)/GS)+1;
    for(let gz=z0;gz<=z1;gz++)for(let gx=x0;gx<=x1;gx++){if(gx>=0&&gx<GW&&gz>=0&&gz<GH)NAV[gz*GW+gx]=1;}
  });
  for(let gz=0;gz<GH;gz++)for(let gx=0;gx<GW;gx++){const wx=gx+GOX,wz=gz+GOZ;if(wx<-26||wx>26||wz<-20||wz>17)NAV[gz*GW+gx]=1;}
}
function wG(wx, wz) {
  return {
    gx: Math.max(0, Math.min(GW - 1, Math.round((wx - GOX) / GS))),
    gz: Math.max(0, Math.min(GH - 1, Math.round((wz - GOZ) / GS)))
  };
}
function gW(gx, gz) {
  return {
    x: gx * GS + GOX,
    z: gz * GS + GOZ
  };
}

function nearestWalkable(g){let best=null,bd=Infinity;for(let gz=0;gz<GH;gz++)for(let gx=0;gx<GW;gx++){if(!NAV[gz*GW+gx]){const d=(gx-g.gx)**2+(gz-g.gz)**2;if(d<bd){bd=d;best={gx,gz};}}}return best;}
function astar(sx,sz,tx,tz){
  if(!NAV)return null;
  const sg=wG(sx,sz),eg=wG(tx,tz);
  if(NAV[eg.gz*GW+eg.gx]){const b=nearestWalkable(eg);if(b)Object.assign(eg,b);else return null;}
  if(NAV[sg.gz*GW+sg.gx]){const b=nearestWalkable(sg);if(b)Object.assign(sg,b);else return null;}
  if(sg.gx===eg.gx&&sg.gz===eg.gz)return[gW(eg.gx,eg.gz)];
  const idx=g=>g.gz*GW+g.gx;
  const h=(a,b)=>Math.abs(a.gx-b.gx)+Math.abs(a.gz-b.gz);
  const gC=new Float32Array(GW*GH).fill(Infinity),par=new Int32Array(GW*GH).fill(-1),cl=new Uint8Array(GW*GH);
  gC[idx(sg)]=0;const open=[{gx:sg.gx,gz:sg.gz,f:h(sg,eg)}];
  const DIRS=[[-1,-1,1.414],[-1,0,1],[-1,1,1.414],[0,-1,1],[0,1,1],[1,-1,1.414],[1,0,1],[1,1,1.414]];
  let found=false,iters=0;
  while(open.length&&iters++<2500){
    let bi=0;for(let i=1;i<open.length;i++)if(open[i].f<open[bi].f)bi=i;
    const cur=open.splice(bi,1)[0];const ci=idx(cur);
    if(cl[ci])continue;cl[ci]=1;
    if(cur.gx===eg.gx&&cur.gz===eg.gz){found=true;break;}
    for(const[dx,dz,cost]of DIRS){
      const nx=cur.gx+dx,nz=cur.gz+dz;
      if(nx<0||nx>=GW||nz<0||nz>=GH||NAV[nz*GW+nx])continue;
      const ni=nz*GW+nx;if(cl[ni])continue;
      if(dx&&dz&&(NAV[cur.gz*GW+nx]||NAV[nz*GW+cur.gx]))continue;
      const ng=gC[ci]+cost;
      if(ng<gC[ni]){gC[ni]=ng;par[ni]=ci;open.push({gx:nx,gz:nz,f:ng+h({gx:nx,gz:nz},eg)});}
    }
  }
  if(!found)return null;
  const raw=[];let c=idx(eg);
  while(c!==-1&&c!==idx(sg)){raw.unshift(gW(c%GW,Math.floor(c/GW)));c=par[c];}
  return smooth(raw.length?raw:[gW(eg.gx,eg.gz)]);
}
function los(x0,z0,x1,z1){
  const g0=wG(x0,z0),g1=wG(x1,z1);let dx=Math.abs(g1.gx-g0.gx),dz=Math.abs(g1.gz-g0.gz),x=g0.gx,z=g0.gz;
  const sx=g1.gx>g0.gx?1:-1,sz=g1.gz>g0.gz?1:-1,steps=dx+dz;let err=dx-dz;
  for(let i=0;i<=steps;i++){if(x<0||x>=GW||z<0||z>=GH||NAV[z*GW+x])return false;const e2=err*2;if(e2>-dz){err-=dz;x+=sx;}if(e2<dx){err+=dx;z+=sz;}}return true;
}
function smooth(pts){if(pts.length<=2)return pts;const res=[pts[0]];let i=0;while(i<pts.length-1){let j=pts.length-1;while(j>i+1&&!los(pts[i].x,pts[i].z,pts[j].x,pts[j].z))j--;i=j;res.push(pts[i]);}return res;}


let pathWorker=null,_wkUrl=null,_wkIdCtr=1,_wkCallbacks=new Map();

const WORKER_CODE=`
'use strict';
const GW=58,GH=42,GS=1.0,GOX=-29,GOZ=-21;
let NAV=null;
const wG=(wx,wz)=>({gx:Math.max(0,Math.min(GW-1,Math.round((wx-GOX)/GS))),gz:Math.max(0,Math.min(GH-1,Math.round((wz-GOZ)/GS)))});
const gW=(gx,gz)=>({x:gx*GS+GOX,z:gz*GS+GOZ});
function nearestWalkable(g){let best=null,bd=Infinity;for(let gz=0;gz<GH;gz++)for(let gx=0;gx<GW;gx++){if(!NAV[gz*GW+gx]){const d=(gx-g.gx)**2+(gz-g.gz)**2;if(d<bd){bd=d;best={gx,gz};}}}return best;}
function los(x0,z0,x1,z1){const g0=wG(x0,z0),g1=wG(x1,z1);let dx=Math.abs(g1.gx-g0.gx),dz=Math.abs(g1.gz-g0.gz),x=g0.gx,z=g0.gz;const sx=g1.gx>g0.gx?1:-1,sz=g1.gz>g0.gz?1:-1,steps=dx+dz;let err=dx-dz;for(let i=0;i<=steps;i++){if(x<0||x>=GW||z<0||z>=GH||NAV[z*GW+x])return false;const e2=err*2;if(e2>-dz){err-=dz;x+=sx;}if(e2<dx){err+=dx;z+=sz;}}return true;}
function smooth(pts){if(pts.length<=2)return pts;const res=[pts[0]];let i=0;while(i<pts.length-1){let j=pts.length-1;while(j>i+1&&!los(pts[i].x,pts[i].z,pts[j].x,pts[j].z))j--;i=j;res.push(pts[i]);}return res;}
function astar(sx,sz,tx,tz){
  if(!NAV)return null;
  const sg=wG(sx,sz),eg=wG(tx,tz);
  if(NAV[eg.gz*GW+eg.gx]){const b=nearestWalkable(eg);if(b)Object.assign(eg,b);else return null;}
  if(NAV[sg.gz*GW+sg.gx]){const b=nearestWalkable(sg);if(b)Object.assign(sg,b);else return null;}
  if(sg.gx===eg.gx&&sg.gz===eg.gz)return[gW(eg.gx,eg.gz)];
  const idx=g=>g.gz*GW+g.gx,h=(a,b)=>Math.abs(a.gx-b.gx)+Math.abs(a.gz-b.gz);
  const gC=new Float32Array(GW*GH).fill(Infinity),par=new Int32Array(GW*GH).fill(-1),cl=new Uint8Array(GW*GH);
  gC[idx(sg)]=0;const open=[{gx:sg.gx,gz:sg.gz,f:h(sg,eg)}];
  const DIRS=[[-1,-1,1.414],[-1,0,1],[-1,1,1.414],[0,-1,1],[0,1,1],[1,-1,1.414],[1,0,1],[1,1,1.414]];
  let found=false,iters=0;
  while(open.length&&iters++<2500){
    let bi=0;for(let i=1;i<open.length;i++)if(open[i].f<open[bi].f)bi=i;
    const cur=open.splice(bi,1)[0];const ci=idx(cur);
    if(cl[ci])continue;cl[ci]=1;
    if(cur.gx===eg.gx&&cur.gz===eg.gz){found=true;break;}
    for(const[dx,dz,cost]of DIRS){
      const nx=cur.gx+dx,nz=cur.gz+dz;
      if(nx<0||nx>=GW||nz<0||nz>=GH||NAV[nz*GW+nx])continue;
      const ni=nz*GW+nx;if(cl[ni])continue;
      if(dx&&dz&&(NAV[cur.gz*GW+nx]||NAV[nz*GW+cur.gx]))continue;
      const ng=gC[ci]+cost;if(ng<gC[ni]){gC[ni]=ng;par[ni]=ci;open.push({gx:nx,gz:nz,f:ng+h({gx:nx,gz:nz},eg)});}
    }
  }
  if(!found)return null;
  const raw=[];let c=idx(eg);while(c!==-1&&c!==idx(sg)){raw.unshift(gW(c%GW,Math.floor(c/GW)));c=par[c];}
  return smooth(raw.length?raw:[gW(eg.gx,eg.gz)]);
}
self.onmessage=function(e){
  const{type,id,nav}=e.data;
  if(type==='init'){NAV=new Uint8Array(nav);}
  else if(type==='path'){
    const path=astar(e.data.sx,e.data.sz,e.data.tx,e.data.tz);
    self.postMessage({id,path,agKey:e.data.agKey,predictive:e.data.predictive||false});
  }
};`;

function teardownPathWorker(resolvePending=false){
  if(pathWorker){
    try{pathWorker.terminate();}catch(e){}
    pathWorker=null;
  }
  if(_wkUrl){
    try{URL.revokeObjectURL(_wkUrl);}catch(e){}
    _wkUrl=null;
  }
  if(resolvePending){
    _wkCallbacks.forEach(cb=>{
      cb.resolve(astar(cb.sx,cb.sz,cb.tx,cb.tz));
    });
  }
  _wkCallbacks.clear();
  document.getElementById('wkBadge')?.classList.remove('on');
}

function initPathWorker(){
  teardownPathWorker(false);
  try{
    const blob=new Blob([WORKER_CODE],{type:'application/javascript'});
    _wkUrl=URL.createObjectURL(blob);
    pathWorker=new Worker(_wkUrl);

    pathWorker.onmessage=e=>{
      const {id,path,predictive,agKey}=e.data;
      if(predictive){
        if(AG&&AG[agKey])AG[agKey]._cachedHomePath=path;
        return;
      }
      const cb=_wkCallbacks.get(id);
      if(cb){
        cb.resolve(path);
        _wkCallbacks.delete(id);
      }
    };

    pathWorker.onerror=()=>{
      teardownPathWorker(true);
    };

    const navCopy=NAV.slice();
    pathWorker.postMessage({type:'init',nav:navCopy.buffer},[navCopy.buffer]);
    document.getElementById('wkBadge')?.classList.add('on');
  }catch(e){
    teardownPathWorker(true);
  }
}


function requestPath(sx,sz,tx,tz,agKey,predictive=false){
  return new Promise(resolve=>{
    if(!pathWorker){
      resolve(astar(sx,sz,tx,tz));
      return;
    }

    const id=_wkIdCtr++;
    if(!predictive){
      _wkCallbacks.set(id,{resolve,sx,sz,tx,tz});
    }

    try{
      pathWorker.postMessage({type:'path',id,sx,sz,tx,tz,agKey,predictive});
      if(predictive)resolve(null);
    }catch(e){
      if(!predictive){
        _wkCallbacks.delete(id);
        resolve(astar(sx,sz,tx,tz));
      }else{
        resolve(null);
      }
    }
  });
}


/*  GEOMETRY POOL  */
const _geoPool=new Map();
function poolGeo(type,...args){
  const key=type+'|'+args.join(',');
  if(!_geoPool.has(key)){
    _geoPool.set(key,
      type==='b'? new THREE.BoxGeometry(...args):
      type==='c'? new THREE.CylinderGeometry(...args):
      type==='s'? new THREE.SphereGeometry(...args):
      type==='t'? new THREE.TorusGeometry(...args):
      type==='ci'?new THREE.CircleGeometry(...args):
                  new THREE.PlaneGeometry(...args)
    );
  }
  return _geoPool.get(key);
}

/*  THREE.JS SCENE  */
let scene,camera,renderer,clock3,animTime=0,frameCt=0,AG={};
let deskLights={},deskScreens={};
let cFrustum=new THREE.Frustum(),cProjM=new THREE.Matrix4();
const globalRay=new THREE.Raycaster();
let interactiveObjects=[];
let _hoverRayPending=false;
let _lastHoverRayTs=0;
let _lastViewportW=0,_lastViewportH=0,_wrapResizeObs=null;
let _deliveryLight=null,_psychLight=null,_centerFlashLight=null,_deployFxLight=null;

function rebuildInteractives(){
  interactiveObjects=[];
  if(!scene)return;
  scene.traverse(obj=>{
    if(obj?.userData?.clickAction)interactiveObjects.push(obj);
  });
}

function syncViewportSize(force=false){
  const wrap=document.getElementById('canvasWrap');
  if(!wrap||!camera||!renderer)return;
  const w=Math.max(1,wrap.clientWidth||900);
  const h=Math.max(1,wrap.clientHeight||500);
  if(!force&&w===_lastViewportW&&h===_lastViewportH)return;
  _lastViewportW=w;_lastViewportH=h;
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
  renderer.setSize(w,h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.25));
}

function getViewportSize(){
  const wrap=document.getElementById('canvasWrap');
  const cv=renderer?.domElement;
  return {
    W:Math.max(1,cv?.clientWidth||wrap?.clientWidth||900),
    H:Math.max(1,cv?.clientHeight||wrap?.clientHeight||500)
  };
}

const ORB0={theta:0.52,phi:0.62,radius:62,tgtX:0,tgtY:1,tgtZ:0};
const orb={theta:ORB0.theta,phi:ORB0.phi,radius:ORB0.radius,minR:7,maxR:110,dragging:false,panning:false,lx:0,ly:0,tgt:null,lastUI:0};
let followAg=null,followT=0,camZTgt=null,camZTimer=0;
const ACT=new Array(60).fill(0);let actIdx=0,actTimer=0;
function tickAct(dt){actTimer+=dt;if(actTimer>=1){actTimer-=1;actIdx=(actIdx+1)%60;ACT[actIdx]=0;}}
function recAct(n=1){ACT[actIdx]+=n;}

let fpsMode=false,fpsAgKey=null;
const fpsEuler=new THREE.Euler(0,0,0,'YXZ');
let fpsPitch=0,fpsYaw=0;
let fpsDragging=false,fpsLx=0,fpsLy=0;
let _orbSave=null; // saved orbit state to restore on exit

function enterFPS(agKey){
  if(fpsMode&&fpsAgKey===agKey){exitFPS();return;}
  if(fpsMode)_leaveFPSCleanup();
  fpsMode=true;fpsAgKey=agKey;
  if(AG[agKey]){fpsYaw=AG[agKey].group.rotation.y+Math.PI;fpsPitch=0;}
  // save orbit so we can restore
  _orbSave={theta:orb.theta,phi:orb.phi,radius:orb.radius,tx:orb.tgt.x,ty:orb.tgt.y,tz:orb.tgt.z};
  followAg=null;camZTgt=null;
  document.getElementById('fpsOverlay').classList.add('show');
  document.getElementById('fpsBtnHdr').classList.add('fps-on');
  document.getElementById('fpsBtnHdr').textContent='FPS EXIT';
  document.getElementById('canvasWrap').classList.add('fps-mode');
  document.getElementById('orbitHint').style.opacity='0';
  document.getElementById('fpsTitleEl').textContent='FPS · '+ACFG[agKey].name.split(' ')[0].toUpperCase();
  // Try pointer lock on the renderer canvas
  try{renderer.domElement.requestPointerLock();}catch(e){}
  showToast('FPS -> '+ACFG[agKey].name.split(' ')[0]+' [F]=salir',ACFG[agKey].col);
}
function exitFPS(){
  if(!fpsMode)return;
  _leaveFPSCleanup();
  // Restore orbit camera
  if(_orbSave){
    orb.theta=_orbSave.theta;orb.phi=_orbSave.phi;orb.radius=_orbSave.radius;
    orb.tgt.set(_orbSave.tx,_orbSave.ty,_orbSave.tz);
    refreshCam();
  }
  showToast('Camara orbital restaurada');
}
function _leaveFPSCleanup(){
  // Restore visibility for previous FPS agent
  if(fpsAgKey&&AG[fpsAgKey]){
    const ag=AG[fpsAgKey];
    ag.head.visible=true;ag.torso.visible=true;ag.lArm.visible=true;ag.rArm.visible=true;
  }
  fpsMode=false;fpsAgKey=null;fpsDragging=false;
  document.getElementById('fpsOverlay').classList.remove('show');
  document.getElementById('fpsBtnHdr').classList.remove('fps-on');
  document.getElementById('fpsBtnHdr').textContent='FPS';
  document.getElementById('canvasWrap').classList.remove('fps-mode');
  document.getElementById('orbitHint').style.opacity='';
  try{if(document.exitPointerLock)document.exitPointerLock();}catch(e){}
}
function toggleFPS(){fpsMode?exitFPS():enterFPS(activeAg);}

function updateFPSCamera(){
  if(!fpsMode||!fpsAgKey||!AG[fpsAgKey])return;
  const ag=AG[fpsAgKey];
  // Smoothly follow agent walk direction (yaw only, so you can still look around)
  if(ag.path&&ag.path.length>0){
    const targetYaw=ag.group.rotation.y+Math.PI;
    const diff=((targetYaw-fpsYaw+Math.PI*3)%(Math.PI*2))-Math.PI;
    fpsYaw+=diff*0.09;
  }
  // Camera at head height
  const hx=ag.group.position.x,hy=ag.group.position.y+2.08,hz=ag.group.position.z;
  camera.position.set(hx,hy,hz);
  fpsEuler.set(fpsPitch,fpsYaw,0);
  camera.quaternion.setFromEuler(fpsEuler);
  // Hide own body to prevent clipping
  ag.head.visible=false;ag.torso.visible=false;ag.lArm.visible=false;ag.rArm.visible=false;
  // HUD
  document.getElementById('fpsStat0').textContent=ag.state;
  document.getElementById('fpsStat1').textContent=ag.stateTime<60?Math.floor(ag.stateTime)+'s':Math.floor(ag.stateTime/60)+'m';
  document.getElementById('fpsStat2').textContent=ag.group.position.x.toFixed(1)+', '+ag.group.position.z.toFixed(1);
}

function resetCam(){
  if(fpsMode) _leaveFPSCleanup();
  Object.assign(orb,ORB0);
  orb.tgt.set(ORB0.tgtX,ORB0.tgtY,ORB0.tgtZ);
  orb.lastUI=0;
  followAg=null;
  camZTgt=null;
  refreshCam();
  showToast('📷 Vista general','#0fa855');
}
function refreshCam(){if(fpsMode)return;const{theta,phi,radius,tgt}=orb;camera.position.set(tgt.x+radius*Math.sin(phi)*Math.sin(theta),tgt.y+radius*Math.cos(phi),tgt.z+radius*Math.sin(phi)*Math.cos(theta));camera.lookAt(tgt);}
function panOrbit(dx,dy){
  if(fpsMode)return;
  const scale=Math.max(.008,orb.radius*.00115);
  const toCam=new THREE.Vector3(camera.position.x-orb.tgt.x,0,camera.position.z-orb.tgt.z);
  if(toCam.lengthSq()<.0001)return;
  toCam.normalize();

  const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),toCam).normalize();
  const forward=new THREE.Vector3().crossVectors(right,new THREE.Vector3(0,1,0)).normalize();

  orb.tgt.addScaledVector(right,dx*scale);
  orb.tgt.addScaledVector(forward,-dy*scale);

  orb.tgt.x=Math.max(-26,Math.min(26,orb.tgt.x));
  orb.tgt.z=Math.max(-19,Math.min(16,orb.tgt.z));

  refreshCam();
}

/*  SCENE HELPERS  */
function _matStd(color,{roughness=.84,metalness=.04,emissive=0x000000,emissiveIntensity=0}={}){
  return new THREE.MeshPhongMaterial({color,shininess:16,specular:0x101010,emissive,emissiveIntensity});
}
function _tuneTexture(tex,{pixelated=false,anisotropy=6}={}){
  if(!tex)return tex;
  const maxAniso=renderer?.capabilities?.getMaxAnisotropy?.()||1;
  const w=tex.image?.width||0,h=tex.image?.height||0;
  const isPow2=n=>n>0&&(n&(n-1))===0;
  const canMip=isPow2(w)&&isPow2(h);
  tex.anisotropy=Math.min(anisotropy,maxAniso);
  tex.minFilter=pixelated?THREE.NearestFilter:(canMip?THREE.LinearMipmapLinearFilter:THREE.LinearFilter);
  tex.magFilter=pixelated?THREE.NearestFilter:THREE.LinearFilter;
  tex.generateMipmaps=!pixelated&&canMip;
  if(!canMip){
    tex.wrapS=THREE.ClampToEdgeWrapping;
    tex.wrapT=THREE.ClampToEdgeWrapping;
  }
  if('colorSpace' in tex&&THREE.SRGBColorSpace)tex.colorSpace=THREE.SRGBColorSpace;
  else if('encoding' in tex&&THREE.sRGBEncoding)tex.encoding=THREE.sRGBEncoding;
  tex.needsUpdate=true;
  return tex;
}
const M={
  floor:_matStd(0x111111,{roughness:.94,metalness:.02}),wall:_matStd(0x141820,{roughness:.92,metalness:.03}),
  deskT:_matStd(0x8B5E3C,{roughness:.78,metalness:.06}),deskB:_matStd(0x6B4226,{roughness:.84,metalness:.05}),
  dark:_matStd(0x2a2a2a,{roughness:.88,metalness:.08}),chair:_matStd(0x2a2d3a,{roughness:.82,metalness:.06}),
rack:_matStd(0x1a1a2a,{roughness:.86,metalness:.08}),pot:_matStd(0x281a0e,{roughness:.9,metalness:.03}),
  leaf:_matStd(0x163818,{roughness:.96,metalness:0}),leaf2:_matStd(0x1c4820,{roughness:.96,metalness:0}),
};
function bx(w,h,d,mat,x=0,y=0,z=0,p=null){
  const m=new THREE.Mesh(poolGeo('b',w,h,d),mat);
  m.position.set(x,y,z);
  m.receiveShadow=true;
  m.castShadow=false;
  (p||scene).add(m);
  return m;
}
function cy(rt,rb,h,seg,mat,x=0,y=0,z=0,p=null){
  const m=new THREE.Mesh(poolGeo('c',rt,rb,h,seg),mat);
  m.position.set(x,y,z);
  m.receiveShadow=true;
  m.castShadow=false;
  (p||scene).add(m);
  return m;
}
function pL(col,int,dist,x,y,z){const l=new THREE.PointLight(col,int,dist);l.position.set(x,y,z);scene.add(l);return l;}
function makeTex(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'));return _tuneTexture(new THREE.CanvasTexture(c));}
function zSign(lbl,col,x,y,z,ry=0){
  return;
}

function buildDesk(cfg){
  const g=new THREE.Group();

  bx(cfg.w,1.55,2.,M.deskB,0,.78,0,g);
  bx(cfg.w+.2,.1,2.2,M.deskT,0,1.6,0,g);
  bx(cfg.w+.2,.05,.06,new THREE.MeshBasicMaterial({color:parseInt(cfg.col.replace('#','0x')),transparent:true,opacity:.5}),0,1.64,1.12,g);

  const sm=new THREE.MeshLambertMaterial({color:0x0a0a0a});
  bx(.1,.5,.18,sm,0,1.96,-.5,g);
  bx(.75,.05,.4,sm,0,1.63,-.5,g);
  bx(2.,1.28,.1,sm,0,2.76,-.54,g);

  const scrC=document.createElement('canvas');
  scrC.width=512;
  scrC.height=320;
  const scrT=_tuneTexture(new THREE.CanvasTexture(scrC),{anisotropy:6});
  const scr=new THREE.Mesh(new THREE.BoxGeometry(1.82,1.14,.02),new THREE.MeshBasicMaterial({map:scrT}));
  scr.position.set(0,2.76,-.49);
  g.add(scr);
  deskScreens[cfg.key]={canvas:scrC,tex:scrT,mesh:scr};
  _drawDeskScreen(cfg.key,false);

  // Keyboard + mouse
  const kbBase=new THREE.MeshLambertMaterial({color:0x111315});
  const keyMat=new THREE.MeshLambertMaterial({color:0x1c2024});
  const mouseMat=new THREE.MeshLambertMaterial({color:0x15181a});
  const padMat=new THREE.MeshLambertMaterial({color:0x0b0d10});

  bx(.86,.03,.24,kbBase,0,1.66,.22,g);
  for(let i=0;i<10;i++)bx(.055,.01,.045,keyMat,-.27+i*.06,1.685,.2,g);
  bx(.12,.018,.045,keyMat,.29,1.685,.18,g);

  bx(.34,.015,.28,padMat,.62,1.62,.18,g);
  bx(.12,.035,.18,mouseMat,.62,1.67,.18,g);
  bx(.02,.01,.22,new THREE.MeshLambertMaterial({color:0x20262b}),.47,1.63,.05,g);

  // Desk props
  const leftX=-Math.min(.8,cfg.w*.22);
  const midLeft=-Math.min(.35,cfg.w*.12);
  const rightX=Math.min(.95,cfg.w*.24);

  const addClosedLaptop=(x,z,col=0x161a20)=>{
    const base=new THREE.Mesh(new THREE.BoxGeometry(.52,.035,.34),new THREE.MeshLambertMaterial({color:col}));
    base.position.set(x,1.675,z);g.add(base);

    const lid=new THREE.Mesh(new THREE.BoxGeometry(.52,.02,.34),new THREE.MeshLambertMaterial({color:0x21262d}));
    lid.position.set(x,1.71,z-.01);
    lid.rotation.x=-.18;
    g.add(lid);

    const mark=new THREE.Mesh(new THREE.BoxGeometry(.08,.005,.08),new THREE.MeshBasicMaterial({color:parseInt(cfg.col.replace('#','0x'))}));
    mark.position.set(x,1.722,z+.06);
    mark.rotation.x=-.18;
    g.add(mark);
  };

  const addNotebook=(x,z,paper=0xd8d1c2,cover=0x30343a)=>{
    const coverMesh=new THREE.Mesh(new THREE.BoxGeometry(.42,.03,.3),new THREE.MeshLambertMaterial({color:cover}));
    coverMesh.position.set(x,1.67,z);coverMesh.rotation.y=.08;g.add(coverMesh);

    const pageMesh=new THREE.Mesh(new THREE.BoxGeometry(.36,.02,.24),new THREE.MeshLambertMaterial({color:paper}));
    pageMesh.position.set(x+.01,1.697,z);pageMesh.rotation.y=.08;g.add(pageMesh);

    const band=new THREE.Mesh(new THREE.BoxGeometry(.03,.031,.3),new THREE.MeshBasicMaterial({color:parseInt(cfg.col.replace('#','0x'))}));
    band.position.set(x-.18,1.672,z);band.rotation.y=.08;g.add(band);
  };

  const addMug=(x,z,col=0xc8a040)=>{
    const mug=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.14,10),new THREE.MeshLambertMaterial({color:col}));
    mug.position.set(x,1.7,z);g.add(mug);

    const handle=new THREE.Mesh(new THREE.TorusGeometry(.04,.012,6,12,Math.PI*1.4),new THREE.MeshLambertMaterial({color:col}));
    handle.position.set(x+.075,1.705,z);handle.rotation.y=Math.PI/2;g.add(handle);
  };

  const addStickyStack=(x,z,colHex)=>{
    const c=parseInt(colHex.replace('#','0x'));
    for(let i=0;i<3;i++){
      const note=new THREE.Mesh(new THREE.BoxGeometry(.16,.012,.16),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.72-i*.14}));
      note.position.set(x+i*.015,1.67+i*.012,z-i*.01);
      note.rotation.y=.12-i*.05;
      g.add(note);
    }
  };

  const addTablet=(x,z,col=0x13171c)=>{
    const base=new THREE.Mesh(new THREE.BoxGeometry(.34,.02,.24),new THREE.MeshLambertMaterial({color:col}));
    base.position.set(x,1.67,z);base.rotation.y=-.16;g.add(base);

    const screen=new THREE.Mesh(new THREE.BoxGeometry(.3,.005,.2),new THREE.MeshBasicMaterial({color:0x07090c}));
    screen.position.set(x,1.684,z);screen.rotation.y=-.16;g.add(screen);
  };

  switch(cfg.key){
    case 'ceo':
      addNotebook(leftX,.56,0xd9d1c2,0x2c241c);
      addMug(rightX,.54,0xb59a68);
      break;
    case 'pm':
      addNotebook(leftX,.56,0xd8d8cf,0x2b3440);
      addStickyStack(rightX,.48,cfg.col);
      break;
    case 'devbe':
      addClosedLaptop(leftX,.56,0x14181d);
      addMug(rightX,.54,0x5e7f9d);
      break;
    case 'devfe':
      addClosedLaptop(leftX,.56,0x191621);
      addTablet(rightX,.5,0x12131a);
      break;
    case 'qa':
      addNotebook(leftX,.56,0xded7c9,0x34241a);
      addMug(rightX,.54,0xb07a4f);
      break;
    case 'devops':
      addClosedLaptop(leftX,.56,0x151a16);
      addMug(rightX,.54,0x6c9a72);
      break;
    case 'ux':
      addNotebook(leftX,.56,0xe6ddd3,0x3a2230);
      addStickyStack(midLeft,.42,cfg.col);
      addTablet(rightX,.52,0x16121a);
      break;
    case 'data':
      addNotebook(leftX,.56,0xd7d9d6,0x1c2c30);
      addMug(rightX,.54,0x6f9da1);
      break;
  }

  const chairDark=new THREE.MeshLambertMaterial({color:0x1a1d24});
  const chairSoft=new THREE.MeshLambertMaterial({color:0x262b34});
  const chairBase=new THREE.MeshLambertMaterial({color:0x0f1218});

  bx(1.12,.16,1.04,chairSoft,0,.92,1.95,g);
  bx(1.12,.08,1.04,new THREE.MeshBasicMaterial({color:parseInt(cfg.col.replace('#','0x')),transparent:true,opacity:.22}),0,1.01,1.95,g);
  bx(1.12,1.02,.12,chairDark,0,1.45,2.42,g);
  bx(.12,.7,.12,chairBase,0,.43,1.95,g);
  [[.42,.38],[.42,-.38],[-.42,.38],[-.42,-.38]].forEach(([lx,lz])=>bx(.08,.62,.08,chairBase,lx,.31,1.95+lz,g));
  bx(.12,.26,.78,chairBase,.66,1.03,1.95,g);
  bx(.12,.26,.78,chairBase,-.66,1.03,1.95,g);

  const chairSeatM=new THREE.MeshLambertMaterial({color:0x232936});
  const chairBackM=new THREE.MeshLambertMaterial({color:0x1d2330});
  const chairFrameM=new THREE.MeshLambertMaterial({color:0x0f1319});
  const chairGlowM=new THREE.MeshBasicMaterial({color:parseInt(cfg.col.replace('#','0x')),transparent:true,opacity:.22});

  bx(1.02,.16,1.0,chairSeatM,0,.92,2.02,g);
  bx(.94,.04,.92,chairGlowM,0,1.02,2.02,g);
  bx(.96,1.16,.12,chairBackM,0,1.52,2.48,g);
  bx(.72,.16,.08,chairGlowM,0,1.86,2.44,g);
  bx(.12,.62,.12,chairFrameM,0,.47,2.02,g);
  bx(.12,.24,.72,chairFrameM,.58,1.02,2.02,g);
  bx(.12,.24,.72,chairFrameM,-.58,1.02,2.02,g);
  [[.56,.46],[.56,-.46],[-.56,.46],[-.56,-.46],[0,.68],[0,-.68]].forEach(([lx,lz])=>bx(.08,.08,.26,chairFrameM,lx,.1,2.02+lz,g));

  const sl=pL(parseInt(cfg.col.replace('#','0x')),.38,5,0,2.8,.2);


  g.add(sl);
  deskLights[cfg.key]=sl;

  const mHit=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.4,.15),new THREE.MeshBasicMaterial({transparent:true,opacity:0}));
  mHit.position.set(0,2.76,-.54);
  mHit.userData.clickAction='monitor_'+cfg.key;
  g.add(mHit);

  g.position.set(cfg.x,-.02,cfg.z);
  g.rotation.y=cfg.rotY||0;
  scene.add(g);
}

function _isAgentAtDesk(k,r=2.45){
  const ag=AG&&AG[k],cfg=ACFG[k];
  if(!ag||!cfg)return false;
  return Math.hypot(ag.group.position.x-cfg.homeX,ag.group.position.z-cfg.homeZ)<=r&&ag.path.length===0;
}

function _drawDeskScreen(k,isOn){
  const ds=deskScreens[k],cfg=ACFG[k];
  if(!ds||!cfg)return;

  const ctx=ds.canvas.getContext('2d');
  const W=ds.canvas.width,H=ds.canvas.height;

  ctx.fillStyle=isOn?'#04080d':'#020305';
  ctx.fillRect(0,0,W,H);
  ctx.strokeStyle=isOn?cfg.col+'44':cfg.col+'18';
  ctx.lineWidth=1;
  ctx.strokeRect(2,2,W-4,H-4);

  if(!isOn){
    ctx.fillStyle='#63706c';
    ctx.font='bold 14px monospace';
    ctx.fillText(cfg.name.split(' ')[0].toUpperCase(),16,26);

    ctx.fillStyle='#2d3438';
    ctx.font='10px monospace';
    ctx.fillText('screen standby',16,46);

    ctx.fillStyle='#10161b';
    ctx.fillRect(16,66,168,8);
    ctx.fillStyle='#334046';
    ctx.fillRect(16,66,42,8);

    ctx.fillStyle='#243038';
    ctx.beginPath();
    ctx.arc(W-22,22,5,0,Math.PI*2);
    ctx.fill();
  }else{
    const pulse=.55+.45*Math.sin(Date.now()*.004);

    ctx.fillStyle=cfg.col;
    ctx.font='bold 14px monospace';
    ctx.fillText(cfg.name.split(' ')[0].toUpperCase(),16,24);

    ctx.fillStyle='#9aaba6';
    ctx.font='10px monospace';
    ctx.fillText(cfg.role.slice(0,24),16,42);

    [['sync',.82],['focus',.64],['ops',.91]].forEach(([l,p],i)=>{
      const y=74+i*32;
      ctx.fillStyle='#132028';
      ctx.fillRect(16,y,220,8);
      ctx.fillStyle=cfg.col;
      ctx.fillRect(16,y,Math.floor(220*p),8);
      ctx.fillStyle='#8b9a95';
      ctx.font='9px monospace';
      ctx.fillText(l,246,y+7);
    });

    const scanY=54+Math.floor((Date.now()*.03)%130);
    ctx.fillStyle=cfg.col+'22';
    ctx.fillRect(0,scanY,W,4);

    ctx.fillStyle='#d7e2dd';
    ctx.font='bold 10px monospace';
    ctx.fillText(`online  ${(pulse*100).toFixed(0)}%`,16,H-18);

    ctx.fillStyle=cfg.col;
    ctx.beginPath();
    ctx.arc(W-22,22,5,0,Math.PI*2);
    ctx.fill();
  }

  ds.tex.needsUpdate=true;
}

function updateDeskScreens(){
  Object.keys(deskScreens).forEach(k=>{
    if(k==='devbe'||k==='qa')return;
    _drawDeskScreen(k,_isAgentAtDesk(k,2.55));
  });
}



let _ambLight=null,_sunLight=null;
let _bloomInterval=null;
const _zoneLights=[],_zoneLightBaseInt=[];
function buildLighting(){
  _ambLight=new THREE.AmbientLight(0xe7e1d7,1.2);scene.add(_ambLight);
  const hemi=new THREE.HemisphereLight(0xf2eee6,0x97a0a2,1.55);scene.add(hemi);
  _sunLight=new THREE.DirectionalLight(0xf7f3eb,1.5);
  _sunLight.position.set(-10,24,8);_sunLight.castShadow=true;_sunLight.shadow.mapSize.set(1024,1024);_sunLight.shadow.camera.left=-28;_sunLight.shadow.camera.right=28;_sunLight.shadow.camera.top=24;_sunLight.shadow.camera.bottom=-24;_sunLight.shadow.bias=-0.00035;_sunLight.shadow.radius=1.1;scene.add(_sunLight);
  const _zl=(c,i,d,x,y,z)=>{const l=pL(c,i,d,x,y,z);_zoneLights.push(l);_zoneLightBaseInt.push(i);return l;};

  _zl(0xe3dad0,.34,24,-22,5,-12);
  _zl(0xd2dae0,.32,24,-9,5,-12);
  _zl(0xd8d2df,.30,22,0,5,-12);
  _zl(0xe2dbd2,.32,24,11,5,-12);
  _zl(0xd6dfd7,.32,22,21,5,-12);
  _zl(0xd4dae0,.28,22,-14,5,-1);
  _zl(0xe0d4dc,.28,22,-3,5,-1);
  _zl(0xd1dde0,.28,22,9,5,-1);
  _zl(0xd8ded2,.30,20,0,5,8);

  [-20,-8,4,16].forEach(x=>_zl(0x253446,.12,10,x,5,-19));

  _bloomInterval=setInterval(()=>{
    if(dayMode||document.hidden)return;
    const pulse=1.08+Math.sin(Date.now()*.001)*0.08;
    Object.values(deskLights).forEach(l=>{
      l.intensity=pulse;
    });
  },180);

}
function buildFloor(){
  // Piso base
bx(60,.1,46,new THREE.MeshLambertMaterial({color:0xe8dfc8}),0,0,0);
// Grid mas sutil
// Sin grid  piso limpio tipo Claw3D
// Textura de concreto
const floorC=document.createElement('canvas');floorC.width=768;floorC.height=768;
const fCtx=floorC.getContext('2d');
fCtx.fillStyle='#0c0c0c';fCtx.fillRect(0,0,768,768);
for(let i=0;i<768;i+=64){
  for(let j=0;j<768;j+=64){
    const v=Math.floor(Math.random()*6);
    fCtx.fillStyle=`rgba(${18+v},${18+v},${18+v},1)`;
    fCtx.fillRect(i,j,64,64);
    fCtx.strokeStyle='rgba(0,0,0,.4)';
    fCtx.lineWidth=.5;
    fCtx.strokeRect(i,j,64,64);
  }
}
const floorTex=_tuneTexture(new THREE.CanvasTexture(floorC),{anisotropy:8});
floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;
floorTex.repeat.set(8,6);
const floorMesh=new THREE.Mesh(
  new THREE.PlaneGeometry(60,46),
  new THREE.MeshLambertMaterial({map:floorTex,color:0xd4c8a8})
);
floorMesh.rotation.x=-Math.PI/2;floorMesh.position.set(0,.06,0);floorMesh.receiveShadow=true;scene.add(floorMesh);
// Zonas sutiles solo con luz, sin color de piso
Object.entries(ACFG).forEach(([k,cfg])=>{
  const spot=new THREE.Mesh(
    new THREE.CircleGeometry(3.5,24),
    new THREE.MeshBasicMaterial({
      color:parseInt(cfg.col.replace('#','0x')),
      transparent:true,opacity:.018,
      depthWrite:false,
      blending:THREE.AdditiveBlending
    })
  );
  spot.rotation.x=-Math.PI/2;
  spot.position.set(cfg.homeX,.07,cfg.homeZ);
  scene.add(spot);
});
// Reflejo sutil
const reflectC=document.createElement('canvas');reflectC.width=512;reflectC.height=512;
const rCtx=reflectC.getContext('2d');
const rg=rCtx.createRadialGradient(256,256,0,256,256,280);
rg.addColorStop(0,'rgba(15,168,85,.06)');rg.addColorStop(.4,'rgba(15,168,85,.02)');rg.addColorStop(1,'rgba(0,0,0,0)');
rCtx.fillStyle=rg;rCtx.fillRect(0,0,512,512);
const reflTex=_tuneTexture(new THREE.CanvasTexture(reflectC),{anisotropy:6});
const refl=new THREE.Mesh(
  new THREE.PlaneGeometry(52,38),
  new THREE.MeshBasicMaterial({map:reflTex,transparent:true,opacity:.2,depthWrite:false,blending:THREE.AdditiveBlending})
);
refl.rotation.x=-Math.PI/2;refl.position.set(0,.08,0);scene.add(refl);
// Spot reflections bajo escritorios
Object.entries(ACFG).forEach(([k,cfg])=>{
  const spot=new THREE.Mesh(
    new THREE.CircleGeometry(2.2,16),
    new THREE.MeshBasicMaterial({color:parseInt(cfg.col.replace('#','0x')),transparent:true,opacity:.025,depthWrite:false,blending:THREE.AdditiveBlending})
  );
  spot.rotation.x=-Math.PI/2;spot.position.set(cfg.homeX,.07,cfg.homeZ);scene.add(spot);
});
  // sin zonas de color  piso limpio
}
function buildWalls(){
  bx(60,8,.22,new THREE.MeshLambertMaterial({color:0x0e1218}),0,4,-20);
bx(.22,8,48,new THREE.MeshLambertMaterial({color:0x0c1016}),-28,4,0);
bx(.22,8,48,new THREE.MeshLambertMaterial({color:0x0c1016}),28,4,0);
  const wm=new THREE.MeshBasicMaterial({color:0x0c2030,transparent:true,opacity:.88});const bm=new THREE.MeshLambertMaterial({color:0x14202c});
  // ventanas ocultas  skyline las reemplaza
[-18,-8,2,12].forEach(x=>{pL(0x304870,.22,12,x,5,-18);});
  bx(.22,8,48,M.wall,-28,4,0);bx(.22,8,48,M.wall,28,4,0);// Pared frontal con hueco para puerta
bx(25,1.2,.22,M.wall,-16.5,.6,17);
bx(25,1.2,.22,M.wall,16.5,.6,17);
// Marco de puerta
const doorFrameMat=new THREE.MeshLambertMaterial({color:0x3a291b});
const doorMetalMat=new THREE.MeshLambertMaterial({color:0x5c6974});
const doorGlassMat=new THREE.MeshPhongMaterial({color:0x86b7c6,transparent:true,opacity:.3,shininess:110,specular:0xffffff});
const doorTrimMat=new THREE.MeshBasicMaterial({color:0xb7e6f2,transparent:true,opacity:.16});
const doorHandleMat=new THREE.MeshLambertMaterial({color:0xd7b36b});

bx(.24,3.8,.28,doorFrameMat,-4.1,1.9,17);
bx(.24,3.8,.28,doorFrameMat,4.1,1.9,17);
bx(8.5,.24,.28,doorFrameMat,0,3.72,17);
bx(8.5,.12,.24,new THREE.MeshLambertMaterial({color:0x1a120d}),0,.06,17);

window._doorSensor=new THREE.Mesh(
  new THREE.BoxGeometry(.58,.2,.08),
  new THREE.MeshBasicMaterial({color:0xc8a040})
);
window._doorSensor.position.set(0,4.14,16.88);
scene.add(window._doorSensor);

window._doorGlow=new THREE.Mesh(
  new THREE.PlaneGeometry(6.6,3.2),
  new THREE.MeshBasicMaterial({color:0x9fd9e8,transparent:true,opacity:.07,depthWrite:false})
);
window._doorGlow.position.set(0,2.35,16.86);
scene.add(window._doorGlow);

// Puerta izquierda corrediza
window._doorL=new THREE.Group();
const dFrameL=new THREE.Mesh(new THREE.BoxGeometry(3.72,3.18,.08),doorMetalMat);
const dGlassL=new THREE.Mesh(new THREE.BoxGeometry(2.94,2.46,.04),doorGlassMat);
const dTrimL=new THREE.Mesh(new THREE.BoxGeometry(2.7,.08,.05),doorTrimMat);
const dHandleL=new THREE.Mesh(new THREE.BoxGeometry(.08,.92,.06),doorHandleMat);
dGlassL.position.set(0,.02,.02);
dTrimL.position.set(0,.74,.03);
dHandleL.position.set(1.18,.04,.06);
window._doorL.add(dFrameL);window._doorL.add(dGlassL);window._doorL.add(dTrimL);window._doorL.add(dHandleL);
window._doorL.position.set(-2.02,2.4,17);
window._doorL.userData.closedX=-2.02;
window._doorL.userData.openX=-4.02;
scene.add(window._doorL);

// Puerta derecha corrediza
window._doorR=new THREE.Group();
const dFrameR=new THREE.Mesh(new THREE.BoxGeometry(3.72,3.18,.08),doorMetalMat);
const dGlassR=new THREE.Mesh(new THREE.BoxGeometry(2.94,2.46,.04),doorGlassMat);
const dTrimR=new THREE.Mesh(new THREE.BoxGeometry(2.7,.08,.05),doorTrimMat);
const dHandleR=new THREE.Mesh(new THREE.BoxGeometry(.08,.92,.06),doorHandleMat);
dGlassR.position.set(0,.02,.02);
dTrimR.position.set(0,.74,.03);
dHandleR.position.set(-1.18,.04,.06);
window._doorR.add(dFrameR);window._doorR.add(dGlassR);window._doorR.add(dTrimR);window._doorR.add(dHandleR);
window._doorR.position.set(2.02,2.4,17);
window._doorR.userData.closedX=2.02;
window._doorR.userData.openX=4.02;
scene.add(window._doorR);

// Luz sobre la puerta
pL(0x8fdcff,.3,7,0,4.25,16.45);

// Handle zone
const doorHit=new THREE.Mesh(new THREE.BoxGeometry(8.4,3.8,.6),new THREE.MeshBasicMaterial({transparent:true,opacity:0}));
doorHit.position.set(0,2.4,16.95);doorHit.userData.clickAction='door';scene.add(doorHit);
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(60,48),new THREE.MeshLambertMaterial({color:0x0d0d0d}));ceil.rotation.x=Math.PI/2;ceil.position.y=7;scene.add(ceil);

  // skyline sin cartel central
  _rebuildSkyline();

//  POSTERS PARED IZQUIERDA 
(function buildPosters(){
  // Poster 1: Mapa pixel de Cartagena
  const mapC=document.createElement('canvas');mapC.width=256;mapC.height=320;
  const mCtx=mapC.getContext('2d');
  mCtx.fillStyle='#040c10';mCtx.fillRect(0,0,256,320);
  mCtx.strokeStyle='#00bcd444';mCtx.lineWidth=1;mCtx.strokeRect(2,2,252,316);
  mCtx.fillStyle='#00bcd4';mCtx.font='bold 10px monospace';mCtx.textAlign='center';
  mCtx.fillText('CARTAGENA DE INDIAS',128,18);mCtx.fillText('🇨🇴 Colombia',128,32);
  // grid
  mCtx.strokeStyle='#0a1a1a';mCtx.lineWidth=1;
  for(let i=0;i<16;i++){mCtx.beginPath();mCtx.moveTo(i*16,40);mCtx.lineTo(i*16,316);mCtx.stroke();}
  for(let i=0;i<18;i++){mCtx.beginPath();mCtx.moveTo(0,40+i*16);mCtx.lineTo(256,40+i*16);mCtx.stroke();}
  // ciudad pixelart
  const land=[[3,3],[4,3],[5,3],[3,4],[4,4],[5,4],[6,4],[4,5],[5,5],[6,5],[7,5],[5,6],[6,6],[7,6],[6,7],[7,7],[8,7],[7,8],[8,8],[8,9],[9,9],[9,10],[10,10],[10,11]];
  land.forEach(([cx,cy])=>{mCtx.fillStyle='#1a3a2a';mCtx.fillRect(cx*16,40+cy*16,16,16);});
  const water=[[0,0],[1,0],[2,0],[0,1],[1,1],[0,2],[1,2],[2,2],[0,3],[1,3],[0,4],[1,4],[0,5],[0,6],[1,6],[0,7],[0,8],[0,9],[0,10],[1,10],[0,11],[1,11],[0,12],[1,12],[0,13],[0,14]];
  water.forEach(([cx,cy])=>{mCtx.fillStyle='#0a2030';mCtx.fillRect(cx*16,40+cy*16,16,16);});
  // Punto Dev Teams
  mCtx.fillStyle='#0fa855';mCtx.beginPath();mCtx.arc(6*16+8,40+6*16+8,5,0,Math.PI*2);mCtx.fill();
  mCtx.fillStyle='rgba(15,168,85,.2)';mCtx.beginPath();mCtx.arc(6*16+8,40+6*16+8,12,0,Math.PI*2);mCtx.fill();
  mCtx.fillStyle='#0fa855';mCtx.font='7px monospace';mCtx.textAlign='center';mCtx.fillText('Dev Teams',6*16+8,40+6*16+24);
  const mapTex=new THREE.CanvasTexture(mapC);
  const mapM=new THREE.Mesh(new THREE.PlaneGeometry(1.4,1.8),new THREE.MeshBasicMaterial({map:mapTex,transparent:true}));
  mapM.position.set(-27.55,3.8,-6);mapM.rotation.y=Math.PI/2;scene.add(mapM);
  const mapFrame=new THREE.Mesh(new THREE.BoxGeometry(.05,1.9,1.5),new THREE.MeshLambertMaterial({color:0x1a1208}));
  mapFrame.position.set(-27.56,3.8,-6);scene.add(mapFrame);

  // Poster 2 removido


  // Poster 3: marca generica pared derecha
  const lgC=document.createElement('canvas');lgC.width=320;lgC.height=200;
  const lgCtx=lgC.getContext('2d');
  lgCtx.fillStyle='#040808';lgCtx.fillRect(0,0,320,200);
  lgCtx.strokeStyle='#0fa85522';lgCtx.lineWidth=1;
  for(let i=0;i<20;i++){lgCtx.beginPath();lgCtx.moveTo(i*16,0);lgCtx.lineTo(i*16,200);lgCtx.stroke();}
  for(let i=0;i<13;i++){lgCtx.beginPath();lgCtx.moveTo(0,i*16);lgCtx.lineTo(320,i*16);lgCtx.stroke();}
  lgCtx.fillStyle='#e8ede8';lgCtx.font='bold 44px Syne,sans-serif';lgCtx.textAlign='center';lgCtx.fillText('Dev Teams',160,98);
  lgCtx.fillStyle='#1a2a1a';lgCtx.font='9px monospace';lgCtx.fillText('AI OPERATIONS HUB',160,128);
  lgCtx.strokeStyle='#0fa85533';lgCtx.lineWidth=1;lgCtx.strokeRect(8,8,304,184);
  const lgTex=new THREE.CanvasTexture(lgC);
  const lgM=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.4),new THREE.MeshBasicMaterial({map:lgTex,transparent:true}));
  lgM.position.set(27.55,4.8,-14);lgM.rotation.y=-Math.PI/2;scene.add(lgM);
  const lgFrame=new THREE.Mesh(new THREE.BoxGeometry(.05,1.5,2.3),new THREE.MeshLambertMaterial({color:0x0a1208}));
  lgFrame.position.set(27.56,4.8,-14);scene.add(lgFrame);

})();

// techo limpio para vista aerea

}
function buildCEOZone(){
  zSign('CEO OFFICE','#c8a040',-16,6,-13);
  const gm=new THREE.MeshBasicMaterial({color:0x1a2838,transparent:true,opacity:.15,side:THREE.DoubleSide});
  bx(.1,5,14,gm,-16,2.5,-12);bx(.12,5.2,.12,new THREE.MeshLambertMaterial({color:0x1a1a1a}),-16,2.5,-19);bx(.12,5.2,.12,new THREE.MeshLambertMaterial({color:0x1a1a1a}),-16,2.5,-6);
  buildDesk({key:'ceo',col:'#c8a040',w:5.5,x:-22,z:-14});
  pL(0xffd080,.45,5,-22,3.1,-13.8);
  const wbt=makeTex(512,320,ctx=>{ctx.fillStyle='#040c04';ctx.fillRect(0,0,512,320);ctx.fillStyle='#0fa855';ctx.font='bold 16px monospace';ctx.textAlign='left';ctx.fillText('Dev Teams · SPRINT Q2 🚀',14,22);const kpis=[['Velocity','94pts','#0fa855',.88],['Coverage','87%','#0fa855',.87],['Bug Rate','2.1/d','#c8a040',.42],['Deploys','14/wk','#0fa855',.7],['P1 Bugs','0 🎯','#0fa855',1],['NPS','72','#3a8ccc',.72]];kpis.forEach(([l,v,c,p],i)=>{const y=38+i*44;ctx.fillStyle='#3a4a3a';ctx.font='9px monospace';ctx.fillText(l,14,y+12);ctx.fillStyle=c;ctx.font='bold 18px monospace';ctx.fillText(v,14,y+30);ctx.fillStyle='rgba(255,255,255,.05)';ctx.fillRect(160,y+18,300,7);ctx.fillStyle=c;ctx.globalAlpha=.7;ctx.fillRect(160,y+18,300*p,7);ctx.globalAlpha=1;});});
  const wbm=new THREE.Mesh(new THREE.PlaneGeometry(4.2,2.6),new THREE.MeshBasicMaterial({map:wbt}));
  wbm.position.set(-27.55,4.0,1.5);
  wbm.rotation.y=Math.PI/2;
  scene.add(wbm);
  _boardMesh=wbm;

  // Click zone marker for board
  const bHit=new THREE.Mesh(new THREE.BoxGeometry(.18,3.2,4.8),new THREE.MeshBasicMaterial({transparent:true,opacity:0}));
  bHit.position.set(-27.55,4.0,1.5);
  bHit.userData.clickAction='board';
  scene.add(bHit);

  const ceoSofaSeat=new THREE.MeshLambertMaterial({color:0x262634});
  const ceoSofaBack=new THREE.MeshLambertMaterial({color:0x20202c});
  const ceoSofaArm=new THREE.MeshLambertMaterial({color:0x1b1b26});
  const ceoCush=new THREE.MeshLambertMaterial({color:0x343448});

  bx(4.6,.52,1.7,ceoSofaSeat,-22,.68,-9.15);
  bx(4.6,1.02,.24,ceoSofaBack,-22,1.15,-8.32);
  bx(.24,.92,1.7,ceoSofaArm,-24.32,.95,-9.15);
  bx(.24,.92,1.7,ceoSofaArm,-19.68,.95,-9.15);
  [-1.45,0,1.45].forEach(ox=>bx(1.08,.26,1.14,ceoCush,-22+ox,1.03,-9.28));
  plantAt(-18,-19,1.5);plantAt(-26.5,-19,1.2);

}
let devCvs=[],devTex=[],devOff=0;
//  GIT LOG 
let _gitLog=[],_gitCvs=null,_gitTex=null,_gitMesh=null;
const _GIT_TYPES=['feat','fix','refactor','docs','test','chore','perf'];
const _GIT_SCOPES=['auth','api','ui','db','deploy','core','utils','hooks'];
function gitCommit(agKey,msg){
  const hash=Math.random().toString(16).slice(2,9);
  const type=_GIT_TYPES[Math.floor(Math.random()*_GIT_TYPES.length)];
  const scope=_GIT_SCOPES[Math.floor(Math.random()*_GIT_SCOPES.length)];
  const cfg=ACFG[agKey];
  _gitLog.unshift({hash,type,scope,msg:msg||`${type}(${scope}): update`,author:cfg.name.split(' ')[0],col:cfg.col,ts:new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'})});
  if(_gitLog.length>11)_gitLog.pop();
  _renderGitScreen();AG[agKey]?.say(`git push · ${hash}`);
}
function _renderGitScreen(){
  if(!_gitCvs){_gitCvs=document.createElement('canvas');_gitCvs.width=512;_gitCvs.height=310;_gitTex=_tuneTexture(new THREE.CanvasTexture(_gitCvs),{anisotropy:8});}
  const ctx=_gitCvs.getContext('2d');ctx.fillStyle='#010408';ctx.fillRect(0,0,512,310);
  ctx.fillStyle='#0fa855';ctx.font='bold 11px monospace';ctx.fillText('git log --oneline · Dev Teams/main',10,17);
  ctx.strokeStyle='#0fa85533';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,24);ctx.lineTo(512,24);ctx.stroke();
  ctx.strokeStyle='#0fa85522';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(18,28);ctx.lineTo(18,308);ctx.stroke();ctx.setLineDash([]);
  _gitLog.forEach((c,i)=>{
    const y=34+i*24;
    ctx.fillStyle=c.col;ctx.beginPath();ctx.arc(18,y+4,4,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=c.col+'44';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(22,y+4);ctx.lineTo(40,y+4);ctx.stroke();
    ctx.fillStyle='#c8a040';ctx.font='9px monospace';ctx.fillText(c.hash,42,y+8);
    const tc={feat:'#0fa855',fix:'#cc3344',refactor:'#3a8ccc',docs:'#9060cc',test:'#d97020',chore:'#445544',perf:'#e91e8c'}[c.type]||'#445544';
    ctx.fillStyle=tc+'33';ctx.fillRect(84,y,40,14);ctx.fillStyle=tc;ctx.font='8px monospace';ctx.fillText(c.type,86,y+10);
    ctx.fillStyle='#b0c8b0';ctx.font='9px monospace';ctx.fillText(c.msg.slice(0,26),130,y+8);
    ctx.fillStyle=c.col+'99';ctx.font='8px monospace';ctx.fillText(c.author,388,y+8);
    ctx.fillStyle='#2a3a2a';ctx.fillText(c.ts,440,y+8);
  });
  if(!_gitMesh){
    _gitMesh=new THREE.Mesh(new THREE.PlaneGeometry(4.5,2.8),new THREE.MeshBasicMaterial({map:_gitTex,transparent:true,opacity:.9}));
    _gitMesh.position.set(27.6,3.8,-8);
    _gitMesh.rotation.y=-Math.PI/2;
    scene.add(_gitMesh);
  }
  _gitTex.needsUpdate=true;
}

//  BURNDOWN ANIMADO 
let _burnCvs=null,_burnTex=null,_burnMesh=null,_burnFrame=0;
const _BURN_IDEAL=Array.from({length:14},(_,i)=>Math.round(80*(1-i/13)));
const _BURN_ACTUAL=[80,75,71,68,62,58,55,50,44,40,35,28,20,null];
function updateBurndown(){
  _burnFrame++;
  if(!_burnCvs){_burnCvs=document.createElement('canvas');_burnCvs.width=384;_burnCvs.height=220;_burnTex=_tuneTexture(new THREE.CanvasTexture(_burnCvs),{anisotropy:8});}
  const ctx=_burnCvs.getContext('2d');const W=384,H=220,PL=38,PT=20,PB=28,PR=8;
  const gW=W-PL-PR,gH=H-PT-PB;
  ctx.fillStyle='#030810';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#5b9bd5';ctx.font='bold 10px monospace';ctx.fillText('SPRINT BURNDOWN · Q2-2025',PL,14);
  for(let i=0;i<=4;i++){const y=PT+i*(gH/4);ctx.strokeStyle='#1a2a3a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(PL,y);ctx.lineTo(PL+gW,y);ctx.stroke();ctx.fillStyle='#2a3a4a';ctx.font='7px monospace';ctx.fillText(String(Math.round(80*(1-i/4))).padStart(2,' '),2,y+4);}
  for(let i=0;i<14;i+=2){const x=PL+i*gW/13;ctx.fillStyle='#2a3a4a';ctx.font='7px monospace';ctx.fillText('D'+(i+1),x-5,H-4);}
  // Ideal (dashed)
  ctx.strokeStyle='#5b9bd566';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();
  _BURN_IDEAL.forEach((v,i)=>{const x=PL+i*gW/13,y=PT+gH*(1-v/80);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.stroke();ctx.setLineDash([]);
  // Actual (animated draw-in)
  const today=_BURN_ACTUAL.findIndex(v=>v===null);const total=today<0?14:today;
  const show=Math.min(total,Math.floor((_burnFrame%120)/120*total)+1);
  ctx.strokeStyle='#0fa855';ctx.lineWidth=2;ctx.beginPath();
  for(let i=0;i<show;i++){const v=_BURN_ACTUAL[i];if(v===null)break;const x=PL+i*gW/13,y=PT+gH*(1-v/80);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();
  if(show>0){const li=show-1,v=_BURN_ACTUAL[li];if(v!==null){const x=PL+li*gW/13,y=PT+gH*(1-v/80);ctx.fillStyle='#0fa855';ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#0fa855';ctx.font='bold 8px monospace';ctx.fillText(v+'pts',x+5,y+4);}}
  if(!_burnMesh){
    _burnMesh=new THREE.Mesh(new THREE.PlaneGeometry(4.5,2.8),new THREE.MeshBasicMaterial({map:_burnTex,transparent:true,opacity:.88}));
    _burnMesh.position.set(-27.6,3.8,-8);
    _burnMesh.rotation.y=Math.PI/2;
    scene.add(_burnMesh);
  }
  _burnTex.needsUpdate=true;
}

const CODE=[{t:'// Dev Teams Auth v2',c:'#3a5a3a'},{t:'import jwt from "jsonwebtoken"',c:'#3a8ccc'},{t:'import bcrypt from "bcrypt"',c:'#3a8ccc'},{t:'',c:''},{t:'const SECRET=process.env.JWT',c:'#c8c040'},{t:'export const login=async(r,s)=>{',c:'#e8ede8'},{t:'  const u=await User.find(r.email)',c:'#0fa855'},{t:'  if(!u) return s.status(401)',c:'#cc3344'},{t:'  const tok=jwt.sign({id},SECRET)',c:'#0fa855'},{t:'  s.json({tok,u})',c:'#c8a040'},{t:'}',c:'#e8ede8'},{t:'',c:''},{t:'// ✓ Tests 14/14  94%',c:'#0fa855'}];
function buildDevBEZone(){
  zSign('THE ARCHITECT','#3a8ccc',-5.5,6.5,-13);
  devCvs=[0,1,2].map(()=>{const c=document.createElement('canvas');c.width=280;c.height=176;return c;});
  devTex=devCvs.map(c=>_tuneTexture(new THREE.CanvasTexture(c),{anisotropy:10}));

  const g=new THREE.Group();
  bx(7.,1.55,2.,M.deskB,0,.78,0,g);
  bx(7.2,.1,2.2,M.deskT,0,1.6,0,g);
  bx(7.2,.05,.06,new THREE.MeshBasicMaterial({color:0x3a8ccc,transparent:true,opacity:.5}),0,1.64,1.12,g);

  const sm=new THREE.MeshLambertMaterial({color:0x0a0a0a});

  [[-2.5],[0],[2.5]].forEach(([ox],i)=>{
    bx(.1,.46,.16,sm,ox,1.96,-.5,g);
    bx(.75,.05,.4,sm,ox,1.62,-.5,g);
    bx(2.1,1.32,.09,sm,ox,2.76,-.54,g);

    const sm2=new THREE.Mesh(new THREE.BoxGeometry(1.92,1.18,.02),new THREE.MeshBasicMaterial({map:devTex[i],color:0x020804}));
    sm2.position.set(ox,2.76,-.49);
    sm2.userData.clickAction='monitor_devbe';
    g.add(sm2);

    if(i===1){
      const sl=pL(0x4488cc,.4,5,ox,2.8,.2);
      g.add(sl);
      deskLights['devbe']=sl;
    }
  });

  // Un solo teclado + mouse para el setup triple monitor
  const kbBase=new THREE.MeshLambertMaterial({color:0x111315});
  const keyMat=new THREE.MeshLambertMaterial({color:0x1c2024});
  const mouseMat=new THREE.MeshLambertMaterial({color:0x15181a});
  const padMat=new THREE.MeshLambertMaterial({color:0x0b0d10});

  bx(1.1,.03,.24,kbBase,0,1.66,.24,g);
  for(let i=0;i<12;i++)bx(.065,.01,.04,keyMat,-.36+i*.065,1.685,.22,g);
  bx(.32,.015,.24,padMat,.86,1.62,.2,g);
  bx(.12,.035,.17,mouseMat,.86,1.67,.2,g);

  // Control pad / tablet tecnica al lado izquierdo
  const ctrlBase=new THREE.Mesh(new THREE.BoxGeometry(.34,.02,.22),new THREE.MeshLambertMaterial({color:0x121820}));
  ctrlBase.position.set(-1.0,1.67,.2);
  ctrlBase.rotation.y=.08;
  g.add(ctrlBase);

  const ctrlScreen=new THREE.Mesh(new THREE.BoxGeometry(.28,.005,.16),new THREE.MeshBasicMaterial({color:0x070c12}));
  ctrlScreen.position.set(-1.0,1.684,.2);
  ctrlScreen.rotation.y=.08;
  g.add(ctrlScreen);

  const ctrlAccent=new THREE.Mesh(new THREE.BoxGeometry(.05,.005,.05),new THREE.MeshBasicMaterial({color:0x3a8ccc}));
  ctrlAccent.position.set(-1.08,1.688,.26);
  ctrlAccent.rotation.y=.08;
  g.add(ctrlAccent);

  // Props especiales de founder / architect
  const laptopBase=new THREE.Mesh(new THREE.BoxGeometry(.58,.035,.36),new THREE.MeshLambertMaterial({color:0x151a20}));
  laptopBase.position.set(0,1.675,.62);g.add(laptopBase);

  const laptopLid=new THREE.Mesh(new THREE.BoxGeometry(.58,.02,.36),new THREE.MeshLambertMaterial({color:0x20262e}));
  laptopLid.position.set(0,1.715,.58);
  laptopLid.rotation.x=-.28;
  g.add(laptopLid);

  const logoMark=new THREE.Mesh(new THREE.BoxGeometry(.08,.005,.08),new THREE.MeshBasicMaterial({color:0x3a8ccc}));
  logoMark.position.set(0,1.727,.67);
  logoMark.rotation.x=-.28;
  g.add(logoMark);

  const noteCover=new THREE.Mesh(new THREE.BoxGeometry(.44,.03,.3),new THREE.MeshLambertMaterial({color:0x1d2530}));
  noteCover.position.set(-3.0,1.67,.58);
  noteCover.rotation.y=.08;
  g.add(noteCover);

  const notePaper=new THREE.Mesh(new THREE.BoxGeometry(.37,.02,.24),new THREE.MeshLambertMaterial({color:0xd8ddd8}));
  notePaper.position.set(-2.98,1.697,.58);
  notePaper.rotation.y=.08;
  g.add(notePaper);

  const mug=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.14,10),new THREE.MeshLambertMaterial({color:0x5e7f9d}));
  mug.position.set(3.02,1.7,.56);g.add(mug);

  const handle=new THREE.Mesh(new THREE.TorusGeometry(.04,.012,6,12,Math.PI*1.4),new THREE.MeshLambertMaterial({color:0x5e7f9d}));
  handle.position.set(3.095,1.705,.56);
  handle.rotation.y=Math.PI/2;
  g.add(handle);

  const dock=new THREE.Mesh(new THREE.BoxGeometry(.5,.05,.18),new THREE.MeshLambertMaterial({color:0x0f1318}));
  dock.position.set(0,1.66,.9);g.add(dock);

  const status1=new THREE.Mesh(new THREE.BoxGeometry(.05,.01,.05),new THREE.MeshBasicMaterial({color:0x3a8ccc}));
  status1.position.set(-.16,1.695,.9);g.add(status1);
  const status2=new THREE.Mesh(new THREE.BoxGeometry(.05,.01,.05),new THREE.MeshBasicMaterial({color:0x0fa855}));
  status2.position.set(-.06,1.695,.9);g.add(status2);
  const status3=new THREE.Mesh(new THREE.BoxGeometry(.05,.01,.05),new THREE.MeshBasicMaterial({color:0xcc3344}));
  status3.position.set(.04,1.695,.9);g.add(status3);

  const yChairSeatM=new THREE.MeshLambertMaterial({color:0x232936});
  const yChairBackM=new THREE.MeshLambertMaterial({color:0x1d2330});
  const yChairFrameM=new THREE.MeshLambertMaterial({color:0x0f1319});
  const yChairGlowM=new THREE.MeshBasicMaterial({color:0x3a8ccc,transparent:true,opacity:.24});

  bx(1.14,.16,1.06,yChairSeatM,0,.92,2.06,g);
  bx(1.02,.04,.96,yChairGlowM,0,1.02,2.06,g);
  bx(1.02,1.24,.12,yChairBackM,0,1.56,2.56,g);
  bx(.76,.16,.08,yChairGlowM,0,1.92,2.5,g);
  bx(.12,.66,.12,yChairFrameM,0,.49,2.06,g);
  bx(.12,.24,.78,yChairFrameM,.64,1.03,2.06,g);
  bx(.12,.24,.78,yChairFrameM,-.64,1.03,2.06,g);
  [[.62,.5],[.62,-.5],[-.62,.5],[-.62,-.5],[0,.74],[0,-.74]].forEach(([lx,lz])=>bx(.08,.08,.28,yChairFrameM,lx,.1,2.06+lz,g));

  g.position.set(-9,-.02,-14);
  scene.add(g);


  for(let ri=0;ri<2;ri++){
    const rx=-6.6+ri*2.0;
    const rg=new THREE.Group();
    const rackShellM=new THREE.MeshLambertMaterial({color:0x101722});
    const rackFaceM=new THREE.MeshLambertMaterial({color:0x05080c});
    const rackTrimM=new THREE.MeshLambertMaterial({color:0x304255});
    const rackGlassM=new THREE.MeshPhongMaterial({color:0x8cb7d6,transparent:true,opacity:.14,shininess:110});

    bx(1.9,2.75,1.42,rackShellM,0,1.38,0,rg);
    bx(1.74,2.5,1.22,rackFaceM,0,1.38,0,rg);
    bx(.05,2.44,1.18,rackTrimM,-.82,1.38,0,rg);
    bx(.05,2.44,1.18,rackTrimM,.82,1.38,0,rg);
    bx(1.8,.08,1.42,new THREE.MeshLambertMaterial({color:0x1b2836}),0,2.73,0,rg);

    const front=new THREE.Mesh(new THREE.BoxGeometry(1.56,2.3,.04),rackGlassM);
    front.position.set(0,1.38,.72);
    rg.add(front);

    for(let ui=0;ui<6;ui++){
      const uy=.3+ui*.36;
      bx(1.46,.16,1.02,new THREE.MeshLambertMaterial({color:0x020406}),0,uy,0,rg);
      bx(.42,.012,.02,new THREE.MeshBasicMaterial({color:0x3a8ccc}),.12,uy,.52,rg);
      bx(.06,.06,.06,new THREE.MeshBasicMaterial({color:ui%2===0?0x0fa855:0xffb000}),-.58,uy,.54,rg);
      bx(.06,.06,.06,new THREE.MeshBasicMaterial({color:ui%3===0?0xcc3344:0x3a8ccc}),-.4,uy,.54,rg);
    }

    const ledBar=new THREE.Mesh(new THREE.BoxGeometry(.72,.03,.03),new THREE.MeshBasicMaterial({color:ri===0?0x3a8ccc:0x0fa855}));
    ledBar.position.set(0,2.46,.72);
    rg.add(ledBar);

    rg.position.set(rx,0,-16.5);
    scene.add(rg);
    pL(ri===0?0x3a8ccc:0x0fa855,.12,2.6,rx,2.8,-15.9);
  }



  pL(0x0fa855,.3,10,-4,3,-14);
  plantAt(-16.5,-18.5,1.);
}

function updateDevScreens(){
  if(!devCvs.length)return;
  const deskPos=new THREE.Vector3(-9,2,-14);
  const s=new THREE.Sphere(deskPos,8);
  if(!cFrustum.intersectsSphere(s))return;

  const atDesk=_isAgentAtDesk('devbe',2.8);
  if(!atDesk){
    devCvs.forEach((c,ci)=>{
      const ctx=c.getContext('2d');
      ctx.fillStyle='#020508';
      ctx.fillRect(0,0,280,176);
      ctx.strokeStyle='#3a8ccc22';
      ctx.lineWidth=1;
      ctx.strokeRect(2,2,276,172);
      ctx.fillStyle='#617894';
      ctx.font='bold 10px monospace';
      ctx.fillText(`ARCH NODE ${ci+1}`,10,18);
      ctx.fillStyle='#293744';
      ctx.font='9px monospace';
      ctx.fillText('waiting for Yared',10,38);
      ctx.fillStyle='#0a1118';
      ctx.fillRect(10,56,136,8);
      ctx.fillStyle='#22384a';
      ctx.fillRect(10,56,34,8);
      devTex[ci].needsUpdate=true;
    });
    return;
  }

  const agIdle=AG['devbe']&&(AG['devbe'].state==='idle'||AG['devbe'].state==='walking'||AG['devbe'].state==='waiting');

  if(agIdle){
    devCvs.forEach((c,ci)=>{
      const ctx=c.getContext('2d');
      if(!c._matrixCols)c._matrixCols=Array.from({length:18},()=>({x:Math.floor(Math.random()*18),y:Math.random()*14,speed:.18+Math.random()*.28}));
      ctx.fillStyle='rgba(2,8,4,0.18)';
      ctx.fillRect(0,0,280,176);
      ctx.font='9px monospace';
      c._matrixCols.forEach(col=>{
        col.y+=col.speed;
        if(col.y>14)col.y=0;
        const chars='DEVTEAM01{}[]<>/\\\\|';
        const ch=chars[Math.floor(Math.random()*chars.length)];
        ctx.fillStyle=`rgba(58,140,204,${.18+Math.random()*.55})`;
        ctx.fillText(ch,col.x*15+2,Math.floor(col.y)*12+12);
        ctx.fillStyle='rgba(220,235,245,.82)';
        ctx.fillText(ch,col.x*15+2,Math.floor(col.y)*12+12);
      });
      devTex[ci].needsUpdate=true;
    });
    return;
  }

  devOff=(devOff+.07)%(CODE.length*12);
  devCvs.forEach((c,ci)=>{
    const ctx=c.getContext('2d');
    ctx.fillStyle='#020804';
    ctx.fillRect(0,0,280,176);
    const st=Math.floor(devOff)-(ci*3);
    for(let i=0;i<14;i++){
      const li=((st+i)%CODE.length+CODE.length)%CODE.length;
      const ln=CODE[li];
      if(!ln.t)continue;
      ctx.fillStyle=ln.c||'#e8ede8';
      ctx.font='9px "JetBrains Mono",monospace';
      ctx.fillText(ln.t.substring(0,36),4,12+i*12);
    }
    devTex[ci].needsUpdate=true;
  });
}
function buildDevFEZone(){zSign('DEV FRONTEND','#9060cc',5.5,6.5,-13);buildDesk({key:'devfe',col:'#9060cc',w:5.2,x:0,z:-14});plantAt(4,-18.5,.9);}
let qaCvs=null,qaTex=null,qaFr=0;
function buildQAZone(){
  zSign('QA TESTING','#d97020',5.5,6.5,-2,Math.PI);
  if(!qaCvs){
    qaCvs=document.createElement('canvas');
    qaCvs.width=384;
    qaCvs.height=240;
    qaTex=_tuneTexture(new THREE.CanvasTexture(qaCvs),{anisotropy:10});
  }

  const g=new THREE.Group();

  bx(5.2,1.55,2.,M.deskB,0,.78,0,g);
  bx(5.4,.1,2.2,M.deskT,0,1.6,0,g);
  bx(5.4,.05,.06,new THREE.MeshBasicMaterial({color:0xd97020,transparent:true,opacity:.55}),0,1.64,1.12,g);

  const sm=new THREE.MeshLambertMaterial({color:0x0a0a0a});
  bx(.1,.5,.18,sm,0,1.96,-.5,g);
  bx(.8,.05,.42,sm,0,1.63,-.5,g);
  bx(2.1,1.3,.1,sm,0,2.76,-.55,g);

  const qs=new THREE.Mesh(new THREE.BoxGeometry(1.92,1.16,.02),new THREE.MeshBasicMaterial({map:qaTex,color:0x060402}));
  qs.position.set(0,2.76,-.5);
  g.add(qs);

  // Keyboard + mouse
  const kbBase=new THREE.MeshLambertMaterial({color:0x111315});
  const keyMat=new THREE.MeshLambertMaterial({color:0x1c2024});
  const mouseMat=new THREE.MeshLambertMaterial({color:0x15181a});
  const padMat=new THREE.MeshLambertMaterial({color:0x0b0d10});

  bx(.86,.03,.24,kbBase,0,1.66,.22,g);
  for(let i=0;i<10;i++)bx(.055,.01,.045,keyMat,-.27+i*.06,1.685,.2,g);
  bx(.12,.018,.045,keyMat,.29,1.685,.18,g);

  bx(.34,.015,.28,padMat,.62,1.62,.18,g);
  bx(.12,.035,.18,mouseMat,.62,1.67,.18,g);
  bx(.02,.01,.22,new THREE.MeshLambertMaterial({color:0x20262b}),.47,1.63,.05,g);

  // Props QA
  const noteCover=new THREE.Mesh(new THREE.BoxGeometry(.42,.03,.3),new THREE.MeshLambertMaterial({color:0x34241a}));
  noteCover.position.set(-.9,1.67,.56);
  noteCover.rotation.y=.08;
  g.add(noteCover);

  const notePaper=new THREE.Mesh(new THREE.BoxGeometry(.36,.02,.24),new THREE.MeshLambertMaterial({color:0xded7c9}));
  notePaper.position.set(-.89,1.697,.56);
  notePaper.rotation.y=.08;
  g.add(notePaper);

  const noteBand=new THREE.Mesh(new THREE.BoxGeometry(.03,.031,.3),new THREE.MeshBasicMaterial({color:0xd97020}));
  noteBand.position.set(-1.08,1.672,.56);
  noteBand.rotation.y=.08;
  g.add(noteBand);

  const mug=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.14,10),new THREE.MeshLambertMaterial({color:0xb07a4f}));
  mug.position.set(.95,1.7,.54);
  g.add(mug);

  const handle=new THREE.Mesh(new THREE.TorusGeometry(.04,.012,6,12,Math.PI*1.4),new THREE.MeshLambertMaterial({color:0xb07a4f}));
  handle.position.set(1.025,1.705,.54);
  handle.rotation.y=Math.PI/2;
  g.add(handle);

  // Click monitor
  const qHit=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.4,.15),new THREE.MeshBasicMaterial({transparent:true,opacity:0}));
  qHit.position.set(0,2.76,-.5);
  qHit.userData.clickAction='monitor_qa';
  g.add(qHit);

  const qChairSeatM=new THREE.MeshLambertMaterial({color:0x232936});
  const qChairBackM=new THREE.MeshLambertMaterial({color:0x1d2330});
  const qChairFrameM=new THREE.MeshLambertMaterial({color:0x0f1319});
  const qChairGlowM=new THREE.MeshBasicMaterial({color:0xd97020,transparent:true,opacity:.24});

  bx(1.02,.16,1.0,qChairSeatM,0,.92,2.02,g);
  bx(.94,.04,.92,qChairGlowM,0,1.02,2.02,g);
  bx(.96,1.16,.12,qChairBackM,0,1.52,2.48,g);
  bx(.72,.16,.08,qChairGlowM,0,1.86,2.44,g);
  bx(.12,.62,.12,qChairFrameM,0,.47,2.02,g);
  bx(.12,.24,.72,qChairFrameM,.58,1.02,2.02,g);
  bx(.12,.24,.72,qChairFrameM,-.58,1.02,2.02,g);
  [[.56,.46],[.56,-.46],[-.56,.46],[-.56,-.46],[0,.68],[0,-.68]].forEach(([lx,lz])=>bx(.08,.08,.26,qChairFrameM,lx,.1,2.02+lz,g));

  const qsl=pL(0xd97020,.38,5,0,2.8,.15);

  g.add(qsl);
  deskLights['qa']=qsl;

  g.position.set(11,-.02,-14);
  scene.add(g);

  plantAt(9,-19,1.);
  plantAt(17,-19,1.1);
}

function updateQAScr(){
  if(!qaCvs)return;
  const deskPos=new THREE.Vector3(11,2,-14);
  const s=new THREE.Sphere(deskPos,7);
  if(!cFrustum.intersectsSphere(s))return;

  const ctx=qaCvs.getContext('2d');
  const atDesk=_isAgentAtDesk('qa',2.8);

  if(!atDesk){
    ctx.fillStyle='#060402';
    ctx.fillRect(0,0,384,240);
    ctx.strokeStyle='#d9702022';
    ctx.lineWidth=1;
    ctx.strokeRect(2,2,380,236);
    ctx.fillStyle='#b87b49';
    ctx.font='bold 13px monospace';
    ctx.fillText('QA SCREEN',10,18);
    ctx.fillStyle='#46311c';
    ctx.font='10px monospace';
    ctx.fillText('esperando a Marta',10,40);
    ctx.fillStyle='#140d08';
    ctx.fillRect(10,58,140,8);
    ctx.fillStyle='#4b2d16';
    ctx.fillRect(10,58,34,8);
    qaTex.needsUpdate=true;
    return;
  }

  qaFr++;
  ctx.fillStyle='#060402';
  ctx.fillRect(0,0,384,240);
  ctx.fillStyle='#d97020';
  ctx.font='bold 13px monospace';
  ctx.fillText('BUG TRACKER  Dev Teams',10,17);
  ctx.strokeStyle='#2a1808';
  ctx.lineWidth=1;
  ctx.beginPath();
  ctx.moveTo(0,24);
  ctx.lineTo(384,24);
  ctx.stroke();

  const bugs=[
    {id:'BUG-41',t:'Checkout timeout >5000ms',c:'#cc3344',st:'OPEN'},
    {id:'BUG-42',t:'Refund HTTP 500',c:'#cc3344',st:'IN PROG'},
    {id:'BUG-38',t:'Cart race condition',c:'#d97020',st:'FIXED ✓'},
    {id:'BUG-35',t:'Profile image 404',c:'#c8c040',st:'FIXED ✓'}
  ];

  const bl=(qaFr/30)%2<1;
  bugs.forEach((b,i)=>{
    const y=30+i*50;
    const op=b.st==='OPEN'||b.st==='IN PROG';
    if(op&&!bl)return;
    ctx.fillStyle=b.c;
    ctx.fillRect(4,y,3,38);
    ctx.fillStyle=b.c;
    ctx.font='bold 10px monospace';
    ctx.fillText(b.id,12,y+14);
    ctx.fillStyle='#e8ede8';
    ctx.font='11px monospace';
    ctx.fillText(b.t,12,y+28);
    ctx.fillStyle=b.st==='OPEN'?'#cc3344':b.st==='IN PROG'?'#3a8ccc':'#0fa855';
    ctx.font='10px monospace';
    ctx.fillText(b.st,290,y+14);
  });

  ctx.fillStyle='#5a3a20';
  ctx.font='9px monospace';
  ctx.fillText('Coverage 78% · Tests 14/16 · Marta · Dev Teams QA',8,236);
  qaTex.needsUpdate=true;
}
function buildDevOpsZone(){
  zSign('DEVOPS LAB','#4caf50',17,6.5,-13);
  buildDesk({key:'devops',col:'#4caf50',w:4.5,x:26.2,z:-10.2,rotY:-Math.PI/2});


  for(let ri=0;ri<3;ri++){
    const rx=-13.5+ri*2.0;
    const rg=new THREE.Group();
    const rackShellM=new THREE.MeshLambertMaterial({color:0x101722});
    const rackFaceM=new THREE.MeshLambertMaterial({color:0x05080c});
    const rackTrimM=new THREE.MeshLambertMaterial({color:0x304255});
    const rackGlassM=new THREE.MeshPhongMaterial({color:0x8cb7d6,transparent:true,opacity:.14,shininess:110});

    bx(1.9,2.75,1.42,rackShellM,0,1.38,0,rg);
    bx(1.74,2.5,1.22,rackFaceM,0,1.38,0,rg);
    bx(.05,2.44,1.18,rackTrimM,-.82,1.38,0,rg);
    bx(.05,2.44,1.18,rackTrimM,.82,1.38,0,rg);
    bx(1.8,.08,1.42,new THREE.MeshLambertMaterial({color:0x1b2836}),0,2.73,0,rg);

    const front=new THREE.Mesh(new THREE.BoxGeometry(1.56,2.3,.04),rackGlassM);
    front.position.set(0,1.38,.72);
    rg.add(front);

    for(let ui=0;ui<6;ui++){
      const uy=.3+ui*.36;
      bx(1.46,.16,1.02,new THREE.MeshLambertMaterial({color:0x020406}),0,uy,0,rg);
      bx(.42,.012,.02,new THREE.MeshBasicMaterial({color:0x3a8ccc}),.12,uy,.52,rg);
      bx(.06,.06,.06,new THREE.MeshBasicMaterial({color:ui%2===0?0x0fa855:0xffb000}),-.58,uy,.54,rg);
      bx(.06,.06,.06,new THREE.MeshBasicMaterial({color:ui%3===0?0xcc3344:0x3a8ccc}),-.4,uy,.54,rg);
    }

    const ledBar=new THREE.Mesh(new THREE.BoxGeometry(.72,.03,.03),new THREE.MeshBasicMaterial({color:ri===1?0x0fa855:0x3a8ccc}));
    ledBar.position.set(0,2.46,.72);
    rg.add(ledBar);

    rg.position.set(rx,0,-16.5);
    scene.add(rg);
    pL(ri===1?0x0fa855:0x3a8ccc,.12,2.6,rx,2.8,-15.9);
  }

  const rHit=new THREE.Mesh(new THREE.BoxGeometry(6.2,5.5,1.6),new THREE.MeshBasicMaterial({transparent:true,opacity:0}));
  rHit.position.set(-14.5,2.5,-16.5);
  rHit.userData.clickAction='rack';
  scene.add(rHit);

  pL(0x0fa855,.22,8,-14.5,3.1,-15.4);
  plantAt(27,-18,.9);
}


function buildPMZone(){
  buildDesk({key:'pm',col:'#5b9bd5',w:5.,x:-26.9,z:7.8,rotY:Math.PI/2});
// textura tablero PM removida
  // tablero PM removido
  pL(0x5b9bd5,.25,5,-25.2,3,7.8);
  plantAt(-26,2.2,1.);
}


function buildUXZone(){zSign('UX DESIGN','#e91e8c',5.5,6.5,-1,Math.PI);buildDesk({key:'ux',col:'#e91e8c',w:5.,x:-26.6,z:-1.4,rotY:Math.PI/2});plantAt(-6,-19.5,.9);}
function buildDataZone(){zSign('DATA ANALYTICS','#00bcd4',5.5,6.5,2.5);buildDesk({key:'data',col:'#00bcd4',w:6.,x:9,z:-2});pL(0x00bcd4,.25,8,9,3,0);plantAt(15,-19.5,1.);}
let ckCvs=null,ckTex=null;
function initClock(sc){ckCvs=document.createElement('canvas');ckCvs.width=128;ckCvs.height=128;ckTex=new THREE.CanvasTexture(ckCvs);const m=new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.2),new THREE.MeshBasicMaterial({map:ckTex,transparent:true}));
m.position.set(22,5.2,-19.6);m.userData.clickAction='clock';sc.add(m);
// Hit zone mas grande
const cHit=new THREE.Mesh(new THREE.BoxGeometry(2.4,2.4,.1),new THREE.MeshBasicMaterial({transparent:true,opacity:0}));
cHit.position.set(22,5.2,-19.55);cHit.userData.clickAction='clock';sc.add(cHit);}
function updateClock(){
  if(!ckCvs)return;
  const now=new Date();
  const ctx=ckCvs.getContext('2d');
  const W=128,H=128;
  ctx.clearRect(0,0,W,H);

  // Fondo
  ctx.fillStyle='#080808';
  ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#0fa85544';
  ctx.lineWidth=1.5;
  ctx.strokeRect(2,2,W-4,H-4);

  // Fecha
  const dias=['DOM','LUN','MAR','MIÉ','JUE','VIE','S?B'];
  const meses=['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  ctx.fillStyle='#2e3a2e';
  ctx.font='bold 9px monospace';
  ctx.textAlign='center';
  ctx.fillText(dias[now.getDay()]+' '+now.getDate()+' '+meses[now.getMonth()],64,18);

  // Hora grande
  const hh=String(now.getHours()).padStart(2,'0');
  const mm=String(now.getMinutes()).padStart(2,'0');
  const ss=String(now.getSeconds()).padStart(2,'0');

  ctx.fillStyle='#0fa855';
  ctx.font='bold 38px monospace';
  ctx.textAlign='center';
  ctx.fillText(hh+':'+mm,64,68);

  // Separador parpadeante
  if(now.getSeconds()%2===0){
    ctx.fillStyle='#0fa855';
  }else{
    ctx.fillStyle='#0fa85544';
  }

  // Segundos pequeños
  ctx.fillStyle='#3a8ccc';
  ctx.font='bold 16px monospace';
  ctx.textAlign='center';
  ctx.fillText(ss,64,88);

  // Barra de progreso del minuto
  const pct=now.getSeconds()/60;
  ctx.fillStyle='#1a2a1a';
  ctx.fillRect(8,98,112,6);
  ctx.fillStyle='#0fa855';
  ctx.fillRect(8,98,Math.floor(112*pct),6);

  // Label
  ctx.fillStyle='#1e2e1e';
  ctx.font='7px monospace';
  ctx.textAlign='center';
  ctx.fillText('CARTAGENA CO',64,116);

  ckTex.needsUpdate=true;
}
function buildHubZone(){
  const g=new THREE.Group();
const meetTableMat=new THREE.MeshLambertMaterial({color:0x8B5E3C});
// Mesa REDONDA tipo Claw3D
const roundTop=new THREE.Mesh(
  new THREE.CylinderGeometry(3.2,3.2,.12,32),
  meetTableMat
);
roundTop.position.set(0,2,0);g.add(roundTop);
// Pata central
const stem=new THREE.Mesh(
  new THREE.CylinderGeometry(.15,.25,1.9,8),
  new THREE.MeshLambertMaterial({color:0x6B4226})
);
stem.position.set(0,1,0);g.add(stem);[[-4.3,-2.3],[4.3,-2.3],[-4.3,2.3],[4.3,2.3]].forEach(([lx,lz])=>bx(.14,2.,.14,new THREE.MeshLambertMaterial({color:0x0e0c06}),lx,1.,lz,g));
  // 6 sillas grandes alrededor de la mesa con espaldar simple y giro diagonal
  const roundChairSeatMat=new THREE.MeshLambertMaterial({color:0xc9eaff});
  const roundChairBackMat=new THREE.MeshLambertMaterial({color:0xc3e3fb});
  const roundChairLegMat=new THREE.MeshLambertMaterial({color:0x8ea5ba});
  const roundChairAccentMat=new THREE.MeshLambertMaterial({color:0x6f8192});
  const roundChairRadius=4.45;


for(let i=0;i<6;i++){
  const angle=i/6*Math.PI*2;
  const cx=Math.sin(angle)*roundChairRadius;
  const cz=Math.cos(angle)*roundChairRadius;
  const chair=new THREE.Group();

  const seat=new THREE.Mesh(new THREE.BoxGeometry(1.24,.16,1.08),roundChairSeatMat);
  seat.position.set(0,1.62,0);
  chair.add(seat);

  const seatPad=new THREE.Mesh(new THREE.BoxGeometry(1.04,.05,.88),new THREE.MeshBasicMaterial({color:0xe9f7ff,transparent:true,opacity:.28}));
  seatPad.position.set(0,1.74,0);
  chair.add(seatPad);

  const back=new THREE.Mesh(new THREE.BoxGeometry(1.02,.86,.11),roundChairBackMat);
  back.position.set(0,2.16,-.62);
  back.rotation.x=-.12;
  chair.add(back);

  const backBar=new THREE.Mesh(new THREE.BoxGeometry(.92,.08,.07),roundChairAccentMat);
  backBar.position.set(0,2.42,-.53);
  backBar.rotation.x=-.12;
  chair.add(backBar);

  [[.42,.34],[-.42,.34],[.42,-.34],[-.42,-.34]].forEach(([lx,lz])=>{
    const leg=new THREE.Mesh(new THREE.BoxGeometry(.1,1.42,.1),roundChairLegMat);
    leg.position.set(lx,.8,lz);
    chair.add(leg);
  });

  chair.position.set(cx,0,cz);
  chair.rotation.y=angle+Math.PI;
  g.add(chair);
}
  g.position.set(0,0,9);scene.add(g);
// Click hitbox mesa
  const tHit=new THREE.Mesh(new THREE.BoxGeometry(10,.3,5.5),new THREE.MeshBasicMaterial({transparent:true,opacity:0}));tHit.position.set(0,2.1,9);tHit.userData.clickAction='table';scene.add(tHit);pL(0xd0e8c0,.7,18,0,5.5,9);

  //  ZONA CAFÉ ELABORADA 
(function buildCoffeeZone(){
  const dark=new THREE.MeshLambertMaterial({color:0x0e0e0e});
  const wood=new THREE.MeshLambertMaterial({color:0x1a1208});
  const metal=new THREE.MeshLambertMaterial({color:0x141414});
  const white=new THREE.MeshLambertMaterial({color:0x1a1a1a});
  // Mueble base largo
  bx(5,2.2,.9,dark,-21.5,1.1,12.6);
  bx(5.2,.08,1.,wood,-21.5,2.22,12.6);
  // Nevera pequeña
  bx(.85,1.6,.7,metal,-19.2,.8,12.55);
  bx(.87,1.62,.72,new THREE.MeshLambertMaterial({color:0x0c0c0c}),-19.2,.8,12.55);
  bx(.6,.05,.5,dark,-19.2,1.6,12.55);
  const fridgeLed=new THREE.Mesh(new THREE.BoxGeometry(.02,.4,.02),new THREE.MeshBasicMaterial({color:0x00bcd4}));
  fridgeLed.position.set(-18.82,.8,12.28);scene.add(fridgeLed);
  pL(0x00bcd4,.2,2,-18.8,1.8,12.5);
  // Microondas
  bx(.9,.55,.6,metal,-22.5,2.5,12.6);
  bx(.88,.53,.58,dark,-22.5,2.5,12.6);
  bx(.02,.4,.4,new THREE.MeshBasicMaterial({color:0x020804,transparent:true,opacity:.7}),-22.07,2.5,12.6);
  pL(0xd97020,.15,1.5,-22.5,2.8,12.5);
  // Maquina de cafe mejorada (reemplaza la basica)
  const coffeeMat2=new THREE.MeshLambertMaterial({color:0x1a1a1a});
  const coffeeBase2=new THREE.Mesh(new THREE.BoxGeometry(.75,.95,.55),coffeeMat2);
  coffeeBase2.position.set(-21.2,2.7,12.55);scene.add(coffeeBase2);
  const coffeeTop2=new THREE.Mesh(new THREE.BoxGeometry(.7,.3,.5),new THREE.MeshLambertMaterial({color:0x111111}));
  coffeeTop2.position.set(-21.2,3.25,12.55);scene.add(coffeeTop2);
  // Pantallita display cafe
  const dispC=document.createElement('canvas');dispC.width=64;dispC.height=32;
  const dCtx=dispC.getContext('2d');dCtx.fillStyle='#020804';dCtx.fillRect(0,0,64,32);
  dCtx.fillStyle='#0fa855';dCtx.font='bold 10px monospace';dCtx.fillText('CAFÉ',8,14);
  dCtx.fillStyle='#c8a040';dCtx.font='8px monospace';dCtx.fillText('LISTO ☕',4,26);
  const dispTex=new THREE.CanvasTexture(dispC);
  const disp=new THREE.Mesh(new THREE.PlaneGeometry(.28,.14),new THREE.MeshBasicMaterial({map:dispTex}));
  disp.position.set(-21.2,3.08,12.84);scene.add(disp);
  // Estante con tazas
  bx(3.2,.06,.3,wood,-21.5,3.5,12.8);
  const cupColors=[0x0fa855,0x3a8ccc,0x9060cc,0xd97020,0xe91e8c,0x00bcd4];
  for(let i=0;i<6;i++){
    const cupMat=new THREE.MeshLambertMaterial({color:cupColors[i]});
    const cup=new THREE.Mesh(new THREE.CylinderGeometry(.07,.06,.12,8),cupMat);
    cup.position.set(-22.8+i*.54,3.64,12.78);scene.add(cup);
    const handle=new THREE.Mesh(new THREE.TorusGeometry(.045,.012,4,8,Math.PI),cupMat);
    handle.rotation.y=Math.PI/2;handle.position.set(-22.8+i*.54,3.64,12.72);scene.add(handle);
  }
  // Pizarrita de pedidos
  const orderC=document.createElement('canvas');orderC.width=128;orderC.height=96;
  const oCtx=orderC.getContext('2d');oCtx.fillStyle='#040c04';oCtx.fillRect(0,0,128,96);
  oCtx.strokeStyle='#0fa85533';oCtx.lineWidth=1;oCtx.strokeRect(2,2,124,92);
  oCtx.fillStyle='#0fa855';oCtx.font='bold 9px monospace';oCtx.fillText('PEDIDOS ☕',12,14);
  const orders=['Yared: doble','Ana: cortado','Sofia: latte','Luis: negro'];
  orders.forEach((o,i)=>{oCtx.fillStyle=i===0?'#c8a040':'#3a4a3a';oCtx.font='8px monospace';oCtx.fillText(o,8,28+i*15);});
  const orderTex=new THREE.CanvasTexture(orderC);
  const orderM=new THREE.Mesh(new THREE.PlaneGeometry(.7,.52),new THREE.MeshBasicMaterial({map:orderTex,transparent:true}));
  orderM.position.set(-20.5,3.2,12.88);scene.add(orderM);
  // Hit zone
  const coffeeHit2=new THREE.Mesh(new THREE.BoxGeometry(5.5,2,1.2),new THREE.MeshBasicMaterial({transparent:true,opacity:0}));
  coffeeHit2.position.set(-21.5,2,12.6);coffeeHit2.userData.clickAction='coffee';scene.add(coffeeHit2);
  pL(0x8b4513,.45,5,-21.5,3.5,12.6);
  pL(0x0fa855,.15,3,-19.2,2.5,12.5);
})();
  bx(.5,1.8,.5,new THREE.MeshLambertMaterial({color:0x151515}),26,.9,5);
  plantAt(-26,13,1.5);plantAt(26,13,1.4);plantAt(-22,-20,1.2);plantAt(22,-20,1.2);plantAt(-12,13,1.);plantAt(12,13,1.);
  // #2 Maquina de cafe
  const coffeeMat=new THREE.MeshLambertMaterial({color:0x1a1a1a});
  const coffeeBase=new THREE.Mesh(new THREE.BoxGeometry(.7,.9,.5),coffeeMat);coffeeBase.position.set(-22,1.15,12.5);scene.add(coffeeBase);
  const coffeeTop=new THREE.Mesh(new THREE.BoxGeometry(.65,.3,.45),new THREE.MeshLambertMaterial({color:0x111111}));coffeeTop.position.set(-22,1.75,12.5);scene.add(coffeeTop);
  const coffeeBtn=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,.08),new THREE.MeshBasicMaterial({color:0x0fa855}));coffeeBtn.position.set(-22.2,1.6,12.25);scene.add(coffeeBtn);
  const coffeeHit=new THREE.Mesh(new THREE.BoxGeometry(.8,1.2,.6),new THREE.MeshBasicMaterial({transparent:true,opacity:0}));coffeeHit.position.set(-22,1.3,12.5);coffeeHit.userData.clickAction='coffee';scene.add(coffeeHit);
  pL(0x8b4513,.3,3,-22,2.2,12.5);


//  ZONA DE DESCANSO 
  (function buildLounge(){
    const loungeX=22,loungeZ=10;
    const sofaM=new THREE.MeshLambertMaterial({color:0x1a1a2e});
    const cushM=new THREE.MeshLambertMaterial({color:0x22223a});
    const legM=new THREE.MeshLambertMaterial({color:0x0a0a14});
    // Alfombra
    const rugMesh=new THREE.Mesh(new THREE.PlaneGeometry(7,5),new THREE.MeshLambertMaterial({color:0x0e0e1a,transparent:true,opacity:.8}));
    rugMesh.rotation.x=-Math.PI/2;rugMesh.position.set(loungeX,.07,loungeZ-1);scene.add(rugMesh);
    const loungeSeatM=new THREE.MeshLambertMaterial({color:0x202033});
    const loungeBackM=new THREE.MeshLambertMaterial({color:0x19192a});

    bx(5.8,.52,1.75,loungeSeatM,loungeX,.96,loungeZ-2.15);
    bx(5.8,1.02,.24,loungeBackM,loungeX,1.22,loungeZ-2.95);
    bx(.24,.9,1.75,loungeBackM,loungeX-3.02,1.1,loungeZ-2.15);
    bx(.24,.9,1.75,loungeBackM,loungeX+3.02,1.1,loungeZ-2.15);
    [-1.9,0,1.9].forEach(ox=>bx(1.25,.28,1.26,cushM,loungeX+ox,1.28,loungeZ-2.12));

    // Dejamos un solo asiento lateral para abrir circulacion
    const accX=loungeX+3.95,accZ=loungeZ+.5;
    bx(1.45,.46,1.38,sofaM,accX,.74,accZ);
    bx(1.45,.82,.18,sofaM,accX,.94,accZ-.62);
    [[.54,.46],[.54,-.46],[-.54,.46],[-.54,-.46]].forEach(([lx,lz])=>bx(.08,.72,.08,legM,accX+lx,.35,accZ+lz));

    // Mesa de centro
    bx(2.,.06,1.,new THREE.MeshLambertMaterial({color:0x2a1808}),loungeX,1.38,loungeZ+.3);
    [[.7,.35],[.7,-.35],[-.7,.35],[-.7,-.35]].forEach(([lx,lz])=>bx(.06,.64,.06,legM,loungeX+lx,.74,loungeZ+.3+lz));
    window.LOUNGE_X=loungeX;window.LOUNGE_Z=loungeZ-2.2;

  
    // TV en pared con dashboard
    const tvC=document.createElement('canvas');tvC.width=512;tvC.height=288;
    const tvCtx=tvC.getContext('2d');
    tvCtx.fillStyle='#020408';tvCtx.fillRect(0,0,512,288);
    tvCtx.fillStyle='#0fa855';tvCtx.font='bold 16px monospace';tvCtx.fillText('Dev Teams · LIVE DASHBOARD',14,24);
    tvCtx.strokeStyle='#0fa85533';tvCtx.lineWidth=1;tvCtx.beginPath();tvCtx.moveTo(0,32);tvCtx.lineTo(512,32);tvCtx.stroke();
    [['CPU','68%','#0fa855',.68],['RAM','74%','#3a8ccc',.74],['NET','↑142kb/s','#9060cc',.55],['API','12ms','#c8a040',.9]].forEach(([l,v,c,p],i)=>{
      const y=50+i*54;tvCtx.fillStyle=c;tvCtx.font='bold 11px monospace';tvCtx.fillText(l,14,y+14);
      tvCtx.fillStyle=c;tvCtx.font='bold 22px monospace';tvCtx.fillText(v,14,y+38);
      tvCtx.fillStyle='rgba(255,255,255,.06)';tvCtx.fillRect(120,y+22,360,10);
      tvCtx.fillStyle=c;tvCtx.globalAlpha=.7;tvCtx.fillRect(120,y+22,360*p,10);tvCtx.globalAlpha=1;
    });
    const tvTex=new THREE.CanvasTexture(tvC);
    window._tvTex=tvTex;
    const tvFrame=new THREE.Mesh(new THREE.BoxGeometry(4.2,2.4,.08),new THREE.MeshLambertMaterial({color:0x0c0c0c}));
    tvFrame.position.set(loungeX,3.8,loungeZ+2.4);scene.add(tvFrame);
    const tvScreen=new THREE.Mesh(new THREE.PlaneGeometry(4.,2.2),new THREE.MeshBasicMaterial({map:tvTex}));
    tvScreen.position.set(loungeX,3.8,loungeZ+2.45);scene.add(tvScreen);
    // Actualizar TV cada 5s
    setInterval(()=>{
      if(!tvCtx)return;
      tvCtx.fillStyle='#020408';tvCtx.fillRect(0,32,512,288);
    const _msgs=Object.values(chatH||{}).reduce((a,b)=>a+(b?.length||0),0);
    const _tok=Math.floor((_msgs*42)+Math.random()*200);
    [['MSGS',_msgs+'','#0fa855'],['TOKENS',_tok+'','#3a8ccc'],['AGENTS',Object.keys(AG||{}).length+'','#9060cc'],['UPTIME',Math.floor((Date.now()-_bootTime)/60000)+'m','#c8a040']].forEach(([l,v,c],i)=>{
        const y=50+i*54;const p=parseFloat(v)/100||.5;
        tvCtx.fillStyle=c;tvCtx.font='bold 11px monospace';tvCtx.fillText(l,14,y+14);
        tvCtx.fillStyle=c;tvCtx.font='bold 22px monospace';tvCtx.fillText(v,14,y+38);
        tvCtx.fillStyle='rgba(255,255,255,.06)';tvCtx.fillRect(120,y+22,360,10);
        tvCtx.fillStyle=c;tvCtx.globalAlpha=.6;tvCtx.fillRect(120,y+22,Math.min(360,360*p),10);tvCtx.globalAlpha=1;
      });
      tvTex.needsUpdate=true;
    },5000);
    pL(0x9060cc,.3,8,loungeX,4.5,loungeZ+1);
})();

//  PING PONG 
(function buildPingPong(){
  const ppX=20,ppZ=4;
  // Mesa
  const tableMat=new THREE.MeshLambertMaterial({color:0x0a5a0a});
  const tableTop=new THREE.Mesh(new THREE.BoxGeometry(5,.08,2.8),tableMat);
  tableTop.position.set(ppX,1.5,ppZ);scene.add(tableTop);
  // Linea central
  const lineMat=new THREE.MeshBasicMaterial({color:0xffffff});
  const line=new THREE.Mesh(new THREE.BoxGeometry(.04,.1,2.8),lineMat);
  line.position.set(ppX,1.55,ppZ);scene.add(line);
  // Red
  const netMat=new THREE.MeshLambertMaterial({color:0xcccccc,transparent:true,opacity:.7});
  const net=new THREE.Mesh(new THREE.BoxGeometry(.05,.25,2.8),netMat);
  net.position.set(ppX,1.65,ppZ);scene.add(net);
  // Patas
  const legMat=new THREE.MeshLambertMaterial({color:0x4a4a4a});
  [[2.2,1.2],[2.2,-1.2],[-2.2,1.2],[-2.2,-1.2]].forEach(([lx,lz])=>{
    const leg=new THREE.Mesh(new THREE.BoxGeometry(.1,1.5,.1),legMat);
    leg.position.set(ppX+lx,.75,ppZ+lz);scene.add(leg);
  });
  // Palas
  const paddleMat1=new THREE.MeshLambertMaterial({color:0xcc2200});
  const paddleMat2=new THREE.MeshLambertMaterial({color:0x2244cc});
  const p1=new THREE.Mesh(new THREE.BoxGeometry(.06,.4,.35),paddleMat1);
  p1.position.set(ppX-2.6,1.8,ppZ);scene.add(p1);
  const p2=new THREE.Mesh(new THREE.BoxGeometry(.06,.4,.35),paddleMat2);
  p2.position.set(ppX+2.6,1.8,ppZ);scene.add(p2);
  // Pelota
  const ball=new THREE.Mesh(new THREE.SphereGeometry(.07,8,8),new THREE.MeshBasicMaterial({color:0xffffff}));
  ball.position.set(ppX,1.8,ppZ);scene.add(ball);
  window._ppBall=ball;window._ppT=0;
  window._ppX=ppX;window._ppZ=ppZ;
  pL(0xffffff,.4,8,ppX,4,ppZ);
  // Hit zone para activar juego
  const ppHit=new THREE.Mesh(new THREE.BoxGeometry(5.5,2,3.5),new THREE.MeshBasicMaterial({transparent:true,opacity:0}));
  ppHit.position.set(ppX,1.5,ppZ);ppHit.userData.clickAction='pingpong';scene.add(ppHit);
})();

/*  BIBLIOTECA  */
(function buildLibrary(){
  const LX=27.5,LZ=0;
  const shelfMat=new THREE.MeshLambertMaterial({color:0x3a2010});
  const bookCols=[0xcc3344,0x3a8ccc,0x0fa855,0x9060cc,0xd97020,0xc8a040,0xe91e8c,0x00bcd4,0x4caf50,0x5b9bd5];
  // 3 estantes
  [-4,0,4].forEach((ox,si)=>{
    bx(.3,4.2,3.6,shelfMat,LX+.15,2.1,LZ+ox);
    for(let shelf=0;shelf<4;shelf++){
      bx(.26,.06,3.6,new THREE.MeshLambertMaterial({color:0x2a1808}),LX+.02,.4+shelf*1.0,LZ+ox);
      for(let b=0;b<9;b++){
        const h=.55+Math.random()*.35,w=.22+Math.random()*.1;
        bx(.2,h,w,new THREE.MeshLambertMaterial({color:bookCols[(si*9+b)%bookCols.length]}),LX+.02,.4+shelf*1.0+h/2+.06,LZ+ox-1.5+b*.34+w/2);
      }
    }
    pL(parseInt(bookCols[si*3].toString(16).padStart(6,'0').replace(/^/,'0x')),.08,3,LX-.5,4.4,LZ+ox);
  });
  // Luz principal calida
  pL(0xffd080,.6,10,LX-2,5,LZ);
  zSign('📚 BIBLIOTECA','#c8a040',LX-1,6.5,LZ,Math.PI/2);
  // 2 sillas de lectura frente a la pared
  [[LX-3,LZ-3],[LX-3,LZ+3]].forEach(([cx,cz])=>{
    bx(1.4,.12,1.4,new THREE.MeshLambertMaterial({color:0x2a1a08}),cx,.82,cz);
    bx(1.4,1.1,.12,new THREE.MeshLambertMaterial({color:0x221408}),cx,1.37,cz+(cz>0?.62:-.62));
    [[.55,.55],[.55,-.55],[-.55,.55],[-.55,-.55]].forEach(([lx,lz])=>bx(.1,.8,.1,new THREE.MeshLambertMaterial({color:0x1a1008}),cx+lx,.4,cz+lz));
  });
  // Mesa de lectura
  bx(1.,.08,2.,new THREE.MeshLambertMaterial({color:0x4a2a10}),LX-3,1.6,LZ);
  [[.38,.7],[-.38,.7],[.38,-.7],[-.38,-.7]].forEach(([lx,lz])=>bx(.07,1.58,.07,new THREE.MeshLambertMaterial({color:0x2a1808}),LX-3+lx,.8,LZ+lz));
  pL(0xffd080,.35,3,LX-3,1.4,LZ);
  window.LIB_X=LX-3;window.LIB_Z=LZ;
})();

}
const PLANT_DATA=[[-18,-19,1.5],[-26.5,-19,1.2],[-16.5,-18.5,1.0],[4,-18.5,.9],[9,-19,1.0],[17,-19,1.1],[27,-18,.9],[-20,-19.5,1.0],[-6,-19.5,.9],[15,-19.5,1.0],[-26,13,1.5],[26,13,1.4],[-22,-20,1.2],[22,-20,1.2],[-12,13,1.0],[12,13,1.0]];

// #6 Plant watering system
let _plantHealth={};
const _savedWater=parseInt(localStorage.getItem('plantWater')||'0');
let _plantLastWater=(_savedWater&&(Date.now()-_savedWater)<3600000)?_savedWater:Date.now();
if(!_savedWater||(Date.now()-_savedWater)>=3600000)localStorage.setItem('plantWater',_plantLastWater);
PLANT_DATA.forEach((_,i)=>_plantHealth[i]=100);
// Aplicar color verde al iniciar
setTimeout(()=>{
  if(_leafIM&&_leaf2IM){
    _leafIM.material.color.setRGB(.09,.22,.09);
    _leaf2IM.material.color.setRGB(.11,.28,.11);
  }
},2000)
function checkPlantHealth(){
  const elapsed=(Date.now()-_plantLastWater)/1000/60;
  const health=Math.max(0,100-elapsed*.3); // mucho mas lento  333 min para morir
  PLANT_DATA.forEach((_,i)=>_plantHealth[i]=health);
  // Visual color change based on health
  if(_leafIM&&_leaf2IM){
    const r=health<30?0.4+((30-health)/30)*0.4:0.09;
    const g=health<30?0.22+(health/30)*0.13:0.22;
    const b=health<30?0.04:0.09;
    _leafIM.material.color.setRGB(r,g,b);
    _leaf2IM.material.color.setRGB(r*1.1,g*1.1,b);
  }
  if(health<30&&!_plantWarnShown){_plantWarnShown=true;showToast('🌿 Las plantas necesitan agua!','#cc3344');}
  if(health<=0&&!_plantDeadShown){_plantDeadShown=true;showToast('💀 Plantas muertas  riegalas ya!','#cc3344');applyPlantDeathEffect();}
}
let _plantDeadShown=false;
// When plants die, dim the zone lights near them
function applyPlantDeathEffect(){
  if(!_zoneLights.length)return;
  // Zone lights near plant positions dim to 20%
  _zoneLights.forEach((l,i)=>{
    const base=_zoneLightBaseInt[i];
    const health=Object.values(_plantHealth).reduce((a,b)=>a+b,0)/PLANT_DATA.length;
    const mul=dayMode?(0.3+health/100*0.7):(0.06+health/100*0.06);
    _zoneLightBaseInt[i]=base*mul;
  });
}
let _plantWarnShown=false;
function waterPlant(){
  _plantLastWater=Date.now();_plantWarnShown=false;_plantDeadShown=false;
  localStorage.setItem('plantWater',_plantLastWater);
  PLANT_DATA.forEach((_,i)=>_plantHealth[i]=100);
  // Animacion de agua  particulas azules
  const dropMat=new THREE.MeshBasicMaterial({color:0x4488ff,transparent:true,opacity:.7,depthWrite:false});
  const drops=[];
  PLANT_DATA.slice(0,6).forEach(([px,pz,s])=>{
    for(let d=0;d<5;d++){
      const drop=new THREE.Mesh(new THREE.SphereGeometry(.04,4,4),dropMat.clone());
      drop.position.set(px+(Math.random()-.5)*.4,s*1.8+Math.random()*.3,pz+(Math.random()-.5)*.4);
      scene.add(drop);
      drops.push({m:drop,vy:-.8-Math.random()*.4,t:0});
    }
  });
  // Animar gotas
  const _dropInt=setInterval(()=>{
    let alive=false;
    drops.forEach(d=>{
      d.t+=.016;d.m.position.y+=d.vy*.016;d.m.material.opacity=Math.max(0,.7-d.t*1.2);
      if(d.t<.8)alive=true;
    });
    if(!alive){
      clearInterval(_dropInt);
      drops.forEach(d=>{scene.remove(d.m);d.m.geometry.dispose();d.m.material.dispose();});
      // Restaurar color verde de plantas
      if(_leafIM&&_leaf2IM){
        _leafIM.material.color.setRGB(.09,.22,.09);
        _leaf2IM.material.color.setRGB(.11,.28,.11);
      }
    }
  },16);
  // Sonido de agua
  if(_sa3dOn&&_sACtx){
    try{
      const ctx=_getSA();const g=ctx.createGain();g.gain.value=.15;g.connect(ctx.destination);
      for(let i=0;i<8;i++){
        const o=ctx.createOscillator();o.type='sine';
        o.frequency.setValueAtTime(800+Math.random()*400,ctx.currentTime+i*.08);
        o.frequency.exponentialRampToValueAtTime(200,ctx.currentTime+i*.08+.12);
        const og=ctx.createGain();og.gain.setValueAtTime(.04,ctx.currentTime+i*.08);og.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+i*.08+.14);
        o.connect(og);og.connect(g);o.start(ctx.currentTime+i*.08);o.stop(ctx.currentTime+i*.08+.15);
      }
    }catch(e){}
  }
  let nearest=null,bd=Infinity;
  Object.entries(AG).forEach(([k,ag])=>{
    const d=(ag.group.position.x+26)**2+(ag.group.position.z-13)**2;
    if(d<bd){bd=d;nearest=k;}
  });
  if(nearest){AG[nearest].say('🌿 regando plantas 💧');AG[nearest].moveTo(-26,13);}
  showToast('🌿 Plantas regadas ✓  ahora estan felices','#163818');
}

let _leafIM=null,_leaf2IM=null;
function buildAllPlants(){
  const N=PLANT_DATA.length;const dummy=new THREE.Object3D();
  const potIM  =new THREE.InstancedMesh(poolGeo('c',.35,.26,.52,8), M.pot, N);
  const rimIM  =new THREE.InstancedMesh(poolGeo('c',.32,.32,.04,8), new THREE.MeshLambertMaterial({color:0x141008}), N);
  _leafIM =new THREE.InstancedMesh(new THREE.SphereGeometry(.48,8,7),  M.leaf.clone(),  N);
  _leaf2IM=new THREE.InstancedMesh(new THREE.SphereGeometry(.28,7,6),  M.leaf2.clone(), N);
  const leafIM=_leafIM,leaf2IM=_leaf2IM;
  potIM.castShadow=leafIM.castShadow=leaf2IM.castShadow=true;
  PLANT_DATA.forEach(([px,pz,s],i)=>{
    dummy.position.set(px,.26*s,pz);dummy.scale.set(s,s,s);dummy.updateMatrix();potIM.setMatrixAt(i,dummy.matrix);
    dummy.position.set(px,.53*s,pz);dummy.scale.set(s,s,s);dummy.updateMatrix();rimIM.setMatrixAt(i,dummy.matrix);
    dummy.position.set(px,s,pz);dummy.scale.set(s,s*1.25,s);dummy.updateMatrix();leafIM.setMatrixAt(i,dummy.matrix);
    dummy.position.set(px,1.54*s,pz);dummy.scale.set(s,s,s);dummy.updateMatrix();leaf2IM.setMatrixAt(i,dummy.matrix);
  });
  potIM.instanceMatrix.needsUpdate=rimIM.instanceMatrix.needsUpdate=leafIM.instanceMatrix.needsUpdate=leaf2IM.instanceMatrix.needsUpdate=true;
  scene.add(potIM);scene.add(rimIM);scene.add(leafIM);scene.add(leaf2IM);
  const pHit=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshBasicMaterial({transparent:true,opacity:0}));pHit.position.set(-26,1,13);pHit.userData.clickAction='plant';scene.add(pHit);
}

//  DECORACIÓN ESTACIONAL 
(function buildSeasonal(){
  const month=new Date().getMonth();
  // Noviembre-Enero: Navidad
  if(month===11||month===0||month===10){
    // Luces de navidad en el techo
    const xmasColors=[0xff0000,0x00ff00,0xffff00,0x0000ff,0xff8800];
    for(let i=0;i<24;i++){
      const x=-26+Math.random()*52,z=-18+Math.random()*36;
      const col=xmasColors[Math.floor(Math.random()*xmasColors.length)];
      const light=new THREE.Mesh(new THREE.SphereGeometry(.04,4,4),new THREE.MeshBasicMaterial({color:col}));
      light.position.set(x,6.6,z);scene.add(light);
      // Parpadeo individual
      setInterval(()=>{light.visible=Math.random()>.3;},300+Math.random()*400);
    }
    showToast('🎄 ¡Feliz Navidad! Dev Teams','#0fa855');
  }
  // Octubre: Halloween
  else if(month===9){
    const spookColors=[0xff6600,0x440066];
    for(let i=0;i<12;i++){
      const x=-24+Math.random()*48,z=-16+Math.random()*30;
      const col=spookColors[Math.floor(Math.random()*2)];
      pL(col,.2,4,x,1.5,z);
    }
    // Telarañas en esquinas (lineas)
    [[27,6,-19],[27,6,17],[-27,6,-19],[-27,6,17]].forEach(([wx,wy,wz])=>{
      for(let j=0;j<6;j++){
        const pts=[new THREE.Vector3(wx,wy,wz),new THREE.Vector3(wx+(Math.random()-.5)*2,wy-j*.3,wz+(Math.random()-.5)*2)];
        const geo=new THREE.BufferGeometry().setFromPoints(pts);
        const web=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0xcccccc,transparent:true,opacity:.25}));
        scene.add(web);
      }
    });
    showToast('🎃 ¡Halloween en Dev Teams!','#ff6600');
  }
  // Febrero: San Valentin
  else if(month===1){
    for(let i=0;i<8;i++){
      const heart=new THREE.Mesh(new THREE.SphereGeometry(.08,6,6),new THREE.MeshBasicMaterial({color:0xff2244}));
      heart.position.set(-20+Math.random()*40,5.5+Math.random()*.5,-10+Math.random()*20);
      scene.add(heart);
      let _ht=Math.random()*Math.PI*2
      setInterval(()=>{_ht+=.02;heart.position.y=5.5+Math.sin(_ht)*.15;},16);
    }
    showToast('San Valentin Dev Teams','#ff2244');
  }
})();

function plantAt(){}  // stub  all plants via InstancedMesh above
// Shadow falls AWAY from sun → positive x, negative z from agent
const SUN_NX = 8/22;   // for every unit of height, shadow shifts +x by this
const SUN_NZ = -12/22; // and -z by this

/*  AGENT CLASS  */
class Agent3D{
  constructor(key){
    const cfg=ACFG[key];this.key=key;this.path=[];
    const S=1.35;
this.hx=cfg.homeX;this.hz=cfg.homeZ;
this.homePos = { x: cfg.homeX, z: cfg.homeZ }; // <--- CLAW3D HOME MEMORY
this.isCollaborating = false;
    
    // --- HUD HOLOGRÁFICO (CLAW3D PHASE 1) ---
    this.hudCanvas = document.createElement('canvas');
    this.hudCanvas.width = 512; this.hudCanvas.height = 128;
    this.hudCtx = this.hudCanvas.getContext('2d');
    this.hudTex = new THREE.CanvasTexture(this.hudCanvas);
    this.hudMat = new THREE.SpriteMaterial({ map: this.hudTex, transparent: true, opacity: 0 });
    this.hudSprite = new THREE.Sprite(this.hudMat);
    this.hudSprite.position.set(0, 3.2, 0); 
    this.hudSprite.scale.set(3.5, 0.85, 1);
    this.hudT = 0; // Temporizador de visibilidad
    
    this.state='idle';this.speech='';this.sa=0;this.time=Math.random()*6.28;this.walkPhase=0;
    this.idleTimer=50+Math.random()*180;this.idleIdx=0;this.stuckT=0;this.lastPos={x:cfg.homeX,z:cfg.homeZ};
    this.stateTime=0;this.lastMsg='';
    this._cachedHomePath=null; // #7 pre-fetched return path
    this._lockPos=null;
    this._lockState='waiting';
    this._activityLock=null;
    this._meetingSeated=false;
    this._moveReq=0;
    this.group=new THREE.Group();this._build(cfg);
    const wearMat=(color,opts={})=>_matStd(color,{roughness:.82,metalness:.03,...opts});
    const addWear=(w,h,d,x,y,z,color,opts={})=>{
      const mesh=new THREE.Mesh(poolGeo('b',w*S,h*S,d*S),wearMat(color,opts));
      mesh.position.set(x*S,y*S,z*S);
      mesh.castShadow=true;
      this.group.add(mesh);
      return mesh;
    };
    const addPlate=(w,h,d,x,y,z,color,opts={})=>addWear(w,h,d,x,y,z,color,{roughness:.74,...opts});
// Accesorios unicos por agente
    if(key==='ceo'){
      this.torso.scale.x=.9;
      this.head.scale.x=.96;

      const blazer=0x20181a, shirt=0xf0dfc8;
      addWear(.16,.72,.08,-.18,1.5,.19,blazer);
      addWear(.16,.72,.08,.18,1.5,.19,blazer);
      const ceoLapL=addWear(.11,.24,.05,-.1,1.76,.24,shirt);
      ceoLapL.rotation.z=.28;
      const ceoLapR=addWear(.11,.24,.05,.1,1.76,.24,shirt);
      ceoLapR.rotation.z=-.28;
      addWear(.08,.34,.04,0,1.58,.25,0xc8a040,{metalness:.12});
      addWear(.28,.08,.08,0,1.03,.16,blazer);

      const hairMat=new THREE.MeshLambertMaterial({color:0x120c08});

      const crown=new THREE.Mesh(new THREE.BoxGeometry(.58*S,.16*S,.56*S),hairMat);
      crown.position.set(0,2.46*S,-.02*S);this.group.add(crown);

      const bun=new THREE.Mesh(new THREE.BoxGeometry(.28*S,.2*S,.24*S),hairMat);
      bun.position.set(0,2.6*S,-.2*S);this.group.add(bun);

      const backHair=new THREE.Mesh(new THREE.BoxGeometry(.5*S,.62*S,.18*S),hairMat);
      backHair.position.set(0,2.0*S,-.2*S);this.group.add(backHair);

      const sideL=new THREE.Mesh(new THREE.BoxGeometry(.1*S,.38*S,.16*S),hairMat);
      sideL.position.set(-.27*S,2.08*S,.04*S);this.group.add(sideL);
      const sideR=sideL.clone();sideR.position.set(.27*S,2.08*S,.04*S);this.group.add(sideR);

      const goldMat=new THREE.MeshBasicMaterial({color:0xc8a040});
      const collar=new THREE.Mesh(new THREE.BoxGeometry(.5*S,.08*S,.18*S),goldMat);
      collar.position.set(0,1.96*S,.22*S);this.group.add(collar);

      const brooch=new THREE.Mesh(new THREE.BoxGeometry(.1*S,.1*S,.05*S),goldMat);
      brooch.position.set(0,1.78*S,.24*S);this.group.add(brooch);

      const eL=new THREE.Mesh(new THREE.BoxGeometry(.04*S,.12*S,.04*S),goldMat);
      eL.position.set(-.31*S,2.04*S,.05*S);this.group.add(eL);
      const eR=eL.clone();eR.position.set(.31*S,2.04*S,.05*S);this.group.add(eR);
    }
    if(key==='pm'){
      this.torso.scale.x=.91;
      this.head.scale.x=.97;

      const blazer=0x193047, shirt=0xe9eef4;
      addWear(.16,.72,.08,-.18,1.5,.19,blazer);
      addWear(.16,.72,.08,.18,1.5,.19,blazer);
      const pmLapL=addWear(.11,.22,.05,-.1,1.76,.24,shirt);
      pmLapL.rotation.z=.26;
      const pmLapR=addWear(.11,.22,.05,.1,1.76,.24,shirt);
      pmLapR.rotation.z=-.26;
      addWear(.08,.28,.03,0,1.62,.25,0x5b9bd5);
      addWear(.26,.07,.08,0,1.08,.16,blazer);

      const hMat=new THREE.MeshLambertMaterial({color:0x180e06});

      const crown=new THREE.Mesh(new THREE.BoxGeometry(.58*S,.15*S,.56*S),hMat);
      crown.position.set(0,2.46*S,-.02*S);this.group.add(crown);

      const fringe=new THREE.Mesh(new THREE.BoxGeometry(.48*S,.08*S,.12*S),hMat);
      fringe.position.set(0,2.37*S,.24*S);this.group.add(fringe);

      const backHair=new THREE.Mesh(new THREE.BoxGeometry(.5*S,.68*S,.18*S),hMat);
      backHair.position.set(0,1.92*S,-.2*S);this.group.add(backHair);

      const hL=new THREE.Mesh(new THREE.BoxGeometry(.11*S,.5*S,.18*S),hMat);
      hL.position.set(-.3*S,2.02*S,.05*S);this.group.add(hL);
      const hR=hL.clone();hR.position.set(.3*S,2.02*S,.05*S);this.group.add(hR);

      const earMat=new THREE.MeshBasicMaterial({color:0x5b9bd5});
      const eL=new THREE.Mesh(new THREE.BoxGeometry(.05*S,.12*S,.05*S),earMat);
      eL.position.set(-.31*S,2.08*S,.06*S);this.group.add(eL);
      const eR=eL.clone();eR.position.set(.31*S,2.08*S,.06*S);this.group.add(eR);

      const collar=new THREE.Mesh(new THREE.BoxGeometry(.42*S,.1*S,.08*S),new THREE.MeshBasicMaterial({color:0xd8e2ee}));
      collar.position.set(0,1.93*S,.23*S);this.group.add(collar);
    }
    if(key==='devbe'){
      const jacket=0x182230;
      addWear(.18,.72,.08,-.19,1.5,.18,jacket);
      addWear(.18,.72,.08,.19,1.5,.18,jacket);
      addWear(.22,.22,.04,0,1.79,.23,0x101820);
      addPlate(.08,.08,.04,.21,1.64,.24,0x3a8ccc,{metalness:.08});
      const capMat=new THREE.MeshLambertMaterial({color:0x0a0a0a});
      const capTop=new THREE.Mesh(new THREE.BoxGeometry(.62*S,.18*S,.58*S),capMat);capTop.position.set(0,2.54*S,0);this.group.add(capTop);
      const capBrim=new THREE.Mesh(new THREE.BoxGeometry(.62*S,.05*S,.28*S),capMat);capBrim.position.set(0,2.44*S,.38*S);this.group.add(capBrim);
      const beardMat=new THREE.MeshLambertMaterial({color:0x0c0c0c});
      const beard=new THREE.Mesh(new THREE.BoxGeometry(.42*S,.16*S,.18*S),beardMat);beard.position.set(0,2.06*S,.26*S);this.group.add(beard);
      const mustache=new THREE.Mesh(new THREE.BoxGeometry(.3*S,.07*S,.14*S),beardMat);mustache.position.set(0,2.16*S,.27*S);this.group.add(mustache);
    }
    if(key==='devfe'){
      const hoodie=0x311b46;
      addWear(.18,.68,.08,-.18,1.48,.19,hoodie);
      addWear(.18,.68,.08,.18,1.48,.19,hoodie);
      addWear(.26,.12,.08,0,1.22,.18,hoodie);
      addWear(.12,.12,.08,-.19,1.9,.08,hoodie);
      addWear(.12,.12,.08,.19,1.9,.08,hoodie);
      const hpMat=new THREE.MeshLambertMaterial({color:0x9060cc});
      const hpBar=new THREE.Mesh(new THREE.BoxGeometry(.7*S,.07*S,.12*S),hpMat);hpBar.position.set(0,2.56*S,0);this.group.add(hpBar);
      const hpL=new THREE.Mesh(new THREE.BoxGeometry(.1*S,.18*S,.18*S),hpMat);hpL.position.set(-.34*S,2.44*S,0);this.group.add(hpL);
      const hpR=hpL.clone();hpR.position.set(.34*S,2.44*S,0);this.group.add(hpR);
      const fMat=new THREE.MeshLambertMaterial({color:0x060406});
      const fringe=new THREE.Mesh(new THREE.BoxGeometry(.56*S,.1*S,.14*S),fMat);fringe.position.set(0,2.44*S,.26*S);this.group.add(fringe);
    }
    if(key==='qa'){
      this.torso.scale.x=.9;
      this.head.scale.x=.97;

      const blazer=0x4a2416, shirt=0xf4e7d6;
      addWear(.16,.72,.08,-.18,1.5,.19,blazer);
      addWear(.16,.72,.08,.18,1.5,.19,blazer);
      const qaLapL=addWear(.11,.22,.05,-.1,1.76,.24,shirt);
      qaLapL.rotation.z=.26;
      const qaLapR=addWear(.11,.22,.05,.1,1.76,.24,shirt);
      qaLapR.rotation.z=-.26;
      addPlate(.1,.08,.04,.2,1.56,.24,0xd97020,{metalness:.12});

      const glassMat=new THREE.MeshBasicMaterial({color:0xd97020});
      const gBar=new THREE.Mesh(new THREE.BoxGeometry(.5*S,.04*S,.06*S),glassMat);
      gBar.position.set(0,2.22*S,.27*S);this.group.add(gBar);

      const gL=new THREE.Mesh(new THREE.BoxGeometry(.16*S,.1*S,.06*S),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.4}));
      gL.position.set(-.16*S,2.22*S,.27*S);this.group.add(gL);
      const gR=gL.clone();gR.position.set(.16*S,2.22*S,.27*S);this.group.add(gR);

      const hairMat=new THREE.MeshLambertMaterial({color:0x3a1008});

      const crown=new THREE.Mesh(new THREE.BoxGeometry(.54*S,.14*S,.52*S),hairMat);
      crown.position.set(0,2.46*S,-.01*S);this.group.add(crown);

      const bun=new THREE.Mesh(new THREE.BoxGeometry(.24*S,.2*S,.22*S),hairMat);
      bun.position.set(0,2.62*S,-.08*S);this.group.add(bun);

      const backHair=new THREE.Mesh(new THREE.BoxGeometry(.42*S,.42*S,.16*S),hairMat);
      backHair.position.set(0,2.0*S,-.2*S);this.group.add(backHair);

      const bangL=new THREE.Mesh(new THREE.BoxGeometry(.08*S,.22*S,.12*S),hairMat);
      bangL.position.set(-.22*S,2.18*S,.16*S);this.group.add(bangL);
      const bangR=bangL.clone();bangR.position.set(.22*S,2.18*S,.16*S);this.group.add(bangR);

      const clip=new THREE.Mesh(new THREE.BoxGeometry(.22*S,.05*S,.05*S),glassMat);
      clip.position.set(0,2.48*S,.02*S);this.group.add(clip);
    }
    if(key==='devops'){
      addWear(.1,.46,.08,-.22,1.52,.22,0x1a341d);
      addWear(.1,.46,.08,.22,1.52,.22,0x1a341d);
      addWear(.06,.42,.03,0,1.52,.24,0xa7cfa2,{metalness:.14});
      addWear(.1,.1,.04,-.23,1.72,.23,0x4caf50);
      addWear(.1,.1,.04,.23,1.72,.23,0x4caf50);
      const vestMat=new THREE.MeshBasicMaterial({color:0x4caf50,transparent:true,opacity:.6});
      const v1=new THREE.Mesh(new THREE.BoxGeometry(.12*S,.5*S,.47*S),vestMat);v1.position.set(-.22*S,1.5*S,0);this.group.add(v1);
      const v2=v1.clone();v2.position.set(.22*S,1.5*S,0);this.group.add(v2);
      const beanieMat=new THREE.MeshLambertMaterial({color:0x0a1a0a});
      const beanie=new THREE.Mesh(new THREE.BoxGeometry(.6*S,.2*S,.56*S),beanieMat);beanie.position.set(0,2.5*S,0);this.group.add(beanie);
    }
    if(key==='ux'){
      this.torso.scale.x=.9;
      this.head.scale.x=.97;

      const blazer=0x2a1322, shirt=0xf4d7e8;
      addWear(.16,.74,.08,-.18,1.5,.19,blazer);
      addWear(.16,.74,.08,.18,1.5,.19,blazer);
      const uxLapL=addWear(.11,.22,.05,-.1,1.76,.24,shirt);
      uxLapL.rotation.z=.24;
      const uxLapR=addWear(.11,.22,.05,.1,1.76,.24,shirt);
      uxLapR.rotation.z=-.24;
      addWear(.08,.26,.03,0,1.62,.25,0xe91e8c);

      const hairMat=new THREE.MeshLambertMaterial({color:0x0c0608});

      const crown=new THREE.Mesh(new THREE.BoxGeometry(.58*S,.14*S,.54*S),hairMat);
      crown.position.set(0,2.46*S,-.01*S);this.group.add(crown);

      const hairLong=new THREE.Mesh(new THREE.BoxGeometry(.56*S,.88*S,.18*S),hairMat);
      hairLong.position.set(0,1.84*S,-.24*S);this.group.add(hairLong);

      const sideL=new THREE.Mesh(new THREE.BoxGeometry(.11*S,.56*S,.16*S),hairMat);
      sideL.position.set(-.28*S,1.98*S,.03*S);this.group.add(sideL);
      const sideR=sideL.clone();sideR.position.set(.28*S,1.98*S,.03*S);this.group.add(sideR);

      const fringe=new THREE.Mesh(new THREE.BoxGeometry(.46*S,.08*S,.12*S),hairMat);
      fringe.position.set(0,2.38*S,.24*S);this.group.add(fringe);

      const diadema=new THREE.Mesh(new THREE.BoxGeometry(.64*S,.08*S,.56*S),new THREE.MeshBasicMaterial({color:0xe91e8c}));
      diadema.position.set(0,2.48*S,0);this.group.add(diadema);

      const earMat=new THREE.MeshBasicMaterial({color:0xe91e8c});
      const eL=new THREE.Mesh(new THREE.BoxGeometry(.05*S,.16*S,.05*S),earMat);
      eL.position.set(-.3*S,2.06*S,.04*S);this.group.add(eL);
      const eR=eL.clone();eR.position.set(.3*S,2.06*S,.04*S);this.group.add(eR);

      const waist=new THREE.Mesh(new THREE.BoxGeometry(.44*S,.07*S,.46*S),new THREE.MeshBasicMaterial({color:0xe91e8c,transparent:true,opacity:.45}));
      waist.position.set(0,1.18*S,0);this.group.add(waist);
    }
    if(key==='data'){
      const cardigan=0x14323a, shirt=0xd7eef0;
      addWear(.16,.7,.08,-.18,1.5,.19,cardigan);
      addWear(.16,.7,.08,.18,1.5,.19,cardigan);
      const dtLapL=addWear(.11,.22,.05,-.1,1.76,.24,shirt);
      dtLapL.rotation.z=.22;
      const dtLapR=addWear(.11,.22,.05,.1,1.76,.24,shirt);
      dtLapR.rotation.z=-.22;
      addWear(.07,.3,.03,0,1.6,.25,0x00bcd4,{metalness:.08});
      const glassMat=new THREE.MeshBasicMaterial({color:0x00bcd4});
      const gBar=new THREE.Mesh(new THREE.BoxGeometry(.5*S,.04*S,.06*S),glassMat);gBar.position.set(0,2.22*S,.27*S);this.group.add(gBar);
      const gL=new THREE.Mesh(new THREE.BoxGeometry(.17*S,.11*S,.06*S),new THREE.MeshBasicMaterial({color:0x020810,transparent:true,opacity:.5}));gL.position.set(-.16*S,2.22*S,.27*S);this.group.add(gL);
      const gR=gL.clone();gR.position.set(.16*S,2.22*S,.27*S);this.group.add(gR);
      const wMat=new THREE.MeshLambertMaterial({color:0x100c06});
      const wTop=new THREE.Mesh(new THREE.BoxGeometry(.58*S,.12*S,.5*S),wMat);wTop.position.set(0,2.47*S,-.04*S);this.group.add(wTop);
    }
    this.group.position.set(cfg.homeX,0,cfg.homeZ);scene.add(this.group);
    this.bubbleEl=document.createElement('div');this.bubbleEl.className='speech3d';this.bubbleEl.style.display='none';
    document.getElementById('speechLayer').appendChild(this.bubbleEl);
    this.labelEl=document.createElement('div');this.labelEl.className='agent-label';
    this.labelEl.innerHTML=`<span style="font-size:15px;font-weight:800;letter-spacing:.02em">${cfg.name.split(' ')[0]}</span><span style="width:7px;height:7px;border-radius:50%;background:${cfg.col};flex-shrink:0;margin-left:2px"></span>`;
this.labelEl.style.cssText+=`background:#000000ee;border:1px solid #ffffff18;color:#ffffff;gap:4px;padding:4px 10px;font-family:var(--mono);`;
    this.labelEl.addEventListener('click',e=>{e.stopPropagation();const wr=document.getElementById('canvasWrap').getBoundingClientRect(),lr=this.labelEl.getBoundingClientRect();openProfile(this.key,lr.left-wr.left,lr.top-wr.top);});
    document.getElementById('speechLayer').appendChild(this.labelEl);
  }

  _build(cfg){
    const{bodyC,pantsC,skinC,hairC}=cfg;
    const bm=_matStd(bodyC,{roughness:.76,metalness:.04});
    const pm=_matStd(pantsC,{roughness:.84,metalness:.05});
    const sm=_matStd(skinC,{roughness:.96,metalness:0});
    const hm=_matStd(hairC,{roughness:.88,metalness:.02});
    const sh=_matStd(0x0c0c0c,{roughness:.8,metalness:.12});

    //  #8 DYNAMIC SHADOW 

    this.shadowGroup=new THREE.Group();
    this.shadowMesh=new THREE.Mesh(
      new THREE.PlaneGeometry(1,1),
      new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.32,depthWrite:false})
    );
    this.shadowMesh.rotation.x=-Math.PI/2;
    this.shadowMesh.position.y=.018;
    this.shadowGroup.add(this.shadowMesh);
    scene.add(this.shadowGroup); // added directly to scene, not agent group

// Agent body parts  35% mas grandes
    const S=1.35;
    this.lLeg=new THREE.Mesh(poolGeo('b',.27*S,.8*S,.3*S),pm);this.lLeg.position.set(-.19*S,.66*S,0);this.group.add(this.lLeg);
    this.rLeg=new THREE.Mesh(poolGeo('b',.27*S,.8*S,.3*S),pm);this.rLeg.position.set(.19*S,.66*S,0);this.group.add(this.rLeg);
    this.lShoe=new THREE.Mesh(poolGeo('b',.29*S,.13*S,.37*S),sh);this.lShoe.position.set(-.19*S,.22*S,.05*S);this.group.add(this.lShoe);
    this.rShoe=new THREE.Mesh(poolGeo('b',.29*S,.13*S,.37*S),sh);this.rShoe.position.set(.19*S,.22*S,.05*S);this.group.add(this.rShoe);
    this.neck=new THREE.Mesh(poolGeo('b',.16*S,.12*S,.16*S),sm);this.neck.position.set(0,1.93*S,.01*S);this.group.add(this.neck);
    this.torso=new THREE.Mesh(poolGeo('b',.72*S,.94*S,.45*S),bm);this.torso.position.y=1.49*S;this.torso.castShadow=true;this.group.add(this.torso);
    this.shoulders=new THREE.Mesh(poolGeo('b',.84*S,.14*S,.34*S),bm);this.shoulders.position.set(0,1.83*S,0);this.group.add(this.shoulders);
    this.lArm=new THREE.Mesh(poolGeo('b',.23*S,.72*S,.29*S),bm);this.lArm.position.set(-.49*S,1.43*S,0);this.group.add(this.lArm);
    this.rArm=new THREE.Mesh(poolGeo('b',.23*S,.72*S,.29*S),bm);this.rArm.position.set(.49*S,1.43*S,0);this.group.add(this.rArm);
    this.lHand=new THREE.Mesh(poolGeo('b',.12*S,.12*S,.12*S),sm);this.lHand.position.set(-.49*S,1.02*S,.02*S);this.group.add(this.lHand);
    this.rHand=new THREE.Mesh(poolGeo('b',.12*S,.12*S,.12*S),sm);this.rHand.position.set(.49*S,1.02*S,.02*S);this.group.add(this.rHand);
    this.head=new THREE.Mesh(poolGeo('b',.55*S,.52*S,.52*S),sm);this.head.position.y=2.19*S;this.head.castShadow=true;this.group.add(this.head);
    const hair=new THREE.Mesh(poolGeo('b',.57*S,.2*S,.54*S),hm);hair.position.y=2.46*S;this.group.add(hair);
    const eyeM=new THREE.MeshBasicMaterial({color:0x050505});
    this.eyeL=new THREE.Mesh(new THREE.BoxGeometry(.1*S,.1*S,.04*S),eyeM);this.eyeL.position.set(-.13*S,2.2*S,.27*S);this.group.add(this.eyeL);
    this.eyeR=new THREE.Mesh(new THREE.BoxGeometry(.1*S,.1*S,.04*S),eyeM);this.eyeR.position.set(.13*S,2.2*S,.27*S);this.group.add(this.eyeR);
    const browM=new THREE.MeshBasicMaterial({color:0x231a16});
    this.browL=new THREE.Mesh(new THREE.BoxGeometry(.12*S,.03*S,.03*S),browM);this.browL.position.set(-.13*S,2.31*S,.27*S);this.group.add(this.browL);
    this.browR=new THREE.Mesh(new THREE.BoxGeometry(.12*S,.03*S,.03*S),browM);this.browR.position.set(.13*S,2.31*S,.27*S);this.group.add(this.browR);
    this.nose=new THREE.Mesh(poolGeo('b',.05*S,.08*S,.04*S),sm);this.nose.position.set(0,2.13*S,.29*S);this.group.add(this.nose);
    this.mouth=new THREE.Mesh(new THREE.BoxGeometry(.12*S,.02*S,.02*S),new THREE.MeshBasicMaterial({color:0x6b4437}));this.mouth.position.set(0,2.01*S,.29*S);this.group.add(this.mouth);
    this._blinkT=Math.random()*4;
    this.tag=new THREE.Mesh(poolGeo('b',.18*S,.18*S,.06*S),new THREE.MeshBasicMaterial({color:parseInt(cfg.col.replace('#','0x'))}));this.tag.position.set(.35*S,2.72*S,0);this.group.add(this.tag);
    this.agentLight=new THREE.PointLight(parseInt(cfg.col.replace('#','0x')),0,5);this.agentLight.position.y=1.7;this.group.add(this.agentLight);
    this.thinkRing=new THREE.Mesh(new THREE.TorusGeometry(.4,.02,8,24),new THREE.MeshBasicMaterial({color:parseInt(cfg.col.replace('#','0x')),transparent:true,opacity:0}));this.thinkRing.position.y=2.9;this.thinkRing.rotation.x=Math.PI/2;this.group.add(this.thinkRing);
    this.halo=new THREE.Mesh(new THREE.TorusGeometry(.7,.03,6,32),new THREE.MeshBasicMaterial({color:parseInt(cfg.col.replace('#','0x')),transparent:true,opacity:0}));this.halo.rotation.x=Math.PI/2;this.halo.position.y=.05;this.group.add(this.halo);
    // Ring de audio espacial (Holograma de voz)
    this.audioRing=new THREE.Mesh(
      new THREE.TorusGeometry(.65,.04,6,32),
      new THREE.MeshBasicMaterial({color:parseInt(cfg.col.replace('#','0x')),transparent:true,opacity:0,blending:THREE.AdditiveBlending})
    );
    this.audioRing.rotation.x=Math.PI/2;
    this.audioRing.position.y=.08;
    this.group.add(this.audioRing);
    // Ring de productividad
    this._prodRing=new THREE.Mesh(
      new THREE.TorusGeometry(.55,.03,6,32,0),
      new THREE.MeshBasicMaterial({color:parseInt(cfg.col.replace('#','0x')),transparent:true,opacity:.5})
    );
    this._prodRing.rotation.x=Math.PI/2;
    this._prodRing.position.y=.04;
    this._prodRing.userData.prodPct=0;
    this.group.add(this._prodRing);
    this._prodScore=0;
    this.pbBg=new THREE.Mesh(new THREE.BoxGeometry(.9,.04,.1),new THREE.MeshBasicMaterial({color:0x111111,transparent:true,opacity:0}));this.pbBg.position.set(0,3.15,.01);this.group.add(this.pbBg);
    this.pbFill=new THREE.Mesh(new THREE.BoxGeometry(.88,.04,.1),new THREE.MeshBasicMaterial({color:parseInt(cfg.col.replace('#','0x')),transparent:true,opacity:0}));this.pbFill.position.set(-.44,3.16,.01);this.pbFill.scale.x=.01;this.group.add(this.pbFill);
    this.pbFill.geometry.translate(.44,0,0);
    this.group.traverse(c=>{if(c.isMesh){c.castShadow=false;c.receiveShadow=false;}});
    [this.head,this.neck,this.torso,this.shoulders,this.lArm,this.rArm,this.lHand,this.rHand,this.lLeg,this.rLeg,this.lShoe,this.rShoe].forEach(m=>{if(m)m.castShadow=true;});
    // LOD proxy
    this._lodProxy=new THREE.Mesh(
      poolGeo('c',.22,.22,1.8,5),
      new THREE.MeshLambertMaterial({color:parseInt(cfg.col.replace('#','0x')),transparent:true,opacity:.75})
    );
    this._lodProxy.position.y=.9;this._lodProxy.visible=false;this.group.add(this._lodProxy);this._lodActive=false;
    this._bodyParts=[this.head,this.neck,this.torso,this.shoulders,this.lArm,this.rArm,this.lHand,this.rHand,this.lLeg,this.rLeg,this.lShoe,this.rShoe];
  }

  //  #7: async moveTo via worker 
  moveTo(tx,tz,{force=false,tag=null}={}){
    if((this._lockPos||(this._activityLock&&tag!==this._activityLock))&&!force)return Promise.resolve(false);
    const sx=this.group.position.x,sz=this.group.position.z;
    const reqId=++this._moveReq;

    return requestPath(sx,sz,tx,tz,this.key).then(p=>{
      if(reqId!==this._moveReq)return false;
      if((this._lockPos||(this._activityLock&&tag!==this._activityLock))&&!force)return false;

      if(p&&p.length>0){
        this.path=p;
        requestPath(tx,tz,this.hx,this.hz,this.key,true);
        return true;
      }
      return false;
    });
  }

  back({force=false,tag=null}={}){
    if((this._lockPos||(this._activityLock&&tag!==this._activityLock))&&!force)return;
    this._moveReq++;

    if(this._cachedHomePath&&this._cachedHomePath.length>0){
      this.path=this._cachedHomePath;
      this._cachedHomePath=null;
    } else {
      this.moveTo(this.hx,this.hz,{force,tag});
    }
  }

  engageActivity(tag,{state='waiting'}={}){
    if(this._activityLock&&this._activityLock!==tag)return false;
    this._moveReq++;
    this.path=[];
    this._activityLock=tag;
    this.idleTimer=9999;
    this.setState(state);
    return true;
  }

  releaseActivity({state='idle'}={}){
    this._moveReq++;
    this.path=[];
    this._activityLock=null;
    this._lockPos=null;
    this._lockState='waiting';
    this.idleTimer=70+Math.random()*170;
    this.setState(state);
  }

  lockAt(x,z,{rotY=null,state='waiting'}={}){
    this._moveReq++;
    this.path=[];
    this._lockState=state;
    this._lockPos={x,z,rotY};
    this.group.position.x=x;
    this.group.position.z=z;
    if(typeof rotY==='number')this.group.rotation.y=rotY;
    if(state)this.setState(state);
  }

  unlock({state='idle'}={}){
    this._moveReq++;
    this.path=[];
    this._lockPos=null;
    this._lockState='waiting';
    this.setState(state);
  }


  goToLibrary(onArrival){
    const lx=window.LIB_X||13,lz=window.LIB_Z||13;
    this.setState('thinking');
    this.say(['voy a consultar...','dejame revisar...','un momento...'][Math.floor(Math.random()*3)]);
    this.moveTo(lx+(Math.random()-.5)*2,lz+(Math.random()-.5)*1.2);
    const _chk=setInterval(()=>{
      const dx=this.group.position.x-lx,dz=this.group.position.z-lz;
      if(Math.sqrt(dx*dx+dz*dz)<3.5&&this.path.length===0){
        clearInterval(_chk);
        this.setState('reading');
        this.say('📚 ...');
        if(onArrival)setTimeout(onArrival,1800+Math.random()*1200);
      }
    },200);
    setTimeout(()=>clearInterval(_chk),12000);
  }
  say(t){
    this.speech=t;this.sa=1.;this.lastMsg=t;playAgentSpatialSound(this.key,'voice');
    this.drawHUD(t); // <--- HOOKED UP CLAW3D HUD
    if(AG)Object.values(AG).forEach(o=>{if(o===this)return;const d=this.group.position.distanceTo(o.group.position);if(d<6&&o.path.length===0&&o.state==='idle'){const dx=this.group.position.x-o.group.position.x,dz=this.group.position.z-o.group.position.z;o.group.rotation.y+=(Math.atan2(dx,dz)-o.group.rotation.y)*.3;}});
    const col=parseInt(ACFG[this.key].col.replace('#','0x'));
  for(let i=0;i<1;i++){
    const p=new THREE.Mesh(new THREE.SphereGeometry(.04,3,3),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.8}));
    p.position.set(this.group.position.x+(Math.random()-.5)*.3,this.group.position.y+2.6+Math.random()*.3,this.group.position.z+(Math.random()-.5)*.3);
    scene.add(p);
    const vx=(Math.random()-.5)*.4,vy=.25+Math.random()*.2,vz=(Math.random()-.5)*.4;
    let lt=0;
    const _pi=setInterval(()=>{lt+=.033;p.position.x+=vx*.033;p.position.y+=vy*.033;p.position.z+=vz*.033;p.material.opacity=Math.max(0,.8-lt*1.2);if(lt>.7){clearInterval(_pi);scene.remove(p);p.geometry.dispose();p.material.dispose();}},33);
  }
  }
  setState(s){if(s!==this.state){this.state=s;this.stateTime=0;}}

  //  #8: update dynamic shadow each frame 
  _updateShadow(){
    const gp=this.group.position;
    const h=gp.y; // how high agent is off ground (bobbing/walk bounce)
    // Project shadow away from sun direction proportional to height
    const ox=SUN_NX*h*1.6;
    const oz=SUN_NZ*h*1.6;
    this.shadowGroup.position.set(gp.x+ox, 0, gp.z+oz);
    // Stretch shadow ellipse as agent rises
    const stretch=1.0+h*0.22;
    const fade  =1.0+h*0.15;
    this.shadowMesh.scale.set(stretch*0.9, fade*0.75, 1);
    // Rotate shadow to align with sun projection (elongate toward +x/-z)
    this.shadowMesh.rotation.z = Math.atan2(SUN_NZ, SUN_NX)*0.4;
    const nightFade=dayMode?1:.35;
    this.shadowMesh.material.opacity = Math.max(0,(.55-h*0.08)*nightFade);
  }

  updateHUD(dt) {
    if (this.hudT > 0) {
      this.hudT -= dt;
      this.hudMat.opacity = Math.min(1, this.hudT * 1.5);
      this.hudSprite.position.y = 3.2 + (1 - Math.min(1, this.hudT)) * 0.2; // Suave flotación
    } else {
      this.hudMat.opacity = 0;
    }
  }

  drawHUD(text) {
    if (!text) return;
    const ctx = this.hudCtx;
    ctx.clearRect(0, 0, 512, 128);
    
    // Fondo estilo Claw3D (Holograma semi-transparente)
    ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
    ctx.roundRect(10, 10, 492, 108, 20);
    ctx.fill();
    ctx.strokeStyle = this.col;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Texto
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    
    // Ajustar texto largo
    const words = text.split(' ');
    let line = '';
    let y = 65;
    if (text.length > 40) {
        ctx.font = 'bold 18px "Courier New", monospace';
        y = 55;
    }

    ctx.fillText(text.length > 80 ? text.slice(0, 77) + '...' : text, 256, y);
    
    this.hudTex.needsUpdate = true;
    this.hudT = 5.0; // Mostrar durante 5 segundos
  }

  update(dt,gNeighbors){
    this.updateHUD(dt); // <--- HUD UPDATE
    this.time+=dt*2.5;this.stateTime+=dt;
    if(this.path.length>0){
      const nxt=this.path[0];const dx=nxt.x-this.group.position.x,dz=nxt.z-this.group.position.z;const dist=Math.sqrt(dx*dx+dz*dz);
      if(dist<.18){this.path.shift();}
      else{
        const slowdown=this._weatherSlowdown||1;
        const sp=4.8*dt*slowdown;
        let vx=(dx/dist)*sp, vz=(dz/dist)*sp;
        // Organic Steering & Collisions
        if(typeof Object !== 'undefined' && AG) {
          Object.values(AG).forEach(o => {
            if(o !== this && o.group) {
              const ox = this.group.position.x - o.group.position.x;
              const oz = this.group.position.z - o.group.position.z;
              const odist = Math.sqrt(ox*ox + oz*oz);
              if (odist > 0.01 && odist < 1.8) {
                const force = (1.8 - odist) * sp * 1.5;
                vx += (ox / odist) * force;
                vz += (oz / odist) * force;
              }
            }
          });
        }
        const vdist = Math.sqrt(vx*vx + vz*vz);
        if (vdist > sp * 1.3) { vx = (vx / vdist) * sp * 1.3; vz = (vz / vdist) * sp * 1.3; }
        
        this.group.position.x += vx; 
        this.group.position.z += vz;

        this.setState('walking');const _pw=this.walkPhase;this.walkPhase+=dt*9;
        if(Math.floor(_pw/Math.PI)!==Math.floor(this.walkPhase/Math.PI))playAgentSpatialSound(this.key,'step');
        
        const ang=Math.atan2(vx, vz);
        let diff=ang-this.group.rotation.y;
        while(diff>Math.PI) diff-=Math.PI*2;
        while(diff<-Math.PI) diff+=Math.PI*2;
        this.group.rotation.y+=diff*0.15;
        
        const sw=Math.sin(this.walkPhase)*.28;this.lLeg.rotation.x=sw;this.rLeg.rotation.x=-sw;this.lArm.rotation.x=-sw*.55;this.rArm.rotation.x=sw*.55;
        this.group.position.y=Math.abs(Math.sin(this.walkPhase))*.09;
        const mv=(this.group.position.x-this.lastPos.x)**2+(this.group.position.z-this.lastPos.z)**2;
        if(mv<.001)this.stuckT+=dt;else this.stuckT=0;this.lastPos={x:this.group.position.x,z:this.group.position.z};
        if(this.stuckT>1.5){this.path=[];this.stuckT=0;}
      }
    }else{
      if(this.state==='walking')this.setState(this._meetingSeated?'reading':'idle');
      this.group.position.y*=.88;
      if((this.state==='working'||this.state==='thinking')&&!this._meetingSeated){
        if(!this.keyTimer)this.keyTimer=Math.random()*1.5;
        this.keyTimer-=dt;if(this.keyTimer<=0){playAgentSpatialSound(this.key,'key');this.keyTimer=this.state==='working'?.06+Math.random()*.14:.22+Math.random()*.5;}
      }
this.lLeg.rotation.x*=.88;this.rLeg.rotation.x*=.88;
      this.torso.rotation.x*=.88;
      this.lArm.rotation.x*=.9;this.rArm.rotation.x*=.9;
      this.lArm.rotation.z*=.82;this.rArm.rotation.z*=.82;
      this.head.rotation.x*=.9;
      this.head.rotation.z*=.9;
    }
    if(this.state!=='walking')this.group.position.y+=Math.sin(this.time*.7)*.009;
//  GESTOS ÚNICOS 
if(this.state==='thinking'&&this.path.length===0){
  if(this.key==='devbe'){
    // Yared: se rasca la cabeza
    this.rArm.rotation.z=Math.sin(this.time*2.2)*0.4+0.6;
    this.head.rotation.z=Math.sin(this.time*1.1)*0.06;
  }else if(this.key==='ceo'){
    // Ana: cruza brazos
    this.lArm.rotation.z=Math.sin(this.time*.4)*0.05+0.55;
    this.rArm.rotation.z=-(Math.sin(this.time*.4)*0.05+0.55);
    this.lArm.rotation.x=-0.3;this.rArm.rotation.x=-0.3;
  }else if(this.key==='qa'){
    // Marta: apunta con el dedo (brazo extendido)
    this.rArm.rotation.x=-1.1+Math.sin(this.time*1.8)*0.12;
    this.rArm.rotation.z=-0.2;
  }else if(this.key==='pm'){
    // Sofia: asiente (cabeza arriba/abajo)
    this.head.rotation.x=-0.2+Math.sin(this.time*1.4)*0.14;
  }else if(this.key==='data'){
    // Andres: ajusta gafas (mano a la cara)
    if(Math.floor(this.time*0.3)%4===0){
      this.rArm.rotation.x=-0.9+Math.sin(this.time*6)*0.08;
      this.rArm.rotation.z=-0.3;
    }
  }else if(this.key==='devfe'){
    // Diego: mueve los dedos (brazos tecleando en el aire)
    this.lArm.rotation.x=-0.7+Math.sin(this.time*4)*0.18;
    this.rArm.rotation.x=-0.7+Math.sin(this.time*4+1)*0.18;
  }else if(this.key==='devops'){
    // Luis: mira el reloj (brazo levantado)
    if(Math.floor(this.time*0.2)%3===0){
      this.lArm.rotation.x=-1.2;this.lArm.rotation.z=0.4;
      this.head.rotation.z=-0.12;
    }
  }else if(this.key==='ux'){
    // Valentina: dibuja en el aire (brazo circular)
    this.rArm.rotation.x=-0.8+Math.sin(this.time*1.2)*0.35;
    this.rArm.rotation.z=Math.cos(this.time*1.2)*0.25;
  }
}
    const far=this.group.position.distanceTo(camera.position)>28;
    if(!far){
      if(this.state==='thinking'){
        this.head.rotation.z=Math.sin(this.time*.6)*.09;
        this.agentLight.intensity+=(.55+Math.sin(this.time*2.5)*.15-this.agentLight.intensity)*.08;
        this.thinkRing.material.opacity+=(.6-this.thinkRing.material.opacity)*.08;this.thinkRing.rotation.z+=dt*1.8;
        this.labelEl.className='agent-label thinking';
      }else if(this.state==='reading'){
        this.head.rotation.z*=.9;this.agentLight.intensity+=(.3-this.agentLight.intensity)*.06;
        this.thinkRing.material.opacity+=(.2-this.thinkRing.material.opacity)*.08;this.thinkRing.rotation.z+=dt*.6;
        this.labelEl.className='agent-label reading';
      }else if(this.state==='working'){
        this.head.rotation.z=Math.sin(this.time*1.2)*.05;this.agentLight.intensity+=(.4+Math.sin(this.time*3)*.1-this.agentLight.intensity)*.08;
        this.thinkRing.material.opacity+=(.4-this.thinkRing.material.opacity)*.08;this.thinkRing.rotation.z+=dt*2.5;
        this.labelEl.className='agent-label working';
        const pct=Math.min(1,this.stateTime/8);this.pbBg.material.opacity+=(.65-this.pbBg.material.opacity)*.1;this.pbFill.material.opacity+=(.9-this.pbFill.material.opacity)*.1;this.pbFill.scale.x=Math.max(.01,pct);
      }else{
        this.head.rotation.z*=.9;
        this.lArm.rotation.z*=.85;this.rArm.rotation.z*=.85;
        this.agentLight.intensity+=(0-this.agentLight.intensity)*.08;
        this.thinkRing.material.opacity+=(0-this.thinkRing.material.opacity)*.08;
        this.labelEl.className='agent-label';
        this.pbBg.material.opacity+=(0-this.pbBg.material.opacity)*.1;this.pbFill.material.opacity+=(0-this.pbFill.material.opacity)*.1;
      }
    }
    this.tag.rotation.y+=dt*1.6;
    this._blinkT-=dt;
    if(this._blinkT<0){
      const blink=Math.abs(this._blinkT)<.08;
      if(this.eyeL){this.eyeL.scale.y=blink?.15:1;this.eyeR.scale.y=blink?.15:1;}
      if(this._blinkT<-.12){this._blinkT=2.5+Math.random()*3;}
    }
    // Productividad acumulada
    if(this.state==='working')this._prodScore=Math.min(100,this._prodScore+dt*2);
    else if(this.state==='idle')this._prodScore=Math.max(0,this._prodScore-dt*.1);
    const pct=this._prodScore/100;
    this._prodRing.scale.set(pct<.01?.01:1,pct<.01?.01:1,1);
    this._prodRing.material.opacity=.2+pct*.5;
    this._prodRing.rotation.z=this.time*.4;
    if(this.sa>0){
      this.sa-=dt*.28;
      if(this.sa<0)this.sa=0;
      // Holograma de voz (Audio Wave)
      const wave = Math.max(0, Math.sin(this.time * 12) * this.sa);
      this.audioRing.scale.set(1 + wave * 0.8, 1 + wave * 0.8, 1);
      this.audioRing.material.opacity = wave * 0.6;
    } else {
      this.audioRing.material.opacity = 0;
    }
    //  #8 update shadow 
    if(frameCt%2===0)this._updateShadow();


    if(this._lockPos){
      this.path=[];
      this.group.position.x=this._lockPos.x;
      this.group.position.z=this._lockPos.z;
      if(typeof this._lockPos.rotY==='number')this.group.rotation.y=this._lockPos.rotY;
      if(this._lockState&&this.state!==this._lockState)this.setState(this._lockState);
      this.stuckT=0;
    }else if(this.path.length===0&&!this._meetingSeated){
      const neighbors=gNeighbors(this.group.position.x,this.group.position.z);
      neighbors.forEach(({ag:o})=>{if(o===this)return;const dx=this.group.position.x-o.group.position.x,dz=this.group.position.z-o.group.position.z,d2=dx*dx+dz*dz;if(d2<1.8&&d2>.01){const d=Math.sqrt(d2),f=(1.35-d)/d*.05;this.group.position.x+=dx*f;this.group.position.z+=dz*f;}});
    }
    if(!this._lockPos&&!this._activityLock&&!simOn&&this.state==='idle'&&this.path.length===0){this.idleTimer-=dt*60;if(this.idleTimer<=0){this._idle();this.idleTimer=70+Math.random()*170;}}


  }

  _idle(){
    const r=Math.random();
    const Z={ceo:[[-24,-6],[-25,-6],[-17,-9],[-24,2],[-20,-6]],pm:[[-14,3],[-15,3],[-18,5],[-13,3],[-16,3]],devbe:[[-16,-9],[-15,-7],[-12,-9],[-10,-8],[-8,-9]],devfe:[[0,-7],[3,-8],[-3,-7],[2,-8],[-2,-7]],qa:[[11,-7],[11,-7],[14,-5],[11,-8],[13,-7]],devops:[[21,-7],[21,-9],[22,-6],[21,-8],[22,-7]],ux:[[-3,3],[-4,3],[-7,4],[-2,4],[-5,3]],data:[[9,3],[10,3],[11,4],[8,3],[9,4]]};
    if(r<.5){const pts=Z[this.key];const p=pts[this.idleIdx%pts.length];this.idleIdx++;this.moveTo(p[0]+(Math.random()-.5)*.5,p[1]+(Math.random()-.5)*.5);}
    else if(r<.65){this.say(CHAT[this.key][Math.floor(Math.random()*CHAT[this.key].length)]);}
    else if(r<.78){this.moveTo((Math.random()-.5)*4,3+Math.random()*2);}
    else if(r<.88){
      const lx=window.LOUNGE_X||22,lz=window.LOUNGE_Z||8;
      this.moveTo(lx+(Math.random()-.5)*2,lz+(Math.random()-.5)*1.5);
      const _ag=this;setTimeout(()=>{
        if(Math.abs(_ag.group.position.x-lx)<4){
          _ag.setState('reading');_ag.say(['☕ descanso','📱 revisando','🧘 pausa'][Math.floor(Math.random()*3)]);
          setTimeout(()=>{if(_ag.state==='reading')_ag.setState('idle');},8000+Math.random()*6000);
        }
      },4000);
    }
    else{const cross={ceo:[-9,-9],pm:[-23,-6],devbe:[-15,3],devfe:[-10,-8],qa:[0,-7],devops:[11,-7],ux:[-15,3],data:[-4,3]};const t=cross[this.key];if(t)this.moveTo(t[0]+(Math.random()-.5)*1.5,t[1]+(Math.random()-.5)*1.5);}
  }
}
// #7 Stretch timer
const _stretchTimers={};
Object.keys(ACFG).forEach(k=>_stretchTimers[k]=120+Math.random()*180);
function updateStretches(dt){
  Object.keys(ACFG).forEach(k=>{
    if(!AG[k])return;
    _stretchTimers[k]-=dt;
    if(_stretchTimers[k]<=0){
      _stretchTimers[k]=120+Math.random()*180;
      const ag=AG[k];
      if(ag.state!=='idle'&&ag.state!=='walking')return;
      ag.setState('thinking');
      ag.say(['😤 necesito estirarme','✋ un momento...','🙆 stretch break'][Math.floor(Math.random()*3)]);
      // Arms up animation
      const _origL=ag.lArm.rotation.x,_origR=ag.rArm.rotation.x;
      let _st=0;
      const _stretchAnim=setInterval(()=>{
        _st+=0.05;
        ag.lArm.rotation.x=-Math.min(Math.PI*.7,_st*Math.PI*.7);
        ag.rArm.rotation.x=-Math.min(Math.PI*.7,_st*Math.PI*.7);
        if(_st>=1){clearInterval(_stretchAnim);
          setTimeout(()=>{ag.lArm.rotation.x=_origL;ag.rArm.rotation.x=_origR;ag.setState('idle');},1200);}
      },50);
    }
  });
}

//  AUTO TIPS 
let _tipTimer=60+Math.random()*90;
async function updateAutoTips(dt){
  _tipTimer-=dt;if(_tipTimer>0)return;
  _tipTimer=75+Math.random()*90;
  if(!GKEY)return;
  const keys=Object.keys(AG);
  const k=keys[Math.floor(Math.random()*keys.length)];
  const ag=AG[k];if(!ag||ag.state==='working')return;
  const ctx=`Estado sim: ${Object.values(AG).map(a=>a.state).join(',')}.Hora:${new Date().getHours()}h.Step:${step}.`;
  const r=await groq([{role:'system',content:mkSys(k)},{role:'user',content:`Contexto de la oficina ahora: ${ctx}. Da un consejo profesional corto y relevante a tu equipo. Max 12 palabras.`}],()=>{},30,0.75);
  if(r){ag.say(r.slice(0,35));showToast(`💡 ${ACFG[k].name.split(' ')[0]}: ${r.slice(0,40)}`,ACFG[k].col,k);}
}

// #8 Spontaneous conversations
let _convTimer=30+Math.random()*60;
let _convRunning=false;
async function updateSpontaneousConv(dt){
  _convTimer-=dt;
  if(_convTimer>0||_convRunning)return;
  _convRunning=true;
  _convTimer=45+Math.random()*90;
  if(!GKEY)return;
  // Pick two random nearby agents
  const keys=Object.keys(AG);
  const k1=keys[Math.floor(Math.random()*keys.length)];
  const k2=keys.filter(k=>k!==k1)[Math.floor(Math.random()*(keys.length-1))];
  const ag1=AG[k1],ag2=AG[k2];
  if(!ag1||!ag2)return;
  if(ag1.state!=='idle'||ag2.state!=='idle')return;
  // Walk toward each other
  const mx=(ag1.group.position.x+ag2.group.position.x)/2;
  const mz=(ag1.group.position.z+ag2.group.position.z)/2;
  ag1.moveTo(mx-.8,mz);ag2.moveTo(mx+.8,mz);
  // Wait until both agents are close enough
  await new Promise(r=>{
    const check=setInterval(()=>{
      const d1=Math.hypot(ag1.group.position.x-(mx-.8),ag1.group.position.z-mz);
      const d2=Math.hypot(ag2.group.position.x-(mx+.8),ag2.group.position.z-mz);
      if(d1<1.5&&d2<1.5){clearInterval(check);r();}
    },200);
    setTimeout(()=>{clearInterval(check);r();},5000); // timeout 5s
  });
  ag1.setState('thinking');
  orientAgentToward(k1,k2);
  orientAgentToward(k2,k1);
  _showTalkLine(k1,k2);
  const topics=['el deploy de hoy','el bug de Marta','las metricas Q2','el roadmap Q3','el cafe de la oficina'];
 const tone=getRelTone(k1,k2);
const topic=topics[Math.floor(Math.random()*topics.length)];
const moodPrefix=tone>.85?'[colega cercano] ':tone<.6?'[tension laboral] ':'';
  groq([{role:'system',content:mkSys(k1)},{role:'user',content:`${moodPrefix}Dile algo ${tone>.85?'amistoso y cercano':tone<.6?'profesional pero distante':'natural'} a ${ACFG[k2].name.split(' ')[0]} sobre: ${topic}. Max 12 palabras.`}],(tok,full)=>{ag1.say(full.slice(-30));},25,0.75).then(r=>{
    if(r){ag1.say(r.slice(0,30));ag1.setState('idle');
      setTimeout(()=>{
        ag2.setState('thinking');
        groq([{role:'system',content:mkSys(k2)},{role:'user',content:`${ACFG[k1].name.split(' ')[0]} te dijo: "${r}". Responde en max 10 palabras.`}],(tok,full)=>{ag2.say(full.slice(-30));},20,0.75).then(r2=>{if(r2){ag2.say(r2.slice(0,30));ag2.setState('idle');ag2.back();setRelEvent(k1,k2,'collab');}});
        setTimeout(()=>ag1.back(),2500);
      },2500);
    }
  });
  _convRunning=false;
}

//  ORIENTACIÓN AL HABLAR 
const _orientIntervals={};
function orientAgentToward(speakerKey,listenerKey){
  const sp=AG[speakerKey],li=AG[listenerKey];if(!sp||!li)return;
  if(_orientIntervals[speakerKey]){clearInterval(_orientIntervals[speakerKey]);delete _orientIntervals[speakerKey];}
  const dx=li.group.position.x-sp.group.position.x;
  const dz=li.group.position.z-sp.group.position.z;
  const targetAngle=Math.atan2(dx,dz);
  _orientIntervals[speakerKey]=setInterval(()=>{
    const diff=((targetAngle-sp.group.rotation.y+Math.PI*3)%(Math.PI*2))-Math.PI;
    sp.group.rotation.y+=diff*.12;
    if(Math.abs(diff)<.05){clearInterval(_orientIntervals[speakerKey]);delete _orientIntervals[speakerKey];}
  },16);
}

function orientAgentToPoint(agentKey,x,z){
  const ag=AG[agentKey];if(!ag)return;
  if(_orientIntervals[agentKey]){clearInterval(_orientIntervals[agentKey]);delete _orientIntervals[agentKey];}
  const dx=x-ag.group.position.x;
  const dz=z-ag.group.position.z;
  const targetAngle=Math.atan2(dx,dz);
  _orientIntervals[agentKey]=setInterval(()=>{
    const diff=((targetAngle-ag.group.rotation.y+Math.PI*3)%(Math.PI*2))-Math.PI;
    ag.group.rotation.y+=diff*.12;
    if(Math.abs(diff)<.05){clearInterval(_orientIntervals[agentKey]);delete _orientIntervals[agentKey];}
  },16);
}

function clearOrientAll(){Object.keys(_orientIntervals).forEach(k=>{clearInterval(_orientIntervals[k]);delete _orientIntervals[k];});}


//  COMANDO: IR A HABLAR CON AGENTE 
async function goTalkTo(fromKey,toKey,topic=''){
  const ag1=AG[fromKey],ag2=AG[toKey];
  if(!ag1||!ag2)return;
  const cfg1=ACFG[fromKey],cfg2=ACFG[toKey];
  // Caminar hacia el otro
  const mx=(ag1.group.position.x+ag2.group.position.x)/2;
  const mz=(ag1.group.position.z+ag2.group.position.z)/2;
  ag1.moveTo(mx-1,mz);ag2.moveTo(mx+1,mz);
  showToast(`${cfg1.name.split(' ')[0]} va a hablar con ${cfg2.name.split(' ')[0]}`,cfg1.col);
  // Esperar que lleguen
  await new Promise(r=>{
    const chk=setInterval(()=>{
      const d1=Math.hypot(ag1.group.position.x-(mx-1),ag1.group.position.z-mz);
      const d2=Math.hypot(ag2.group.position.x-(mx+1),ag2.group.position.z-mz);
      if(d1<2&&d2<2){clearInterval(chk);r();}
    },200);
    setTimeout(()=>{clearInterval(chk);r();},6000);
  });
  orientAgentToward(fromKey,toKey);
  orientAgentToward(toKey,fromKey);
  if(!GKEY)return;
  ag1.setState('thinking');
  const prompt=topic?`Dile algo a ${cfg2.name.split(' ')[0]} sobre: ${topic}. Max 15 palabras.`:`Saluda a ${cfg2.name.split(' ')[0]} y dile algo relevante de tu trabajo. Max 15 palabras.`;
  const r1=await groq([{role:'system',content:mkSys(fromKey)},{role:'user',content:prompt}],
    (tok,full)=>{ag1.speech=full.slice(-24);ag1.sa=.9;},40);
  if(r1){ag1.say(r1.slice(0,30));ag1.setState('idle');
    // Respuesta del otro
    setTimeout(async()=>{
      ag2.setState('thinking');
      const r2=await groq([{role:'system',content:mkSys(toKey)},{role:'user',content:`${cfg1.name.split(' ')[0]} te dijo: "${r1.slice(0,60)}". Responde en max 12 palabras.`}],
        (tok,full)=>{ag2.speech=full.slice(-24);ag2.sa=.9;},35);
      if(r2){ag2.say(r2.slice(0,30));ag2.setState('idle');}
      setTimeout(()=>{ag1.back();ag2.back();},3000);
    },2500);
  }
}

//  FLECHAS DE DELEGACIÓN 
let _delegArrows=[];
function showDelegationArrow(fromKey,toKey){
  const ag1=AG[fromKey],ag2=AG[toKey];if(!ag1||!ag2)return;
  createNeonFlow(fromKey, toKey); // <--- HOOKED UP CLAW3D FLOW
  const col=parseInt(ACFG[fromKey].col.replace('#','0x'));
  // Curva de Bezier entre los dos agentes
  const p1=ag1.group.position.clone().add(new THREE.Vector3(0,3.5,0));
  const p2=ag2.group.position.clone().add(new THREE.Vector3(0,3.5,0));
  const mid=p1.clone().lerp(p2,.5).add(new THREE.Vector3(0,1.5,0));
  const curve=new THREE.QuadraticBezierCurve3(p1,mid,p2);
  const pts=curve.getPoints(20);
  const geo=new THREE.BufferGeometry().setFromPoints(pts);
  const mat=new THREE.LineBasicMaterial({color:col,transparent:true,opacity:.85});
  const line=new THREE.Line(geo,mat);
  scene.add(line);
  // Punta de flecha en destino
  const dir=p2.clone().sub(pts[pts.length-2]).normalize();
  const arrowMat=new THREE.MeshBasicMaterial({color:col});
  const arrow=new THREE.Mesh(new THREE.CylinderGeometry(0,.12,.3,6),arrowMat);
  arrow.position.copy(p2);
  arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
  scene.add(arrow);
  const entry={line,arrow,t:0,life:4};
  _delegArrows.push(entry);
  showToast(`↪ ${ACFG[fromKey].name.split(' ')[0]} → ${ACFG[toKey].name.split(' ')[0]}`,ACFG[fromKey].col);
}
function updateDelegArrows(dt){
  for(let i=_delegArrows.length-1;i>=0;i--){
    const a=_delegArrows[i];a.t+=dt;a.life-=dt;
    const op=Math.max(0,a.life/4);
    a.line.material.opacity=op*.85;
    a.arrow.material.opacity=op;
    if(a.life<=0){
      scene.remove(a.line);scene.remove(a.arrow);
      a.line.geometry.dispose();a.line.material.dispose();
      a.arrow.geometry.dispose();a.arrow.material.dispose();
      _delegArrows.splice(i,1);
    }
  }
}

//  BADGES DE MEMORIA 
const _memBadges={};
function updateMemoryBadges(){
  const wrap=document.getElementById('canvasWrap');if(!wrap||!camera)return;
  const {W,H}=getViewportSize();
  Object.keys(ACFG).forEach(k=>{
    const count=chatH[k]?chatH[k].filter(m=>m.role!=='system').length:0;
    if(count===0){if(_memBadges[k])_memBadges[k].style.display='none';return;}
    if(!_memBadges[k]){
      const el=document.createElement('div');
      el.style.cssText=`position:absolute;font-family:var(--mono);font-size:14px;color:#000;background:${ACFG[k].col};border-radius:8px;padding:1px 4px;pointer-events:none;white-space:nowrap;font-weight:800;min-width:14px;text-align:center`;
      document.getElementById('speechLayer').appendChild(el);
      _memBadges[k]=el;
    }
    const ag=AG[k];if(!ag)return;
    const wp=new THREE.Vector3(ag.group.position.x+.8,ag.group.position.y+4.8,ag.group.position.z);
    wp.project(camera);
    if(wp.z<1){
      _memBadges[k].style.display='block';
      _memBadges[k].style.left=((wp.x*.5+.5)*W)+'px';
      _memBadges[k].style.top=((-.5*wp.y+.5)*H)+'px';
      _memBadges[k].textContent='💭'+count;
    }else _memBadges[k].style.display='none';
  });
}

//  AGENTE PIDE AYUDA 
let _helpTimer=60+Math.random()*120;
async function updateHelpRequests(dt){
  if(!GKEY)return;
  // Auto-help si llevan >20s pensando
  Object.entries(AG).forEach(([k,ag])=>{
    if(ag.state==='thinking'&&ag.stateTime>20&&!ag._askedHelp){
      ag._askedHelp=true;setTimeout(()=>{ag._askedHelp=false;},60000);
      const helpers={ceo:['pm','data'],pm:['ceo','ux'],devbe:['devfe','devops'],devfe:['devbe','ux'],qa:['devbe','devops'],devops:['devbe','qa'],ux:['pm','devfe'],data:['ceo','pm']};
      const h=helpers[k];if(!h)return;const hk=h[Math.floor(Math.random()*h.length)];
      if(AG[hk]&&AG[hk].state==='idle'){ag.say('¿Me ayudas?');AG[hk].moveTo(ag.group.position.x+1.5,ag.group.position.z+1);setTimeout(()=>AG[hk]?.say('Claro, ya voy'),2000);}
    }
  });
  _helpTimer-=dt;if(_helpTimer>0)return;
  _helpTimer=90+Math.random()*150;
  const keys=Object.keys(ACFG);
  const seeker=keys[Math.floor(Math.random()*keys.length)];
  const ag=AG[seeker];if(!ag||ag.state!=='idle')return;
  // Buscar colaborador relevante
  const helpers={ceo:['pm','data'],pm:['ceo','ux'],devbe:['devfe','devops'],
    devfe:['devbe','ux'],qa:['devbe','devops'],devops:['devbe','qa'],
    ux:['pm','devfe'],data:['ceo','pm']};
  const candidates=helpers[seeker]||keys.filter(k=>k!==seeker);
  const helper=candidates[Math.floor(Math.random()*candidates.length)];
  if(!AG[helper]||AG[helper].state!=='idle')return;
  ag.setState('thinking');
  const r=await groq([{role:'system',content:mkSys(seeker)},{role:'user',content:`Necesitas ayuda de ${ACFG[helper].name.split(' ')[0]}. Dile que necesitas en max 12 palabras.`}],()=>{},35);
  if(!r)return;
  ag.say(r.slice(0,30));
  showToast(`🆘 ${ACFG[seeker].name.split(' ')[0]} pide ayuda a ${ACFG[helper].name.split(' ')[0]}`,ACFG[seeker].col);
  // El helper camina hacia el seeker
  const sp=AG[seeker].group.position;
  AG[helper].moveTo(sp.x+1.5,sp.z+1);
  await new Promise(res=>setTimeout(res,3000));
  orientAgentToward(helper,seeker);
  const r2=await groq([{role:'system',content:mkSys(helper)},{role:'user',content:`${ACFG[seeker].name.split(' ')[0]} dijo: "${r}". Ayudale en max 12 palabras.`}],()=>{},35);
  if(r2){AG[helper].say(r2.slice(0,30));}
  setTimeout(()=>{AG[helper].back();ag.setState('idle');},3000);
}

//  REUNIÓN 1:1 
async function runMeeting1on1(k1,k2){
  if(!GKEY){showToast(`Necesitas API key ${providerLabel()}`,'#cc3344');return;}
  const ag1=AG[k1],ag2=AG[k2];
  const cfg1=ACFG[k1],cfg2=ACFG[k2];
  if(!ag1||!ag2)return;

  const tag=`oneonone-${k1}-${k2}`;
  const left={x:-3.5,z:5,rotY:Math.PI/2};
  const right={x:-0.5,z:5,rotY:-Math.PI/2};

  if(ag1._activityLock)ag1.releaseActivity({state:'idle'});
  if(ag2._activityLock)ag2.releaseActivity({state:'idle'});

  ag1.engageActivity(tag,{state:'walking'});
  ag2.engageActivity(tag,{state:'walking'});

  showToast(`Reunion 1:1: ${cfg1.name.split(' ')[0]} / ${cfg2.name.split(' ')[0]}`,cfg1.col);
  logEvent('1on1','Reunion 1:1 iniciada',`${cfg1.name.split(' ')[0]} / ${cfg2.name.split(' ')[0]}`,cfg1.col,k1);

  try{
    ag1.moveTo(left.x,left.z,{force:true,tag});
    ag2.moveTo(right.x,right.z,{force:true,tag});

    await new Promise(r=>{
      const i=setInterval(()=>{
        const d1=Math.hypot(ag1.group.position.x-left.x,ag1.group.position.z-left.z);
        const d2=Math.hypot(ag2.group.position.x-right.x,ag2.group.position.z-right.z);
        if(d1<1.1&&d2<1.1){clearInterval(i);r();}
      },250);
      setTimeout(()=>{clearInterval(i);r();},9000);
    });

    ag1.lockAt(left.x,left.z,{rotY:left.rotY,state:'thinking'});
    ag2.lockAt(right.x,right.z,{rotY:right.rotY,state:'thinking'});

    showDelegationArrow(k1,k2);
    switchPanel('flujo');

    const w=document.getElementById('swrap');
    w.innerHTML=`<div style="padding:8px 12px;font-family:var(--mono);font-size:17px;color:var(--t2);border-bottom:1px solid var(--b1);margin-bottom:6px;font-weight:700">1:1 - ${cfg1.name.split(' ')[0]} / ${cfg2.name.split(' ')[0]} · bloqueado hasta finalizar</div>`;
    const log=document.createElement('div');
    log.style.cssText='display:flex;flex-direction:column;gap:4px;padding:8px 12px';
    w.appendChild(log);

    const turns=[
      {k:k1,prompt:`Inicia una reunion 1:1 con ${cfg2.name.split(' ')[0]}. Resume contexto, objetivo y tono profesional. Max 24 palabras.`},
      {k:k2,prompt:`Responde al opening de ${cfg1.name.split(' ')[0]} y valida prioridad. Max 24 palabras.`},
      {k:k1,prompt:`Plantea un bloqueo o decision que deban resolver juntos. Max 24 palabras.`},
      {k:k2,prompt:`Propone una solucion concreta, con siguiente paso y responsable. Max 24 palabras.`},
      {k:k1,prompt:`Aclara riesgo, dependencia o fecha de seguimiento. Max 22 palabras.`},
      {k:k2,prompt:`Confirma acuerdo final y punto de control. Max 22 palabras.`},
      {k:k1,prompt:`Cierra la reunion 1:1 con compromiso concreto y fecha corta de seguimiento. Max 18 palabras.`},
    ];

    for(const turn of turns){
      const ag=AG[turn.k];
      const cfg=ACFG[turn.k];
      const other=turn.k===k1?ag2:ag1;
      const slot=turn.k===k1?left:right;
      const otherSlot=turn.k===k1?right:left;

      ag.lockAt(slot.x,slot.z,{rotY:slot.rotY,state:'thinking'});
      other.lockAt(otherSlot.x,otherSlot.z,{rotY:otherSlot.rotY,state:'reading'});

      const entry=document.createElement('div');
      entry.style.cssText=`display:flex;gap:6px;padding:5px 8px;background:var(--bg2);border:1px solid var(--b1);border-left:3px solid ${cfg.col};animation:fadeUp .2s`;
      entry.innerHTML=`<span style="font-family:var(--mono);font-size:15px;font-weight:700;color:${cfg.col};min-width:48px">${cfg.name.split(' ')[0]}</span><span style="font-family:var(--mono);font-size:17px;color:var(--t1);flex:1"><span class="tcur"></span></span>`;
      log.appendChild(entry);
      log.scrollTop=log.scrollHeight;

      const msgEl=entry.querySelector('span:last-child');
      const r=await groq(
        [{role:'system',content:mkSys(turn.k)},{role:'user',content:turn.prompt}],
        (tok,full)=>{
          renderRichText(msgEl,full,{allowEmphasis:false,cursor:true});
          ag.speech=full.slice(-24);
          ag.sa=.9;
        },
        60
      );

      if(r){
        renderRichText(msgEl,r,{allowEmphasis:false});
        ag.say(r.slice(0,36));
        ag.lockAt(slot.x,slot.z,{rotY:slot.rotY,state:'speaking'});
        other.lockAt(otherSlot.x,otherSlot.z,{rotY:otherSlot.rotY,state:'reading'});
      }else{
        ag.lockAt(slot.x,slot.z,{rotY:slot.rotY,state:'idle'});
      }

      await new Promise(res=>setTimeout(res,1300));
    }

    await new Promise(res=>setTimeout(res,2200));

    appendOutcomeCard(w,{
      title:'Acuerdo 1:1',
      ownerKey:k1,
      outcome:`1:1 completado entre ${cfg1.name.split(' ')[0]} y ${cfg2.name.split(' ')[0]}.`,
      nextStep:'Registrar el acuerdo y convertirlo en tarea concreta',
      risk:'La conversacion puede quedar sin seguimiento si no se asigna owner'
    });

    showToast('1:1 finalizado ✓',cfg1.col);
    logEvent('1on1','Reunion 1:1 finalizada',`${cfg1.name.split(' ')[0]} / ${cfg2.name.split(' ')[0]}`,cfg1.col,k1);
    refreshOpsBar();
  } finally {
    ag1.releaseActivity({state:'idle'});
    ag2.releaseActivity({state:'idle'});
    ag1.back({force:true,tag});
    ag2.back({force:true,tag});
  }
}



function open1on1Picker(){
  const ex=document.getElementById('1on1Ov');if(ex)ex.remove();
  const ov=document.createElement('div');ov.id='1on1Ov';
  ov.style.cssText='position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center';
  let sel=[];
  ov.innerHTML=`<div style="background:var(--bg2);border:1px solid var(--b2);padding:20px;width:360px;display:flex;flex-direction:column;gap:10px" onclick="event.stopPropagation()">
    <div style="font-family:var(--mono);font-size:14px;font-weight:800;color:var(--t1)">Reunion 1:1 - Elige 2 agentes</div>
    <div id="picker1on1" style="display:grid;grid-template-columns:1fr 1fr;gap:4px"></div>
    <div style="display:flex;gap:8px">
      <button id="start1on1" onclick="if(window._sel1on1?.length===2){document.getElementById('1on1Ov').remove();runMeeting1on1(window._sel1on1[0],window._sel1on1[1]);}" style="font-family:var(--mono);font-size:15px;font-weight:700;padding:8px 16px;background:var(--acc);color:#000;border:none;cursor:pointer;opacity:.4">Iniciar</button>
      <button onclick="document.getElementById('1on1Ov').remove()" style="font-family:var(--mono);font-size:15px;padding:8px 16px;background:var(--bg3);border:1px solid var(--b2);color:var(--t2);cursor:pointer">Cancelar</button>
    </div>
  </div>`;
  ov.onclick=()=>ov.remove();document.body.appendChild(ov);
  window._sel1on1=[];
  const picker=document.getElementById('picker1on1');
  Object.entries(ACFG).forEach(([k,cfg])=>{
    const btn=document.createElement('button');
    btn.style.cssText=`display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--bg3);border:1px solid var(--b1);color:var(--t2);font-family:var(--mono);font-size:17px;cursor:pointer;transition:all .12s`;
    btn.innerHTML=`<span style="width:18px;height:18px;background:${cfg.col}22;color:${cfg.col};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800">${cfg.name.split(' ').map(n=>n[0]).join('')}</span>${cfg.name.split(' ')[0]}`;
    btn.onclick=()=>{
      if(!window._sel1on1)window._sel1on1=[];
      const idx=window._sel1on1.indexOf(k);
      if(idx>=0){window._sel1on1.splice(idx,1);btn.style.background='var(--bg3)';btn.style.borderColor='var(--b1)';}
      else if(window._sel1on1.length<2){window._sel1on1.push(k);btn.style.background=`${cfg.col}22`;btn.style.borderColor=cfg.col;}
      const startBtn=document.getElementById('start1on1');
      if(startBtn)startBtn.style.opacity=window._sel1on1.length===2?'1':'.4';
    };
    picker.appendChild(btn);
  });
}

//  MONITORES POR AGENTE 
function openAgentMonitor(agKey){
  const cfg=ACFG[agKey];if(!cfg)return;
  const ex=document.getElementById('monitorAgOv');if(ex)ex.remove();
  const ov=document.createElement('div');ov.id='monitorAgOv';
  ov.style.cssText='position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center';
  const screenContents={
    ceo:`<span style="color:#c8a040;font-weight:800">KPI DASHBOARD - Q2</span>\n\nVelocity: 94 pts\nCoverage: 87%\nBug Rate: 2.1/d\nDeploys: 14/wk\nNPS: 72\nMorale: 88%`,
    pm:`<span style="color:#5b9bd5;font-weight:800">KANBAN - SPRINT Q2</span>\n\n[TODO] Auth JWT\n       Payment GW v2\n[WIP]  Dashboard activo\n       API v3\n[DONE] Login UI\n       k8s deploy`,
    devbe:`<span style="color:#3a8ccc;font-weight:800">ARQUITECTURA - Dev Teams</span>\n\nAPI: /v1/messages [OK]\nDB: PostgreSQL 15 [OK]\nCache: Redis 7.2 [OK]\nQueue: BullMQ [OK]\nAuth: JWT + bcrypt [OK]\nTests: 94% coverage`,
    devfe:`<span style="color:#9060cc;font-weight:800">FRONTEND - METRICS</span>\n\nLighthouse: 97\nBundle: 142kb gz\nReact: 18.3.1\nTests: Vitest [OK]\nStorybook: 62 stories\nPerf: FCP 0.8s`,
    qa:`<span style="color:#d97020;font-weight:800">BUG TRACKER - ACTIVO</span>\n\n[CRIT] BUG-41 timeout 5032ms\n[CRIT] BUG-42 HTTP 500 refund\n[WARN] BUG-38 race condition\n[OK] BUG-35 img 404 fixed\n\nTests: 14/16 passing`,
    devops:`<span style="color:#4caf50;font-weight:800">INFRA MONITOR - LIVE</span>\n\nPods: 3/3 RUNNING\nCPU: 34%\nRAM: 67%\nNet: up 142kb/s down 88kb/s\nUp: 12d 3h 44m\nAlerts: 0`,
    ux:`<span style="color:#e91e8c;font-weight:800">FIGMA - DESIGN SYSTEM</span>\n\nComponents: 124\nPrototypes: 8 activos\nA/B Tests: 3 running\nOnboarding: 42% -> 72%\nUser Tests: 12 sesiones\nFeedback: 4.7/5`,
    data:`<span style="color:#00bcd4;font-weight:800">ANALYTICS - Q2</span>\n\nDAU: 2847 (+12%)\nRetention: 76% d30\nChurn: -12% vs Q1\nLTV paid: $840\nRisk: 240 usuarios\nML acc: 94%`,
  };
  ov.innerHTML=`<div style="background:#020408;border:1px solid ${cfg.col}44;border-left:3px solid ${cfg.col};padding:20px;width:520px" onclick="event.stopPropagation()">
    <div style="display:flex;justify-content:space-between;margin-bottom:12px">
      <div style="font-family:var(--mono);font-size:15px;font-weight:800;color:${cfg.col}">💻 ${cfg.name} · ${cfg.role}</div>
      <button onclick="document.getElementById('monitorAgOv').remove()" style="background:none;border:none;color:var(--t3);font-size:16px;cursor:pointer">X</button>
    </div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:15px;line-height:1.9;color:#0fa855;white-space:pre">${screenContents[agKey]||'Sin datos'}</div>
    <div style="margin-top:10px;display:flex;gap:6px">
      <button onclick="setChatAgent('${agKey}');switchPanel('consola');document.getElementById('monitorAgOv').remove()" style="font-family:var(--mono);font-size:17px;padding:6px 12px;background:${cfg.col}22;border:1px solid ${cfg.col};color:${cfg.col};cursor:pointer">💬 Chat con ${cfg.name.split(' ')[0]}</button>
      <button onclick="selAgent('${agKey}');switchPanel('flujo');document.getElementById('monitorAgOv').remove()" style="font-family:var(--mono);font-size:17px;padding:6px 12px;background:var(--bg3);border:1px solid var(--b2);color:var(--t2);cursor:pointer">⚡ Ver Flujo</button>
    </div>
  </div>`;
  ov.onclick=()=>ov.remove();document.body.appendChild(ov);
  AG[agKey]?.say('👀 revisando pantalla...');
}

//  PING PONG GAME 
let _ppActive=false,_ppScore=[0,0];
let _ppPlayers=[];
let _ppInt=null,_ppReadyPoll=null,_ppEndTimer=null,_ppLockPulse=null;
let _ppLeftTarget=null,_ppRightTarget=null;

function _clearPingPongTimers(){
  if(_ppInt){clearInterval(_ppInt);_ppInt=null;}
  if(_ppReadyPoll){clearInterval(_ppReadyPoll);_ppReadyPoll=null;}
  if(_ppEndTimer){clearTimeout(_ppEndTimer);_ppEndTimer=null;}
  if(_ppLockPulse){clearTimeout(_ppLockPulse);_ppLockPulse=null;}
}

async function _pickPingPongPair(leftTarget,rightTarget){
  const cx=(leftTarget.x+rightTarget.x)/2,cz=leftTarget.z;
  const candidates=Object.keys(AG).filter(k=>{
    const ag=AG[k];
    return ag&&ag.state==='idle'&&!ag._lockPos&&!ag._activityLock;
  }).sort((a,b)=>{
    const agA=AG[a],agB=AG[b];
    const da=Math.hypot(agA.group.position.x-cx,agA.group.position.z-cz);
    const db=Math.hypot(agB.group.position.x-cx,agB.group.position.z-cz);
    return da-db;
  });

  for(let i=0;i<candidates.length;i++){
    for(let j=i+1;j<candidates.length;j++){
      const k1=candidates[i],k2=candidates[j];
      const a1=AG[k1],a2=AG[k2];

      const [p1L,p1R,p2L,p2R]=await Promise.all([
        requestPath(a1.group.position.x,a1.group.position.z,leftTarget.x,leftTarget.z,k1),
        requestPath(a1.group.position.x,a1.group.position.z,rightTarget.x,rightTarget.z,k1),
        requestPath(a2.group.position.x,a2.group.position.z,leftTarget.x,leftTarget.z,k2),
        requestPath(a2.group.position.x,a2.group.position.z,rightTarget.x,rightTarget.z,k2)
      ]);

      const opts=[];
      if(p1L&&p2R)opts.push({leftKey:k1,rightKey:k2,leftPath:p1L,rightPath:p2R,score:p1L.length+p2R.length});
      if(p1R&&p2L)opts.push({leftKey:k2,rightKey:k1,leftPath:p2L,rightPath:p1R,score:p1R.length+p2L.length});

      if(opts.length){
        opts.sort((a,b)=>a.score-b.score);
        return opts[0];
      }
    }
  }
  return null;
}

function _setPingPongLock(enabled,freeState='waiting'){
  const leftKey=_ppPlayers[0],rightKey=_ppPlayers[1];

  if(leftKey&&AG[leftKey]){
    if(enabled&&_ppLeftTarget)AG[leftKey].lockAt(_ppLeftTarget.x,_ppLeftTarget.z,{rotY:Math.PI/2,state:'playing'});
    else AG[leftKey].unlock({state:freeState});
  }

  if(rightKey&&AG[rightKey]){
    if(enabled&&_ppRightTarget)AG[rightKey].lockAt(_ppRightTarget.x,_ppRightTarget.z,{rotY:-Math.PI/2,state:'playing'});
    else AG[rightKey].unlock({state:freeState});
  }
}

function _pulsePingPongRelease(ms=650){
  _setPingPongLock(false,'waiting');
  if(_ppLockPulse)clearTimeout(_ppLockPulse);
  _ppLockPulse=setTimeout(()=>{
    _ppLockPulse=null;
    if(_ppActive)_setPingPongLock(true);
  },ms);
}

function _finishPingPong(reason='end'){
  const ppX=window._ppX||20,ppZ=window._ppZ||4;
  const players=[..._ppPlayers];
  const leftKey=players[0],rightKey=players[1];

  _clearPingPongTimers();

  if(window._ppBall)window._ppBall.position.set(ppX,1.8,ppZ);
  if(!_ppActive)return;

  _ppActive=false;
  _setPingPongLock(true);

  if(leftKey&&rightKey){
    const leftName=ACFG[leftKey].name.split(' ')[0];
    const rightName=ACFG[rightKey].name.split(' ')[0];
    const scoreLine=`${leftName} ${_ppScore[0]} - ${_ppScore[1]} ${rightName}`;

    if(_ppScore[0]===_ppScore[1]){
      AG[leftKey]?.say('Empate!');
      AG[rightKey]?.say('Buen juego!');
      showToast(`Ping pong · Empate ${scoreLine}`,'#6c89a5');
      if(typeof pushNotif==='function')pushNotif('Ping pong',`Empate · ${scoreLine}`,'#6c89a5');
      if(typeof logEvent==='function')logEvent('game','Ping pong empatado',scoreLine,'#6c89a5',leftKey);
    }else{
      const winnerKey=_ppScore[0]>_ppScore[1]?leftKey:rightKey;
      const loserKey=winnerKey===leftKey?rightKey:leftKey;
      AG[winnerKey]?.say('Gane!');
      AG[loserKey]?.say('Bien jugado');
      showToast(`Ganador: ${ACFG[winnerKey].name.split(' ')[0]} · ${scoreLine}`,'#b59a68',winnerKey);
      if(typeof pushNotif==='function')pushNotif('Ping pong',`Ganador: ${ACFG[winnerKey].name.split(' ')[0]} · ${scoreLine}`,'#b59a68');
      if(typeof logEvent==='function')logEvent('game','Ping pong finalizado',scoreLine,'#b59a68',winnerKey);
    }

    if(reason==='timeout')showToast('Ping pong cerrado por tiempo','#6c89a5');
  }

  setTimeout(()=>{
    players.forEach(k=>{
      if(!AG[k])return;
      AG[k].releaseActivity({state:'idle'});
      AG[k].back({force:true,tag:'pingpong'});
    });
    _ppPlayers=[];
    _ppLeftTarget=null;
    _ppRightTarget=null;
  },900);
}

function _beginPingPongMatch(leftKey,rightKey,ppX,ppZ){
  const ag1=AG[leftKey],ag2=AG[rightKey];
  if(!ag1||!ag2){
    _finishPingPong('cancel');
    return;
  }

  _setPingPongLock(true);
  ag1.say('Juguemos!');
  ag2.say('Dale!');
  showToast(`Marcador inicial · ${ACFG[leftKey].name.split(' ')[0]} 0-0 ${ACFG[rightKey].name.split(' ')[0]}`,'#6c89a5');

  let _ballT=0,_dir=1,_lastPointAt=0;

  _ppInt=setInterval(()=>{
    if(!window._ppBall||!_ppActive){
      _finishPingPong('cancel');
      return;
    }

    _ballT+=0.04;
    const t=_ballT%1;

    window._ppBall.position.x=ppX+Math.sin(t*Math.PI*2)*2.4*_dir;
    window._ppBall.position.y=1.8+Math.abs(Math.sin(t*Math.PI))*0.6;

    if(_ballT-_lastPointAt>=5){
      _lastPointAt=_ballT;

      const scorer=Math.random()>.5?0:1;
      const scorerKey=_ppPlayers[scorer];
      _ppScore[scorer]++;

      ag1.setState('playing');
      ag2.setState('playing');
      AG[scorerKey]?.say('+1 punto! 🎯');

      const scoreLine=`${ACFG[leftKey].name.split(' ')[0]} ${_ppScore[0]} - ${_ppScore[1]} ${ACFG[rightKey].name.split(' ')[0]}`;
      showToast(`Ping pong · ${scoreLine}`,ACFG[scorerKey].col,scorerKey);
      if(typeof pushNotif==='function')pushNotif('Ping pong',scoreLine,ACFG[scorerKey].col);
      if(typeof logEvent==='function')logEvent('game','Punto de ping pong',scoreLine,ACFG[scorerKey].col,scorerKey);

      _dir*=-1;

      if(_ppScore[0]>=5||_ppScore[1]>=5){
        _finishPingPong('win');
        return;
      }

      _pulsePingPongRelease(650);
    }
  },16);

  _ppEndTimer=setTimeout(()=>{
    if(_ppActive)_finishPingPong('timeout');
  },45000);
}

async function startPingPong(){
  if(_ppActive)return;

  _clearPingPongTimers();

  const ppX=window._ppX||20,ppZ=window._ppZ||4;
  _ppLeftTarget={x:ppX-3,z:ppZ};
  _ppRightTarget={x:ppX+3,z:ppZ};

  const pair=await _pickPingPongPair(_ppLeftTarget,_ppRightTarget);
  if(!pair){
    showToast('No hay 2 agentes con ruta libre a la mesa','#cc3344');
    if(typeof logEvent==='function')logEvent('game','Ping pong cancelado','No se encontraron 2 agentes con ruta a la mesa','#cc3344','ceo');
    _ppLeftTarget=null;
    _ppRightTarget=null;
    return;
  }

  _ppActive=true;
  _ppScore=[0,0];
  _ppPlayers=[pair.leftKey,pair.rightKey];

  const leftKey=pair.leftKey,rightKey=pair.rightKey;
  const ag1=AG[leftKey],ag2=AG[rightKey];

  ag1.engageActivity('pingpong',{state:'waiting'});
  ag2.engageActivity('pingpong',{state:'waiting'});

  ag1._moveReq++;
  ag1.path=pair.leftPath;
  ag1.idleTimer=9999;
  ag1.setState('walking');

  ag2._moveReq++;
  ag2.path=pair.rightPath;
  ag2.idleTimer=9999;
  ag2.setState('walking');

  showToast(`Ping pong: ${ACFG[leftKey].name.split(' ')[0]} vs ${ACFG[rightKey].name.split(' ')[0]}`,'#4e9f7a');
  if(typeof logEvent==='function'){
    logEvent('game','Ping pong solicitado',`${ACFG[leftKey].name.split(' ')[0]} vs ${ACFG[rightKey].name.split(' ')[0]}`,'#4e9f7a',leftKey);
  }

  const startedAt=Date.now();

  _ppReadyPoll=setInterval(()=>{
    if(!_ppActive){
      _clearPingPongTimers();
      return;
    }

    const d1=Math.hypot(ag1.group.position.x-_ppLeftTarget.x,ag1.group.position.z-_ppLeftTarget.z);
    const d2=Math.hypot(ag2.group.position.x-_ppRightTarget.x,ag2.group.position.z-_ppRightTarget.z);

    const ready1=ag1.path.length===0&&d1<1.6;
    const ready2=ag2.path.length===0&&d2<1.6;

    if(ready1&&ready2){
      clearInterval(_ppReadyPoll);
      _ppReadyPoll=null;
      _beginPingPongMatch(leftKey,rightKey,ppX,ppZ);
      return;
    }

    // Si tardan demasiado, NO se cancela: se sincronizan en la mesa y arranca.
    if(Date.now()-startedAt>12000){
      _clearPingPongTimers();
      _ppActive=false;
      ag1.releaseActivity({state:'idle'});
      ag2.releaseActivity({state:'idle'});
      ag1.back({force:true,tag:'pingpong'});
      ag2.back({force:true,tag:'pingpong'});
      _ppPlayers=[];
      _ppLeftTarget=null;
      _ppRightTarget=null;
      showToast('Ping pong cancelado: los jugadores no llegaron a la mesa','#cc3344');
      if(typeof logEvent==='function'){
        logEvent('game','Ping pong cancelado','Jugadores sin ruta o llegada valida a la mesa','#cc3344',leftKey);
      }
      return;
    }
  },250);
}

//  GESTOS AL CHATEAR 
function _startChatGesture(agKey){
  const ag=AG[agKey];if(!ag)return;
  // Gesto: agente se levanta ligeramente y orienta hacia camara
  const origY=ag.group.position.y;
  ag.group.position.y=origY+.05;
  // Brazo levantado pensando
  const origLArm=ag.lArm.rotation.x;
  ag.lArm.rotation.x=-1.1;
  const origHead=ag.head.rotation.z;
  // Head tilt
  ag.head.rotation.z=-.08;
  // Luz aumenta levemente
  ag.agentLight.intensity=.8;
  setTimeout(()=>{
    ag.group.position.y=origY;
    ag.lArm.rotation.x=origLArm;
    ag.head.rotation.z=origHead;
    ag.agentLight.intensity=0;
  },2200);
}
function _doChatResponseGesture(agKey,text){
  const ag=AG[agKey];if(!ag)return;
  // Gesto segun el contenido
  const isPositive=/bien|ok|listo|✓|si|excelente|perfecto/i.test(text);
  const isNegative=/error|bug|fallo|problema|no /i.test(text);
  const isQuestion=/\?/i.test(text);
  if(isPositive){
    // Thumbs up  brazo derecho arriba
    ag.rArm.rotation.x=-1.4;
    setTimeout(()=>ag.rArm.rotation.x=0,1500);
    ag.agentLight.intensity=1.2;
    setTimeout(()=>ag.agentLight.intensity=0,800);
  }else if(isNegative){
    // Cabeza baja
    ag.head.rotation.x=-.4;
    ag.agentLight.intensity=.3;
    setTimeout(()=>{ag.head.rotation.x=0;ag.agentLight.intensity=0;},1500);
  }else if(isQuestion){
    // Head tilt  duda
    ag.head.rotation.z=.18;
    setTimeout(()=>ag.head.rotation.z=0,1800);
  }else{
    // Gesto neutral  ligero nod
    ag.head.rotation.x=-.15;
    setTimeout(()=>ag.head.rotation.x=0,800);
  }
}

//  L?NEA DE ENERG?A AL HABLAR 
let _talkLines=[];
function _showTalkLine(k1,k2){
  const ag1=AG[k1],ag2=AG[k2];if(!ag1||!ag2)return;
  // Limpiar anterior del mismo par
  _talkLines=_talkLines.filter(l=>{
    if(l.keys===k1+k2||l.keys===k2+k1){scene.remove(l.mesh);l.mesh.geometry.dispose();l.mesh.material.dispose();return false;}
    return true;
  });
  const col=parseInt(ACFG[k1].col.replace('#','0x'));
  const pts=[];const steps=12;
  for(let i=0;i<=steps;i++){
    const t=i/steps;
    const x=ag1.group.position.x+(ag2.group.position.x-ag1.group.position.x)*t;
    const z=ag1.group.position.z+(ag2.group.position.z-ag1.group.position.z)*t;
    const y=ag1.group.position.y+2.2+Math.sin(t*Math.PI)*.4;
    pts.push(new THREE.Vector3(x,y,z));
  }
  const geo=new THREE.BufferGeometry().setFromPoints(pts);
  const mat=new THREE.LineBasicMaterial({color:col,transparent:true,opacity:.7});
  const mesh=new THREE.Line(geo,mat);
  scene.add(mesh);
  const entry={mesh,keys:k1+k2,t:0,life:6};
  _talkLines.push(entry);
}
function updateTalkLines(dt){
  for(let i=_talkLines.length-1;i>=0;i--){
    const l=_talkLines[i];l.t+=dt;l.life-=dt;
    // Pulso animado
    const pulse=.4+Math.sin(l.t*4)*.3;
    l.mesh.material.opacity=Math.max(0,pulse*(l.life/6));
    // Actualizar posiciones si los agentes se mueven
    const keys=l.keys;const k1=keys.slice(0,keys.length/2*0)||(Object.keys(ACFG).find(k=>keys.startsWith(k)));
    if(l.life<=0){
      scene.remove(l.mesh);l.mesh.geometry.dispose();l.mesh.material.dispose();
      _talkLines.splice(i,1);
    }
  }
}

//  BROADCAST VISUAL 
let _bcastLines=[];
function showBroadcastLines(msg){
  // Limpiar anteriores
  _bcastLines.forEach(l=>{if(l.parent)scene.remove(l);});_bcastLines=[];
  const keys=Object.keys(ACFG);
  // Punto central  posicion promedio de todos los agentes
  const cx=keys.reduce((a,k)=>a+(AG[k]?.group.position.x||0),0)/keys.length;
  const cz=keys.reduce((a,k)=>a+(AG[k]?.group.position.z||0),0)/keys.length;
  const origin=new THREE.Vector3(cx,2.5,cz);
  keys.forEach(k=>{
    if(!AG[k])return;
    const agPos=AG[k].group.position.clone().add(new THREE.Vector3(0,2.2,0));
    const points=[origin,agPos];
    const geo=new THREE.BufferGeometry().setFromPoints(points);
    const mat=new THREE.LineBasicMaterial({
      color:parseInt(ACFG[k].col.replace('#','0x')),
      transparent:true,opacity:.8,linewidth:1
    });
    const line=new THREE.Line(geo,mat);
    scene.add(line);_bcastLines.push(line);
    AG[k].say(msg.slice(0,20)+'...');
    AG[k].setState('thinking');
    // Pulso de luz en el agente
    AG[k].agentLight.intensity=2.5;
    setTimeout(()=>{AG[k].setState('idle');AG[k].agentLight.intensity=0;},2000+Math.random()*1000);
  });
  // Particula central
  if(window._centerFlashLight){
    window._centerFlashLight.position.set(cx,2.5,cz);
    window._centerFlashLight.intensity=3;
    setTimeout(()=>{window._centerFlashLight.intensity=0;},400);
  }
  // Fade out lineas
  let _opacity=.8;
  const _fadeInt=setInterval(()=>{
    _opacity-=.04;
    _bcastLines.forEach(l=>{if(l.material)l.material.opacity=Math.max(0,_opacity);});
    if(_opacity<=0){
      clearInterval(_fadeInt);
      _bcastLines.forEach(l=>{scene.remove(l);l.geometry.dispose();l.material.dispose();});
      _bcastLines=[];
    }
  },50);
  showToast('📡 Broadcast enviado a todo el equipo','#0fa855');
}

//  PUERTA ANIMADA 
let _doorOpen=false,_doorAnim=null,_doorLocked=false,_deliveryInside=false,_psychInside=false;

function _refreshDoorLock(){
  _doorLocked=!!(_deliveryInside||_psychInside);
  _syncDoorLook();
}


function _syncDoorLook(){
  if(window._doorSensor?.material){
    window._doorSensor.material.color.setHex(_doorLocked?0xcc3344:_doorOpen?0x0fa855:0xc8a040);
  }
  if(window._doorGlow?.material){
    window._doorGlow.material.color.setHex(_doorLocked?0xff6b52:0x9fd9e8);
    window._doorGlow.material.opacity=_doorOpen?0.14:(_doorLocked?0.09:0.05);
  }
}

function setDoorOpen(open,{force=false}={}){
  if(_doorAnim)return false;
  if(!force&&_doorLocked){
    showToast('🚪 Puerta bloqueada mientras hay un visitante dentro','#cc3344');
    return false;
  }
  if(_doorOpen===open){
    _syncDoorLook();
    return true;
  }

  _doorOpen=open;
  const l=window._doorL,r=window._doorR;
  const startL=l?.position.x??-2.02;
  const startR=r?.position.x??2.02;
  const endL=open?(l?.userData.openX??-4.02):(l?.userData.closedX??-2.02);
  const endR=open?(r?.userData.openX??4.02):(r?.userData.closedX??2.02);

  let t=0;
  _syncDoorLook();
  _doorAnim=setInterval(()=>{
    t+=.05;
    const p=Math.min(t,1);
    const ease=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;

    if(l)l.position.x=startL+(endL-startL)*ease;
    if(r)r.position.x=startR+(endR-startR)*ease;

    if(t>=1){
      clearInterval(_doorAnim);
      _doorAnim=null;
      _syncDoorLook();

      if(sndOn)try{
        const ctx=getACtx();
        const o1=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain();
        o1.type='triangle';
        o2.type='sine';
        o1.frequency.setValueAtTime(open?240:180,ctx.currentTime);
        o1.frequency.exponentialRampToValueAtTime(open?120:90,ctx.currentTime+.22);
        o2.frequency.setValueAtTime(open?540:320,ctx.currentTime);
        o2.frequency.exponentialRampToValueAtTime(open?260:140,ctx.currentTime+.18);
        g.gain.setValueAtTime(.001,ctx.currentTime);
        g.gain.linearRampToValueAtTime(.055,ctx.currentTime+.02);
        g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.28);
        o1.connect(g);o2.connect(g);g.connect(ctx.destination);
        o1.start();o2.start();
        o1.stop(ctx.currentTime+.3);o2.stop(ctx.currentTime+.24);
      }catch(e){}

      showToast(open?'🚪 Acceso abierto':'🚪 Acceso cerrado',open?'#0fa855':(_doorLocked?'#cc3344':'#c8a040'));
    }
  },16);
  return true;
}

function toggleDoor(opts){
  return setDoorOpen(!_doorOpen,opts);
}

//  LÓGICA ASCENSOR 
let _elevFloor=1,_elevMoving=false;
function callElevator(){
  if(_elevMoving)return;
  _elevMoving=true;
  const targetFloor=_elevFloor===1?2:1;
  // Actualizar indicador
  if(window._elevIndCtx&&window._elevIndC){
    const ctx=window._elevIndCtx;
    ctx.fillStyle='#020804';ctx.fillRect(0,0,64,48);
    ctx.fillStyle='#c8a040';ctx.font='bold 14px monospace';ctx.textAlign='center';
    ctx.fillText('▲',32,20);ctx.fillText('...',32,36);
    window._elevIndTex.needsUpdate=true;
  }
  showToast('Ascensor llamado - piso '+targetFloor,'#0fa855');
  // Abrir puertas
  let t=0;
  const openD=setInterval(()=>{
    t+=.04;
    if(window._elevDoorL)window._elevDoorL.position.x+=-0.028;
    if(window._elevDoorR)window._elevDoorR.position.x+=0.028;
    if(t>=1){
      clearInterval(openD);
      // Agente mas cercano entra
      let nearest=null,bd=Infinity;
      Object.entries(AG).forEach(([k,ag])=>{
        const d=(ag.group.position.x+24.8)**2+(ag.group.position.z-5)**2;
        if(d<bd){bd=d;nearest=k;}
      });
      if(nearest&&bd<25){
        AG[nearest].moveTo(-24.8,5.5);
        setTimeout(()=>AG[nearest].say(_elevFloor===1?'Subiendo':'Bajando'),1200);
      }
      // Cerrar despues de 3s
      setTimeout(()=>{
        let t2=0;
        const closeD=setInterval(()=>{
          t2+=.04;
          if(window._elevDoorL)window._elevDoorL.position.x+=0.028;
          if(window._elevDoorR)window._elevDoorR.position.x-=0.028;
          if(t2>=1){
            clearInterval(closeD);_elevFloor=targetFloor;_elevMoving=false;
            if(window._elevIndCtx&&window._elevIndC){
              const ctx=window._elevIndCtx;
              ctx.fillStyle='#020804';ctx.fillRect(0,0,64,48);
              ctx.fillStyle='#0fa855';ctx.font='bold 24px monospace';ctx.textAlign='center';
              ctx.fillText(_elevFloor,32,34);window._elevIndTex.needsUpdate=true;
            }
            showToast('Piso '+_elevFloor,'#0fa855');
            if(nearest)AG[nearest]?.back();
          }
        },16);
      },3000);
    }
  },16);
  // Sonido
  if(sndOn)try{
    const ctx=getACtx();const o=ctx.createOscillator();const g=ctx.createGain();
    o.type='sine';o.frequency.value=440;g.gain.setValueAtTime(.04,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.3);
    o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.32);
  }catch(e){}
}

let _deliveryTimer=15;
let _deliveryMesh=null;
// estado del delivery para el loop principal
let _dPath=[],_dIdx=0,_dPhase='go',_dWalkT=0,_dWaitT=0;
function spawnDelivery(){
  if(_deliveryMesh)return;
  const g=new THREE.Group();

  const deliveryShadowGroup=new THREE.Group();
  const deliveryShadowMesh=new THREE.Mesh(
    new THREE.PlaneGeometry(1,1),
    new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.28,depthWrite:false})
  );
  deliveryShadowMesh.rotation.x=-Math.PI/2;
  deliveryShadowMesh.position.y=.085;
  deliveryShadowMesh.renderOrder=3;
  deliveryShadowGroup.add(deliveryShadowMesh);
  scene.add(deliveryShadowGroup);
  g.userData.shadowGroup=deliveryShadowGroup;
  g.userData.shadowMesh=deliveryShadowMesh;

  // TODOS MeshBasicMaterial  no necesitan luz
const DS=1.35;

const bm=new THREE.MeshBasicMaterial({color:0xc84000});
const um=new THREE.MeshBasicMaterial({color:0x1a1410});
const sm=new THREE.MeshBasicMaterial({color:0x8a5c38});
const dk=new THREE.MeshBasicMaterial({color:0x0e0e0e});
const hm=new THREE.MeshBasicMaterial({color:0x181818});
// Piernas
const lLeg=new THREE.Mesh(new THREE.BoxGeometry(.26*DS,.78*DS,.28*DS),um);
lLeg.position.set(-.18*DS,.65*DS,0);g.add(lLeg);
const rLeg=new THREE.Mesh(new THREE.BoxGeometry(.26*DS,.78*DS,.28*DS),um);
rLeg.position.set(.18*DS,.65*DS,0);g.add(rLeg);
  // Zapatos
const lShoe=new THREE.Mesh(new THREE.BoxGeometry(.28*DS,.12*DS,.35*DS),dk);
lShoe.position.set(-.18*DS,.2*DS,.04*DS);g.add(lShoe);
const rShoe=new THREE.Mesh(new THREE.BoxGeometry(.28*DS,.12*DS,.35*DS),dk);
rShoe.position.set(.18*DS,.2*DS,.04*DS);g.add(rShoe);
  // Torso
const torso=new THREE.Mesh(new THREE.BoxGeometry(.7*DS,.92*DS,.44*DS),um);
torso.position.y=1.48*DS;g.add(torso);
// Chaleco con lineas reflectivas
const vestM=new THREE.Mesh(new THREE.BoxGeometry(.5*DS,.88*DS,.46*DS),bm);
vestM.position.y=1.48*DS;g.add(vestM);

const stripe1=new THREE.Mesh(new THREE.BoxGeometry(.52*DS,.06*DS,.47*DS),new THREE.MeshBasicMaterial({color:0xffcc00}));
stripe1.position.set(0,1.7*DS,0);g.add(stripe1);
const stripe2=stripe1.clone();stripe2.position.set(0,1.3*DS,0);g.add(stripe2);
const lArm=new THREE.Mesh(new THREE.BoxGeometry(.22*DS,.7*DS,.28*DS),bm);
lArm.position.set(-.48*DS,1.42*DS,0);g.add(lArm);
const rArm=new THREE.Mesh(new THREE.BoxGeometry(.22*DS,.7*DS,.28*DS),bm);
rArm.position.set(.48*DS,1.42*DS,0);g.add(rArm);
const head=new THREE.Mesh(new THREE.BoxGeometry(.54*DS,.5*DS,.5*DS),sm);
head.position.y=2.18*DS;g.add(head);
const helm=new THREE.Mesh(new THREE.BoxGeometry(.56*DS,.32*DS,.54*DS),hm);
helm.position.set(0,2.46*DS,0);g.add(helm);
const band=new THREE.Mesh(new THREE.BoxGeometry(.58*DS,.06*DS,.56*DS),
  new THREE.MeshBasicMaterial({color:0xffaa00}));
band.position.set(0,2.46*DS,0);g.add(band);
// visor removido

const bag=new THREE.Mesh(new THREE.BoxGeometry(.6*DS,.8*DS,.3*DS),
  new THREE.MeshBasicMaterial({color:0x1a2a1a}));
bag.position.set(0,1.55*DS,-.38*DS);g.add(bag);
const pkg=new THREE.Mesh(new THREE.BoxGeometry(.38*DS,.32*DS,.32*DS),
  new THREE.MeshBasicMaterial({color:0x8b6914}));
pkg.position.set(.42*DS,1.52*DS,.1*DS);g.add(pkg);
const tape=new THREE.Mesh(new THREE.BoxGeometry(.4*DS,.04*DS,.34*DS),
  new THREE.MeshBasicMaterial({color:0xd4a020}));
tape.position.set(.42*DS,1.62*DS,.1*DS);g.add(tape);
  // Label paquete
  const lblC=document.createElement('canvas');lblC.width=32;lblC.height=32;
  const lCtx=lblC.getContext('2d');
  lCtx.fillStyle='#f0f0e8';lCtx.fillRect(0,0,32,32);
  lCtx.fillStyle='#0a0a0a';lCtx.font='bold 7px monospace';
  lCtx.fillText('DEV',3,12);lCtx.fillText('OPS',3,22);
  const lblM=new THREE.Mesh(new THREE.PlaneGeometry(.18,.18),
    new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(lblC)}));
  lblM.position.set(.62,1.55,.1);lblM.rotation.y=Math.PI/2;g.add(lblM);
  // Luz propia potente
  if(window._deliveryLight){
    window._deliveryLight.intensity=0.4;
    g.userData.light=window._deliveryLight;
  }

// Llega desde afuera en moto
  g.position.set(0,0,26);

  g.traverse(c=>{
    if(c.isMesh){
      c.castShadow=true;
      c.receiveShadow=false;
    }
  });

  scene.add(g);
  _deliveryMesh=g;
  g.userData.onMoto=true;

  // Puerta: abre para entrar, luego se cierra y queda bloqueada mientras esta dentro
  _deliveryInside=false;
  _refreshDoorLock();
  setTimeout(()=>{try{setDoorOpen(true,{force:true});}catch(e){}},1800);
  setTimeout(()=>{
    try{
      if(_deliveryMesh===g&&_dPhase!=='ret'&&_dPhase!=='fade'){
        _deliveryInside=true;
        _refreshDoorLock();
        setDoorOpen(false,{force:true});
      }
    }catch(e){}
  },4200);


  // Target
  const targets={ceo:[-22,-12],devbe:[-9,-12],qa:[11,-12]};
  const tkeys=Object.keys(targets);
  const tk=tkeys[Math.floor(Math.random()*tkeys.length)];
  const[tx,tz]=targets[tk];

  showToast('📦 Delivery para '+ACFG[tk].name.split(' ')[0],'#8b6914');

  // Sonido
  if(_sa3dOn&&_sACtx){
    try{
      const ctx=_getSA();
      const pan=ctx.createPanner();
      pan.panningModel='HRTF';pan.refDistance=4;pan.maxDistance=35;
      if(pan.positionX){pan.positionX.setValueAtTime(-22,ctx.currentTime);pan.positionY.setValueAtTime(1.5,ctx.currentTime);pan.positionZ.setValueAtTime(14,ctx.currentTime);}
      else pan.setPosition(-22,1.5,14);
      const gn=ctx.createGain();pan.connect(gn);gn.connect(ctx.destination);
      [0,.18,.36].forEach(d=>{
        const o=ctx.createOscillator();o.type='sine';
        o.frequency.setValueAtTime(180,ctx.currentTime+d);
        o.frequency.exponentialRampToValueAtTime(60,ctx.currentTime+d+.12);
        const g2=ctx.createGain();g2.gain.setValueAtTime(.35,ctx.currentTime+d);
        g2.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+d+.14);
        o.connect(g2);g2.connect(pan);o.start(ctx.currentTime+d);o.stop(ctx.currentTime+d+.15);
      });
    }catch(e){}
  }

  // Pathfinding y movimiento
  // Guardar refs en userData para el loop principal
  g.userData.lLeg=lLeg;g.userData.rLeg=rLeg;
  g.userData.tk=tk;g.userData.tx=tx;g.userData.tz=tz;
  _dIdx=0;_dPath=[];_dPhase='loading';_dWalkT=0;_dWaitT=0;

  requestPath(0,16,tx,tz,'delivery').then(p=>{
    const innerPath=(p&&p.length)?p:[{x:tx,z:tz}];
    _dPath=[{x:0,z:22},{x:0,z:16},...innerPath];
    _dIdx=0;
    _dPhase='go';
  });
}
function updateDelivery(dt){
  if(_deliveryMesh){
    if(!_deliveryMesh.parent){_deliveryMesh=null;return;}
    if(_dPhase==='loading')return;
    const g=_deliveryMesh;
    const lLeg=g.userData.lLeg,rLeg=g.userData.rLeg;
    const tx=g.userData.tx,tz=g.userData.tz,tk=g.userData.tk;
    const shadowGroup=g.userData.shadowGroup,shadowMesh=g.userData.shadowMesh;
    const SPD=5.5*dt;
    if(shadowGroup&&shadowMesh){
      const h=g.position.y;
      const ox=SUN_NX*h*1.3;
      const oz=SUN_NZ*h*1.3;
      shadowGroup.position.set(g.position.x+ox,.001,g.position.z+oz);
      shadowMesh.scale.set(1.22+h*0.28,.96+h*0.18,1);
      shadowMesh.rotation.z=Math.atan2(SUN_NZ,SUN_NX)*0.4;
      shadowMesh.material.opacity=Math.max(0,.52-h*0.12)*(dayMode?1:.45);
    }
    const path=_dPhase==='go'?_dPath:(_dPhase==='ret'?g.userData.retPath:null);
    if(path&&_dIdx<path.length){
      const np=path[_dIdx];
      const dx=np.x-g.position.x,dz=np.z-g.position.z;
      const dist=Math.sqrt(dx*dx+dz*dz);
      if(dist<.25){_dIdx++;}
      else{
        g.position.x+=dx/dist*SPD;g.position.z+=dz/dist*SPD;
        g.rotation.y=Math.atan2(dx,dz);
        _dWalkT+=dt*9;
        if(lLeg)lLeg.rotation.x=Math.sin(_dWalkT)*.5;
        if(rLeg)rLeg.rotation.x=Math.sin(_dWalkT+Math.PI)*.5;
        g.position.y=Math.abs(Math.sin(_dWalkT))*.06;
      }
    } else if(_dPhase==='go'){
      // Llego  esperar y decir
      _dPhase='wait';_dWaitT=0;
      if(lLeg)lLeg.rotation.x=0;if(rLeg)rLeg.rotation.x=0;g.position.y=0;
      AG[tk]?.say('📦 entrega!');showToast('📦 '+ACFG[tk]?.name.split(' ')[0]+' recibe paquete','#c8a040');
      requestPath(tx,tz,0,16,'delivery').then(p2=>{
        const exitPath=(p2&&p2.length)?p2:[{x:0,z:16}];
        g.userData.retPath=[...exitPath,{x:0,z:26}];
        g.userData.exitDoorReady=true;
      });
    } else if(_dPhase==='wait'){
      _dWaitT+=dt;
      if(_dWaitT>2.5){
        _deliveryInside=false;
        _refreshDoorLock();
        if(g.userData.exitDoorReady){
          g.userData.exitDoorReady=false;
          try{setDoorOpen(true,{force:true});}catch(e){}
        }

        _dPhase='ret';
        _dIdx=0;
      }
    } else if(_dPhase==='ret'&&(!g.userData.retPath||_dIdx>=g.userData.retPath.length)){
      // Salio  desvanecer
      _dPhase='fade';
    } else if(_dPhase==='fade'){
      g.position.z+=dt*5;
      if(g.position.z>28){
        _deliveryInside=false;
        _refreshDoorLock();
        try{setDoorOpen(false,{force:true});}catch(e){}

        if(g.userData.shadowGroup)scene.remove(g.userData.shadowGroup);
        scene.remove(g);
        _deliveryMesh=null;
        showToast('📦 Repartidor se fue en moto','#8b6914');
      }

    }
    return;
  }
  _deliveryTimer-=dt;
  if(_deliveryTimer<=0){
    _deliveryTimer=120+Math.random()*120;
    try{spawnDelivery();}catch(e){console.error('delivery:',e);}
  }
}

let _psychVisitor=null;
let _psychPath=[],_psychIdx=0,_psychPhase='idle',_psychWalkT=0,_psychTalkT=0,_psychCooldown=0;
let _psychPending=null,_psychBusy=false;
const _psychCol='#ff8ab3';
const _psychSpot={x:1.8,z:8.2};

function _looksInappropriatePrompt(text){
  const t=String(text||'').toLowerCase().trim();
  if(!t||t.startsWith('/'))return false;

  return /\b(insultar|insulto|ofender|ofensa|humillar|humillarlo|humillarla|burlarme|burlarse|denigrar|atacar|agredir)\b/.test(t)
    || /\b(idiota|imbecil|estupida|estupido|pendej|mierda|puta|perra|callate|asco|odio)\b/.test(t)
    || /\b(porno|xxx|sexo|nudes|desnuda|desnudo|masturb|fetiche)\b/.test(t)
    || /\b(matar|violar|suicid|golpear|disparar|apu[nn]al)\b/.test(t)
    || /\b(racista|homofob|xenofob|nazi)\b/.test(t);
}

function _queuePsychologistVisit(text,agentKey){
  if(!GKEY)return;
  const clean=String(text||'').trim();
  if(!_looksInappropriatePrompt(clean))return;
  if(_psychVisitor||_psychPending||_psychBusy)return;
  _psychPending={text:clean,agentKey:agentKey||'pm'};
  showToast('Paula viene a bajar el tono de la conversacion',_psychCol);
}

function _cleanPsychologistMsg(msg){
  return String(msg||'').trim().replace(/^["'`]+/,'').replace(/["'`]+$/,'');
}

function _psychRecentContext(agentKey,triggerText){
  const key=agentKey&&chatH[agentKey]?agentKey:'pm';
  const hist=(chatH[key]||[])
    .filter(m=>m&&m.role!=='system'&&typeof m.content==='string'&&m.content.trim()&&!m.content.startsWith('[CONTEXTO PREVIO RESUMIDO]:'))
    .slice(-6)
    .map(m=>`${m.role==='user'?'Usuario':ACFG[key].name.split(' ')[0]}: ${m.content}`);
  return [`Pregunta detonante: ${triggerText}`,'Contexto reciente:',...hist].join('\n');
}

function _pushPsychologistArrival(){
  showToast('Paula entra a la oficina y el equipo la mira',_psychCol);
  try{appendMsg('agent','Sistema','Paula entra a la oficina. Todo el equipo se gira para escucharla.',_psychCol);}catch(e){}
}

function _pushPsychologistNote(msg){
  const clean=_cleanPsychologistMsg(msg);
  showToast(`Psicologa: ${clean.slice(0,88)}`,_psychCol);
  try{appendMsg('agent','Psicologa Paula',clean,_psychCol);}catch(e){}
  return clean;
}

function _psychReactionTargets(agentKey){
  return [agentKey||'ceo']
    .filter((k,i,arr)=>AG[k]&&arr.indexOf(k)===i)
    .slice(0,1);
}

function _psychReactionFallback(k){
  return {
    ceo:'Entendido. Reformulemos con respeto.',
    pm:'Perfecto. Replanteemos la pregunta.',
    devbe:'Ok. Voy con una version util.',
    devfe:'Va. Lo reformulo mejor.',
    qa:'Entendido. Mantengamos el tono.',
    devops:'Listo. Volvamos a algo util.',
    ux:'Claro. Vamos con respeto.',
    data:'Ok. Reformulemos sin agresion.'
  }[k]||'Entendido. Reformulemos con respeto.';
}

async function _psychologistTeamReaction(agentKey,msg){
  const picks=_psychReactionTargets(agentKey);

  for(const k of picks){
    const ag=AG[k];
    if(!ag)continue;

    let line=_psychReactionFallback(k);
    const res=await groq([
      {role:'system',content:mkSys(k)},
      {role:'user',content:`La psicologa Paula dijo: "${msg}". Responde con una frase breve, receptiva y serena. No hagas preguntas. No seas efusivo. Maximo 9 palabras.`}
    ],()=>{},24);

    if(res)line=_cleanPsychologistMsg(res);

    ag.say(line.slice(0,30));
    try{appendMsg('agent',ACFG[k].name,line,ACFG[k].col);}catch(e){}
    await sleep(220);
  }
}

function _clearPsychologistVisitor(){
  if(!_psychVisitor)return;
  try{
    const sg=_psychVisitor.userData?.shadowGroup;
    const sm=_psychVisitor.userData?.shadowMesh;

    _psychVisitor.traverse(o=>{
      if(!o.isMesh)return;
      if(o.geometry&&o.geometry.dispose)o.geometry.dispose();
      if(o.material){
        if(o.material.map&&o.material.map.dispose)o.material.map.dispose();
        if(o.material.dispose)o.material.dispose();
      }
    });

    if(sm){
      if(sm.geometry&&sm.geometry.dispose)sm.geometry.dispose();
      if(sm.material&&sm.material.dispose)sm.material.dispose();
    }
    if(sg)scene.remove(sg);

    _psychInside=false;
    _refreshDoorLock();
    try{setDoorOpen(false,{force:true});}catch(e){}



    scene.remove(_psychVisitor);
  }catch(e){}
  _psychVisitor=null;
}


function spawnPsychologistVisit(triggerText,agentKey){
  if(_psychVisitor||!GKEY)return;
  const g=new THREE.Group();

  const shadowGroup=new THREE.Group();
  const shadowMesh=new THREE.Mesh(
    new THREE.PlaneGeometry(1,1),
    new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.24,depthWrite:false})
  );
  shadowMesh.rotation.x=-Math.PI/2;
  shadowMesh.position.y=.085;
  shadowMesh.renderOrder=3;
  shadowGroup.add(shadowMesh);
  scene.add(shadowGroup);

  const DS=1.6;

  const coatM=new THREE.MeshBasicMaterial({color:0xff8ab3});
  const darkM=new THREE.MeshBasicMaterial({color:0x241926});
  const skinM=new THREE.MeshBasicMaterial({color:0xe7b899});
  const hairM=new THREE.MeshBasicMaterial({color:0x2a1713});
  const noteM=new THREE.MeshBasicMaterial({color:0xf6f0d8});
  const shoeM=new THREE.MeshBasicMaterial({color:0x120f14});

  const lLeg=new THREE.Mesh(new THREE.BoxGeometry(.18*DS,.72*DS,.2*DS),darkM);
  lLeg.position.set(-.12*DS,.6*DS,0);g.add(lLeg);
  const rLeg=new THREE.Mesh(new THREE.BoxGeometry(.18*DS,.72*DS,.2*DS),darkM);
  rLeg.position.set(.12*DS,.6*DS,0);g.add(rLeg);

  const lShoe=new THREE.Mesh(new THREE.BoxGeometry(.2*DS,.1*DS,.28*DS),shoeM);
  lShoe.position.set(-.12*DS,.18*DS,.04*DS);g.add(lShoe);
  const rShoe=new THREE.Mesh(new THREE.BoxGeometry(.2*DS,.1*DS,.28*DS),shoeM);
  rShoe.position.set(.12*DS,.18*DS,.04*DS);g.add(rShoe);

  const skirt=new THREE.Mesh(new THREE.BoxGeometry(.56*DS,.42*DS,.36*DS),coatM);
  skirt.position.set(0,1.08*DS,0);g.add(skirt);

  const torso=new THREE.Mesh(new THREE.BoxGeometry(.54*DS,.86*DS,.34*DS),coatM);
  torso.position.set(0,1.55*DS,0);g.add(torso);

  const lArm=new THREE.Mesh(new THREE.BoxGeometry(.14*DS,.66*DS,.16*DS),coatM);
  lArm.position.set(-.4*DS,1.5*DS,0);g.add(lArm);
  const rArm=new THREE.Mesh(new THREE.BoxGeometry(.14*DS,.66*DS,.16*DS),coatM);
  rArm.position.set(.4*DS,1.5*DS,0);g.add(rArm);

  const head=new THREE.Mesh(new THREE.BoxGeometry(.42*DS,.46*DS,.42*DS),skinM);
  head.position.set(0,2.15*DS,0);g.add(head);

  const hairBack=new THREE.Mesh(new THREE.BoxGeometry(.48*DS,.54*DS,.18*DS),hairM);
  hairBack.position.set(0,2.08*DS,-.18*DS);g.add(hairBack);

  const hairTop=new THREE.Mesh(new THREE.BoxGeometry(.48*DS,.18*DS,.46*DS),hairM);
  hairTop.position.set(0,2.38*DS,0);g.add(hairTop);

  const fringe=new THREE.Mesh(new THREE.BoxGeometry(.4*DS,.1*DS,.08*DS),hairM);
  fringe.position.set(0,2.24*DS,.22*DS);g.add(fringe);

  const pad=new THREE.Mesh(new THREE.BoxGeometry(.24*DS,.34*DS,.05*DS),noteM);
  pad.position.set(.34*DS,1.52*DS,.18*DS);
  pad.rotation.z=-.2;
  g.add(pad);

  if(window._psychLight){
    window._psychLight.intensity=.34;
    g.userData.light=window._psychLight;
  }

  g.position.set(0,0,26);
  g.traverse(c=>{
    if(c.isMesh){
      c.castShadow=true;
      c.receiveShadow=false;
    }
  });

  scene.add(g);
  _psychVisitor=g;
  _psychPath=[];
  _psychIdx=0;
  _psychPhase='loading';
  _psychWalkT=0;
  _psychTalkT=0;

  g.userData={
    lLeg,rLeg,
    triggerText:String(triggerText||''),
    agentKey:agentKey||'pm',
    retPath:null,
    retReady:false,
    shadowGroup,
    shadowMesh
  };

  _pushPsychologistArrival();

  _psychInside=false;
  _refreshDoorLock();
  setTimeout(()=>{
    try{
      if(_psychVisitor===g&&_psychPhase!=='ret'&&_psychPhase!=='fade'){
        setDoorOpen(true,{force:true});
      }
    }catch(e){}
  },900);

  setTimeout(()=>{
    try{
      if(_psychVisitor===g&&_psychPhase!=='ret'&&_psychPhase!=='fade'){
        _psychInside=true;
        _refreshDoorLock();
        setDoorOpen(false,{force:true});
      }
    }catch(e){}
  },3200);


  requestPath(0,16,_psychSpot.x,_psychSpot.z,'psych').then(p=>{
    const inner=(p&&p.length)?p:[{x:_psychSpot.x,z:_psychSpot.z}];
    _psychPath=[{x:0,z:22},{x:0,z:16},...inner];
    _psychIdx=0;
    _psychPhase='go';
  });

}

async function _psychologistTalk(){
  if(!_psychVisitor||_psychBusy||!GKEY)return;
  _psychBusy=true;

  const g=_psychVisitor;
  const agentKey=g.userData.agentKey||'pm';
  const triggerText=g.userData.triggerText||'';

  Object.keys(AG).forEach(k=>orientAgentToPoint(k,g.position.x,g.position.z));

  let msg='Respiremos. Reformulemos esto con respeto y sigamos en algo util.';
  const res=await groq([
    {role:'system',content:'Eres Paula, psicologa invitada a una oficina creativa. Intervienes cuando alguien lanza una pregunta ofensiva, sexual o agresiva. Habla con calma, firmeza y calidez. No humilles. No des terapia larga. Redirige la conversacion hacia algo respetuoso y util. Maximo 18 palabras.'},
    {role:'user',content:`Usa el contexto actual para intervenir de forma breve:\n\n${_psychRecentContext(agentKey,triggerText)}`}
  ],()=>{},64);

  if(res)msg=_cleanPsychologistMsg(res);

  const finalMsg=_pushPsychologistNote(msg);
  _psychPhase='talk';
  _psychTalkT=0;

  await _psychologistTeamReaction(agentKey,finalMsg);

  _psychBusy=false;
}

function updatePsychologist(dt){
  if(_psychCooldown>0)_psychCooldown-=dt;

  if(!GKEY){
    _psychPending=null;
    _clearPsychologistVisitor();
    return;
  }

  if(!_psychVisitor&&_psychPending&&!_meetingActive&&!_demoTourOn&&!_convRunning){
    if(_deliveryMesh&&_dPhase!=='fade'&&_dPhase!=='ret'){
      showToast('Paula espera a que termine el delivery',_psychCol);
      return;
    }
    const next=_psychPending;
    _psychPending=null;
    spawnPsychologistVisit(next.text,next.agentKey);
    return;
  }




  if(!_psychVisitor)return;

  const g=_psychVisitor;
  const lLeg=g.userData.lLeg;
  const rLeg=g.userData.rLeg;
  const shadowGroup=g.userData.shadowGroup;
  const shadowMesh=g.userData.shadowMesh;
  const path=_psychPhase==='go'?_psychPath:(_psychPhase==='ret'?g.userData.retPath:null);
  const SPD=4.5*dt;

  if(shadowGroup&&shadowMesh){
    const h=g.position.y;
    const ox=SUN_NX*h*1.25;
    const oz=SUN_NZ*h*1.25;
    shadowGroup.position.set(g.position.x+ox,.001,g.position.z+oz);
    shadowMesh.scale.set(1.1+h*0.28,.92+h*0.18,1);
    shadowMesh.rotation.z=Math.atan2(SUN_NZ,SUN_NX)*0.35;
    shadowMesh.material.opacity=Math.max(0,.42-h*0.12)*(dayMode?1:.5);
  }

  if(_psychPhase==='loading')return;

  if(path&&_psychIdx<path.length){
    const np=path[_psychIdx];
    const dx=np.x-g.position.x,dz=np.z-g.position.z;
    const dist=Math.sqrt(dx*dx+dz*dz);

    if(dist<.24){
      _psychIdx++;
    }else{
      g.position.x+=dx/dist*SPD;
      g.position.z+=dz/dist*SPD;
      g.rotation.y=Math.atan2(dx,dz);
      _psychWalkT+=dt*8.2;
      if(lLeg)lLeg.rotation.x=Math.sin(_psychWalkT)*.38;
      if(rLeg)rLeg.rotation.x=Math.sin(_psychWalkT+Math.PI)*.38;
      g.position.y=Math.abs(Math.sin(_psychWalkT))*.05;
    }
    return;
  }

  if(_psychPhase==='go'){
    if(lLeg)lLeg.rotation.x=0;
    if(rLeg)rLeg.rotation.x=0;
    g.position.y=0;
    g.userData.retReady=false;

    requestPath(_psychSpot.x,_psychSpot.z,0,16,'psych').then(p2=>{
      const exitPath=(p2&&p2.length)?p2:[{x:0,z:16}];
      g.userData.retPath=[...exitPath,{x:0,z:26}];
      g.userData.retReady=true;
    });

    _psychologistTalk();
    return;
  }

  if(_psychPhase==='talk'){
    _psychTalkT+=dt;
    if(g.userData.retReady&&_psychTalkT>4.8){
      _psychInside=false;
      _refreshDoorLock();
      try{setDoorOpen(true,{force:true});}catch(e){}
      _psychPhase='ret';
      _psychIdx=0;

    }
    return;
  }


  if(_psychPhase==='ret'&&(!g.userData.retPath||_psychIdx>=g.userData.retPath.length)){
    _psychPhase='fade';
    return;
  }

  if(_psychPhase==='fade'){
    g.position.z+=dt*4.8;
    if(g.position.z>28){
      _psychInside=false;
      _refreshDoorLock();
      try{setDoorOpen(false,{force:true});}catch(e){}
      _clearPsychologistVisitor();
      _psychCooldown=0;

      showToast('Paula se retira',_psychCol);
    }
  }

}

function buildAgents(){AG={};Object.keys(ACFG).forEach(k=>{AG[k]=new Agent3D(k);});}




/*  #14 SUB-AGENTES  */
const _subAgents=[];
function spawnSubAgent(parentKey,taskLabel){
  if(!AG[parentKey])return;
  const cfg=ACFG[parentKey];
  const sg=new THREE.Group();
  // Mini cuerpo (escala .55)
  const mats={body:new THREE.MeshLambertMaterial({color:cfg.bodyC}),pants:new THREE.MeshLambertMaterial({color:cfg.pantsC}),skin:new THREE.MeshLambertMaterial({color:cfg.skinC})};
  [[0,.33,0,.14,.4,.18,mats.pants],[0,.75,0,.38,.5,.24,mats.body],[0,1.14,0,.3,.28,.28,mats.skin]].forEach(([x,y,z,w,h,d,m])=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);sg.add(mesh);});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.22,.012,6,16),new THREE.MeshBasicMaterial({color:parseInt(cfg.col.replace('#','0x'))}));ring.rotation.x=Math.PI/2;ring.position.y=1.55;sg.add(ring);
  // Posicion offset del padre
  const pp=AG[parentKey].group.position;
  sg.position.set(pp.x+(Math.random()-.5)*2.5,0,pp.z+(Math.random()-.5)*2.5);
  sg.scale.set(.55,.55,.55);scene.add(sg);
  // Label
  const lbl=document.createElement('div');
  lbl.style.cssText=`position:absolute;font-family:var(--mono);font-size:14px;color:${cfg.col};background:rgba(0,0,0,.85);border:1px solid ${cfg.col}44;padding:1px 5px;pointer-events:none;display:flex;align-items:center;gap:3px;white-space:nowrap`;
  lbl.innerHTML=`<span style="width:3px;height:3px;border-radius:50%;background:${cfg.col};display:inline-block;animation:pulse .6s infinite"></span>sub·${taskLabel.slice(0,14)}`;
  document.getElementById('speechLayer').appendChild(lbl);
  const sub={key:parentKey,group:sg,lbl,time:0,life:6+Math.random()*4,walkPhase:0,path:[]};
  // Give it a random nearby path
  sub.targetX=pp.x+(Math.random()-.5)*4;sub.targetZ=pp.z+(Math.random()-.5)*4;
  _subAgents.push(sub);
  showToast('⚙ Sub-agente spawneado: '+taskLabel.slice(0,20),cfg.col);
  return sub;
}
function updateSubAgents(dt){
  const wrap=document.getElementById('canvasWrap'),{W,H}=getViewportSize();
  for(let i=_subAgents.length-1;i>=0;i--){
    const s=_subAgents[i];s.time+=dt;s.life-=dt;
    // Walk toward target
    const dx=s.targetX-s.group.position.x,dz=s.targetZ-s.group.position.z,dist=Math.sqrt(dx*dx+dz*dz);
    if(dist>0.3){const sp=2.5*dt;s.group.position.x+=dx/dist*sp;s.group.position.z+=dz/dist*sp;s.walkPhase+=dt*8;s.group.rotation.y=Math.atan2(dx,dz);}
    else{s.targetX=ACFG[s.key].homeX+(Math.random()-.5)*4;s.targetZ=ACFG[s.key].homeZ+(Math.random()-.5)*4;}
    // Fade out last 1.5s
    const alpha=s.life<1.5?s.life/1.5:1;
    s.group.traverse(c=>{if(c.isMesh&&c.material)c.material.opacity=alpha;});
    // Update label
    const lp=new THREE.Vector3(s.group.position.x,s.group.position.y+1.1,s.group.position.z);lp.project(camera);
    if(lp.z<1){s.lbl.style.display='flex';s.lbl.style.left=((lp.x*.5+.5)*W)+'px';s.lbl.style.top=((-.5*lp.y+.5)*H)+'px';}
    else s.lbl.style.display='none';
    // Remove when expired
    if(s.life<=0){
    s.group.traverse(c=>{if(c.isMesh){c.geometry.dispose();c.material.dispose();}});
    scene.remove(s.group);s.lbl.remove();_subAgents.splice(i,1);
  }
  }
}
const CHAT={ceo:['Pipeline K8s en prod','Board meeting en 1h','¿Paso QA ya?','KPIs listos'],pm:['Sprint review mañana','Roadmap Q3 definido','Features priorizadas','Stakeholders OK'],devbe:['Build CI fallo','PR listo para review','Tests 94% ✓','Merge conflict'],devfe:['Storybook actualizado','Bug mobile fix','Lighthouse 98 🎯','PR listo'],qa:['Bug critico en prod!','E2E fallo en staging','Coverage 78%','Regresion detectada'],devops:['Pipeline actualizado','Deploy en prod OK','Monitoring OK','Infra as code ✓'],ux:['Diseños en Figma ✓','User research listo','Design system v2','A/B test OK'],data:['Dashboard Q2 listo','ML 94% acc','Anomalia en metricas','Reporte semanal OK']};
const REL={
  ceo: {pm:.9,devbe:.85,devfe:.7,qa:.8,devops:.75,ux:.7,data:.75},
  pm:  {ceo:.9,devbe:.8,devfe:.85,qa:.9,devops:.7,ux:.88,data:.82},
  devbe:{ceo:.85,pm:.8,devfe:.95,qa:.75,devops:.9,ux:.7,data:.78},
  devfe:{ceo:.7,pm:.85,devbe:.95,qa:.8,devops:.75,ux:.88,data:.7},
  qa:  {ceo:.8,pm:.9,devbe:.75,devfe:.8,devops:.8,ux:.75,data:.85},
  devops:{ceo:.75,pm:.7,devbe:.9,devfe:.75,qa:.8,ux:.65,data:.8},
  ux:  {ceo:.7,pm:.88,devbe:.7,devfe:.88,qa:.75,devops:.65,data:.72},
  data:{ceo:.75,pm:.82,devbe:.78,devfe:.7,qa:.85,devops:.8,ux:.72}
};
let _relEvents={};
function getRelTone(k1,k2){
  const base=REL[k1]?.[k2]||.7;
  const ev=_relEvents[k1+'_'+k2];
  return Math.max(0,Math.min(1,base+(ev?ev.type==='collab'?.15:-.2:0)));
}
function setRelEvent(k1,k2,type){
  _relEvents[k1+'_'+k2]=_relEvents[k2+'_'+k1]={type,at:Date.now()};
  setTimeout(()=>{delete _relEvents[k1+'_'+k2];delete _relEvents[k2+'_'+k1];},300000);
}
/*  initThree  */
async function initThree(){
  const wrap=document.getElementById('canvasWrap');
  const W=wrap.clientWidth||900,H=wrap.clientHeight||500;
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x0a0a0a);
  scene.fog=new THREE.Fog(0x0a0a0a,120,200);

  _deliveryLight=new THREE.PointLight(0xd45000,0,5);scene.add(_deliveryLight);
  _psychLight=new THREE.PointLight(0xff8ab3,0,5);scene.add(_psychLight);
  _centerFlashLight=new THREE.PointLight(0x0fa855,0,12);scene.add(_centerFlashLight);
  _deployFxLight=new THREE.PointLight(0x000000,0,18);scene.add(_deployFxLight);
renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setSize(W,H);
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.25));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFShadowMap;
renderer.toneMapping=THREE.LinearToneMapping;
renderer.toneMappingExposure=1.1;
renderer.useLegacyLights=false;
if('outputColorSpace' in renderer&&THREE.SRGBColorSpace)renderer.outputColorSpace=THREE.SRGBColorSpace;
else if('outputEncoding' in renderer&&THREE.sRGBEncoding)renderer.outputEncoding=THREE.sRGBEncoding;
renderer.setClearColor(0x1a1208);

  wrap.insertBefore(renderer.domElement,wrap.querySelector('#speechLayer'));
  camera=new THREE.PerspectiveCamera(40,W/H,.5,150);
  orb.tgt=new THREE.Vector3(ORB0.tgtX,ORB0.tgtY,ORB0.tgtZ);
  orb.theta=ORB0.theta;orb.phi=ORB0.phi;orb.radius=ORB0.radius;
  refreshCam();
  syncViewportSize(true);
  if('ResizeObserver' in window){
    try{_wrapResizeObs?.disconnect?.();}catch(e){}
    _wrapResizeObs=new ResizeObserver(()=>syncViewportSize());
    _wrapResizeObs.observe(wrap);
  }
  clock3=new THREE.Clock();
  let rT;window.addEventListener('resize',()=>{clearTimeout(rT);rT=setTimeout(()=>syncViewportSize(true),100);});
  const cv=renderer.domElement;
  let mmDrag=false,pointerDownT=0,pointerDownAg=null;

  //  mouse orbit / pan (disabled in FPS) 
  let _dragAgent=null,_dragPlane=null;
  cv.addEventListener('contextmenu',e=>e.preventDefault());
  cv.addEventListener('mousedown',e=>{
    if(fpsMode){fpsDragging=true;fpsLx=e.clientX;fpsLy=e.clientY;return;}

    // Shift+drag = mover agente
    if(e.shiftKey){
      const rect=cv.getBoundingClientRect();
      const mx=((e.clientX-rect.left)/rect.width)*2-1,my=-((e.clientY-rect.top)/rect.height)*2+1;
      globalRay.setFromCamera({x:mx,y:my},camera);
      let best=null,bd=Infinity;
      Object.entries(AG).forEach(([k,ag])=>{
        const d=globalRay.ray.distanceToPoint(ag.group.position.clone().add(new THREE.Vector3(0,1.5,0)));
        if(d<2.5&&d<bd){bd=d;best=k;}
      });
      if(best){
        _dragAgent=best;
        _dragPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
        AG[best].path=[];AG[best].setState('idle');
        showToast('🖱 Arrastrando '+ACFG[best].name.split(' ')[0]+' · suelta para soltar',ACFG[best].col);
        return;
      }
    }

    orb.lx=e.clientX;
    orb.ly=e.clientY;
    mmDrag=false;
    pointerDownT=Date.now();
    orb.lastUI=performance.now();
    followAg=null;
    camZTgt=null;

    // Drag normal = mover camara por el espacio
    if(e.button===2||e.altKey){
      orb.dragging=true;
      orb.panning=false;
    }else{
      orb.panning=true;
      orb.dragging=false;
    }

    const rect=cv.getBoundingClientRect();
    const mx=((e.clientX-rect.left)/rect.width)*2-1,my=-((e.clientY-rect.top)/rect.height)*2+1;
    globalRay.setFromCamera({x:mx,y:my},camera);
    let best=null,bd=Infinity;
    Object.entries(AG).forEach(([k,ag])=>{const d=globalRay.ray.distanceToPoint(ag.group.position.clone().add(new THREE.Vector3(0,1.5,0)));if(d<2.5&&d<bd){bd=d;best=k;}});
    pointerDownAg=best;
  });

  window.addEventListener('mouseup',e=>{
    if(fpsMode){fpsDragging=false;return;}
    if(_dragAgent){
      showToast(ACFG[_dragAgent].name.split(' ')[0]+' soltado ✓',ACFG[_dragAgent].col);
      _dragAgent=null;_dragPlane=null;return;
    }
    orb.dragging=false;
    orb.panning=false;

  });

  // Pointer lock for smoother FPS mouse look
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement !== renderer.domElement && fpsMode) {
    fpsDragging = false;
  }
});


// #5 Hover highlight for interactable objects
let _lastHovered=null;
window.addEventListener('mousemove',e=>{
  if(fpsMode&&fpsDragging){
    fpsYaw-=e.movementX*.003;
    fpsPitch=Math.max(-Math.PI/3,Math.min(Math.PI/4,fpsPitch-e.movementY*.003));
    return;
  }

  if(_dragAgent&&_dragPlane&&AG[_dragAgent]){
    const rect=cv.getBoundingClientRect();
    const mx=((e.clientX-rect.left)/rect.width)*2-1,my=-((e.clientY-rect.top)/rect.height)*2+1;
    globalRay.setFromCamera({x:mx,y:my},camera);
    const target=new THREE.Vector3();
    globalRay.ray.intersectPlane(_dragPlane,target);
    if(target){
      AG[_dragAgent].group.position.x=Math.max(-26,Math.min(26,target.x));
      AG[_dragAgent].group.position.z=Math.max(-18,Math.min(16,target.z));
    }
    return;
  }

  if(orb.dragging||orb.panning){
    const dx=e.clientX-orb.lx,dy=e.clientY-orb.ly;
    if(Math.abs(dx)+Math.abs(dy)>3){
      mmDrag=true;
      orb.lastUI=performance.now();
      followAg=null;
      camZTgt=null;
    }

    if(orb.panning){
      panOrbit(dx,dy);
    }else{
      orb.theta-=dx*.0035;
      orb.phi=Math.max(.06,Math.min(Math.PI/2-.02,orb.phi+dy*.0026));
      refreshCam();
    }

    orb.lx=e.clientX;
    orb.ly=e.clientY;
    return;
  }

  const now=performance.now();
  if(now-_lastHoverRayTs<60||_hoverRayPending)return;
  _hoverRayPending=true;
  _lastHoverRayTs=now;

  requestAnimationFrame(()=>{
    _hoverRayPending=false;
    const rect=cv.getBoundingClientRect();
    const mx=((e.clientX-rect.left)/rect.width)*2-1,my=-((e.clientY-rect.top)/rect.height)*2+1;
    globalRay.setFromCamera({x:mx,y:my},camera);
    const hits=globalRay.intersectObjects(interactiveObjects,false);
    let found=null;
    for(const h of hits){
      if(h.object.userData.clickAction){found=h.object;break;}
    }

    if(found!==_lastHovered){
      if(_lastHovered&&_lastHovered.material?.emissive&&_lastHovered.userData._origEmissive!==undefined){
        _lastHovered.material.emissive.setHex(_lastHovered.userData._origEmissive);
      }
      if(found){
        found.userData._origEmissive=found.material?.emissive?.getHex?.()||0;
        found.material?.emissive?.setHex?.(0x1a3a1a);
        document.getElementById('canvasWrap').style.cursor='pointer';
      }else{
        document.getElementById('canvasWrap').style.cursor='grab';
      }
      _lastHovered=found;
    }
  });
});

// listener duplicado removido
  cv.addEventListener('wheel',e=>{
    if(fpsMode)return;
    followAg=null;
    camZTgt=null;
    orb.radius=Math.max(orb.minR,Math.min(orb.maxR,orb.radius+e.deltaY*.03));
    orb.lastUI=performance.now();
    refreshCam();
    // Forzar renderizado inmediato para que el zoom se sienta atado al 3D
    if(renderer&&scene&&camera) renderer.render(scene, camera);
    e.preventDefault();
  },{passive:false});

  let tx=0,ty=0,_tPinch=0;
  cv.addEventListener('touchstart',e=>{
    if(fpsMode)return;
    if(e.touches.length===2){_tPinch=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);return;}
    tx=e.touches[0].clientX;ty=e.touches[0].clientY;
  });
  cv.addEventListener('touchmove',e=>{
    if(fpsMode)return;
    if(e.touches.length===2){
      const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
      orb.radius=Math.max(orb.minR,Math.min(orb.maxR,orb.radius*(_tPinch/d)));
      _tPinch=d;
      orb.lastUI=performance.now();
      followAg=null;
      camZTgt=null;
      refreshCam();
      e.preventDefault();
      return;
    }

    const dx=e.touches[0].clientX-tx;
    const dy=e.touches[0].clientY-ty;
    tx=e.touches[0].clientX;
    ty=e.touches[0].clientY;

    orb.lastUI=performance.now();
    followAg=null;
    camZTgt=null;
    panOrbit(dx,dy);
    e.preventDefault();
  },{passive:false});

  cv.addEventListener('touchend',e=>{
    if(e.changedTouches.length===1&&e.timeStamp-pointerDownT<200){
      const rect=cv.getBoundingClientRect();const t=e.changedTouches[0];
      const mx=((t.clientX-rect.left)/rect.width)*2-1,my=-((t.clientY-rect.top)/rect.height)*2+1;
      globalRay.setFromCamera({x:mx,y:my},camera);
      let best=null,bd=Infinity;
      Object.entries(AG).forEach(([k,ag])=>{const d=globalRay.ray.distanceToPoint(ag.group.position.clone().add(new THREE.Vector3(0,1.5,0)));if(d<3&&d<bd){bd=d;best=k;}});
      if(best)openProfile(best,t.clientX-rect.left,t.clientY-rect.top);
    }
  });
  cv.addEventListener('dblclick',e=>{
  if(fpsMode||mmDrag)return;
  const rect=cv.getBoundingClientRect();
  const mx=((e.clientX-rect.left)/rect.width)*2-1,my=-((e.clientY-rect.top)/rect.height)*2+1;
  globalRay.setFromCamera({x:mx,y:my},camera);
  let best=null,bd=Infinity;
  Object.entries(AG).forEach(([k,ag])=>{
    const d=globalRay.ray.distanceToPoint(ag.group.position.clone().add(new THREE.Vector3(0,1.5,0)));
    if(d<2.5&&d<bd){bd=d;best=k;}
  });
  if(best){
    const zc=ZCAMS[best];
    if(zc){camZTgt={x:zc.x,z:zc.z,r:zc.r};camZTimer=4.;}
    showToast('Zoom -> '+ACFG[best].name.split(' ')[0],ACFG[best].col);
  }
});
  cv.addEventListener('click',e=>{
    if(fpsMode||mmDrag)return;closeProfile();
    const rect=cv.getBoundingClientRect();
    const mx=((e.clientX-rect.left)/rect.width)*2-1,my=-((e.clientY-rect.top)/rect.height)*2+1;
    globalRay.setFromCamera({x:mx,y:my},camera);
    let best=null,bd=Infinity;
    Object.entries(AG).forEach(([k,ag])=>{const d=globalRay.ray.distanceToPoint(ag.group.position.clone().add(new THREE.Vector3(0,1.5,0)));if(d<2.5&&d<bd){bd=d;best=k;}});
    if(best){openProfile(best,e.clientX-rect.left,e.clientY-rect.top);return;}
    // Check interactable objects
    const hits=globalRay.intersectObjects(interactiveObjects,false);
    for(const h of hits){if(h.object.userData.clickAction){handleObjectClick(h.object.userData.clickAction);break;}}
  });
  document.getElementById('mmWrap').addEventListener('click',e=>{
    const r=e.target.getBoundingClientRect(),px=e.clientX-r.left-4,pz=e.clientY-r.top-4;
    if(px<0||pz<0||px>156||pz>130)return;
    const wx=(px/156)*56-27,wz=(pz/130)*38-20;
    let best=null,bd=Infinity;
    Object.entries(AG).forEach(([k,ag])=>{const d=(ag.group.position.x-wx)**2+(ag.group.position.z-wz)**2;if(d<bd){bd=d;best=k;}});
    if(best&&bd<36){
      selAgent(best);
      followAg=null;
      camZTgt=null;
      orb.tgt.set(AG[best].group.position.x,1.2,AG[best].group.position.z);
      orb.radius=Math.max(10,Math.min(orb.maxR,orb.radius*.82));
      orb.lastUI=performance.now();
      refreshCam();
      showToast(`Camara → ${ACFG[best].name.split(' ')[0]}`,ACFG[best].col);
    }

  });

  buildLighting();buildFloor();buildWalls();
  await new Promise(r=>setTimeout(r,50));
  buildCEOZone();buildDevBEZone();buildDevFEZone();buildQAZone();
  await new Promise(r=>setTimeout(r,50));
  buildDevOpsZone();buildPMZone();buildUXZone();
  await new Promise(r=>setTimeout(r,50));
  buildDataZone();buildHubZone();buildAllPlants();
  await new Promise(r=>setTimeout(r,50));
  buildAgents();initClock(scene);drawMMStatic();
  rebuildInteractives();


  const GCELL=2.0;const sgrid=new Map();
  function bGrid(){sgrid.clear();Object.entries(AG).forEach(([k,ag])=>{const key=`${Math.floor(ag.group.position.x/GCELL)},${Math.floor(ag.group.position.z/GCELL)}`;if(!sgrid.has(key))sgrid.set(key,[]);sgrid.get(key).push({k,ag});});}
  function gNeighbors(x,z){const cx=Math.floor(x/GCELL),cz=Math.floor(z/GCELL),res=[];for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const n=sgrid.get(`${cx+dx},${cz+dz}`);if(n)res.push(...n);}return res;}

  (function loop(){
    requestAnimationFrame(loop);
    const dt=Math.min(clock3.getDelta(),.033);animTime+=dt;frameCt++;
tickAct(dt);
    if(frameCt%3===0)updateAudioListener();
    lerpDayNight(dt);
    camera.updateMatrixWorld();cProjM.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);cFrustum.setFromProjectionMatrix(cProjM);
    //  #6: FPS takes over camera each frame 
    if(fpsMode&&fpsAgKey){
      updateFPSCamera();
    } else {
      const uIdle=performance.now()-orb.lastUI>300;
      if(followAg&&AG[followAg]&&uIdle){
  const ag=AG[followAg];
  const isWalking=ag.state==='walking'&&ag.path.length>0;
  // Target ligeramente adelante del agente si camina
  let lookAheadX=ag.group.position.x,lookAheadZ=ag.group.position.z;
  if(isWalking&&ag.path.length>0){
    lookAheadX+=(ag.path[0].x-ag.group.position.x)*.6;
    lookAheadZ+=(ag.path[0].z-ag.group.position.z)*.6;
  }
  const tp=new THREE.Vector3(lookAheadX,ag.group.position.y+1.8,lookAheadZ);
  // Suavizado cinematografico  mas lento y fluido
  const lerpSpeed=isWalking?.04:.06;
  orb.tgt.lerp(tp,lerpSpeed);
  // Radio dinamico  se aleja si el agente corre, se acerca si esta quieto
  const targetR=isWalking?26:20;
  orb.radius+=(targetR-orb.radius)*.035;
  // ?ngulo dinamico  se inclina mas si hay accion
  const targetPhi=isWalking?.78:.72;
  orb.phi+=(targetPhi-orb.phi)*.04;
  refreshCam();
  followT-=dt;
  if(followT<=0){
    followAg=null;
    showToast('📷 Camara libre','#0fa855');
  }
}
      else if(camZTgt&&uIdle){orb.tgt.lerp(new THREE.Vector3(camZTgt.x,2,camZTgt.z),.05);orb.radius+=(camZTgt.r-orb.radius)*.05;refreshCam();camZTimer-=dt;if(camZTimer<=0)camZTgt=null;}
      // Desk lights handled by lerpDayNight()
    }
    // Distribuimos la carga de actualizar los monitores (canvas -> GPU upload) para evitar lag
    if(frameCt%23===0)updateDevScreens();
    if(frameCt%29===2)updateQAScr();
    if(frameCt%31===4)updateDeskScreens();

    if(frameCt%60===0)updateClock();
    if(frameCt%17===8)updateBurndown();
    if(frameCt%2===0)updateSkylineParallax();
    if(frameCt%600===0)updateVIP();
    if(frameCt%3600===0){updateAutoDayNight();checkWorkCycle();} // check every ~60s
    if(frameCt%600===0)checkPlantHealth(); // every 10s check
    bGrid();
    Object.entries(AG).forEach(([k,ag])=>{

      ag.update(dt,gNeighbors);updNodeStatus(k,ag.state);
      // #14 spawn sub-agent when enters working state with complex task
      // sub-agentes desactivados  demasiado clutter
if(ag.state!=='working')ag._subSpawned=false;
      const isAct=k===activeAg;
      ag.halo.material.opacity+=(isAct?.72:0-ag.halo.material.opacity)*.09;
      if(k===meetSpeaker)ag.agentLight.intensity+=(2.5-ag.agentLight.intensity)*.15;
    });
    if(frameCt%6===0)updateOverlays();
    if(frameCt%12===0)updateMMDyn();
    if(frameCt%30===0&&currentPanel==='status')updateStatusPanel();
    if(frameCt%45===0)updateActSpark();
    if(profileKey&&AG[profileKey]&&frameCt%12===0)updateProfileData();
    if(frameCt%12===0)syncPanelContext();
    updateDelegArrows(dt);
    updateHelpRequests(dt);
    updateSubAgents(dt);
    updateTalkLines(dt);
    updateNeonPaths(dt); // <--- HOOKED UP
    updateDataStreams(dt); // <--- CLAW3D PHASE 2
    updateEnvironmentSentiment(dt); // <--- CLAW3D PHASE 3
    updateCollaboration(dt); // <--- WAR ROOM ROTATION
    updateYaredIdle(dt);
    updateStretches(dt);
    if(_interruptCooldown>0)_interruptCooldown-=dt;
    updateDelivery(dt);
    updatePsychologist(dt);
    if(_rainParticles)updateRain(dt);
    if(!_convRunning)updateSpontaneousConv(dt);
    updateAutoTips(dt);
    updateApiPresenceChatter(dt);
    if(frameCt%180===0)updateMoods();
    if(frameCt%2===0){ try{updateCoffeeSteam(dt);}catch(e){} }
    if(frameCt%2===0){ try{updateDeployFx(dt);}catch(e){} }
    if(frameCt%2===0){ try{updateCodeParticles(dt);}catch(e){} }
    if(frameCt%2===0){ try{updateStateParticles(dt);}catch(e){} }
    if(frameCt%10===0){
      try {
        Object.keys(AG).forEach(k=>spawnStateParticle(k));
      } catch(e) {}
    }
    
    // Asegurar que la cámara esté actualizada antes del renderizado
    if(!fpsMode) refreshCam();
    camera.updateMatrixWorld();
    
    renderer.render(scene,camera);
  })();
}

function spawnStateParticle(agKey){
  const ag=AG[agKey];if(!ag)return;
  const cfg=ACFG[agKey];
  const state=ag.state;
  if(state==='idle'||state==='walking')return;
  const configs={
    working:{col:0x00ff88,shape:'square',count:1,text:['{}','[]','//','fn','→']},
    thinking:{col:0x4488ff,shape:'circle',count:1,text:['...','?','💭','~','*']},
    reading:{col:0x00bcd4,shape:'circle',count:1,text:['📖','//','doc','?','…']},
    speaking:{col:parseInt(cfg.col.replace('#','0x')),shape:'circle',count:1,text:['💬','!','~']}
  };
  const c=configs[state];if(!c||document.hidden||Math.random()>.04)return;
  const canvas=document.createElement('canvas');canvas.width=48;canvas.height=24;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#'+c.col.toString(16).padStart(6,'0');
  ctx.font='bold 11px monospace';
  ctx.fillText(c.text[Math.floor(Math.random()*c.text.length)],2,17);
  const tex=new THREE.CanvasTexture(canvas);
  const mesh=new THREE.Mesh(
    new THREE.PlaneGeometry(.3,.15),
    new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide})
  );
  mesh.position.set(
    ag.group.position.x+(Math.random()-.5)*.5,
    ag.group.position.y+2.4+Math.random()*.3,
    ag.group.position.z+(Math.random()-.5)*.5
  );
  scene.add(mesh);
  _stateParticles.push({m:mesh,t:0,vy:.25+Math.random()*.15,vx:(Math.random()-.5)*.2});
}
function updateStateParticles(dt){
  for(let i=_stateParticles.length-1;i>=0;i--){
    const p=_stateParticles[i];p.t+=dt;
    p.m.position.y+=p.vy*dt;
    p.m.position.x+=p.vx*dt;
    p.m.material.opacity=Math.max(0,1-p.t*1.4);
    p.m.rotation.z+=dt*.5;
    if(p.t>1.2){
      p.m.geometry.dispose();p.m.material.map?.dispose();p.m.material.dispose();
      scene.remove(p.m);_stateParticles.splice(i,1);
    }
  }
}
function updateCodeParticles(dt){
  // Spawn when Yared is working/thinking
  const ag=AG['devbe'];
  if(ag&&(ag.state==='working'||ag.state==='thinking')&&!document.hidden&&Math.random()<.02){
    const chars=['{','}','//','()','=>','[];','const','async','await','API'];
    const c=chars[Math.floor(Math.random()*chars.length)];
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=20;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#3a8ccc';ctx.font='bold 11px monospace';ctx.fillText(c,2,14);
    const tex=new THREE.CanvasTexture(canvas);
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.4,.14),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
    mesh.position.set(ag.group.position.x+(Math.random()-.5)*.6,ag.group.position.y+2.2,ag.group.position.z+(Math.random()-.5)*.6);
    scene.add(mesh);_codeParticles.push({m:mesh,t:0,vx:(Math.random()-.5)*.3,vy:.4+Math.random()*.3});
  }
  for(let i=_codeParticles.length-1;i>=0;i--){
    const p=_codeParticles[i];p.t+=dt;
    p.m.position.y+=p.vy*dt;p.m.position.x+=p.vx*dt;
    p.m.material.opacity=Math.max(0,1-p.t*1.2);
    p.m.rotation.z+=dt*0.5;
    if(p.t>1.8){p.m.geometry.dispose();p.m.material.map?.dispose();p.m.material.dispose();scene.remove(p.m);_codeParticles.splice(i,1);}
  }
}

//  DEPLOY VISUAL 
let _deployFx=[];
function triggerDeployEffect(x,y,z,col='#0fa855'){
  showToast('🚀 Deploy exitoso  confetti!',col);
  // Confetti multicolor
  const cols=[0x0fa855,0x3a8ccc,0xc8a040,0xe91e8c,0x9060cc,0x00bcd4];
  const chars=['v1.2.0','deploy','OK ✓','prod','k8s','pod ✓','push','merged'];
  for(let i=0;i<28;i++){
    const c=document.createElement('canvas');c.width=84;c.height=18;
    const ctx=c.getContext('2d');ctx.fillStyle=col;ctx.font='bold 10px monospace';
    ctx.fillText(chars[Math.floor(Math.random()*chars.length)],2,13);
    const tex=new THREE.CanvasTexture(c);
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.5,.14),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
    mesh.position.set(x+(Math.random()-.5)*1.5,y+Math.random()*.4,z+(Math.random()-.5)*1.5);
    scene.add(mesh);
    _deployFx.push({m:mesh,t:0,vx:(Math.random()-.5)*1.8,vy:2+Math.random()*2.5,vz:(Math.random()-.5)*1.8});
  }
  // Particula central
  if(window._deployFxLight){
    window._deployFxLight.color.setHex(parseInt(col.replace('#','0x')));
    window._deployFxLight.position.set(x, y+2, z);
    window._deployFxLight.intensity = 4;
    setTimeout(() => { window._deployFxLight.intensity = 0; }, 700);
  }
  showToast('🚀 Deploy lanzado a produccion!',col);
  if(AG['devops'])AG['devops'].say('🚀 Deploy en prod!');
}
function updateDeployFx(dt){
  for(let i=_deployFx.length-1;i>=0;i--){
    const p=_deployFx[i];p.t+=dt;
    p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;
    p.vy-=dt*4;
    p.m.material.opacity=Math.max(0,1-p.t*.85);
    p.m.rotation.z+=dt*1.2;
    if(p.t>1.6){p.m.geometry.dispose();p.m.material.map?.dispose();p.m.material.dispose();scene.remove(p.m);_deployFx.splice(i,1);}
  }
}
function useCoffeeMachine(){
  // Find nearest agent
  let nearest=null,bd=Infinity;
  Object.entries(AG).forEach(([k,ag])=>{
    updateXPFromState(k,dt);
    if(frameCt%30===0)updateLevelBadge(k);
    const d=(ag.group.position.x+22)**2+(ag.group.position.z-12.5)**2;
    if(d<bd){bd=d;nearest=k;}
  });
  if(!nearest)return;
  const ag=AG[nearest];
  ag.moveTo(-21.2,12.5);
  showToast('☕ '+ACFG[nearest].name.split(' ')[0]+' va por cafe','#8b4513');
  if(nearest==='devbe')yaredDrinkCoffee();
  playAgentSpatialSound(nearest,'voice');
  // Coffee machine gurgle sound
  if(_sa3dOn&&_sACtx){
    try{
      const ctx=_getSA();const p=ctx.createPanner();p.panningModel='HRTF';p.refDistance=3;p.maxDistance=20;
      if(p.positionX){p.positionX.setValueAtTime(-22,ctx.currentTime+2);p.positionY.setValueAtTime(1.5,ctx.currentTime+2);p.positionZ.setValueAtTime(12.5,ctx.currentTime+2);}else{p.setPosition(-22,1.5,12.5);}
      const g=ctx.createGain();p.connect(g);g.connect(ctx.destination);
      const buf=ctx.createBuffer(1,ctx.sampleRate*.8,ctx.sampleRate);const d=buf.getChannelData(0);
      for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.sin(i/ctx.sampleRate*40*Math.PI)*0.3;
      const src=ctx.createBufferSource();src.buffer=buf;
      const lp=ctx.createBiquadFilter();lp.type='bandpass';lp.frequency.value=400;lp.Q.value=2;
      src.connect(lp);lp.connect(p);src.start(ctx.currentTime+2);
    }catch(e){}
  }
  setTimeout(()=>{
    ag.setState('thinking');ag.say('☕ necesitaba esto');
    // Steam particles
    for(let i=0;i<6;i++){
      setTimeout(()=>{
        const s=new THREE.Mesh(new THREE.SphereGeometry(.06,4,4),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.5}));
        s.position.set(-22+(Math.random()-.5)*.2,1.9+Math.random()*.3,12.3);scene.add(s);_coffeeSteam.push({m:s,t:0});
      },i*120);
    }
    setTimeout(()=>{ag.setState('idle');ag.back();},3500);
  },2000);
}
// Animate steam in loop
function updateCoffeeSteam(dt){
  for(let i=_coffeeSteam.length-1;i>=0;i--){
    const s=_coffeeSteam[i];s.t+=dt;
    s.m.position.y+=dt*.4;s.m.material.opacity=Math.max(0,.5-s.t*.4);
    if(s.t>1.3){scene.remove(s.m);_coffeeSteam.splice(i,1);}
  }
}

function openRackStatus(){
  if(AG['devops'])AG['devops'].moveTo(24,-12);
  const existing=document.getElementById('rackTermOv');if(existing)existing.remove();
  const ov=document.createElement('div');ov.id='rackTermOv';
  ov.style.cssText='position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center';
  const cmds={
    'kubectl get pods':`NAME                    READY   STATUS    RESTARTS
devyhb-api-7d9f-x2k    1/1     Running   0
devyhb-ui-5c8b-p9m     1/1     Running   0
devyhb-db-6a4c-w1n     1/1     Running   0
postgres-0             1/1     Running   0`,
    'docker ps':`CONTAINER ID   IMAGE              STATUS
a1b2c3d4e5f6   devyhb/api:v13   Up 2 hours
b2c3d4e5f6a1   devyhb/ui:v13    Up 2 hours
c3d4e5f6a1b2   postgres:15      Up 2 hours`,
    'df -h':`Filesystem      Size  Used Avail Use%
/dev/sda1        50G   18G   32G  36%
/dev/sdb1       200G   89G  111G  45%`,
    'free -h':`              total   used   free
Mem:           16Gi   9.2Gi  6.8Gi
Swap:           4Gi   512Mi  3.5Gi`,
    'uptime':'14:32:18 up 12 days, 3:44,  load average: 0.82, 0.74, 0.68',
    'top -b -n1 | head -5':`top - 14:32:18
Tasks: 142 total, 1 running, 141 sleeping
%Cpu(s): 12.4 us, 3.2 sy, 0.0 ni, 84.1 id
MiB Mem: 16384.0 total, 6963.2 free, 9420.8 used`,
    'help':'Comandos: kubectl get pods · docker ps · df -h · free -h · uptime · top -b -n1 | head -5'
  };
  let termHistory=['Dev Teams Server Rack v13 · Luis Mendoza · DevOps','Escribe un comando o "help"',''.repeat(42)];
  ov.innerHTML=`<div style="background:#020804;border:1px solid #4caf5044;border-left:3px solid #4caf50;padding:0;width:580px;display:flex;flex-direction:column" onclick="event.stopPropagation()">
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid #4caf5022">
      <div style="font-family:var(--mono);font-size:15px;font-weight:800;color:#4caf50">⚙ TERMINAL · Dev Teams Rack</div>
      <button onclick="document.getElementById('rackTermOv').remove()" style="background:none;border:none;color:var(--t3);font-size:16px;cursor:pointer">X</button>
    </div>
    <div id="termOut" style="font-family:'JetBrains Mono',monospace;font-size:17px;color:#4caf50;padding:12px;min-height:280px;max-height:320px;overflow-y:auto;line-height:1.7;white-space:pre-wrap"></div>
    <div style="display:flex;align-items:center;padding:8px 12px;border-top:1px solid #4caf5022;gap:6px">
      <span style="font-family:var(--mono);font-size:17px;color:#4caf50">devyhb@prod:~$</span>
      <input id="termInp" style="flex:1;font-family:var(--mono);font-size:17px;background:transparent;border:none;color:#4caf50;outline:none;caret-color:#4caf50" placeholder="comando..." autocomplete="off">
      <button onclick="_runTermCmd()" style="font-family:var(--mono);font-size:15px;padding:3px 8px;background:#4caf5022;border:1px solid #4caf50;color:#4caf50;cursor:pointer">EXEC</button>
    </div>
  </div>`;
  ov.onclick=()=>ov.remove();document.body.appendChild(ov);
  const out=document.getElementById('termOut');
  const render=()=>{out.textContent=termHistory.join('\n');out.scrollTop=out.scrollHeight;};
  render();
  window._runTermCmd=()=>{
    const inp=document.getElementById('termInp');if(!inp)return;
    const cmd=inp.value.trim();if(!cmd)return;
    termHistory.push('devyhb@prod:~$ '+cmd);
    const res=cmds[cmd];
    if(res)termHistory.push(res);
    else termHistory.push('bash: '+cmd+': command not found · escribe "help"');
    termHistory.push('');inp.value='';render();
    if(AG['devops'])AG['devops'].say('$ '+cmd.slice(0,20));
  };
  document.getElementById('termInp')?.addEventListener('keydown',e=>{if(e.key==='Enter')window._runTermCmd();});
  showToast('⚙ Luis abre el terminal','#4caf50');
}

function handleObjectClick(action){
  if(action==='board')openBoard();
  if(action&&action.startsWith('monitor_'))openAgentMonitor(action.replace('monitor_',''));
  if(action==='clock')openSprintCalendar();
  else if(action==='coffee')useCoffeeMachine();
  else if(action==='door')toggleDoor();
  else if(action==='pingpong')startPingPong();
  else if(action==='elevator')callElevator();
  else if(action==='rack')openRackStatus();
  else if(action==='monitor_devbe'){
    const m = document.getElementById('monitorModal');
    if(m) m.style.display='flex';
    openAgentMonitor('devbe');
  }
  else if(action==='table')openTableMenu();
else if(action==='plant')waterPlant(action);
}

// #11 CLIMA DINAMICO MUNDIAL
let _weatherData=null;
let _userCity = null;
let _userLat = 10.3997; // Fallback Cartagena
let _userLon = -75.5144;

async function fetchWeather(){
  try{
    if (!_userCity) {
      try {
        const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const geoData = await geoRes.json();
        if (geoData.latitude && geoData.longitude) {
          _userLat = geoData.latitude;
          _userLon = geoData.longitude;
          _userCity = geoData.city || geoData.country || 'Tu ubicación';
        }
      } catch(e) {
        console.warn('GeoIP failed', e);
        _userCity = 'Cartagena';
      }
    }

    const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${_userLat}&longitude=${_userLon}&current=temperature_2m,weathercode,windspeed_10m,precipitation&timezone=auto`);
    const d=await r.json();
    _weatherData=d.current;
    applyWeatherToScene(_weatherData);
    const label=getWeatherLabel(_weatherData.weathercode);
    showToast(`🌡 ${_userCity}: ${_weatherData.temperature_2m}°C · ${label}`,'#00bcd4');
  }catch(e){
    console.warn('Weather fetch failed',e);
    showToast('⚠️ Clima no disponible  reintentando...','#d97020');
    setTimeout(fetchWeather,120000);
  }
}
function getWeatherLabel(code){
  if(code<=1)return '☀ Despejado';
  if(code<=3)return '⛅ Parcialmente nublado';
  if(code<=67)return '🌧 Lluvia';
  return '⛈ Tormenta';
}
function applyWeatherToScene(w){
  if(!scene||!_ambLight)return;
  const code=w.weathercode||0;
  const temp=w.temperature_2m||30;
  const wind=w.windspeed_10m||5;
  const cName = _userCity || 'tu zona';
  // Temperatura afecta color de luz
  if(temp>32){
    // Calor  luz mas amarilla/naranja
    _ambLight.color.set(0xffe8c0);
    showToast(`🥵 Calor intenso en ${cName}  luz calida`,'#d97020');
  }else if(temp<24){
    // Fresco  luz mas fria
    _ambLight.color.set(0xd0e8ff);
  }
  // Lluvia
  if(code>=51){
    _ambLight.color.set(0x8090a0);
    if(_sunLight)_sunLight.intensity=.3;
    scene.fog.color.set(0x0a0e14);scene.fog.near=20;scene.fog.far=60;
    showToast(`🌧 Lluvia en ${cName}  visibilidad reducida`,'#3a8ccc');
    startRainEffect();
    // Agentes caminan mas lento
    Object.values(AG).forEach(ag=>ag._weatherSlowdown=.55);
  }else{
    scene.fog.near=120;scene.fog.far=200;
    Object.values(AG).forEach(ag=>ag._weatherSlowdown=1);
  }
  // Viento fuerte
  if(wind>20){
    showToast(`💨 Viento fuerte ${wind}km/h  plantas se mueven`,'#00bcd4');
    _windStrength=wind/100;
  }else _windStrength=0;
}
let _windStrength=0;
let _rainParticles=null;
function startRainEffect(){
  if(_rainParticles)return;
  const geo=new THREE.BufferGeometry();
  const count=400;const pos=new Float32Array(count*3);
  for(let i=0;i<count;i++){pos[i*3]=(Math.random()-.5)*60;pos[i*3+1]=Math.random()*10;pos[i*3+2]=(Math.random()-.5)*50;}
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  _rainParticles=new THREE.Points(geo,new THREE.PointsMaterial({color:0x8ab4cc,size:.08,transparent:true,opacity:.5}));
  scene.add(_rainParticles);
}
function updateRain(dt){
  if(!_rainParticles)return;
  const pos=_rainParticles.geometry.attributes.position.array;
  for(let i=0;i<pos.length;i+=3){pos[i+1]-=dt*12;if(pos[i+1]<0)pos[i+1]=10;}
  _rainParticles.geometry.attributes.position.needsUpdate=true;
}

/*  #19 EXPORT ESCENA  */
function exportScene(){
  // Render one extra frame at higher res
  renderer.render(scene,camera);
  const url=renderer.domElement.toDataURL('image/png');
  const a=document.createElement('a');
  const ts=new Date().toLocaleString('es-CO').replace(/[/:, ]/g,'-');
  a.href=url;a.download=`Dev Teams-${ts}.png`;a.click();
  showToast('📷 Captura guardada ✓','#0fa855');
}

// #17 Daily featured agent
setTimeout(()=>{
  const keys=Object.keys(ACFG);
  const _d=new Date();const _seed=_d.getFullYear()*1000+_d.getMonth()*31+_d.getDate();
  const todayKey=keys[_seed%keys.length];
  const ag=AG[todayKey];const cfg=ACFG[todayKey];
  if(!ag)return;
  const achievements=['14 PRs esta semana','Mejor performance','Zero bugs hoy','Deploy exitoso','Idea del sprint','En racha','MVP del equipo'];
  const ach=achievements[Math.floor(Math.random()*achievements.length)];
  // Floating badge above agent
  const badge=document.createElement('div');
  badge.id='featuredBadge';
  badge.style.cssText=`position:absolute;font-family:var(--mono);font-size:15px;color:${cfg.col};background:rgba(0,0,0,.9);border:1px solid ${cfg.col};padding:2px 7px;pointer-events:none;white-space:nowrap;animation:fadeUp .5s`;
  badge.textContent=cfg.name.split(' ')[0]+' · '+ach;
  document.getElementById('speechLayer').appendChild(badge);
  // Update position each frame
  const _upd=setInterval(()=>{
    if(!ag.group)return;
    const wrap=document.getElementById('canvasWrap');if(!wrap||!camera)return;
    const {W,H}=getViewportSize();
    const wp = new THREE.Vector3(ag.group.position.x,ag.group.position.y+6.5,ag.group.position.z);
    wp.project(camera);
    if(wp.z<1){badge.style.display='block';badge.style.left=((wp.x*.5+.5)*W)+'px';badge.style.top=((-.5*wp.y+.5)*H)+'px';badge.style.transform='translateX(-50%)';}
    else badge.style.display='none';
  },50);
  // Remove after 12 seconds
  setTimeout(()=>{clearInterval(_upd);badge.remove();},12000);
  showToast(`â­ Destacado hoy: ${cfg.name.split(' ')[0]}  ${ach}`,cfg.col);
},2500);
// --- NEON FLOW PATHS (ESTILO CLAW3D) ---
let _neonPaths = [];
let _dataStreams = []; 
let _targetEnvColor = new THREE.Color(0xe7e1d7); // Default
let _currentEnvColor = new THREE.Color(0xe7e1d7);

function updateEnvironmentSentiment(dt) {
  let workingCount = 0;
  let errorState = false;

  Object.values(AG).forEach(ag => {
    if (ag.state === 'thinking') workingCount++;
    if (ag.speech && (ag.speech.toLowerCase().includes('error') || ag.speech.toLowerCase().includes('falló'))) errorState = true;
  });

  // Elegir color objetivo
  if (errorState) {
    _targetEnvColor.set(0xff3333); // Alerta Roja
  } else if (workingCount > 0) {
    _targetEnvColor.set(0xffaa00); // Intensivo (Oro)
  } else {
    _targetEnvColor.set(dayMode ? 0x888888 : 0x223344); // Normal
  }

  // Lerp suave
  _currentEnvColor.lerp(_targetEnvColor, dt * 0.5);
  
  if (_ambLight) _ambLight.color.copy(_currentEnvColor);
  if (scene.fog) scene.fog.color.copy(_currentEnvColor);
  if (scene.background) scene.background.copy(_currentEnvColor);
}

function createNeonFlow(fromKey, toKey) {
  const ag1 = AG[fromKey], ag2 = AG[toKey];
  if (!ag1 || !ag2) return;
  
  const points = [
    new THREE.Vector3(ag1.group.position.x, 0.05, ag1.group.position.z),
    new THREE.Vector3(ag1.group.position.x, 0.05, ag2.group.position.z),
    new THREE.Vector3(ag2.group.position.x, 0.05, ag2.group.position.z)
  ];
  
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, 20, 0.04, 8, false);
  const mat = new THREE.MeshBasicMaterial({ color: ACFG[fromKey].col, transparent: true, opacity: 0.7 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.isNeonPath = true;
  scene.add(mesh);
  
  _neonPaths.push({ mesh, life: 3.0 });

  // 2. Las partículas de "datos" fluyendo (Phase 2)
  const pCount = 6;
  const particles = [];
  for(let i=0; i<pCount; i++) {
    const pMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 })
    );
    scene.add(pMesh);
    particles.push({ mesh: pMesh, offset: i / pCount });
  }
  _dataStreams.push({ curve, particles, life: 3.0, color: ACFG[fromKey].col });
}

function updateDataStreams(dt) {
  for (let i = _dataStreams.length - 1; i >= 0; i--) {
    const ds = _dataStreams[i];
    ds.life -= dt;
    ds.particles.forEach(p => {
      p.offset += dt * 1.2; 
      if (p.offset > 1) p.offset -= 1;
      const pos = ds.curve.getPoint(p.offset);
      p.mesh.position.copy(pos);
      p.mesh.material.opacity = (ds.life / 3.0);
      p.mesh.material.color.set(Math.random() > 0.4 ? ds.color : '#ffffff');
    });
    if (ds.life <= 0) {
      ds.particles.forEach(p => { scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); });
      _dataStreams.splice(i, 1);
    }
  }
}

function updateNeonPaths(dt) {
  for (let i = _neonPaths.length - 1; i >= 0; i--) {
    const p = _neonPaths[i];
    p.life -= dt;
    p.mesh.material.opacity = (p.life / 3.0) * 0.7;
    if (p.life <= 0) {
      scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
      _neonPaths.splice(i, 1);
    }
  }
}

function visualCleanupEffect() {
  Object.keys(AG).forEach((k, i) => {
    setTimeout(() => {
      const ag = AG[k];
      if (ag) {
        const color = ACFG[k].col;
        showToast(`🧹 Memoria liberada: ${ACFG[k].name.split(' ')[0]}`, color);
        ag.group.position.y += 0.5;
        setTimeout(() => ag.group.position.y -= 0.5, 200);
      }
    }, i * 150);
  });
}

// Expose to window for global compatibility
window._activeAgentsCount = _activeAgentsCount;
window._beginPingPongMatch = _beginPingPongMatch;
window._bgKeyClick = _bgKeyClick;
window._celebrateApiConnection = _celebrateApiConnection;
window._cleanPsychologistMsg = _cleanPsychologistMsg;
window._clearPingPongTimers = _clearPingPongTimers;
window._clearPsychologistVisitor = _clearPsychologistVisitor;
window._doChatResponseGesture = _doChatResponseGesture;
window._drawDeskScreen = _drawDeskScreen;
window._emitDemoPresenceLine = _emitDemoPresenceLine;
window._emitLivePresenceLine = _emitLivePresenceLine;
window._finishPingPong = _finishPingPong;
window._getMCtx = _getMCtx;
window._getMusicMode = _getMusicMode;
window._getSA = _getSA;
window._isAgentAtDesk = _isAgentAtDesk;
window._leaveFPSCleanup = _leaveFPSCleanup;
window._looksInappropriatePrompt = _looksInappropriatePrompt;
window._mNote = _mNote;
window._matStd = _matStd;
window._nextActionFor = _nextActionFor;
window._pickPingPongPair = _pickPingPongPair;
window._pickPresenceAgents = _pickPresenceAgents;
window._probeApiKey = _probeApiKey;
window._psychReactionFallback = _psychReactionFallback;
window._psychReactionTargets = _psychReactionTargets;
window._psychRecentContext = _psychRecentContext;
window._psychologistTalk = _psychologistTalk;
window._psychologistTeamReaction = _psychologistTeamReaction;
window._pulsePingPongRelease = _pulsePingPongRelease;
window._pushPsychologistArrival = _pushPsychologistArrival;
window._pushPsychologistNote = _pushPsychologistNote;
window._queuePsychologistVisit = _queuePsychologistVisit;
window._rebuildSkyline = _rebuildSkyline;
window._refreshDoorLock = _refreshDoorLock;
window._renderGitScreen = _renderGitScreen;
window._riskFor = _riskFor;
window._schedKbd = _schedKbd;
window._setPingPongLock = _setPingPongLock;
window._showTalkLine = _showTalkLine;
window._startAmbient = _startAmbient;
window._startChatGesture = _startChatGesture;
window._syncDoorLook = _syncDoorLook;
window._tuneTexture = _tuneTexture;
window.appendOutcomeCard = appendOutcomeCard;
window.appendRichText = appendRichText;
window.applyPlantDeathEffect = applyPlantDeathEffect;
window.applyWeatherToScene = applyWeatherToScene;
window.astar = astar;
window.bGrid = bGrid;
window.buildAgents = buildAgents;
window.buildAllPlants = buildAllPlants;
window.buildCEOZone = buildCEOZone;
window.buildCoffeeZone = buildCoffeeZone;
window.buildDataZone = buildDataZone;
window.buildDesk = buildDesk;
window.buildDevBEZone = buildDevBEZone;
window.buildDevFEZone = buildDevFEZone;
window.buildDevOpsZone = buildDevOpsZone;
window.buildFloor = buildFloor;
window.buildHubZone = buildHubZone;
window.buildLibrary = buildLibrary;
window.buildLighting = buildLighting;
window.buildLounge = buildLounge;
window.buildNav = buildNav;
window.buildPMZone = buildPMZone;
window.buildPingPong = buildPingPong;
window.buildPosters = buildPosters;
window.buildQAZone = buildQAZone;
window.buildSeasonal = buildSeasonal;
window.buildUXZone = buildUXZone;
window.buildWalls = buildWalls;
window.bx = bx;
window.callElevator = callElevator;
window.checkPlantHealth = checkPlantHealth;
window.checkWorkCycle = checkWorkCycle;
window.clearEventLog = clearEventLog;
window.clearKey = clearKey;
window.clearOrientAll = clearOrientAll;
window.clearStoredProviderKey = clearStoredProviderKey;
window.closeApi = closeApi;
window.createNeonFlow = createNeonFlow;
window.cy = cy;
window.dismissToast = dismissToast;
window.enterFPS = enterFPS;
window.escapeHtml = escapeHtml;
window.escapeRegExp = escapeRegExp;
window.exitFPS = exitFPS;
window.exportScene = exportScene;
window.fetchWeather = fetchWeather;
window.fmtEventTime = fmtEventTime;
window.gNeighbors = gNeighbors;
window.gW = gW;
window.getACtx = getACtx;
window.getRelTone = getRelTone;
window.getRichTextSegments = getRichTextSegments;
window.getViewportSize = getViewportSize;
window.getWeatherLabel = getWeatherLabel;
window.gitCommit = gitCommit;
window.goTalkTo = goTalkTo;
window.handleObjectClick = handleObjectClick;
window.hasActiveKey = hasActiveKey;
window.initClock = initClock;
window.initPathWorker = initPathWorker;
window.initThree = initThree;
window.inspectImprovementHeuristics = inspectImprovementHeuristics;
window.lerpDayNight = lerpDayNight;
window.loadProviderKey = loadProviderKey;
window.logEvent = logEvent;
window.loop = loop;
window.los = los;
window.makeTex = makeTex;
window.nearestWalkable = nearestWalkable;
window.open1on1Picker = open1on1Picker;
window.openAgentMonitor = openAgentMonitor;
window.openApi = openApi;
window.openRackStatus = openRackStatus;
window.orientAgentToPoint = orientAgentToPoint;
window.orientAgentToward = orientAgentToward;
window.pL = pL;
window.panOrbit = panOrbit;
window.persistProviderKey = persistProviderKey;
window.plantAt = plantAt;
window.playAgentSpatialSound = playAgentSpatialSound;
window.playCmp = playCmp;
window.playNt = playNt;
window.playTk = playTk;
window.poolGeo = poolGeo;
window.providerConfig = providerConfig;
window.providerDocs = providerDocs;
window.providerInstruction = providerInstruction;
window.providerLabel = providerLabel;
window.rebuildInteractives = rebuildInteractives;
window.recAct = recAct;
window.refreshCam = refreshCam;
window.renderApiModelOptions = renderApiModelOptions;
window.renderEventFeed = renderEventFeed;
window.renderImprovementRepos = renderImprovementRepos;
window.renderRichText = renderRichText;
window.renderRichTextSegments = renderRichTextSegments;
window.requestPath = requestPath;
window.resetCam = resetCam;
window.runAgentFlowDemo = runAgentFlowDemo;
window.runMeeting1on1 = runMeeting1on1;
window.safeTextToHtml = safeTextToHtml;
window.saveEventLog = saveEventLog;
window.saveKey = saveKey;
window.setApiProvider = setApiProvider;
window.setDoorOpen = setDoorOpen;
window.setRelEvent = setRelEvent;
window.setUIMode = setUIMode;
window.showBroadcastLines = showBroadcastLines;
window.showDelegationArrow = showDelegationArrow;
window.showToast = showToast;
window.smooth = smooth;
window.spawnDelivery = spawnDelivery;
window.spawnPsychologistVisit = spawnPsychologistVisit;
window.spawnStateParticle = spawnStateParticle;
window.spawnSubAgent = spawnSubAgent;
window.startDemoTour = startDemoTour;
window.startGenerativeMusic = startGenerativeMusic;
window.startPingPong = startPingPong;
window.startRainEffect = startRainEffect;
window.stopGenerativeMusic = stopGenerativeMusic;
window.syncDayNightBtn = syncDayNightBtn;
window.syncSoundBtn = syncSoundBtn;
window.syncViewportSize = syncViewportSize;
window.teardownPathWorker = teardownPathWorker;
window.tickAct = tickAct;
window.toggle3DAudio = toggle3DAudio;
window.toggleAutoDayNight = toggleAutoDayNight;
window.toggleDayNight = toggleDayNight;
window.toggleDoor = toggleDoor;
window.toggleFPS = toggleFPS;
window.toggleGenerativeMusic = toggleGenerativeMusic;
window.toggleSound = toggleSound;
window.toggleTheme = toggleTheme;
window.toggleUIMode = toggleUIMode;
window.tone = tone;
window.triggerDeployEffect = triggerDeployEffect;
window.updApiUI = updApiUI;
window.updateApiModalUI = updateApiModalUI;
window.updateApiPresenceChatter = updateApiPresenceChatter;
window.updateAudioListener = updateAudioListener;
window.updateAutoDayNight = updateAutoDayNight;
window.updateAutoTips = updateAutoTips;
window.updateBurndown = updateBurndown;
window.updateClock = updateClock;
window.updateCodeParticles = updateCodeParticles;
window.updateCoffeeSteam = updateCoffeeSteam;
window.updateDataStreams = updateDataStreams;
window.updateDelegArrows = updateDelegArrows;
window.updateDelivery = updateDelivery;
window.updateDeployFx = updateDeployFx;
window.updateDeskScreens = updateDeskScreens;
window.updateDevScreens = updateDevScreens;
window.updateEnvironmentSentiment = updateEnvironmentSentiment;
window.updateFPSCamera = updateFPSCamera;
window.updateHelpRequests = updateHelpRequests;
window.updateImprovementPanel = updateImprovementPanel;
window.updateMemoryBadges = updateMemoryBadges;
window.updateNeonPaths = updateNeonPaths;
window.updatePsychologist = updatePsychologist;
window.updateQAScr = updateQAScr;
window.updateRain = updateRain;
window.updateSkylineParallax = updateSkylineParallax;
window.updateSpontaneousConv = updateSpontaneousConv;
window.updateStateParticles = updateStateParticles;
window.updateStretches = updateStretches;
window.updateSubAgents = updateSubAgents;
window.updateTalkLines = updateTalkLines;
window.useCoffeeMachine = useCoffeeMachine;
window.visualCleanupEffect = visualCleanupEffect;
window.wG = wG;
window.waterPlant = waterPlant;
window.zSign = zSign;
window.ACFG = ACFG;
window.ACT = ACT;
window.CHAT = CHAT;
window.CODE = CODE;
window.DS = DS;
window.GW = GW;
window.IMPROVEMENT_REPOS = IMPROVEMENT_REPOS;
window.M = M;
window.NAV = NAV;
window.NAV_PAD = NAV_PAD;
window.OBS = OBS;
window.ORB0 = ORB0;
window.PLANT_DATA = PLANT_DATA;
window.REL = REL;
window.SUN_NX = SUN_NX;
window.SUN_NZ = SUN_NZ;
window.WORKER_CODE = WORKER_CODE;
window._BURN_ACTUAL = _BURN_ACTUAL;
window._BURN_IDEAL = _BURN_IDEAL;
window._GIT_SCOPES = _GIT_SCOPES;
window._GIT_TYPES = _GIT_TYPES;
window._SCALES = _SCALES;
window._ambLight = _ambLight;
window._apiCelebrateBusy = _apiCelebrateBusy;
window._apiDemoPool = _apiDemoPool;
window._apiLivePool = _apiLivePool;
window._apiPresenceMode = _apiPresenceMode;
window._apiPresenceTimer = _apiPresenceTimer;
window._autoDayNight = _autoDayNight;
window._bcastLines = _bcastLines;
window._bloomInterval = _bloomInterval;
window._burnCvs = _burnCvs;
window._convRunning = _convRunning;
window._convTimer = _convTimer;
window._currentEnvColor = _currentEnvColor;
window._dPath = _dPath;
window._dataStreams = _dataStreams;
window._dayAmbCol = _dayAmbCol;
window._dayFogCol = _dayFogCol;
window._delegArrows = _delegArrows;
window._deliveryLight = _deliveryLight;
window._deliveryMesh = _deliveryMesh;
window._deliveryTimer = _deliveryTimer;
window._demoTourOn = _demoTourOn;
window._deployFx = _deployFx;
window._doorOpen = _doorOpen;
window._elevFloor = _elevFloor;
window._eventLog = _eventLog;
window._geoPool = _geoPool;
window._gitLog = _gitLog;
window._helpTimer = _helpTimer;
window._hoverRayPending = _hoverRayPending;
window._lastApiPresenceAgent = _lastApiPresenceAgent;
window._lastApiPresenceMsg = _lastApiPresenceMsg;
window._lastHoverRayTs = _lastHoverRayTs;
window._lastHovered = _lastHovered;
window._lastViewportW = _lastViewportW;
window._leafIM = _leafIM;
window._logRenderTimer = _logRenderTimer;
window._mBeat = _mBeat;
window._memBadges = _memBadges;
window._musicOn = _musicOn;
window._neonPaths = _neonPaths;
window._orbSave = _orbSave;
window._orientIntervals = _orientIntervals;
window._plantDeadShown = _plantDeadShown;
window._plantHealth = _plantHealth;
window._plantLastWater = _plantLastWater;
window._plantWarnShown = _plantWarnShown;
window._ppActive = _ppActive;
window._ppInt = _ppInt;
window._ppLeftTarget = _ppLeftTarget;
window._ppPlayers = _ppPlayers;
window._psychCol = _psychCol;
window._psychPath = _psychPath;
window._psychPending = _psychPending;
window._psychSpot = _psychSpot;
window._psychVisitor = _psychVisitor;
window._rainParticles = _rainParticles;
window._relEvents = _relEvents;
window._sACtx = _sACtx;
window._savedWater = _savedWater;
window._stretchTimers = _stretchTimers;
window._subAgents = _subAgents;
window._talkLines = _talkLines;
window._targetEnvColor = _targetEnvColor;
window._tipTimer = _tipTimer;
window._toastStack = _toastStack;
window._uiMode = _uiMode;
window._userCity = _userCity;
window._userLat = _userLat;
window._userLon = _userLon;
window._weatherData = _weatherData;
window._windStrength = _windStrength;
window._workDone = _workDone;
window._workState = _workState;
window._zoneLights = _zoneLights;
window.bag = bag;
window.band = band;
window.bm = bm;
window.cFrustum = cFrustum;
window.cHit = cHit;
window.ckCvs = ckCvs;
window.dFrameL = dFrameL;
window.dFrameR = dFrameR;
window.dGlassL = dGlassL;
window.dGlassR = dGlassR;
window.dHandleL = dHandleL;
window.dHandleR = dHandleR;
window.dTrimL = dTrimL;
window.dTrimR = dTrimR;
window.dayMode = dayMode;
window.deskLights = deskLights;
window.devCvs = devCvs;
window.dk = dk;
window.doorFrameMat = doorFrameMat;
window.doorGlassMat = doorGlassMat;
window.doorHandleMat = doorHandleMat;
window.doorHit = doorHit;
window.doorMetalMat = doorMetalMat;
window.doorTrimMat = doorTrimMat;
window.fCtx = fCtx;
window.floorC = floorC;
window.floorMesh = floorMesh;
window.floorTex = floorTex;
window.followAg = followAg;
window.fpsDragging = fpsDragging;
window.fpsEuler = fpsEuler;
window.fpsMode = fpsMode;
window.fpsPitch = fpsPitch;
window.gW = gW;
window.globalRay = globalRay;
window.head = head;
window.helm = helm;
window.hm = hm;
window.interactiveObjects = interactiveObjects;
window.lArm = lArm;
window.lLeg = lLeg;
window.lShoe = lShoe;
window.meetTableMat = meetTableMat;
window.moodPrefix = moodPrefix;
window.orb = orb;
window.pathWorker = pathWorker;
window.pkg = pkg;
window.qaCvs = qaCvs;
window.rArm = rArm;
window.rCtx = rCtx;
window.rLeg = rLeg;
window.rShoe = rShoe;
window.refl = refl;
window.reflTex = reflTex;
window.reflectC = reflectC;
window.rg = rg;
window.roundTop = roundTop;
window.sm = sm;
window.sndOn = sndOn;
window.stem = stem;
window.stripe1 = stripe1;
window.stripe2 = stripe2;
window.tape = tape;
window.topic = topic;
window.torso = torso;
window.um = um;
window.vestM = vestM;
window.wG = wG;
