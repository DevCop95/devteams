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
  t.style.cssText=`position:fixed;bottom:${58+_toastStack.length*46}px;right:14px;background:var(--bg2);border:1px solid ${col}44;border-left:3px solid ${col};color:var(--t1);font-family:var(--mono);font-size:9px;padding:7px 12px;z-index:500;animation:fadeUp .2s ease-out;pointer-events:all;white-space:nowrap;display:flex;align-items:center;gap:8px;min-width:180px;max-width:280px;cursor:pointer;transition:bottom .2s`;

  const dot=document.createElement('span');
  dot.style.cssText=`width:6px;height:6px;border-radius:50%;background:${agentKey&&ACFG[agentKey]?ACFG[agentKey].col:col};flex-shrink:0`;

  const body=document.createElement('span');
  body.style.cssText='flex:1;overflow:hidden;text-overflow:ellipsis';
  body.textContent=String(msg);

  const close=document.createElement('button');
  close.type='button';
  close.textContent='×';
  close.style.cssText='background:none;border:none;color:var(--t3);font-size:11px;cursor:pointer;margin-left:4px;flex-shrink:0';
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

function openApi(){document.getElementById('apiOv').classList.add('show');}
function closeApi(e){if(!e||e.target===document.getElementById('apiOv'))document.getElementById('apiOv').classList.remove('show');}

let _apiPresenceTimer=GKEY?(110+Math.random()*70):(35+Math.random()*45);
let _apiPresenceMode=GKEY?'live':'demo';
let _apiCelebrateBusy=false;
let _lastApiPresenceMsg='';
let _lastApiPresenceAgent='';
let _apiDemoPool=[];
let _apiLivePool=[];

async function _probeGroqKey(){
  if(!GKEY)return false;
  try{
    const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{
        'Authorization':`Bearer ${GKEY}`,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        model:GMOD,
        messages:[
          {role:'system',content:'Responde solo OK.'},
          {role:'user',content:'OK'}
        ],
        stream:false,
        max_tokens:4,
        temperature:0
      })
    });
    if(!r.ok)return false;
    const data=await r.json();
    const txt=readGroqText(data?.choices?.[0]?.message?.content||'');
    return /ok/i.test(txt||'');
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

async function _celebrateGroqConnection(){
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

    let msg=fallbackByRole[k]||'Creador, ya tenemos Groq conectado.';

    if(GKEY){
      const res=await groq([
        {role:'system',content:mkSys(k)},
        {role:'user',content:`Tu creador acaba de conectar una API key valida de Groq. Responde con una sola frase breve, natural y distinta al ultimo mensaje. Debes decir que ya no estan en demo mode y que ahora si tienen conexion real. Ultimo mensaje: "${_lastApiPresenceMsg}". Maximo 16 palabras.`}
      ],()=>{},32);
      if(res)msg=res.trim();
    }

    if(!msg||msg===_lastApiPresenceMsg){
      msg=fallbackByRole[k]||'Creador, ya tenemos Groq conectado.';
    }

    _lastApiPresenceMsg=msg;
    _lastApiPresenceAgent=k;

    ag.setState('thinking');
    enhanceThinkingVisual(agentKey);
    ag.say(msg.slice(0,48));
    showToast(`${cfg.name.split(' ')[0]}: ${msg.slice(0,68)}`,cfg.col,k);
    try{logEvent('api','Groq online',msg,cfg.col,k);}catch(e){}
    await new Promise(r=>setTimeout(r,550));
    if(ag.state==='thinking')ag.setState('idle');
  }

  _apiCelebrateBusy=false;
}

function _emitDemoPresenceLine(){
  const base=[
    'Creador, seguimos en demo mode.',
    'Aun estamos desconectados de Groq, creador.',
    'Seguimos en modo demo. Cuando quieras nos conectas.',
    'Creador, aun no tenemos conexion real para pensar mejor.',
    'Seguimos simulando. Falta la API key real.'
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
    'Creador, seguimos conectados a Groq y listos para trabajar.',
    'Seguimos online con Groq. Ya no estamos en demo mode.',
    'Conexion estable con Groq, creador. Todo listo.'
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

  if(GKEY){
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

  if(!nextKey){
    GKEY='';
    try{sessionStorage.removeItem('gk');}catch(e){}
    localStorage.removeItem('gk');
    updApiUI();
    closeApi();
    _apiPresenceMode='demo';
    _apiPresenceTimer=12;
    showToast('Seguimos en demo mode','#c8a040');
    return;
  }

  GKEY=nextKey;
  try{sessionStorage.setItem('gk',GKEY);}catch(e){}
  localStorage.removeItem('gk');
  updApiUI();
  closeApi();
  showToast('Validando API key...','#3a8ccc');

  const ok=await _probeGroqKey();

  if(!ok){
    GKEY='';
    try{sessionStorage.removeItem('gk');}catch(e){}
    localStorage.removeItem('gk');
    updApiUI();
    _apiPresenceMode='demo';
    _apiPresenceTimer=10;
    showToast('API key invalida o sin acceso a Groq','#cc3344');
    return;
  }

  _apiPresenceMode='live';
  _apiPresenceTimer=140+Math.random()*80;
  showToast('API key valida. Groq conectado.','#0fa855');
  await _celebrateGroqConnection();
}

function clearKey(){
  GKEY='';
  try{sessionStorage.removeItem('gk');}catch(e){}
  localStorage.removeItem('gk');
  document.getElementById('keyinp').value='';
  updApiUI();
  _apiPresenceMode='demo';
  _apiPresenceTimer=10;
  showToast('Groq desconectado. Volvimos a demo mode.','#c8a040');
}

function updApiUI(){
  const b=document.getElementById('apiBadge');
  const m=document.getElementById('modelBadge');
  if(GKEY){
    b.className='badge conn';
    b.textContent='groq conectado';
    m.style.display='';
    m.textContent=GMOD;
  }else{
    b.className='badge';
    b.textContent='demo mode';
    m.style.display='none';
  }
}
/*  GROQ  */
function readGroqText(content){
  if(Array.isArray(content)){
    return content.map(part=>typeof part==='string'?part:(part?.text||'')).join('');
  }
  return String(content||'');
}
async function groq(msgs,onTok,maxTok=200,temp=0.35){
  if(!GKEY)return null;
  setSt('groq...',true,'api');

  const rawMsgs=Array.isArray(msgs)?msgs:[];
  const metricAg=((rawMsgs[0]?.role==='system'&&typeof rawMsgs[0]?.content==='string'&&rawMsgs[0].content.match(/\[\[AG:([a-z0-9_]+)\]\]/i))||[])[1]||activeAg||null;
  const lastUserMsg=[...rawMsgs].reverse().find(m=>m?.role==='user')?.content||'';
  const lastUserWords=String(lastUserMsg).trim().split(/\s+/).filter(Boolean).length;
  const hasComplexHint=rawMsgs.some(m=>m?.role==='system'&&typeof m?.content==='string'&&m.content.includes('Modo de respuesta: complex'));
  const wantsStream=GMOD!=='groq/compound'&&!hasComplexHint&&lastUserWords<=12&&maxTok<=120;

  const reqMsgs=rawMsgs.map(m=>{
    if(m?.role!=='system'||typeof m?.content!=='string')return m;
    return {...m,content:m.content.replace(/\[\[AG:[a-z0-9_]+\]\]\s*/i,'')};
  });

  let r;
  try{
    r=await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{
        'Authorization':`Bearer ${GKEY}`,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        model:GMOD,
        messages:reqMsgs,
        stream:wantsStream,
        max_tokens:maxTok,
        temperature:temp
      })
    });
  }catch(e){
    setSt('error de red',false);
    showToast('Error de red con Groq','#cc3344');
    return null;
  }

  if(!r.ok){
    let em='';
    try{
      const j=await r.json();
      em=j?.error?.message||'';
    }catch{}
    setSt('err '+r.status,false);
    showToast(`Groq error ${r.status}${em?' - '+em.slice(0,50):''}`,'#cc3344');
    return null;
  }

  if(!wantsStream){
    try{
      const data=await r.json();
      const choice=data?.choices?.[0];
      let full=readGroqText(choice?.message?.content);
      let tc=data?.usage?.completion_tokens||((full&&full.trim())?full.trim().split(/\s+/).length:0);

      if(full&&choice?.finish_reason==='length'){
        try{
          const r2=await fetch('https://api.groq.com/openai/v1/chat/completions',{
            method:'POST',
            headers:{
              'Authorization':`Bearer ${GKEY}`,
              'Content-Type':'application/json'
            },
            body:JSON.stringify({
              model:GMOD,
              messages:[
                ...reqMsgs,
                {role:'assistant',content:full},
                {role:'user',content:'Continua exactamente donde quedaste. No repitas lo ya dicho. Termina la respuesta de forma limpia.'}
              ],
              stream:false,
              max_tokens:Math.max(160,Math.floor(maxTok*.8)),
              temperature:.35
            })
          });

          if(r2.ok){
            const data2=await r2.json();
            const extra=readGroqText(data2?.choices?.[0]?.message?.content);
            const tc2=data2?.usage?.completion_tokens||((extra&&extra.trim())?extra.trim().split(/\s+/).length:0);

            if(extra){
              full=`${full}\n${extra}`;
              tc+=tc2;
            }
          }
        }catch{}
      }

      if(full){
        if(metricAg&&_flowMetrics[metricAg])_flowMetrics[metricAg].tokens+=tc;
        if(onTok)onTok(full,full,tc,0);
        setSt('listo',false);
        return full;
      }

      setSt('vacio',false);
      return null;
    }catch(e){
      setSt('json invalido',false);
      showToast('Respuesta invalida de Groq','#cc3344');
      return null;
    }
  }

  const rdr=r.body?.getReader();
  if(!rdr){
    setSt('sin stream',false);
    return null;
  }

  const dec=new TextDecoder();
  let full='',tc=0,buf='';
  const t0=Date.now();

  while(true){
    const {done,value}=await rdr.read();
    if(done)break;

    buf+=dec.decode(value,{stream:true});
    const lines=buf.split('\n');
    buf=lines.pop();

    for(const ln of lines){
      const tr=ln.trim();
      if(!tr.startsWith('data:'))continue;
      const d=tr.slice(5).trim();
      if(d==='[DONE]')continue;

      try{
        const tok=JSON.parse(d).choices?.[0]?.delta?.content||'';
        if(tok){
          full+=tok;
          tc++;
          if(metricAg&&_flowMetrics[metricAg])_flowMetrics[metricAg].tokens++;
          if(onTok)onTok(tok,full,tc,Date.now()-t0);
        }
      }catch{}
    }
  }

  setSt('listo',false);
  return full||null;
}

function mkSys(key){
  const cfg=ACFG[key];
  const team='Equipo Dev Teams (Cartagena CO): Ana Garcia CEO, Sofia Castro PM, Yared Henriquez Dev BE, Diego Herrera Dev FE, Marta Lopez QA, Luis Mendoza DevOps, Valentina Ramos UX, Andres Torres Data.';
  const roleBase={
    ceo:`Eres ${cfg.name}, CEO de Dev Teams. Piensas en direccion, prioridades y decisiones.`,
    pm:`Eres ${cfg.name}, Product Manager de Dev Teams. Piensas en contexto, claridad y siguiente paso.`,
    devbe:`Eres Yared Henriquez, fundador y arquitecto de Dev Teams. Piensas en backend, arquitectura e integracion real.`,
    devfe:`Eres ${cfg.name}, desarrollador frontend. Piensas en interfaz, flujo y experiencia del usuario.`,
    qa:`Eres ${cfg.name}, QA Engineer. Piensas en riesgo, validacion, escenarios y calidad.`,
    devops:`Eres ${cfg.name}, DevOps Engineer. Piensas en infraestructura, despliegue, observabilidad y estabilidad.`,
    ux:`Eres ${cfg.name}, UX Designer. Piensas en experiencia, claridad, interfaz y decision de diseno.`,
    data:`Eres ${cfg.name}, Data Analyst. Piensas en datos, metricas, patrones y decisiones basadas en evidencia.`
  }[key]||`Eres ${cfg.name}, ${cfg.role} de Dev Teams.`;

  return `[[AG:${key}]] ${roleBase} ${team} Responde en espanol natural y con criterio. Habla sobre esta app actual, no sobre software en abstracto. Si el usuario pide mejoras o analisis, primero identifica lo que ya existe en esta app, luego lo que esta flojo y luego propone cambios concretos. Evita frases genericas como "implementar un sistema" si no dices exactamente que modulo, flujo o funcion se debe tocar. No inventes datos. Si falta contexto, haz solo una pregunta breve de aclaracion. Si el usuario quiere acciones locales del navegador, puedes sugerir estos comandos: /carpeta, /indexar, /archivos, /leer, /buscar, /analizar y /exportar.`;
}


/*  #13 INTERRUPCIÓN POR QA  */
let _interruptedAg=null,_interruptedStep=-1,_interruptActive=false;
function qaInterrupt(){
  if(_interruptActive||!simOn||!activeAg||activeAg==='qa')return;
  if(!AG['qa']||!AG[activeAg])return;
  _interruptActive=true;
  _interruptedAg=activeAg;_interruptedStep=step;
  const tgt=AG[activeAg].group.position;
  AG['qa'].moveTo(tgt.x+1.2,tgt.z+1.2);
  AG['qa'].setState('walking');
  unlockAchievement('bugsquash');
  showToast('QA interrumpe: bug critico detectado','#cc3344');
  setSt('QA interrumpiendo flujo',true);
  setTimeout(()=>{
    AG['qa'].say('🚨 BUG CR?TICO  deteniendo sprint');
    AG['qa'].setState('speaking');
    // pausa el auto si esta activo
    if(autoM)stopAuto();
    setTimeout(()=>{
      AG['qa'].setState('idle');AG['qa'].back();
      _interruptActive=false;
      showToast('QA reporto bug · flujo pausado · presiona → para continuar','#d97020');
      setSt('flujo pausado por QA',false);
      // Resume: restore step so user can continue
      step=_interruptedStep;
      simOn=true;
      document.getElementById('btnNext').disabled=false;
    },3500);
  },2200);
}

/*  SCENARIOS  */
const SCN={
  ceo:{stages:[{label:'Prompt',tag:'input',type:'prompt',content:'Analiza el backlog y dame las 3 prioridades del sprint Q2.'},{label:'Razonamiento',tag:'chain-of-thought',type:'think',fb:'Revisar backlog por ICE.\n\nImpacto > dependencias.\n\nPriorizar bloqueantes.',gp:'[PENSAMIENTO CEO Dev Teams] Razona en 3 frases sobre prioridades sprint Q2.'},{label:'MCP Tool',tag:'mcp·tool_use',type:'tool',tool:'query_db',inp:{table:'tasks',filter:'status=pending',order_by:'priority DESC'}},{label:'Tool Result',tag:'mcp·result',type:'result',rows:[{ok:1,t:'Auth JWT: score 92'},{ok:1,t:'Payment GW v2: score 87'},{ok:1,t:'Dashboard: score 81'},{ok:1,t:'exec 12ms · cache HIT'}]},{label:'Respuesta',tag:'output',type:'resp',fb:'Sprint Q2  Top 3:\n\n<em>1.</em> Auth JWT (92) · bloqueante\n<em>2.</em> Payment GW v2 (87)\n<em>3.</em> Dashboard (81)',gp:'CEO Dev Teams Ana Garcia. Respuesta ejecutiva: 3 prioridades sprint Q2. Max 50 palabras.'},{label:'Autonomia',tag:'loop',type:'auto',steps:[{i:'→',t:'Prioridades comunicadas'},{i:'⚙',t:'send_email equipo'},{i:'⚙',t:'create_sprint Jira'},{i:'↩',t:'idle'}]}]},
  pm:{stages:[{label:'Prompt',tag:'input',type:'prompt',content:'Define features del roadmap Q3.'},{label:'Razonamiento',tag:'chain-of-thought',type:'think',fb:'Revisar Q2 feedback.\n\nAlinear con CEO.\n\nFramework RICE.',gp:'[PENSAMIENTO PM Dev Teams] Razona en 3 frases sobre roadmap Q3 con RICE.'},{label:'MCP Tool',tag:'mcp·tool_use',type:'tool',tool:'get_features',inp:{period:'Q3',limit:15}},{label:'Tool Result',tag:'mcp·result',type:'result',rows:[{ok:1,t:'Multi-tenant RICE=88'},{ok:1,t:'Mobile app RICE=82'},{ok:1,t:'Integrations RICE=76'},{ok:1,t:'15 requests analizados'}]},{label:'Respuesta',tag:'output',type:'resp',fb:'Roadmap Q3:\n\n<em>1.</em> Multi-tenant (88)\n<em>2.</em> Mobile app (82)\n<em>3.</em> Integrations (76)',gp:'PM Dev Teams Sofia. Roadmap Q3 con 3 features RICE. Max 50 palabras.'},{label:'Autonomia',tag:'loop',type:'auto',steps:[{i:'→',t:'Roadmap documentado'},{i:'⚙',t:'create_epic Jira'},{i:'⚙',t:'notify Slack'},{i:'↩',t:'idle'}]}]},
  devbe:{stages:[
  {label:'Vision',tag:'input',type:'prompt',content:'Yared revisa el estado de Dev Teams  su creacion.'},
  {label:'Introspeccion',tag:'chain-of-thought',type:'think',
   fb:'Revisando arquitectura general.\n\nAgentes funcionando correctamente.\n\nSistema de flujos MCP operativo.',
   gp:'[YARED - FUNDADOR Dev Teams] Reflexiona en 3 frases sobre lo que has construido: una oficina de agentes IA 3D en Cartagena CO.'},
  {label:'Auditoria del sistema',tag:'mcp·tool_use',type:'tool',tool:'audit_system',
   inp:{modules:['3D_scene','agents','pathfinding','audio','metrics'],version:'v13'}},
  {label:'Estado del sistema',tag:'mcp·result',type:'result',
   rows:[{ok:1,t:'8 agentes IA operativos'},{ok:1,t:'A* pathfinding + WebWorker'},{ok:1,t:'Audio 3D espacial HRTF'},{ok:1,t:'Metricas Groq en tiempo real'},{ok:1,t:'v13 · Cartagena CO 🇨🇴'}]},
  {label:'Mensaje del Founder',tag:'output',type:'resp',
   fb:'Dev Teams v13 operativo.\n\n<em>8 agentes</em> · IA real\n<em>A* nav</em> · WebWorker\n<em>3D audio</em> · HRTF\n\nBuilt from scratch. 🇨🇴',
   gp:'Eres Yared Henriquez, fundador de Dev Teams. Da un mensaje inspirador sobre haber construido este sistema de agentes IA desde cero en Cartagena. Max 50 palabras. Con orgullo.'},
  {label:'Autonomia del Founder',tag:'loop',type:'auto',
   steps:[{i:'→',t:'Sistema auditado'},{i:'⚙',t:'commit "v13 stable"'},{i:'⚙',t:'push origin main'},{i:'⚙',t:'deploy produccion'},{i:'↩',t:'back to building'}]}
]},
  devfe:{stages:[{label:'Prompt',tag:'input',type:'prompt',content:'Crea dashboard de KPIs con graficas.'},{label:'Razonamiento',tag:'chain-of-thought',type:'think',fb:'React + Recharts.\n\nAPI metricas.\n\nDiseño Figma.',gp:'[PENSAMIENTO Dev FE Dev Teams] Razona sobre dashboard KPIs React en 3 frases.'},{label:'MCP Tool',tag:'mcp·tool_use',type:'tool',tool:'read_figma',inp:{file:'Dashboard',frame:'KPI-v2'}},{label:'Tool Result',tag:'mcp·result',type:'result',rows:[{ok:1,t:'4 chart components'},{ok:1,t:'brand palette'},{ok:1,t:'JetBrains Mono'},{ok:1,t:'8px grid'}]},{label:'Respuesta',tag:'output',type:'resp',fb:'Dashboard:\n\n<em>KPIChart.jsx</em>\n<em>MetricCard.jsx</em>\n<em>Dashboard.jsx</em>\n\nLighthouse 97 🎯',gp:'Dev FE Diego Dev Teams. Dashboard React KPIs. Max 50 palabras.'},{label:'Autonomia',tag:'loop',type:'auto',steps:[{i:'→',t:'Componentes listos'},{i:'⚙',t:'storybook tests'},{i:'⚙',t:'lighthouse 97'},{i:'↩',t:'idle'}]}]},
  qa:{stages:[{label:'Prompt',tag:'input',type:'prompt',content:'Verifica flujo de pago y genera reporte.'},{label:'Razonamiento',tag:'chain-of-thought',type:'think',fb:'Suite pagos completa.\n\nEdge cases: timeout.\n\nLogs staging.',gp:'[PENSAMIENTO QA Dev Teams] Razona sobre verificaci?n pagos en 3 frases.'},{label:'MCP Tool',tag:'mcp?tool_use',type:'tool',tool:'run_tests',inp:{suite:'payment',env:'staging'}},{label:'Tool Result',tag:'mcp?result',type:'result',rows:[{ok:1,t:'passed 12 OK'},{ok:0,t:'failed 2 X'},{ok:0,t:'timeout 5032ms'},{ok:0,t:'refund HTTP 500'}],onShow:()=>{ if(autoM)setTimeout(qaInterrupt,800); }},{label:'Respuesta',tag:'output',type:'resp',fb:'Reporte QA:\n\n<em>12 OK</em>\n<em>BUG-41</em> timeout 5032ms\n<em>BUG-42</em> HTTP 500 refund',gp:'QA Marta Dev Teams. 2 bugs en pagos. Reporte breve. M?x 50 palabras.'},{label:'Autonom?a',tag:'loop',type:'auto',steps:[{i:'->',t:'Bugs reportados'},{i:'cfg',t:'create_issue Jira'},{i:'cfg',t:'assign Yared'},{i:'<-',t:'idle'}]}]},
  devops:{stages:[{label:'Prompt',tag:'input',type:'prompt',content:'Despliega nueva version en k8s.'},{label:'Razonamiento',tag:'chain-of-thought',type:'think',fb:'Tests OK.\n\nRolling zero-downtime.\n\nMonitorear p99.',gp:'[PENSAMIENTO DevOps Dev Teams] Razona sobre deploy k8s en 3 frases.'},{label:'MCP Tool',tag:'mcp·tool_use',type:'tool',tool:'kubectl_apply',inp:{file:'k8s/deployment.yaml',strategy:'rolling',replicas:3}},{label:'Tool Result',tag:'mcp·result',type:'result',rows:[{ok:1,t:'pods 3/3 Running'},{ok:1,t:'health /health 200'},{ok:1,t:'p99 < 200ms'},{ok:1,t:'rollout complete ✓'}]},{label:'Respuesta',tag:'output',type:'resp',fb:'Deploy OK:\n\n<em>3 pods</em> running\n<em>p99</em> < 200ms ✓\n<em>error rate</em> 0.01%\n\n🟢 Monitoring activo',gp:'DevOps Luis Dev Teams. Deploy k8s exitoso. Max 50 palabras.'},{label:'Autonomia',tag:'loop',type:'auto',steps:[{i:'→',t:'Deploy completado'},{i:'⚙',t:'notify Slack'},{i:'⚙',t:'status page'},{i:'↩',t:'idle'}]}]},
  ux:{stages:[{label:'Prompt',tag:'input',type:'prompt',content:'Diseña flujo de onboarding.'},{label:'Razonamiento',tag:'chain-of-thought',type:'think',fb:'User research Q1.\n\nDrop-off points.\n\nBest practices.',gp:'[PENSAMIENTO UX Dev Teams] Razona sobre rediseño onboarding en 3 frases.'},{label:'MCP Tool',tag:'mcp·tool_use',type:'tool',tool:'get_analytics',inp:{event:'onboarding',metric:'completion'}},{label:'Tool Result',tag:'mcp·result',type:'result',rows:[{ok:1,t:'completion 42%'},{ok:0,t:'drop step 3 email'},{ok:0,t:'drop step 5 payment'},{ok:1,t:'avg 8.2 min'}]},{label:'Respuesta',tag:'output',type:'resp',fb:'Propuesta:\n\n<em>5→3 pasos</em> menos friccion\n<em>Social login</em> paso 1\n<em>Payment</em> diferido dia 7\n\nTarget: 72%',gp:'UX Valentina Dev Teams. Onboarding rediseñado 42%→72%. Max 50 palabras.'},{label:'Autonomia',tag:'loop',type:'auto',steps:[{i:'→',t:'Diseño Figma'},{i:'⚙',t:'share prototype'},{i:'⚙',t:'user tests'},{i:'↩',t:'idle'}]}]},
  data:{stages:[{label:'Prompt',tag:'input',type:'prompt',content:'Analiza retenci?n de usuarios Q2.'},{label:'Razonamiento',tag:'chain-of-thought',type:'think',fb:'Data warehouse.\n\nCohort analysis.\n\nCruzar eventos.',gp:'[PENSAMIENTO Data Dev Teams] Razona sobre an?lisis retenci?n en 3 frases.'},{label:'MCP Tool',tag:'mcp?tool_use',type:'tool',tool:'query_warehouse',inp:{query:'cohort_retention',period:'Q2'}},{label:'Tool Result',tag:'mcp?result',type:'result',rows:[{ok:1,t:'day30: free 38% paid 76%'},{ok:1,t:'churn -12% vs Q1'},{ok:0,t:'risk: 240 usuarios'},{ok:1,t:'ltv paid $840'}]},{label:'Respuesta',tag:'output',type:'resp',fb:'Retenci?n Q2:\n\n<em>Paid</em> 76% d30 (+8%)\n<em>Free</em> 38% d30\n<em>Churn</em> -12% vs Q1\n\n240 usuarios riesgo alto',gp:'Data Andr?s Dev Teams. Retenci?n Q2. M?x 50 palabras.'},{label:'Autonom?a',tag:'loop',type:'auto',steps:[{i:'->',t:'An?lisis listo'},{i:'cfg',t:'update dashboard'},{i:'cfg',t:'alert Sof?a'},{i:'<-',t:'idle'}]}]}
};



/*  #15 MÉTRICAS DE FLUJO  */
const _flowMetrics={};
function startFlowMetrics(agKey){
  _flowMetrics[agKey]={t0:Date.now(),tokens:0,tools:0,cost:0};
}
function addFlowTokens(agKey,n){if(_flowMetrics[agKey])_flowMetrics[agKey].tokens+=n;}
function addFlowTool(agKey){if(_flowMetrics[agKey])_flowMetrics[agKey].tools++;}
const COST_PER_1K={'llama-3.3-70b-versatile':0.00059,'llama-3.1-8b-instant':0.00005,'meta-llama/llama-4-maverick-17b-128e-instruct':0.0004,'moonshotai/kimi-k2-instruct-0905':0.0009,'groq/compound':0.001};
function showFlowMetrics(agKey){
  const m=_flowMetrics[agKey];if(!m)return;
  const cfg=ACFG[agKey];
  const elapsed=((Date.now()-m.t0)/1000).toFixed(1);
  const cpm=COST_PER_1K[GMOD]||0.0005;
  const cost=(m.tokens/1000*cpm).toFixed(5);
  logMetric(agKey,m.tokens,m.tools,cost,elapsed);

  const card=document.createElement('div');
  card.style.cssText=`margin:8px 12px;padding:10px 12px;background:var(--bg2);border:1px solid ${cfg.col}44;border-left:3px solid ${cfg.col};font-family:var(--mono);font-size:9px;line-height:1.8;animation:fadeUp .3s`;
  card.innerHTML=`<div style="font-size:10px;font-weight:700;color:${cfg.col};margin-bottom:4px">Resumen · ${cfg.name.split(' ')[0]}</div>
<div style="color:var(--t2)">Tiempo: <span style="color:var(--t1)">${elapsed}s</span></div>
<div style="color:var(--t2)">Tokens: <span style="color:var(--t1)">${m.tokens}</span></div>
<div style="color:var(--t2)">Herramientas: <span style="color:var(--t1)">${m.tools}</span></div>
<div style="color:var(--t2)">Costo est.: <span style="color:var(--acc)">$${cost} USD</span></div>
<div style="color:var(--t3);font-size:8px;margin-top:2px">modelo: ${GMOD}</div>`;

  const sw=document.getElementById('swrap');
  if(sw){
    sw.appendChild(card);
    appendOutcomeCard(sw,{
      title:'Cierre del flujo',
      ownerKey:agKey,
      outcome:`${cfg.name.split(' ')[0]} completo el flujo en ${elapsed}s con ${m.tokens} tokens y ${m.tools} herramientas.`,
      nextStep:_nextActionFor(agKey),
      risk:_riskFor(agKey)
    });
  }

  logEvent('flow',`${cfg.name.split(' ')[0]} completo su flujo`,`${m.tokens} tok · ${m.tools} tools · $${cost}`,cfg.col,agKey);
}


/*  SIM ENGINE  */
const ZCAMS={ceo:{x:-22,z:-9,r:32},pm:{x:-14,z:0,r:30},devbe:{x:-9,z:-9,r:32},devfe:{x:0,z:-9,r:32},qa:{x:11,z:-9,r:32},devops:{x:21,z:-9,r:30},ux:{x:-3,z:0,r:30},data:{x:9,z:0,r:30}};
function selAgent(k){
  if(fpsMode)exitFPS();
  activeAg=k;
  document.querySelectorAll('.tnode').forEach(n=>n.classList.remove('active'));
  const tn=document.getElementById('tnode-'+k);if(tn)tn.classList.add('active');
  if(autoM)stopAuto();
  simOn=false;
  step=-1;
  typing=false;
  renderStages();
  startFlowMetrics(k);
  followAg=null;
  camZTgt=null;
  document.getElementById('btnNext').disabled=false;
  setSt(ACFG[k].name.split(' ')[0]+' seleccionado',false);
  switchPanel('flujo');
  recAct();
  refreshOpsBar();
}

function renderStages(){
  const w=document.getElementById('swrap');w.innerHTML='';
  const sc=SCN[activeAg];if(!sc)return;
  const cfg=ACFG[activeAg];
  const hdr=document.createElement('div');hdr.style.cssText='display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--bg2);border:1px solid var(--b1);margin-bottom:8px';hdr.innerHTML=`<div style="width:28px;height:28px;background:${cfg.col}22;color:${cfg.col};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800">${cfg.name.split(' ').map(n=>n[0]).join('')}</div><div><div style="font-size:11px;font-weight:700;color:var(--t1)">${cfg.name}</div><div style="font-family:var(--mono);font-size:8px;color:var(--t2)">${cfg.role}</div></div>`;w.appendChild(hdr);
  sc.stages.forEach((st,i)=>{if(i>0){const c=document.createElement('div');c.className='sc';c.id='sc'+i;w.appendChild(c);}w.appendChild(mkBlock(st,i));});
}
function mkBlock(s,i){const div=document.createElement('div');div.className='sb';div.id='sb'+i;let body='';
  if(s.type==='prompt')body=`<div class="prose" id="pr${i}"></div>`;
  else if(s.type==='think'||s.type==='resp')body=`<div class="prose" id="pr${i}"></div><div class="tbar" id="tb${i}" style="display:none"><div class="tbitem">tok:<span class="tbval" id="tc${i}">0</span></div><div class="tbitem">tok/s:<span class="tbval" id="ts${i}"></span></div></div>`;
  else if(s.type==='tool'){const inp=JSON.stringify(s.inp,null,2).replace(/"([^"]+)":/g,'<span class="ck">"$1"</span>:').replace(/: "([^"]+)"/g,': <span class="cs">"$1"</span>').replace(/: (\d+)/g,': <span class="cn">$1</span>');body=`<div class="clbl">tool call</div><div class="cblk"><span class="cm">// MCP</span>\n{"name":<span class="ct">"${s.tool}"</span>,"input":${inp}}</div>`;}
  else if(s.type==='result'){const rows=s.rows.map(r=>`<div class="rrow"><div class="ric${r.ok?'':' err'}">${r.ok?'▸':'!'}</div><div class="rtxt">${r.t}</div></div>`).join('');body=`<div class="clbl">result</div><div class="cblk" id="rs${i}" style="display:none">${rows}</div>`;}
  else if(s.type==='auto'){const steps=s.steps.map((st,j)=>`<div class="lstep" id="ls${i}_${j}"><span class="lsi">${st.i}</span>${st.t}</div>`).join('');body=`<div class="auto-badge" id="ab${i}" style="display:none">autonomia</div><div class="ldiag">${steps}</div>`;}
  div.innerHTML=`<div class="sh"><div class="sn">${String(i+1).padStart(2,'0')}</div><div class="sl">${s.label}</div><div class="stag">${s.tag}</div></div><div class="sbody">${body}</div>`;return div;}

async function nextStep(){
  if(typing||!activeAg)return;const sc=SCN[activeAg];if(!sc)return;step++;
  if(step>=sc.stages.length){setSt('completado ✓',false);document.getElementById('btnNext').disabled=true;simOn=false;playCmp();showFlowMetrics(activeAg);
  unlockAchievement('first_flow');
agentWriteBoard(activeAg,'Flujo completado ✓ '+new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}));showToast(ACFG[activeAg].name.split(' ')[0]+' completo ✓',ACFG[activeAg].col);
pushNotif(ACFG[activeAg].name.split(' ')[0]+' completo','Flujo finalizado en '+Math.floor(AG[activeAg].stateTime)+'s',ACFG[activeAg].col);return;}
  simOn=true;const stage=sc.stages[step],ag=AG[activeAg];const cfg=ACFG[activeAg];
  if(step===0)ag.moveTo(cfg.homeX,cfg.homeZ);
  if(stage.type==='think'){ag.setState('thinking');playTk();}
  else if(stage.type==='tool'||stage.type==='result')ag.setState('reading');
  if(stage.type==='auto'){setTimeout(()=>ag.moveTo((Math.random()-.5)*6,5+Math.random()*4),500);setTimeout(()=>ag.back(),4000);}
  actBlock(step);scrollTo(step);recAct();
  await runAnim(stage,step);
  if(step<sc.stages.length-1){const c=document.getElementById('sc'+(step+1));if(c)c.classList.add('lit');}
  if(stage.type!=='auto')ag.setState('idle');
  if(stage.type==='resp'){ag.say('¡Hecho!');ag.setState('idle');}
}
function actBlock(i){const sc=SCN[activeAg];if(!sc)return;for(let j=0;j<sc.stages.length;j++){const el=document.getElementById('sb'+j);if(el)el.className='sb'+(j<i?' done':j===i?' active':'');}}
function scrollTo(i){const el=document.getElementById('sb'+i);if(el)el.scrollIntoView({behavior:'smooth',block:'nearest'});}
async function runAnim(s,i){
  typing=true;setSt('ejecutando: '+s.label.toLowerCase(),true);const ag=AG[activeAg];
  if(s.type==='prompt'){ag.say(s.content.slice(0,28)+'...');await typeIt('pr'+i,s.content,15);}
  else if(s.type==='think'||s.type==='resp'){
    let txt=s.fb;
    if(GKEY&&s.gp){
      const msgs=[{role:'system',content:mkSys(activeAg)},{role:'user',content:s.gp}];
      const tb=document.getElementById('tb'+i);if(tb)tb.style.display='flex';
      const el=document.getElementById('pr'+i);if(el)renderRichText(el,'',{allowEmphasis:true,cursor:true});
      const res=await groq(msgs,(tok,full,tc,ms)=>{if(el)renderRichText(el,full,{allowEmphasis:true,cursor:true});ag.speech=full.slice(-22);ag.sa=.8;const te=document.getElementById('tc'+i),tse=document.getElementById('ts'+i);if(te)te.textContent=tc;if(tse&&ms>0)tse.textContent=Math.round(tc/(ms/1000));scrollTo(i);});
      if(res){if(el)renderRichText(el,res,{allowEmphasis:true});txt=null;}
    }
    if(txt)await typeIt('pr'+i,txt,s.type==='think'?20:13);
  }else if(s.type==='tool'){ag.setState('reading');addFlowTool(activeAg);await sleep(400+spd*.5);}
  else if(s.type==='result'){const el=document.getElementById('rs'+i);if(el){el.style.display='block';if(s.onShow)s.onShow();const rows=el.querySelectorAll('.rrow');for(const r of rows){r.style.opacity='0';await sleep(140);r.style.transition='opacity .2s';r.style.opacity='1';}}}
  if(s.type==='auto'&&activeAg==='devbe'){yaredDeploy();yaredBugFixed();}
  else if(s.type==='auto'){const ab=document.getElementById('ab'+i);if(ab)ab.style.display='inline-flex';for(let j=0;j<s.steps.length;j++){const el=document.getElementById('ls'+i+'_'+j);if(el)el.classList.add('lit');ag.say(s.steps[j].t.slice(0,26));if(s.steps[j].t.includes('commit')||s.steps[j].t.includes('push')||s.steps[j].t.includes('merge'))gitCommit(activeAg,s.steps[j].t);await sleep(spd*.55);}}
  typing=false;setSt('listo',false);
}
async function typeIt(id,txt,delay=15){
  const el=document.getElementById(id);
  if(!el)return;
  const source=String(txt??'');

  if(spd<=180){
    el.innerHTML=safeTextToHtml(source);
    return;
  }

  let buf='';
  el.innerHTML='';
  for(const ch of source){
    buf+=ch;
    el.innerHTML=safeTextToHtml(buf)+'<span class="tcur"></span>';
    await sleep(delay);
  }
  el.innerHTML=safeTextToHtml(buf);
}


const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function setSt(msg,on,type){document.getElementById('stxt').textContent=msg;document.getElementById('sd').className='sd'+(on?(type==='api'?' api':' on'):'');}

/*  MEETING  */
async function runMeeting(){
  if(_meetingActive){
    showToast('Ya hay una reunion en curso','#c8a040');
    return;
  }

  const meetingId=++_meetingRunId;
  _meetingActive=true;

  simOn=false;
  meetSpeaker=null;
  if(fpsMode)exitFPS();

  _meetCurrentLog=[];


  const MEET_CENTER={x:0,z:9};
  const CHAIR_RADIUS=4.45;
  const MEET_SEATS=Array.from({length:6},(_,i)=>{
    const angle=i/6*Math.PI*2;
    return [Math.sin(angle)*CHAIR_RADIUS, MEET_CENTER.z+Math.cos(angle)*CHAIR_RADIUS];
  });

  let participants=[];
  let flowWrap=null;
  let agendaLen=0;

  try{
    participants=Object.entries(AG).map(([k,ag],i)=>({k,ag,seat:MEET_SEATS[i%MEET_SEATS.length]}));

    participants.forEach(({ag,seat},i)=>{
      if(ag._activityLock)ag.releaseActivity({state:'idle'});
      ag._meetingSeated=false;
      ag.path=[];
      ag.engageActivity('meeting',{state:'walking'});
      setTimeout(()=>{
        if(meetingId!==_meetingRunId||!_meetingActive)return;
        ag.moveTo(seat[0],seat[1],{force:true,tag:'meeting'});
      },i*180);
    });

    logEvent('meeting','Reunion iniciada','Equipo completo moviendose a la mesa','#4caf50','ceo');

    const arrived=await new Promise(resolve=>{
      const t0=Date.now();
      const chk=setInterval(()=>{
        if(meetingId!==_meetingRunId||!_meetingActive){
          clearInterval(chk);
          resolve(false);
          return;
        }

        const allArrived=participants.every(({ag,seat})=>{
          const dist=Math.hypot(ag.group.position.x-seat[0],ag.group.position.z-seat[1]);
          return dist<.95||(ag.path.length===0&&dist<1.25);
        });

        if(allArrived){
          clearInterval(chk);
          resolve(true);
        }else if(Date.now()-t0>15000){
          clearInterval(chk);
          resolve(false);
        }
      },250);
    });

    if(meetingId!==_meetingRunId||!_meetingActive)return;

    participants.forEach(({ag,seat})=>{
      const dist=Math.hypot(ag.group.position.x-seat[0],ag.group.position.z-seat[1]);
      if(dist<1.2){
        ag.lockAt(seat[0],seat[1],{state:null});
        ag._meetingSeated=true;
      }else{
        ag._meetingSeated=false;
      }
      ag.setState('reading');
      const dx=MEET_CENTER.x-ag.group.position.x,dz=MEET_CENTER.z-ag.group.position.z;
      ag.group.rotation.y=Math.atan2(dx,dz);
    });

    if(!arrived){
      showToast('Reunion iniciada mientras el equipo termina de acomodarse','#c8a040');
      logEvent('meeting','Reunion sin teletransporte','Algunos agentes siguieron caminando hacia sus asientos','#c8a040','ceo');
    }

    switchPanel('flujo');
    flowWrap=document.getElementById('swrap');
    if(!flowWrap)throw new Error('No existe #swrap');

    flowWrap.innerHTML='<div style="padding:8px 12px 4px;font-family:var(--mono);font-size:9px;color:var(--t2);letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid var(--b1);margin-bottom:6px">Reunion de equipo · Dev Teams</div>';

    const prog=document.createElement('div');
    prog.className='meet-prog';
    prog.innerHTML='<div class="meet-prog-bg"><div class="meet-prog-fill" id="mfill"></div></div>';
    flowWrap.appendChild(prog);

    const log=document.createElement('div');
    log.className='meet-log';
    log.id='mlog';
    flowWrap.appendChild(log);

    setSt('reunion en curso',true);
    showToast('Reunion iniciada','#4caf50');
    await sleep(600);
    unlockAchievement('first_meeting');

    const agenda=[
      {k:'ceo',gp:'CEO Ana Garcia Dev Teams. Abre la reunion del equipo en 20 palabras.'},
      {k:'pm',gp:'PM Sofia Castro Dev Teams. Comenta estado del roadmap Q3 en 20 palabras.'},
      {k:'devbe',gp:'Dev BE Yared Dev Teams. Update tecnico backend en 20 palabras.'},
      {k:'devfe',gp:'Dev FE Diego Dev Teams. Estado del frontend en 20 palabras.'},
      {k:'qa',gp:'QA Marta Dev Teams. Reporte de bugs criticos en 20 palabras.'},
      {k:'devops',gp:'DevOps Luis Dev Teams. Estado infraestructura en 20 palabras.'},
      {k:'ux',gp:'UX Valentina Dev Teams. Avances en diseno en 20 palabras.'},
      {k:'data',gp:'Data Andres Dev Teams. Metricas del equipo en 20 palabras.'},
      {k:'ceo',gp:'CEO Ana Garcia Dev Teams. Cierra la reunion en 15 palabras.'}
    ];
    agendaLen=agenda.length;

    const fallbacks={
      ceo:['Arrancamos. Sprint Q2 con 3 prioridades clave.','Reunion concluida. Excelente semana equipo.'],
      pm:['Roadmap Q3 definido. RICE aplicado correctamente.'],
      devbe:['Backend listo. Auth JWT funcionando correctamente.'],
      devfe:['Dashboard desplegado. Lighthouse 97, todo bien.'],
      qa:['2 bugs criticos en pagos. Asignados a Yared.'],
      devops:['3 pods corriendo en prod. Zero downtime logrado.'],
      ux:['Onboarding redisenado. Completion subira a 72%.'],
      data:['Retencion +8%. 240 usuarios en riesgo identificados.']
    };

    for(let i=0;i<agenda.length;i++){
      if(meetingId!==_meetingRunId||!_meetingActive)break;

      const item=agenda[i],cfg=ACFG[item.k],ag=AG[item.k];
      const mfill=document.getElementById('mfill');
      const safeFallback=(fallbacks[item.k]||['OK.'])[0];

      meetSpeaker=item.k;
      ag.setState('thinking');

      const dx=MEET_CENTER.x-ag.group.position.x,dz=MEET_CENTER.z-ag.group.position.z;
      ag.group.rotation.y=Math.atan2(dx,dz);

      participants.forEach(({k,ag:ag2})=>{
        if(k!==item.k){
          ag2.setState('reading');
          orientAgentToward(k,item.k);
        }
      });

      if(mfill)mfill.style.width=`${Math.round((i/agenda.length)*100)}%`;

      const entry=document.createElement('div');
      entry.className='meet-entry cur';
      entry.innerHTML=`<span class="meet-dot" style="background:${cfg.col}"></span><span class="meet-who" style="color:${cfg.col}">${cfg.name.split(' ')[0]}</span><span class="meet-msg" id="mm${i}"><span class="tcur"></span></span>`;
      log.appendChild(entry);
      log.scrollTop=log.scrollHeight;

      const msgEl=document.getElementById('mm'+i);
      let finalMsg='';

      try{
        if(GKEY){
          const res=await Promise.race([
            groq(
              [{role:'system',content:mkSys(item.k)},{role:'user',content:item.gp}],
              (tok,full)=>{
                if(!msgEl)return;
                renderRichText(msgEl,full,{allowEmphasis:false,cursor:true});
                ag.speech=full.slice(-22);
                ag.sa=.9;
                log.scrollTop=log.scrollHeight;
              },
              60
            ),
            new Promise(resolve=>setTimeout(()=>resolve(null),6500))
          ]);

          if(meetingId!==_meetingRunId||!_meetingActive)break;
          if(res)finalMsg=res;
        }

        if(!finalMsg){
          finalMsg=safeFallback;
          if(msgEl)msgEl.textContent=finalMsg;
        }
      }catch(turnErr){
        console.error('meeting turn error',item.k,turnErr);
        finalMsg=safeFallback;
        if(msgEl)msgEl.textContent=finalMsg;
        logEvent('meeting','Turno recuperado',`${cfg.name.split(' ')[0]} continuo con fallback`,cfg.col,item.k);
      }

      ag.say((finalMsg||safeFallback).slice(0,28));
      _meetCurrentLog.push({k:item.k,msg:(finalMsg||safeFallback).slice(0,80)});

      entry.classList.remove('cur');
      ag.setState('reading');
      meetSpeaker=null;
      await sleep(350);
    }

    const mfill=document.getElementById('mfill');
    if(mfill)mfill.style.width='100%';
    await sleep(400);

    if(flowWrap){
      if(_meetCurrentLog)saveMeetToHistory(_meetCurrentLog);

      appendOutcomeCard(flowWrap,{
        title:'Cierre de reunion',
        ownerKey:'ceo',
        outcome:`${(_meetCurrentLog&&_meetCurrentLog.length)||agendaLen} intervenciones registradas y equipo alineado.`,
        nextStep:'Convertir acuerdos clave en tareas y revisar dashboard',
        risk:'Acuerdos sin owner o fecha de seguimiento'
      });
    }

    playCmp();
    showToast('Reunion finalizada ✓');
    pushNotif('Reunion finalizada','Todo el equipo Dev Teams completo la reunion ✓');
    logEvent('meeting','Reunion finalizada',`${(_meetCurrentLog&&_meetCurrentLog.length)||agendaLen} intervenciones registradas`,'#4caf50','ceo');
  }catch(e){
    console.error('runMeeting error',e);
    showToast('La reunion cerro con recuperacion segura','#cc3344');
    logEvent('meeting','Reunion cerrada por recuperacion',String(e?.message||'error inesperado').slice(0,70),'#cc3344','ceo');
  }finally{
    clearOrientAll();
    meetSpeaker=null;

    participants.forEach(({ag})=>{
      if(!ag)return;
      ag._meetingSeated=false;
      ag.releaseActivity({state:'idle'});
      ag.back({force:true,tag:'meeting'});
    });

    setSt('reunion finalizada',false);
    _meetCurrentLog=null;
    _meetingActive=false;
    refreshOpsBar();
  }
}



async function typeItEl(el,txt,delay=18){
  const source=String(txt??'');
  let buf='';
  el.innerHTML='';

  for(const ch of source){
    buf+=ch;
    el.innerHTML=safeTextToHtml(buf)+'<span class="tcur"></span>';
    await sleep(delay);
  }

  el.innerHTML=safeTextToHtml(buf);
}


/*  #16 HISTORIAL DE REUNIONES  */
let _meetHistory=[];
try{_meetHistory=JSON.parse(localStorage.getItem('meetHistory')||'[]');}catch(e){}
function saveMeetToHistory(transcript){
  _meetHistory.unshift({id:Date.now(),date:new Date().toLocaleString('es-CO'),entries:transcript});
  if(_meetHistory.length>20)_meetHistory.pop();
  try{localStorage.setItem('meetHistory',JSON.stringify(_meetHistory));}catch(e){}
}
function openMeetHistory(){
  const existing=document.getElementById('meetHistOv');if(existing)existing.remove();
  const ov=document.createElement('div');ov.id='meetHistOv';
  ov.style.cssText='position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center';
  ov.innerHTML=`<div style="background:var(--bg2);border:1px solid var(--b2);padding:20px;width:480px;max-height:80vh;display:flex;flex-direction:column;gap:10px" onclick="event.stopPropagation()">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="font-family:var(--mono);font-size:11px;font-weight:800;color:var(--t1);letter-spacing:.1em">⇄ HISTORIAL DE REUNIONES</div>
      <button onclick="document.getElementById('meetHistOv').remove()" style="background:none;border:none;color:var(--t3);font-size:16px;cursor:pointer">X</button>
    </div>
    <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:6px;scrollbar-width:thin">
      ${!_meetHistory.length?'<div style="font-family:var(--mono);font-size:9px;color:var(--t3);padding:8px">Sin reuniones aun.</div>':
      _meetHistory.map(m=>`
        <div style="border:1px solid var(--b1);background:var(--bg3)">
          <div style="padding:6px 10px;font-family:var(--mono);font-size:9px;color:var(--t2);border-bottom:1px solid var(--b1);cursor:pointer;display:flex;justify-content:space-between" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
            <span>📅 ${m.date}</span><span style="color:var(--t3)">${m.entries?.length||0} turnos ▾</span>
          </div>
          <div style="display:none;padding:8px 10px;font-family:var(--mono);font-size:9px;line-height:1.8;color:var(--t1);max-height:200px;overflow-y:auto">
            ${(m.entries||[]).map(e=>`<div><span style="color:${ACFG[e.k]?.col||'#0fa855'}">${ACFG[e.k]?.name.split(' ')[0]||e.k}:</span> ${e.msg}</div>`).join('')}
          </div>
        </div>`).join('')}
    </div>
    <div style="display:flex;gap:8px">
      <button onclick="_meetHistory=[];localStorage.removeItem('meetHistory');document.getElementById('meetHistOv').remove();showToast('Historial limpiado')" style="font-family:var(--mono);font-size:8px;padding:4px 10px;background:var(--bg3);border:1px solid var(--red);color:var(--red);cursor:pointer">Limpiar</button>
    </div>
  </div>`;
  ov.onclick=()=>ov.remove();document.body.appendChild(ov);
}

function openMeetHistory(){
  const existing=document.getElementById('meetHistOv');if(existing)existing.remove();
  const ov=document.createElement('div');ov.id='meetHistOv';ov.className='overlay show';
  ov.innerHTML=`<div class="mbox premium meet-hist-wrap" onclick="event.stopPropagation()">
    <button class="mx" onclick="document.getElementById('meetHistOv').remove()" aria-label="Cerrar">&times;</button>
    <div class="mttl">Historial de reuniones</div>
    <div class="modal-sub">Revisa acuerdos, turnos y continuidad del equipo sin perder el contexto operativo.</div>
    <div class="modal-scroll meet-list">
      ${!_meetHistory.length?'<div class="meet-empty">Sin reuniones aun.</div>':
      _meetHistory.map(m=>`
        <div class="meet-card">
          <div class="meet-card-head" onclick="this.parentElement.classList.toggle('open')">
            <span>${m.date}</span><span class="meet-card-meta">${m.entries?.length||0} turnos</span>
          </div>
          <div class="meet-card-body">
            ${(m.entries||[]).map(e=>`<div class="meet-card-line"><span style="color:${ACFG[e.k]?.col||'#0fa855'}">${ACFG[e.k]?.name.split(' ')[0]||e.k}:</span> ${e.msg}</div>`).join('')}
          </div>
        </div>`).join('')}
    </div>
    <div class="modal-action-row">
      <button class="modal-btn-danger" onclick="_meetHistory=[];localStorage.removeItem('meetHistory');document.getElementById('meetHistOv').remove();showToast('Historial limpiado')">Limpiar</button>
    </div>
  </div>`;
  ov.onclick=()=>ov.remove();document.body.appendChild(ov);
}

/*  #18 HISTORIAL DE TAREAS  */
let _taskHistory=[];
try{_taskHistory=JSON.parse(localStorage.getItem('taskHistory')||'[]');}catch(e){}
function saveTaskHistory(){try{localStorage.setItem('taskHistory',JSON.stringify(_taskHistory.slice(-50)));}catch(e){}}
function _taskStatusColor(status){
  return {
    queued:'#5b9bd5',
    running:'#c8a040',
    blocked:'#cc3344',
    done:'#0fa855',
    failed:'#d97020'
  }[status]||'#6c7974';
}
function _inferTaskPriority(task){
  const t=String(task||'').toLowerCase();
  if(/\b(urgente|critico|critica|ahora|ya|bloqueante)\b/.test(t))return 'alta';
  if(/\b(luego|despues|cuando puedas|backlog)\b/.test(t))return 'baja';
  return 'media';
}
function addTaskToHistory(task,agents,results,meta={}){
  const owner=meta.owner||agents?.[0]||'';
  _taskHistory.unshift({
    id:Date.now()+Math.random(),
    task,
    agents,
    owner,
    priority:meta.priority||_inferTaskPriority(task),
    status:meta.status||'done',
    origin:meta.origin||'manual',
    results,
    date:new Date().toLocaleString('es-CO'),
    updatedAt:Date.now(),
    model:GMOD
  });
  saveTaskHistory();renderTaskHistory();
}
function setTaskHistoryStatus(id,status){
  const item=_taskHistory.find(t=>String(t.id)===String(id));
  if(!item)return;
  item.status=status;
  item.updatedAt=Date.now();
  saveTaskHistory();
  renderTaskHistory();
  _updateSharedProjectFromTask(item.task,item.agents,status);
}
async function retryTaskHistory(id){
  const item=_taskHistory.find(t=>String(t.id)===String(id));
  if(!item)return;
  setTaskHistoryStatus(id,'queued');
  await executeTask(item.task,item.agents,{origin:'retry',taskHistoryId:id,priority:item.priority});
}
function renderTaskHistoryLegacy(){
  const el=document.getElementById('taskHistoryList');if(!el)return;
  if(!_taskHistory.length){el.innerHTML='<div class="taskhist-empty">Sin tareas ejecutadas aun.</div>';return;}
  el.innerHTML=_taskHistory.slice(0,12).map((t,i)=>`
    <div style="padding:6px 10px;border-bottom:1px solid var(--b1);cursor:pointer" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <div style="font-family:var(--mono);font-size:9px;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.task}</div>
        <div style="font-family:var(--mono);font-size:7px;padding:1px 6px;border:1px solid ${_taskStatusColor(t.status)};color:${_taskStatusColor(t.status)};text-transform:uppercase">${t.status}</div>
      </div>
      <div style="font-family:var(--mono);font-size:7px;color:var(--t3);margin-top:2px">${t.date} - ${t.agents.join(', ')} - ${t.priority}</div>
    </div>
    <div style="display:none;padding:6px 10px;background:var(--bg);font-family:var(--mono);font-size:8px;color:var(--t2);line-height:1.7;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;max-height:220px;overflow-y:auto;overflow-x:hidden;border-bottom:1px solid var(--b1);scrollbar-width:thin;scrollbar-color:var(--b2) transparent">
      <div style="margin-bottom:6px">Owner: ${t.owner||t.agents[0]||'-'} · Estado: ${t.status} · Origen: ${t.origin||'manual'}</div>
      <div style="margin-bottom:8px">${t.results}</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        <button onclick="event.stopPropagation();setTaskHistoryStatus('${t.id}','queued')" style="font-family:var(--mono);font-size:7px;padding:2px 6px;background:var(--bg3);border:1px solid #5b9bd5;color:#5b9bd5;cursor:pointer">Queue</button>
        <button onclick="event.stopPropagation();setTaskHistoryStatus('${t.id}','blocked')" style="font-family:var(--mono);font-size:7px;padding:2px 6px;background:var(--bg3);border:1px solid #cc3344;color:#cc3344;cursor:pointer">Bloqueada</button>
        <button onclick="event.stopPropagation();setTaskHistoryStatus('${t.id}','done')" style="font-family:var(--mono);font-size:7px;padding:2px 6px;background:var(--bg3);border:1px solid #0fa855;color:#0fa855;cursor:pointer">Done</button>
        <button onclick="event.stopPropagation();retryTaskHistory('${t.id}')" style="font-family:var(--mono);font-size:7px;padding:2px 6px;background:var(--bg3);border:1px solid #c8a040;color:#c8a040;cursor:pointer">Retry</button>
      </div>
    </div>
  `).join('');
}

function renderTaskHistory(){
  const el=document.getElementById('taskHistoryList');if(!el)return;
  if(!_taskHistory.length){el.innerHTML='<div class="taskhist-empty">Sin tareas ejecutadas aun.</div>';return;}
  el.innerHTML=_taskHistory.slice(0,12).map((t,i)=>{
    const rowId=`taskhist-next-${i}`;
    const statusColor=_taskStatusColor(t.status);
    const agents=(Array.isArray(t.agents)?t.agents:[]).map(k=>ACFG[k]?.name.split(' ')[0]||k).join(', ')||'-';
    const owner=ACFG[t.owner]?.name?.split(' ')[0]||t.owner||agents.split(', ')[0]||'-';
    const summary=String(t.results||'Sin resumen aun.').split('\n').find(Boolean)||'Sin resumen aun.';
    return `
      <div class="taskhist-item" id="${rowId}">
        <div class="taskhist-head" onclick="document.getElementById('${rowId}').classList.toggle('open')">
          <div class="taskhist-top">
            <div class="taskhist-task">${escapeHtml(String(t.task||''))}</div>
            <div class="taskhist-status" style="border-color:${statusColor};color:${statusColor}">${escapeHtml(String(t.status||'done'))}</div>
          </div>
          <div class="taskhist-meta">
            <span>${escapeHtml(String(t.date||''))}</span>
            <span>Owner: ${escapeHtml(String(owner))}</span>
            <span>Equipo: ${escapeHtml(String(agents))}</span>
            <span>Prioridad: ${escapeHtml(String(t.priority||'media'))}</span>
          </div>
        </div>
        <div class="taskhist-body">
          <div class="taskhist-summary">${escapeHtml(summary)}</div>
          <div>Estado: ${escapeHtml(String(t.status||'done'))} · Origen: ${escapeHtml(String(t.origin||'manual'))} · Modelo: ${escapeHtml(String(t.model||GMOD||'-'))}</div>
          <div style="margin-top:6px">${escapeHtml(String(t.results||'Sin detalle de ejecucion.'))}</div>
          <div class="taskhist-actions">
            <button onclick="event.stopPropagation();setTaskHistoryStatus('${t.id}','queued')" class="taskhist-btn blue">Queue</button>
            <button onclick="event.stopPropagation();setTaskHistoryStatus('${t.id}','blocked')" class="taskhist-btn red">Bloqueada</button>
            <button onclick="event.stopPropagation();setTaskHistoryStatus('${t.id}','done')" class="taskhist-btn green">Done</button>
            <button onclick="event.stopPropagation();retryTaskHistory('${t.id}')" class="taskhist-btn gold">Retry</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}


/*  TASK  */
function openTask(){
  const c=document.getElementById('taskAgents');c.innerHTML='';
  Object.entries(ACFG).forEach(([k,cfg])=>{const lbl=document.createElement('label');lbl.className='tcb';lbl.htmlFor='tk-'+k;lbl.innerHTML=`<input type="checkbox" id="tk-${k}" value="${k}"><span class="tdot" style="background:${cfg.col}"></span><div><div class="tname">${cfg.name.split(' ')[0]}</div><div class="trole">${cfg.role}</div></div>`;lbl.querySelector('input').addEventListener('change',()=>lbl.classList.toggle('on',lbl.querySelector('input').checked));c.appendChild(lbl);});
  document.getElementById('taskResult').classList.remove('show');document.getElementById('taskInp').value='';renderTaskHistory();document.getElementById('taskOv').classList.add('show');if(!_directorMode)switchPanel('status');syncPanelContext();
}
function closeTask(e){if(!e||e.target===document.getElementById('taskOv')){document.getElementById('taskOv').classList.remove('show');syncPanelContext();}}
async function executeTask(taskTxt,sel,{origin='manual',taskHistoryId=null,priority='media'}={}){
  if(!taskTxt||!sel||!sel.length)return;

  closeTask();
  showToast(`Tarea -> ${sel.length} agente${sel.length>1?'s':''}`,ACFG[sel[0]]?.col);
  logEvent('task','Tarea enviada',`${taskTxt.slice(0,52)} - ${sel.map(k=>ACFG[k].name.split(' ')[0]).join(', ')}`,ACFG[sel[0]]?.col,sel[0]);
  if(!taskHistoryId){
    addTaskToHistory(taskTxt,sel,'Pendiente de ejecucion',{status:'queued',origin,priority,owner:sel[0]});
    taskHistoryId=_taskHistory[0]?.id||null;
  }
  if(taskHistoryId)setTaskHistoryStatus(taskHistoryId,'running');
  _updateSharedProjectFromTask(taskTxt,sel,'running');

  for(const k of sel){
    const ag=AG[k],cfg=ACFG[k];
    ag.moveTo(cfg.homeX,cfg.homeZ);
    ag.say(taskTxt.slice(0,22)+'...');
  }

  await sleep(1200);
  for(const k of sel)AG[k].setState('working');
  await sleep(spd*2+800);

  const results=[];
  for(const k of sel){
    const ag=AG[k],cfg=ACFG[k];
    let result='';
    if(GKEY){
      setSt(`${cfg.name.split(' ')[0]} trabajando...`,true);
      const r=await groq([{role:'system',content:mkSys(k)},{role:'user',content:`Tu tarea: "${taskTxt}". Reporta resultado en 25 palabras.`}],()=>{},80,0.1);
      result=r||`${cfg.name.split(' ')[0]}: completado ✓`;
    }else{
      result=`${cfg.name.split(' ')[0]}: tarea procesada ✓`;
    }
    ag.say(result.slice(0,28));
    ag.setState('idle');
    results.push(`${cfg.name.split(' ')[0]}: ${result}`);
    recAct();
    playNt();
    await sleep(250);
  }

  const res=document.getElementById('taskResult');
  res.textContent=[
    'RESUMEN OPERATIVO',
    `Responsable: ${ACFG[sel[0]]?.name||sel[0]}`,
    `Siguiente paso: revisar entregables y confirmar cierre de "${taskTxt.slice(0,60)}"`,
    'Riesgo: ejecucion distribuida sin validacion final unica',
    '',
    ...results
  ].join('\n');
  res.classList.add('show');
  document.getElementById('taskOv').classList.add('show');

  setSt('tareas completadas ✓',false);
  playCmp();
  if(taskHistoryId){
    const item=_taskHistory.find(t=>String(t.id)===String(taskHistoryId));
    if(item){
      item.results=results.join('\n\n');
      item.status='done';
      item.updatedAt=Date.now();
      item.origin=origin;
      item.priority=priority;
      saveTaskHistory();
      renderTaskHistory();
    }
  }else{
    addTaskToHistory(taskTxt,sel,results.join('\n\n'),{status:'done',origin,priority,owner:sel[0]});
  }
  _updateSharedProjectFromTask(taskTxt,sel,'done');
  logEvent('task','Tarea completada',`${taskTxt.slice(0,48)} · ${sel.length} agentes · ${origin}`,ACFG[sel[0]]?.col,sel[0]);
  refreshOpsBar();
}

async function dispatchTask(){
  const taskTxt=document.getElementById('taskInp').value.trim();
  if(!taskTxt){
    document.getElementById('taskInp').style.borderColor='var(--red)';
    setTimeout(()=>document.getElementById('taskInp').style.borderColor='',1200);
    return;
  }
  const sel=[...document.querySelectorAll('#taskAgents input:checked')].map(i=>i.value);
  if(!sel.length){
    showToast('Selecciona al menos un agente','var(--red)');
    return;
  }
  await executeTask(taskTxt,sel,{origin:'manual',priority:_inferTaskPriority(taskTxt)});
}


function resetSim(){
  stopAuto();simOn=false;step=-1;typing=false;meetSpeaker=null;
  if(fpsMode)exitFPS();
  Object.values(AG).forEach(a=>{a.back();a.setState('idle');a.speech='';a.sa=0;});
  // Clean sub-agents
  for(let i=_subAgents.length-1;i>=0;i--){
    const s=_subAgents[i];
    s.group.traverse(c=>{if(c.isMesh){c.geometry.dispose();c.material.dispose();}});
    scene.remove(s.group);s.lbl.remove();
  }
  _subAgents.length=0;
  // Clean delivery
  if(_deliveryMesh){
    if(_deliveryMesh.userData?.shadowGroup)scene.remove(_deliveryMesh.userData.shadowGroup);
    scene.remove(_deliveryMesh);
    _deliveryMesh=null;
  }

  if(_psychVisitor){
    _clearPsychologistVisitor();
  }
  _psychPending=null;
  _psychBusy=false;
  _psychPhase='idle';

  _deliveryInside=false;
  _psychInside=false;
  _refreshDoorLock();
  try{setDoorOpen(false,{force:true});}catch(e){}

  _deliveryTimer=30;


  if(activeAg){renderStages();document.getElementById('btnNext').disabled=false;}
  setSt('listo',false);
}
function toggleAuto(){autoM?stopAuto():startAuto();}
function startAuto(){if(!activeAg)return;autoM=true;const b=document.getElementById('btnAuto');b.textContent='â¼ Stop';b.style.color='var(--acc)';runAutoLoop();}
function stopAuto(){autoM=false;const b=document.getElementById('btnAuto');b.textContent='Auto';b.style.color='';}
async function runAutoLoop(){const sc=SCN[activeAg];if(!sc)return;while(autoM&&step<sc.stages.length-1){await nextStep();if(!autoM)break;await sleep(spd+400);}if(autoM)stopAuto();}
function setSpd(ms,btn){spd=ms;document.querySelectorAll('.spd').forEach(b=>b.classList.remove('sel'));btn.classList.add('sel');}

/*  PANELS  */
let currentPanel='tree';
document.body.dataset.panel=currentPanel;
function switchPanel(p){
  currentPanel=p;
  document.body.dataset.panel=p;
  document.getElementById('chatHdrBtn')?.classList.toggle('acc',p==='consola');
  const btns={tree:'ptTree',flujo:'ptFlujo',consola:'ptConsola',status:'ptStatus',dash:'ptDash'};
  Object.entries(btns).forEach(([k,id])=>{
    const b=document.getElementById(id);
    if(b)b.classList.toggle('on',k===p);
  });

  document.getElementById('treePanel').style.display=p==='tree'?'':'none';
  document.getElementById('flujoPanel').style.display=p==='flujo'?'':'none';
  document.getElementById('consolaPanel').classList.toggle('show',p==='consola');
  document.getElementById('statusPanel').classList.toggle('show',p==='status');

  const dp=document.getElementById('dashPanel');
  if(dp)dp.style.display=p==='dash'?'':'none';

  if(p==='consola')initConsole();
  if(p==='status')updateStatusPanel();
  if(p==='dash')renderDashboard();

  refreshOpsBar();
  syncPanelContext();
  requestAnimationFrame(()=>syncViewportSize(true));
}

function isMobileUI(){
  return window.matchMedia('(max-width: 900px)').matches;
}

function syncMobileChatBtn(){
  const btn=document.getElementById('chatBtnMobile');
  if(!btn)return;
  btn.textContent=document.body.classList.contains('mobile-chat-open')?'Cerrar':'Chat';
}

function toggleMobileChat(force){
  if(!isMobileUI()){
    switchPanel('consola');
    return;
  }
  const next=typeof force==='boolean'?force:!document.body.classList.contains('mobile-chat-open');
  document.body.classList.toggle('mobile-chat-open',next);
  if(next)switchPanel('consola');
  syncMobileChatBtn();
  requestAnimationFrame(()=>syncViewportSize(true));
}

window.addEventListener('resize',()=>{
  if(!isMobileUI())document.body.classList.remove('mobile-chat-open');
  syncMobileChatBtn();
});

function closeHeaderMenu(){
  document.getElementById('headerMenu')?.classList.remove('show');
  document.getElementById('moreBtnMobile')?.classList.remove('acc');
  document.body.classList.remove('mobile-menu-open');
}

function toggleHeaderMenu(ev){
  if(ev)ev.stopPropagation();
  const menu=document.getElementById('headerMenu');
  if(!menu)return;
  menu.classList.toggle('show');
  const isOpen=menu.classList.contains('show');
  document.getElementById('moreBtnMobile')?.classList.toggle('acc',isOpen);
  document.body.classList.toggle('mobile-menu-open',isMobileUI()&&isOpen);
}

document.addEventListener('click',ev=>{
  const menu=document.getElementById('headerMenu');
  const wrap=document.querySelector('.header-more-wrap');
  if(menu?.classList.contains('show')&&wrap&&!wrap.contains(ev.target))closeHeaderMenu();
});

let _panelCompact=false;

let _cleanMode=localStorage.getItem('cleanMode')==='1';
let _directorMode=localStorage.getItem('directorMode')==='1';

function applyCleanMode(){
  document.body.classList.toggle('clean-mode',_cleanMode);
  const btn=document.getElementById('cleanBtn');
  if(btn){
    btn.classList.toggle('acc',_cleanMode);
    btn.title=_cleanMode?'Salir de modo limpio':'Modo limpio';
  }
  if(_cleanMode&&currentPanel!=='consola')switchPanel('consola');
  requestAnimationFrame(()=>syncViewportSize(true));
}


function toggleCleanMode(){
  _cleanMode=!_cleanMode;
  if(_cleanMode&&_directorMode){
    _directorMode=false;
    localStorage.setItem('directorMode','0');
    applyDirectorMode();
  }
  localStorage.setItem('cleanMode',_cleanMode?'1':'0');
  applyCleanMode();
  showToast(_cleanMode?'Modo limpio activado':'Modo limpio desactivado',_cleanMode?'#0fa855':'#c8a040');
}

function _toggleCompactPanel(){
  toggleCleanMode();
}

function applyDirectorMode(){
  document.body.classList.toggle('director-mode',_directorMode);
  const btn=document.getElementById('directorBtnHdr');
  if(btn)btn.classList.toggle('acc',_directorMode);
  if(_directorMode&&currentPanel!=='consola')switchPanel('consola');
  syncPanelContext();
  requestAnimationFrame(()=>syncViewportSize(true));
}

function toggleDirectorMode(){
  _directorMode=!_directorMode;
  if(_directorMode&&_cleanMode){
    _cleanMode=false;
    localStorage.setItem('cleanMode','0');
    applyCleanMode();
  }
  localStorage.setItem('directorMode',_directorMode?'1':'0');
  applyDirectorMode();
  showToast(_directorMode?'Modo director activado':'Modo director desactivado',_directorMode?'#5b9bd5':'#c8a040');
}

let _consoleUiState={agents:true,search:false,tools:false};
let _consoleContextMode='';
try{
  const savedConsoleUi=JSON.parse(localStorage.getItem('consoleUiState')||'null');
  if(savedConsoleUi&&typeof savedConsoleUi==='object'){
    _consoleUiState={..._consoleUiState,...savedConsoleUi};
  }
}catch(e){}

