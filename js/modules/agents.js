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
function refreshOpsBar(){
  const nowEl=document.getElementById('opsNow');
  const metaEl=document.getElementById('opsMeta');
  if(!nowEl||!metaEl)return;

  let now='Listo para operar';
  if(_demoTourOn)now='Demo guiada en curso';
  else if(meetSpeaker&&ACFG[meetSpeaker])now=`${ACFG[meetSpeaker].name.split(' ')[0]} lidera la conversacion`;
  else if(activeAg&&typeof AG!=='undefined'&&AG[activeAg])now=`${ACFG[activeAg].name.split(' ')[0]} - ${AG[activeAg].state}`;

  const panelMap={tree:'equipo',flujo:'flujo',consola:'chat',status:'estado',dash:'dashboard'};
  metaEl.textContent=[
    GKEY?'Groq online':'modo demo',
    `panel ${panelMap[currentPanel]||currentPanel}`,
    `${_activeAgentsCount()} activos`
  ].join(' - ');

  nowEl.textContent=now;
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
    this.labelEl.innerHTML=`<span style="font-size:10px;font-weight:800;letter-spacing:.02em">${cfg.name.split(' ')[0]}</span><span style="width:7px;height:7px;border-radius:50%;background:${cfg.col};flex-shrink:0;margin-left:2px"></span>`;
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
const sp=4.8*dt*slowdown;this.group.position.x+=dx/dist*sp;this.group.position.z+=dz/dist*sp;
        this.setState('walking');const _pw=this.walkPhase;this.walkPhase+=dt*9;
        if(Math.floor(_pw/Math.PI)!==Math.floor(this.walkPhase/Math.PI))playAgentSpatialSound(this.key,'step');
        const ang=Math.atan2(dx,dz);this.group.rotation.y+=(ang-this.group.rotation.y)*.22;
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
    if(this.sa>0){this.sa-=dt*.28;if(this.sa<0)this.sa=0;}
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
      el.style.cssText=`position:absolute;font-family:var(--mono);font-size:6px;color:#000;background:${ACFG[k].col};border-radius:8px;padding:1px 4px;pointer-events:none;white-space:nowrap;font-weight:800;min-width:14px;text-align:center`;
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

  const light=new THREE.PointLight(0xff8ab3,.34,5);
  light.position.set(0,2.8*DS,.3);g.add(light);

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
  lbl.style.cssText=`position:absolute;font-family:var(--mono);font-size:7px;color:${cfg.col};background:rgba(0,0,0,.85);border:1px solid ${cfg.col}44;padding:1px 5px;pointer-events:none;display:flex;align-items:center;gap:3px;white-space:nowrap`;
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