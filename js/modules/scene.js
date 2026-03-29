/* #10 MODO DÍA/NOCHE */
let dayMode=localStorage.getItem('dayMode')!=='0';
if(!dayMode)document.body.classList.add('night-mode');

function syncDayNightBtn(){
  const btn=document.getElementById('dnBtn');
  if(!btn)return;
  btn.className=dayMode?'header-menu-btn':'header-menu-btn night';
  btn.title=dayMode?'Modo dia [N]':'Modo noche [N]';
  btn.innerHTML=dayMode
    ? `<span class="menu-ico"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <!-- Luna -->
  <path d="M21 12.79A9 9 0 1 1 11.21 3 
           7 7 0 0 0 21 12.79z"></path>

  <!-- Rayos del sol (ciclo) -->
  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41
           M17.66 17.66l1.41 1.41M2 12h2M20 12h2"></path>
</svg></span><span class="menu-lbl">Dia / Noche</span>`
    : `<span class="menu-ico"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
  Object.assign(orb,ORB0);
  orb.tgt.set(ORB0.tgtX,ORB0.tgtY,ORB0.tgtZ);
  orb.lastUI=0;
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

/*  initThree  */
function initThree(){
  const wrap=document.getElementById('canvasWrap');
  const W=wrap.clientWidth||900,H=wrap.clientHeight||500;
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x0a0a0a);
  scene.fog=new THREE.Fog(0x0a0a0a,120,200);
renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setSize(W,H);
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.25));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFShadowMap;
renderer.toneMapping=THREE.NoToneMapping;
renderer.toneMappingExposure=1;
renderer.physicallyCorrectLights=false;
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

  // Drag agente
    if(_dragAgent&&_dragPlane&&AG[_dragAgent]){
      const rect=cv.getBoundingClientRect();
      const mx=((e.clientX-rect.left)/rect.width)*2-1,my=-((e.clientY-rect.top)/rect.height)*2+1;
      globalRay.setFromCamera({x:mx,y:my},camera);
      const target=new THREE.Vector3();
      globalRay.ray.intersectPlane(_dragPlane,target);
      if(target){
        const clampX=Math.max(-26,Math.min(26,target.x));
        const clampZ=Math.max(-18,Math.min(16,target.z));
        AG[_dragAgent].group.position.x=clampX;
        AG[_dragAgent].group.position.z=clampZ;
      }
      return;
    }


// listener duplicado removido
  cv.addEventListener('wheel',e=>{
    if(fpsMode)return;
    followAg=null;
    camZTgt=null;
    orb.radius=Math.max(orb.minR,Math.min(orb.maxR,orb.radius+e.deltaY*.03));
    orb.lastUI=performance.now();
    refreshCam();
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
  buildCEOZone();buildDevBEZone();buildDevFEZone();buildQAZone();buildDevOpsZone();
  buildPMZone();buildUXZone();buildDataZone();buildHubZone();
  buildAllPlants();buildAgents();initClock(scene);drawMMStatic();
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
    if(frameCt%8===0)updateDevScreens();
    if(frameCt%10===0)updateQAScr();
    if(frameCt%12===0)updateDeskScreens();

    if(frameCt%60===0)updateClock();
    if(frameCt%3===0)updateBurndown();
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
    updateStretches(dt);
    if(_interruptCooldown>0)_interruptCooldown-=dt;
    updateDelivery(dt);
    updatePsychologist(dt);
    if(_rainParticles)updateRain(dt);
    if(!_convRunning)updateSpontaneousConv(dt);
    updateAutoTips(dt);
    updateApiPresenceChatter(dt);
    if(frameCt%180===0)updateMoods();
    if(frameCt%2===0)updateCoffeeSteam(dt);
    if(frameCt%2===0)updateDeployFx(dt);
    if(frameCt%2===0)updateCodeParticles(dt);
    if(frameCt%2===0)updateStateParticles(dt);
    if(frameCt%10===0)Object.keys(AG).forEach(k=>spawnStateParticle(k));
    renderer.render(scene,camera);
  })();
}
