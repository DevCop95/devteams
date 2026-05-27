// chat.js - Multi-agent routing & Groq API client

let _currentGroqController = null;

async function groq(msgs,onTok,maxTok=200,temp=0.35){
  if(!GKEY)return null;
  const provider=providerConfig();
  const allowStream=API_PROVIDER==='groq';
  setSt(`${providerLabel()}...`,true,'api');

  // Cancel previous request if active
  if (_currentGroqController) {
    _currentGroqController.abort();
  }
  _currentGroqController = new AbortController();
  const signal = _currentGroqController.signal;

  const rawMsgs=Array.isArray(msgs)?msgs:[];
  const metricAg=((rawMsgs[0]?.role==='system'&&typeof rawMsgs[0]?.content==='string'&&rawMsgs[0].content.match(/\[\[AG:([a-z0-9_]+)\]\]/i))||[])[1]||activeAg||null;
  const lastUserMsg=[...rawMsgs].reverse().find(m=>m?.role==='user')?.content||'';
  const lastUserWords=String(lastUserMsg).trim().split(/\s+/).filter(Boolean).length;
  const hasComplexHint=rawMsgs.some(m=>m?.role==='system'&&typeof m?.content==='string'&&m.content.includes('Modo de respuesta: complex'));
  const wantsStream=allowStream&&GMOD!=='groq/compound'&&!hasComplexHint&&lastUserWords<=12&&maxTok<=120;

  const reqMsgs=rawMsgs
    .filter(m=>m&&typeof m.content==='string'&&m.content.trim()!=='')
    .map(m=>{
      let content=m.content;
      if(m.role==='system') content=content.replace(/\[\[AG:[a-z0-9_]+\]\]\s*/i,'');
      return {role:m.role||'user',content};
    });

  let payload = {
    model: GMOD,
    messages: reqMsgs
  };

  if (API_PROVIDER !== 'openrouter') {
    payload.temperature = Math.min(temp, 2);
    payload.max_tokens = Math.floor(maxTok);
  }

  if (API_PROVIDER === 'openrouter' && (GMOD.includes('google') || GMOD.includes('gemma'))) {
    const sysMsgIndex = payload.messages.findIndex(m => m.role === 'system');
    if (sysMsgIndex !== -1) {
      const sysContent = payload.messages[sysMsgIndex].content;
      payload.messages.splice(sysMsgIndex, 1);
      const userMsgIndex = payload.messages.findIndex(m => m.role === 'user');
      if (userMsgIndex !== -1) {
        payload.messages[userMsgIndex].content = `[System Instructions: ${sysContent}]\\n\\n${payload.messages[userMsgIndex].content}`;
      } else {
        payload.messages.push({ role: 'user', content: `[System Instructions: ${sysContent}]` });
      }
    }
  }

  if (wantsStream) {
    payload.stream = true;
  }
  
  const isOpenRouterFree = API_PROVIDER === 'openrouter' && String(GMOD).includes(':free');

  if (temp !== undefined && temp !== null && !isOpenRouterFree) {
    payload.temperature = temp;
  }

  if (maxTok && !isOpenRouterFree) {
    payload.max_tokens = Math.floor(maxTok);
  }

  let r;
  let timeoutId = setTimeout(() => {
    if (_currentGroqController) {
      _currentGroqController.abort();
    }
  }, 30000);

  try{
    r=await fetch(provider.endpoint,{
      method:'POST',
      headers:{
        'Authorization':`Bearer ${GKEY}`,
        'Content-Type':'application/json',
        'HTTP-Referer': 'https://dev-teams-local.app/',
        'X-Title': 'Dev Teams AI'
      },
      body: JSON.stringify(payload),
      signal: signal
    });
  }catch(e){
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      setSt('timeout/cancelado',false);
      return null;
    }
    setSt('error de red',false);
    showToast(`Error de red con ${providerLabel()}`,'#cc3344');
    return null;
  }

  clearTimeout(timeoutId);

  if(!r.ok){
    let em='';
    try{
      const j=await r.json();
      em=j?.error?.message||j?.message||'';
      console.warn('API Error Payload:', JSON.stringify(j, null, 2));
    }catch{}
    if(r.status===400){
      setSt('error 400',false);
      let errMsg = em ? em.slice(0, 60) : 'Parámetros no soportados por el modelo.';
      if(em.toLowerCase().includes('developer instruction') || em.toLowerCase().includes('system instruction')){
         errMsg = 'El modelo no soporta "system prompts".';
      }
      
      if(API_PROVIDER==='openrouter'){
        showToast(`${providerLabel()}: (400) ${errMsg}. Cambia el modelo manualmente.`,`#cc3344`);
      } else {
        showToast(`${providerLabel()} (400): ${errMsg}`,`#cc3344`);
      }
      return null;
    }
    if(r.status===402){
      setSt('error 402',false);
      showToast(`${providerLabel()}: Fondos insuficientes (402).`,`#cc3344`);
      return null;
    }
    if(r.status===429){
      setSt('límite 429',false);
      if(API_PROVIDER==='openrouter'){
        showToast(`${providerLabel()}: Modelo saturado (429). Cambia el modelo manualmente.`,`#cc3344`);
      } else {
        showToast(`${providerLabel()}: Demasiadas peticiones. Espera unos segundos.`,`#cc3344`);
      }
      return null;
    }
    if(r.status===404){
      setSt('error 404',false);
      if(API_PROVIDER==='openrouter'){
        showToast(`${providerLabel()}: (404) Modelo obsoleto. Cambia el modelo manualmente.`,`#cc3344`);
      } else {
        showToast(`${providerLabel()}: Modelo actual no encontrado o no disponible.`,`#cc3344`);
      }
      return null;
    }
    setSt('err '+r.status,false);
    showToast(`${providerLabel()} error ${r.status}${em?' - '+em.slice(0,50):''}`,'#cc3344');
    return null;
  }

  if(!wantsStream){
    try{
      const data=await r.json();
      const choice=data?.choices?.[0];
      let full=readGroqText(choice?.message?.content);
      let tc=data?.usage?.completion_tokens||((full&&full.trim())?full.trim().split(/\\s+/).length:0);

      if(allowStream&&full&&choice?.finish_reason==='length'){
        try{
          let r2_controller = new AbortController();
          let r2_timeout = setTimeout(() => r2_controller.abort(), 30000);
          const r2=await fetch(provider.endpoint,{
            method:'POST',
            headers:{
              'Authorization':`Bearer ${GKEY}`,
              'Content-Type':'application/json',
              'HTTP-Referer': window.location.href.startsWith('file:') ? 'https://dev-teams-local.app' : window.location.href,
              'X-Title': 'Dev Teams AI'
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
            }),
            signal: r2_controller.signal
          });
          clearTimeout(r2_timeout);

          if(r2.ok){
            const data2=await r2.json();
            const extra=readGroqText(data2?.choices?.[0]?.message?.content);
            const tc2=data2?.usage?.completion_tokens||((extra&&extra.trim())?extra.trim().split(/\\s+/).length:0);

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
      showToast(`Respuesta invalida de ${providerLabel()}`,'#cc3344');
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

  try {
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
  } catch(e) {
    if (e.name === 'AbortError') {
      setSt('stream cancelado',false);
      return null;
    }
  }

  setSt('listo',false);
  return full||null;
}

const API_PROVIDERS={
  groq:{
    label:'Groq',
    keyStorage:'gk',
    instruction:'Gratis en console.groq.com | se guarda solo en esta sesión',
    docsUrl:'https://console.groq.com',
    defaultModel:'meta-llama/llama-4-scout-17b-16e-instruct',
    models:[
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'meta-llama/llama-4-maverick-17b-128e-instruct',
      'llama-3.3-70b-versatile',
      'deepseek-r1-distill-llama-70b',
      'qwen/qwen3-32b',
      'whisper-large-v3-turbo'
    ],
    endpoint:'https://api.groq.com/openai/v1/chat/completions',
    accent:'#0fa855'
  },
  openrouter:{
    label:'OpenRouter',
    keyStorage:'ork',
    instruction:'Solicita tu clave en openrouter.ai/docs/api-reference/chat-completion',
    docsUrl:'https://openrouter.ai/docs/api-reference/chat-completion',
    defaultModel:'google/gemma-3-27b-it:free',
    models:[
      'google/gemma-3-27b-it:free',
      'google/gemma-4-31b-it:free',
      'qwen/qwen3-coder:free',
      'nvidia/nemotron-3-nano-30b-a3b:free',
      'liquid/lfm-2.5-1.2b-instruct:free',
      'meta-llama/llama-3.3-70b-instruct:free'
    ],
    endpoint:'https://openrouter.ai/api/v1/chat/completions',
    accent:'#3f8fff'
  }
};
const MODEL_STORAGE_KEYS={groq:'gm_groq',openrouter:'gm_openrouter'};
const PROVIDER_KEY_NAMES={groq:'gk',openrouter:'ork'};
let API_PROVIDER=localStorage.getItem('apiProvider');
if(!API_PROVIDERS[API_PROVIDER])API_PROVIDER='groq';
let _sessionProviderKeys={groq:'',openrouter:''};
try{_sessionProviderKeys.groq=sessionStorage.getItem('gk')||'';}catch(e){}
try{_sessionProviderKeys.openrouter=sessionStorage.getItem('ork')||'';}catch(e){}
window.activeAg='ceo';
window.simOn=false;
window.step=-1;
window.autoM=false;
window.spd=1400;
window.typing=false;
let GKEY=_sessionProviderKeys[API_PROVIDER]||(localStorage.getItem(PROVIDER_KEY_NAMES[API_PROVIDER])||'');
let GMOD=localStorage.getItem(MODEL_STORAGE_KEYS[API_PROVIDER])||API_PROVIDERS[API_PROVIDER].defaultModel;

// Limpiar GMOD si es un modelo obsoleto de OpenRouter para evitar crash/400 (ej: gemini-2.0-pro-exp-02-05:free)
if(API_PROVIDER==='openrouter' && !API_PROVIDERS.openrouter.models.includes(GMOD)){
  GMOD=API_PROVIDERS.openrouter.defaultModel;
  localStorage.setItem(MODEL_STORAGE_KEYS.openrouter, GMOD);
}
if(GKEY){
  try{sessionStorage.setItem(PROVIDER_KEY_NAMES[API_PROVIDER],GKEY);}catch(e){}
  localStorage.removeItem(PROVIDER_KEY_NAMES[API_PROVIDER]);
}
const DEAD=['llama3-8b-8192','llama3-70b-8192','mixtral-8x7b-32768','gemma2-9b-it','llama-3.1-70b-versatile'];
if(DEAD.includes(GMOD)){GMOD='llama-3.3-70b-versatile';localStorage.setItem('gm',GMOD);}

// Define getter/setter properties on window to keep agents.js and chat.js in sync
window.API_PROVIDERS = API_PROVIDERS;
window.MODEL_STORAGE_KEYS = MODEL_STORAGE_KEYS;
window.PROVIDER_KEY_NAMES = PROVIDER_KEY_NAMES;

Object.defineProperty(window, 'API_PROVIDER', {
  get: () => API_PROVIDER,
  set: (v) => { API_PROVIDER = v; },
  configurable: true
});
Object.defineProperty(window, 'GKEY', {
  get: () => GKEY,
  set: (v) => { GKEY = v; },
  configurable: true
});
Object.defineProperty(window, 'GMOD', {
  get: () => GMOD,
  set: (v) => { GMOD = v; },
  configurable: true
});

if (window.setApiProvider) {
  window.setApiProvider(API_PROVIDER, { quiet: true });
} else {
  renderApiModelOptions();
  if(GKEY){
    document.getElementById('keyinp').value=GKEY;
    document.getElementById('msel').value=GMOD;
    updApiUI();
  }
}

window.meetSpeaker=null;
window._meetingActive=false;
window._meetingRunId=0;
const _bootTime=Date.now();
const _moods={};
const MOOD_COLS={happy:'#0fa855',stressed:'#cc3344',focused:'#3a8ccc',idle:'#444444'};
function setMood(k,mood){_moods[k]=mood;const ag=AG[k];if(!ag)return;ag.halo.material.color.setStyle(MOOD_COLS[mood]||'#444');ag.halo.material.opacity=mood==='idle'?0:.18;showToast(`${ACFG[k].name.split(' ')[0]} → ${mood}`,MOOD_COLS[mood],k);}
function updateMoods(){Object.keys(ACFG).forEach(k=>{const ag=AG[k];if(!ag)return;const s=ag.state;const cur=_moods[k]||'idle';let next=cur;if(s==='working'&&ag.stateTime>10)next='focused';else if(s==='thinking'&&ag.stateTime>8)next='stressed';else if(s==='idle'&&ag.stateTime>15)next='happy';else if(s==='idle')next='idle';if(next!==cur)setMood(k,next);});}
let _meetCurrentLog=null;
window.profileKey=null;

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
    AG['qa'].say('🚨 BUG CRÍTICO  deteniendo sprint');
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
const COST_PER_1K={'llama-3.3-70b-versatile':0.00059,'llama-3.1-8b-instant':0.00005,'meta-llama/llama-4-maverick-17b-128e-instruct':0.0004,'moonshotai/kimi-k2-instruct-0905':0.0009,'groq/compound':0.001,'openrouter/gpt-4o-mini':0.006,'openrouter/gpt-4o':0.01,'openrouter/gpt-3.5-turbo-instruct':0.0005,'openrouter/deepseek-r1-0528':0.002};
function showFlowMetrics(agKey){
  const m=_flowMetrics[agKey];if(!m)return;
  const cfg=ACFG[agKey];
  const elapsed=((Date.now()-m.t0)/1000).toFixed(1);
  const cpm=COST_PER_1K[GMOD]||0.0005;
  const cost=(m.tokens/1000*cpm).toFixed(5);
  logMetric(agKey,m.tokens,m.tools,cost,elapsed);

  const card=document.createElement('div');
  card.style.cssText=`margin:8px 12px;padding:10px 12px;background:var(--bg2);border:1px solid ${cfg.col}44;border-left:3px solid ${cfg.col};font-family:var(--mono);font-size:17px;line-height:1.8;animation:fadeUp .3s`;
  card.innerHTML=`<div style="font-size:15px;font-weight:700;color:${cfg.col};margin-bottom:4px">Resumen · ${cfg.name.split(' ')[0]}</div>
<div style="color:var(--t2)">Tiempo: <span style="color:var(--t1)">${elapsed}s</span></div>
<div style="color:var(--t2)">Tokens: <span style="color:var(--t1)">${m.tokens}</span></div>
<div style="color:var(--t2)">Herramientas: <span style="color:var(--t1)">${m.tools}</span></div>
<div style="color:var(--t2)">Costo est.: <span style="color:var(--acc)">$${cost} USD</span></div>
<div style="color:var(--t3);font-size:15px;margin-top:2px">modelo: ${GMOD}</div>`;

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
  window.followAg=null;
  window.camZTgt=null;
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
  const hdr=document.createElement('div');hdr.style.cssText='display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--bg2);border:1px solid var(--b1);margin-bottom:8px';hdr.innerHTML=`<div style="width:28px;height:28px;background:${cfg.col}22;color:${cfg.col};display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800">${cfg.name.split(' ').map(n=>n[0]).join('')}</div><div><div style="font-size:14px;font-weight:700;color:var(--t1)">${cfg.name}</div><div style="font-family:var(--mono);font-size:15px;color:var(--t2)">${cfg.role}</div></div>`;w.appendChild(hdr);
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

    flowWrap.innerHTML='<div style="padding:8px 12px 4px;font-family:var(--mono);font-size:17px;color:var(--t2);letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid var(--b1);margin-bottom:6px">Reunion de equipo · Dev Teams</div>';

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


/*  CONSOLE  */
window.chatAgent='ceo';
function filterChatSearch(q){
  const msgs=document.getElementById('cmsgs');
  if(!msgs)return;
  const all=msgs.querySelectorAll('.cmsg');
  q=q.toLowerCase().trim();

  all.forEach(m=>{
    if(!q){
      m.style.display='';
      return;
    }
    const txt=m.textContent.toLowerCase();
    m.style.display=txt.includes(q)?'':'none';
  });
}


const chatH={};
Object.keys(ACFG).forEach(k=>{
  try{const saved=localStorage.getItem('chat_'+k);chatH[k]=saved?JSON.parse(saved):[];}
  catch(e){chatH[k]=[];}
});
let _lastIntentResolution=null;
const _defaultSharedProjectMemory=()=>({
  goal:'',
  activeFile:'',
  lastFiles:[],
  lastWorkspaceAction:'',
  recentIntent:'',
  decisions:[],
  risks:[],
  nextStep:'',
  lastAgent:'',
  updatedAt:0
});
// ==================== MEMORIA COMPARTIDA DEL EQUIPO ====================
let SHARED_MEMORY = {
  decisions: [],
  filesAnalyzed: [],
  openQuestions: [],
  roadmap: [],
  lastUpdate: Date.now()
};

function saveSharedMemory() {
  localStorage.setItem('devteams_shared_memory', JSON.stringify(SHARED_MEMORY));
}

function loadSharedMemory() {
  const saved = localStorage.getItem('devteams_shared_memory');
  if (saved) SHARED_MEMORY = JSON.parse(saved);
}

function updateSharedDecision(agentKey, decision) {
  const cfg = ACFG[agentKey] || { name: 'Equipo' };
  SHARED_MEMORY.decisions.unshift({
    agent: cfg.name.split(' ')[0],
    decision: decision,
    timestamp: Date.now()
  });
  if (SHARED_MEMORY.decisions.length > 30) SHARED_MEMORY.decisions.pop();
  saveSharedMemory();
}

function getSharedContext() {
  if (SHARED_MEMORY.decisions.length === 0) return "Sin decisiones recientes.";
  return SHARED_MEMORY.decisions.slice(0, 8)
    .map(d => `• ${d.agent}: ${d.decision}`).join('\n');
}

// Cargar al inicio
loadSharedMemory();
let _sharedProjectMemory = _defaultSharedProjectMemory();
try{
  const saved=JSON.parse(localStorage.getItem('sharedProjectMemory')||'null');
  if(saved&&typeof saved==='object')_sharedProjectMemory={..._sharedProjectMemory,...saved};
}catch(e){}
function saveSharedProjectMemory(){try{localStorage.setItem('sharedProjectMemory',JSON.stringify(_sharedProjectMemory));}catch(e){}}
function _pushSharedUnique(list,value,limit=6){
  const next=[value,...(Array.isArray(list)?list:[]).filter(v=>v&&v!==value)];
  return next.slice(0,limit);
}
function _setSharedProjectMemory(patch={}){
  _sharedProjectMemory={..._sharedProjectMemory,...patch,updatedAt:Date.now()};
  saveSharedProjectMemory();
}
function _rememberSharedProjectFile(pathLike,action=''){
  const path=_normalizeWorkspacePath(pathLike);
  if(!path)return;
  _setSharedProjectMemory({
    activeFile:path,
    lastFiles:_pushSharedUnique(_sharedProjectMemory.lastFiles,path,6),
    lastWorkspaceAction:action||_sharedProjectMemory.lastWorkspaceAction
  });
}
function _recordIntentResolution(intent){
  if(!intent)return;
  _lastIntentResolution={
    type:intent.type||'chat',
    routeKind:intent.routeKind||'',
    activeKey:intent.activeKey||'',
    text:String(intent.text||'').slice(0,120),
    ts:Date.now()
  };
  _setSharedProjectMemory({
    recentIntent:[intent.type,intent.routeKind].filter(Boolean).join(':')||intent.type||'chat',
    lastAgent:intent.activeKey||_sharedProjectMemory.lastAgent
  });
}
function _updateSharedProjectFromChat(agentKey,userText,reply){
  const text=String(userText||'').trim();
  const appMode=_isProjectAppPrompt(text);
  const nextPatch={
    lastAgent:agentKey,
    nextStep:text?`Seguir sobre: ${text.slice(0,80)}`:_sharedProjectMemory.nextStep
  };
  if(appMode&&!_sharedProjectMemory.goal)nextPatch.goal=text.slice(0,140);
  const normalizedReply=String(reply||'').toLowerCase();
  if(/\b(riesgo|bug|falla|bloque|error)\b/.test(normalizedReply)){
    nextPatch.risks=_pushSharedUnique(_sharedProjectMemory.risks,text.slice(0,100),5);
  }
  _setSharedProjectMemory(nextPatch);
}
function _updateSharedProjectFromTask(taskTxt,sel,status='done'){
  const owner=sel&&sel[0]?sel[0]:'';
  _setSharedProjectMemory({
    goal:_sharedProjectMemory.goal||String(taskTxt||'').slice(0,140),
    nextStep:status==='done'
      ?`Validar cierre de tarea: ${String(taskTxt||'').slice(0,80)}`
      :`Revisar tarea ${status}: ${String(taskTxt||'').slice(0,80)}`,
    lastAgent:owner||_sharedProjectMemory.lastAgent,
    decisions:_pushSharedUnique(_sharedProjectMemory.decisions,`Tarea ${status}: ${String(taskTxt||'').slice(0,90)}`,6)
  });
}
function _sharedMemoryPromptBlock(){
  const mem=_sharedProjectMemory||_defaultSharedProjectMemory();
  const parts=[];
  if(mem.goal)parts.push(`Objetivo: ${mem.goal}`);
  if(mem.activeFile)parts.push(`Archivo activo: ${mem.activeFile}`);
  if(mem.lastWorkspaceAction)parts.push(`Workspace: ${mem.lastWorkspaceAction}`);
  if(mem.nextStep)parts.push(`Siguiente paso: ${mem.nextStep}`);
  if(mem.decisions&&mem.decisions.length)parts.push(`Decisiones: ${mem.decisions.slice(0,3).join(' | ')}`);
  if(mem.risks&&mem.risks.length)parts.push(`Riesgos: ${mem.risks.slice(0,3).join(' | ')}`);
  return parts.length?parts.join('. '):'';
}
//  COMPRESIÓN DE MEMORIA 
const MEM_THRESHOLD=16;
async function compressMemory(k){
  const userMsgs=chatH[k].filter(m=>m.role!=='system');
  if(userMsgs.length<MEM_THRESHOLD||!GKEY)return;
  showToast(`Comprimiendo memoria de ${ACFG[k].name.split(' ')[0]}...`,'#9060cc');

  const filtered=userMsgs.filter(m=>{
    const c=String(m?.content||'').trim();
    if(!c)return false;
    if(c.startsWith('[CONTEXTO PREVIO RESUMIDO]:'))return false;
    if(c.startsWith('/'))return false;
    if(/^Lectura de /i.test(c))return false;
    if(/^Resultados para /i.test(c))return false;
    if(/^Analisis de /i.test(c))return false;
    if(/^Archivos disponibles /i.test(c))return false;
    if(/^Carpeta /i.test(c))return false;
    if(/^Tools disponibles:/i.test(c))return false;
    if(/^Tools > /i.test(c))return false;
    return true;
  });

  if(filtered.length<MEM_THRESHOLD)return;

  const convText=filtered.map(m=>`${m.role==='user'?'User':ACFG[k].name.split(' ')[0]}: ${m.content}`).join('\n');

  const summary=await groq([
    {
      role:'system',
      content:'Resume la conversacion como memoria operativa. Extrae objetivo del usuario, decisiones tomadas, restricciones, preferencias, pendientes y contexto tecnico importante. Ignora comandos del navegador, lecturas de archivos y salidas operativas largas. No inventes nada. Maximo 100 palabras.'
    },
    {
      role:'user',
      content:`Convierte este historial en memoria operativa util:\n\n${convText}`
    }
  ],()=>{},160);

  if(summary){
    const tail=userMsgs.slice(-8);
    chatH[k]=[
      {role:'system',content:mkSys(k)},
      {role:'assistant',content:`[CONTEXTO PREVIO RESUMIDO]: ${summary}`},
      ...tail
    ];
    saveChatH(k);
    showToast(`Memoria de ${ACFG[k].name.split(' ')[0]} comprimida`,'#0fa855');
  }
}

const GREETS={
  ceo:'Hola, soy Ana Garcia, CEO de Dev Teams.',
  pm:'Hola, soy Sofia Castro, Product Manager de Dev Teams.',
  devbe:'Hola, soy Yared Henriquez, Founder and Architect de Dev Teams.',
  devfe:'Hola, soy Diego Herrera, Dev Frontend de Dev Teams.',
  qa:'Hola, soy Marta Lopez, QA Engineer de Dev Teams.',
  devops:'Hola, soy Luis Mendoza, DevOps Engineer de Dev Teams.',
  ux:'Hola, soy Valentina Ramos, UX Designer de Dev Teams.',
  data:'Hola, soy Andres Torres, Data Analyst de Dev Teams.'
};
function addGreeting(){const t=GREETS[chatAgent];if(!t)return;appendMsg('agent',ACFG[chatAgent].name,t);chatH[chatAgent].push({role:'assistant',content:t});}
function setChatAgent(k){
  chatAgent=k;
  document.querySelectorAll('.cas-btn').forEach(b=>b.classList.remove('on'));
  document.getElementById('cas-'+k)?.classList.add('on');
  _refreshWorkspaceQuickUI();
  const badge=document.getElementById('cagbadge');
  if(k==='all'){
    badge.textContent='TODOS';
    badge.style.color='var(--acc)';
    document.getElementById('cmsgs').innerHTML='<div style="padding:10px 12px;font-family:var(--mono);font-size:17px;color:var(--t2)">Modo broadcast: tu mensaje se envia a todo el equipo y cada agente responde desde su rol.</div>';
    _refreshMemoryBarUI();
    refreshSceneCinemaHud();
    refreshOpsBar();
    return;
  }
  badge.textContent=ACFG[k].name.split(' ')[0];
  badge.style.color=ACFG[k].col;
  document.getElementById('cmsgs').innerHTML='';
  if(chatH[k].length===0)addGreeting();
  else chatH[k].forEach(m=>{
    if(m.role==='system')return;
    if(m.role==='assistant'&&typeof m.content==='string'&&m.content.startsWith('[CONTEXTO PREVIO RESUMIDO]:'))return;
    appendMsg(m.role==='user'?'user':'agent',m.role==='user'?'Tu':ACFG[k].name,m.content);
  });
  _refreshMemoryBarUI();
  const ag=AG[k];
  if(ag){
    ag.say('Hola');
    ag.setState('thinking');
    setTimeout(()=>ag.setState('idle'),1200);
  }
  refreshSceneCinemaHud();
  refreshOpsBar();
  syncPanelContext();
}

function appendMsg(type,who,text,col=''){
  const msgs=document.getElementById('cmsgs');
  const w=document.createElement('div');
  w.className='cmsg';

  const wd=document.createElement('div');
  wd.className='cwho'+(type==='user'?' u':'');

  const dot=document.createElement('span');
  dot.style.background=col||ACFG[chatAgent]?.col||'var(--acc)';
  wd.appendChild(dot);
  wd.appendChild(document.createTextNode(who));

  if(type==='agent'&&col)wd.style.color=col;
  else if(type==='agent')wd.style.color=ACFG[chatAgent]?.col||'';

  const bd=document.createElement('div');
  bd.className='cbody'+(type==='user'?' um':'');
  bd.innerHTML=safeTextToHtml(text);

  w.appendChild(wd);
  w.appendChild(bd);
  msgs.appendChild(w);
  msgs.scrollTop=msgs.scrollHeight;
  return bd;
}
/* helpers duplicadas de chat removidas */

let _workspaceDirHandle=null;
let _workspaceIndex=[];
let _workspaceIndexedAt=0;
let _workspaceLastFilePath='';
let _workspaceLastSearch='';
let _workspacePickerMode='read';
let _workspacePickerItems=[];
let _workspacePdfReady=false;
let _workspaceOfficeReady=false;
let _workspaceViewerState=null;

function _chatHistoryParts(agentKey,limit=12){
  const hist=(chatH[agentKey]||[]).filter(m=>m&&m.role!=='system');
  const summaryMsg=[...hist].reverse().find(m=>m.role==='assistant'&&typeof m.content==='string'&&m.content.startsWith('[CONTEXTO PREVIO RESUMIDO]:'));
  const recent=hist.filter(m=>m!==summaryMsg).slice(-limit);
  return {
    summary:summaryMsg?summaryMsg.content.replace('[CONTEXTO PREVIO RESUMIDO]:','').trim():'',
    recent
  };
}

function _officeChatSnapshot(agentKey){
  const teamStates=Object.entries(AG).map(([k,a])=>`${ACFG[k].name.split(' ')[0]}:${a.state}`).join(', ');
  const ag=AG[agentKey];
  const hh=new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'});
  const meeting=_meetingActive?'Reunion activa.':'Sin reunion activa.';
  const mode=dayMode?'Modo dia.':'Modo noche.';
  const shared=_sharedProjectMemory.activeFile?`Archivo activo ${_sharedProjectMemory.activeFile}. `:'';
  return `Hora ${hh}. Panel ${currentPanel}. ${meeting} ${mode} ${shared}${ag?ACFG[agentKey].name.split(' ')[0]+' esta '+ag.state+'. ':''}Estados del equipo: ${teamStates}.`;
}

function _classifyChatComplexity(text){
  const raw=String(text||'').trim();
  const t=raw.toLowerCase();
  const words=raw.split(/\s+/).filter(Boolean).length;

  const ambiguousShort=words<=7&&/\b(eso|esto|asi|igual|lo mismo|hazlo|mejoralo|revisalo|esa parte|ese bloque|lo de antes)\b/.test(t);
  const multiRequest=(t.match(/\b(y|ademas|tambien|luego|despues)\b/g)||[]).length>=2;
  const analytical=/\b(como|porque|analiza|comparar|compara|mejor|mejora|arquitectura|logica|impacto|riesgo|opciones|explica|organiza|reestructura)\b/.test(t);

  if(ambiguousShort)return 'ambiguous';
  if(words>=18||multiRequest||analytical)return 'complex';
  return 'simple';
}

function _needsClarification(text){
  return _classifyChatComplexity(text)==='ambiguous';
}

function _buildClarificationQuestion(text,agentKey){
  const name=ACFG[agentKey]?.name?.split(' ')[0]||'Agente';
  const t=String(text||'').toLowerCase();

  if(/\b(chat|groq|mensaje|prompt)\b/.test(t))return `${name}: Te refieres al chat, al prompt o a la respuesta de Groq?`;
  if(/\b(readme|documentacion|doc)\b/.test(t))return `${name}: Te refieres al README completo o a una seccion puntual?`;
  if(/\b(ui|css|pantalla|vista|interfaz)\b/.test(t))return `${name}: Te refieres al layout, a colores o al comportamiento de la interfaz?`;
  if(/\b(path|nav|ruta|colision|mesa|silla)\b/.test(t))return `${name}: Te refieres a navegacion, colisiones o posicion de objetos?`;

  return `${name}: Dame un poco mas de contexto para ayudarte bien.`;
}

function _responseGuide(text){
  const mode=_classifyChatComplexity(text);
  if(mode==='simple')return 'Si la pregunta es simple, responde directo en 1 a 3 frases.';
  if(mode==='ambiguous')return 'Si falta contexto, haz una sola pregunta breve y espera.';
  return 'Si la pregunta es compleja, responde con este orden: 1) Lo que ya existe en esta app, 2) Lo que esta flojo, 3) Cambios concretos, 4) Orden recomendado. Maximo 7 lineas y cero relleno.';
}

function _isProjectAppPrompt(text){
  const t=String(text||'').toLowerCase().trim();
  if(!t)return false;

  if(/\b(esta app|este proyecto|este sistema|dev teams|workspace|groq|api key|planner|delegacion|modal|consola|panel|historial|task|tarea)\b/.test(t))return true;
  if(/\b(chat|contexto|memoria|tools|herramientas|navegador)\b/.test(t))return true;
  if(/\b(_buildchatpayload|compressmemory|_handlebrowsertoolcommand|_readworkspacetext|_routechatagent|runagentchain|savekey|rendertaskhistory|modal de tareas)\b/.test(t))return true;

  return false;
}


function _shouldIsolateChatTurn(text,agentKey){
  const current=String(text||'').trim();
  if(!current)return false;

  if(!_isProjectAppPrompt(current)&&_classifyChatComplexity(current)==='simple'){
    return true;
  }

  const lastUser=[...(chatH[agentKey]||[])]
    .reverse()
    .find(m=>m&&m.role==='user'&&typeof m.content==='string')?.content||'';

  if(!lastUser)return false;

  return _isProjectAppPrompt(lastUser)&&!_isProjectAppPrompt(current)&&_classifyChatComplexity(current)!=='complex';
}

function _buildChatPayload(agentKey, userText, opts = {}) {
  const isolated = !!opts.isolated;
  const mem = isolated ? { summary: '', recent: [] } : _chatHistoryParts(agentKey, 12);
  const recent = mem.recent.slice();
  const mode = _classifyChatComplexity(userText);
  const workspaceState = _workspaceDirHandle ? 'carpeta conectada' : 'carpeta no conectada';

  if (!(recent[recent.length - 1] && recent[recent.length - 1].role === 'user' && recent[recent.length - 1].content === userText)) {
    recent.push({ role: 'user', content: userText });
  }

  return [
    { role: 'system', content: mkSys(agentKey) },
    { role: 'system', content: 'Usa primero el contexto reciente de la conversación.' },
    { role: 'system', content: `Memoria compartida del equipo:\n${getSharedContext()}` },   // ← NUEVO
    { role: 'system', content: `Estado del workspace: ${workspaceState}` },
    { role: 'system', content: `Modo de respuesta: ${mode}. ${_responseGuide(userText)}` },
    ...recent
  ].filter(Boolean);
}

function _buildBroadcastPayload(agentKey,userText,opts={}){
  const appMode=_isProjectAppPrompt(userText);
  const flagged=_looksInappropriatePrompt(userText);
  const base=_buildChatPayload(agentKey,userText,opts);

  return [
    base[0],
    flagged
      ? {role:'system',content:'La pregunta parece ofensiva o inadecuada. No la conviertas en una definicion inocente o academica si la intencion probable es insultar, humillar o pedir contenido sexual o agresivo. Rechaza con calma y redirige en 1 o 2 lineas.'}
      : appMode
        ? {role:'system',content:`Estas en modo broadcast. No repitas ideas genericas ni consultoria abstracta. ${_broadcastRoleAngle(agentKey,userText)} Debes mencionar exactamente 1 o 2 piezas reales de esta app. No uses frases como "podriamos implementar un sistema". No menciones saveKey salvo que el tema sea API key o persistencia de credenciales. Cierra con una sola prioridad concreta. Maximo 4 lineas.`}
        : {role:'system',content:'Estas en modo broadcast general. La pregunta no trata sobre la app. Responde directo, breve y util. No hables de Dev Teams, del equipo, de esta oficina ni de funciones del proyecto. Maximo 2 lineas.'},
    ...base.slice(1)
  ];
}



function _chatThinkDelay(text){
  const mode=_classifyChatComplexity(text);
  if(mode==='simple')return 450+Math.random()*150;
  if(mode==='ambiguous')return 750+Math.random()*180;
  return 1400+Math.random()*450;
}

function _chatMaxTokens(text,isBroadcast=false){
  const mode=_classifyChatComplexity(text);
  if(isBroadcast)return mode==='complex'?240:140;
  if(mode==='simple')return 120;
  if(mode==='ambiguous')return 90;
  return 420;
}


async function _prepareAgentForChat(agentKey,text){
  const ag=AG[agentKey];
  if(!ag)return;
  const mode=_classifyChatComplexity(text);

  if(agentKey==='devbe'&&mode==='complex')ag.goToLibrary(null);
  else if(agentKey==='devops'&&/\b(deploy|infra|logs|docker|k8s|scan|ip)\b/i.test(text))ag.goToLibrary(null);
  else if(Math.random()<.35)ag.goToLibrary(null);
  else{
    ag.setState('thinking');
    _startChatGesture(agentKey);
  }

  await sleep(_chatThinkDelay(text));
}

function _scoreChatAgents(text,currentAgent){
  const t=String(text||'').toLowerCase().trim();

  const score={
    ceo:0,
    pm:0,
    devbe:0,
    devfe:0,
    qa:0,
    devops:0,
    ux:0,
    data:0
  };

  const add=(keys,n=1)=>keys.forEach(k=>{score[k]+=n;});

  if(/\b(ana|ceo)\b/.test(t))add(['ceo'],8);
  if(/\b(sofia|pm)\b/.test(t))add(['pm'],8);
  if(/\b(yared|backend|arquitectura|api|apis|db|sql|auth|autenticacion|server|servidor)\b/.test(t))add(['devbe'],4);
  if(/\b(diego|frontend|front|ui|css|html|react|responsive|pantalla|componente)\b/.test(t))add(['devfe'],4);
  if(/\b(marta|qa|bug|bugs|test|tests|testing|staging|e2e|validacion|regresion)\b/.test(t))add(['qa'],4);
  if(/\b(luis|devops|deploy|infra|infraestructura|docker|k8s|kubernetes|pipeline|ci\/cd|logs|monitoring|observabilidad|ip|scan|escaneo|host|puerto|puertos)\b/.test(t))add(['devops'],4);
  if(/\b(valentina|ux|diseno|figma|wireframe|copy|usabilidad|experiencia|interfaz)\b/.test(t))add(['ux'],4);
  if(/\b(andres|data|metricas|dashboard|reporte|reportes|csv|json|analitica|tendencia|modelo)\b/.test(t))add(['data'],4);

  if(/\b(chat|contexto|memoria|historial|prompt|tools|tool|herramientas|navegador|workspace|comandos)\b/.test(t))add(['devbe','pm','devfe','ux'],5);
  if(/\b(mejorar la app|mejorar este proyecto|mejorar esta app|esta app|este sistema)\b/.test(t))add(['devbe','pm','devfe','ux'],6);
  if(/\b(consola|panel|modal|interfaz|flujo|usabilidad)\b/.test(t))add(['devfe','ux'],4);
  if(/\b(memoria|historial|contexto)\b/.test(t))add(['devbe','pm'],3);
  if(/\b(groq|api key|planner|delegacion)\b/.test(t))add(['devbe','devops'],2);
  if(/\b(tools del navegador|\/carpeta|\/leer|\/buscar|\/analizar|\/exportar|workspace)\b/.test(t))add(['devbe','devfe','ux'],4);

  if(/\b(producto|roadmap|backlog|sprint|prioridad|prioridades|scope|entrega|requisito|coordinar|seguimiento)\b/.test(t))add(['pm'],3);
  if(/\b(estrategia|negocio|cliente|decision|direccion)\b/.test(t))add(['ceo'],3);

  if(!/\b(groq|api key|infra|deploy|docker|k8s|logs|monitoring|observabilidad|ip|scan)\b/.test(t))score.devops-=3;
  if(!/\b(metricas|dashboard|reporte|reportes|csv|json|analitica|tendencia|modelo|observabilidad)\b/.test(t))score.data-=3;

  if(/\b(api|backend|frontend|qa|deploy|infra|ux|data)\b/.test(t))add(['pm'],1);
  if(currentAgent&&score[currentAgent]>0)score[currentAgent]+=1;

  return Object.entries(score)
    .map(([key,score])=>({key,score}))
    .sort((a,b)=>b.score-a.score);
}

function _pickBroadcastAgents(text){
  const t=String(text||'').toLowerCase();

  if(!_isProjectAppPrompt(text)){
    if(/\b(huevo|gallina|ciencia|biologia|evolucion|dato|estadistica)\b/.test(t)){
      return ['data'];
    }
    if(/\b(diseno|ux|interfaz|pagina web|sitio web|landing|layout|tipografia|colores|web)\b/.test(t)){
      return ['ux'];
    }
    if(/\b(api|apis|integracion|backend|endpoint|servicio|servicios)\b/.test(t)){
      return ['devbe'];
    }
    return ['ceo'];
  }

  if(/\b(mejorar|revisar|auditar|optimizar)\b/.test(t)&&/\b(chat|contexto|memoria|tools|herramientas|navegador|workspace)\b/.test(t)){
    return ['pm','devbe','devfe'];
  }

  const ranked=_scoreChatAgents(text,'ceo').filter(x=>x.score>0).map(x=>x.key);
  const top=ranked.slice(0,3);
  return top.length?top:['devbe','pm','devfe'];
}


function _broadcastRoleAngle(agentKey,text){
  return {
    ceo:'Habla solo de prioridad y orden de implementacion. No hagas resumen tecnico.',
    pm:'Habla solo de secuencia y prioridad. Debes decir que va primero y que va despues. No menciones funciones salvo para fijar el orden.',
    devbe:'Habla solo de logica interna del chat, memoria, router y tools. Debes nombrar funciones exactas. No hables de UX ni de prioridad general.',
    devfe:'Habla solo de consola, panel, modal, historial, legibilidad y friccion visual. No repitas funciones de memoria salvo si afectan UI.',
    qa:'Habla solo de riesgos, regresiones y pruebas que faltan. No propongas features nuevas.',
    devops:'Habla solo de Groq, API key, errores operativos y estabilidad. No opines de memoria o UX salvo que dependan de Groq.',
    ux:'Habla solo de friccion, claridad y experiencia de uso. Debes aterrizarlo a flujos reales del chat o tools.',
    data:'Habla solo de metricas, observabilidad o preguntas de tipo cientifico/general. No hables de funciones de la app salvo si el tema es datos.'
  }[agentKey]||'Habla solo desde tu rol.';
}


function _routeChatAgent(text,currentAgent){
  const ranked=_scoreChatAgents(text,currentAgent);
  const best=ranked[0];
  return !best||best.score<=0?(currentAgent||'ceo'):best.key;
}

function _isWorkspaceToolIntent(text){
  const raw=String(text||'').trim();
  const lower=raw.toLowerCase();
  return /^\/(tools|ayuda|carpeta|indexar|archivos|leer|buscar|analizar|exportar)\b/i.test(raw)
    || /^herramientas\b/i.test(lower)
    || /^conecta carpeta\b/i.test(lower)
    || /^abrir carpeta\b/i.test(lower)
    || /^lista archivos\b/i.test(lower)
    || /^lee(?:\s+el)?\s+archivo\b/i.test(lower)
    || /^busca(?:\s+en\s+el\s+proyecto)?\b/i.test(lower)
    || /^analiza(?:\s+el)?\s+archivo\b/i.test(lower)
    || /^exporta chat\b/i.test(lower);
}

function _matchGotoIntent(text){
  const gotoMatch=String(text||'').match(/(?:habla con|ve a hablar con|goto|talk to)\s+(\w+)/i);
  if(!gotoMatch)return null;
  const targetName=gotoMatch[1].toLowerCase();
  const targetKey=Object.keys(ACFG).find(k=>ACFG[k].name.split(' ')[0].toLowerCase()===targetName||k===targetName);
  if(!targetKey)return null;
  return {
    targetKey,
    topic:String(text||'').replace(gotoMatch[0],'').trim()
  };
}

function _resolveChatIntent(text,currentAgent){
  const intent={
    text:String(text||'').trim(),
    requestedAgent:currentAgent||'ceo',
    activeKey:currentAgent||'ceo',
    type:'chat',
    routeKind:'',
    broadcastKeys:[],
    goto:null,
    clarification:'',
    complexity:_classifyChatComplexity(text),
    project:_isProjectAppPrompt(text),
    unsafe:_looksInappropriatePrompt(text)
  };

  if(intent.requestedAgent==='all'){
    if(_isWorkspaceToolIntent(intent.text)){
      intent.type='tool';
      intent.activeKey='pm';
      intent.routeKind='tools';
      return intent;
    }
    intent.type='broadcast';
    intent.broadcastKeys=_pickBroadcastAgents(intent.text);
    return intent;
  }

  if(_isWorkspaceToolIntent(intent.text)){
    intent.type='tool';
    return intent;
  }

  const gotoIntent=_matchGotoIntent(intent.text);
  if(gotoIntent&&gotoIntent.targetKey!==intent.requestedAgent){
    intent.type='goto';
    intent.goto=gotoIntent;
    return intent;
  }

  const routedAgent=_routeChatAgent(intent.text,intent.requestedAgent);
  if(routedAgent!==intent.requestedAgent){
    intent.activeKey=routedAgent;
    intent.routeKind='topic';
  }

  if(_needsClarification(intent.text)){
    intent.type='clarify';
    intent.clarification=_buildClarificationQuestion(intent.text,intent.activeKey);
    return intent;
  }

  return intent;
}

function _applyResolvedIntentRouting(intent){
  if(!intent||intent.requestedAgent===intent.activeKey)return;
  setChatAgent(intent.activeKey);
  const cfg=ACFG[intent.activeKey];
  if(!cfg)return;
  const msg=intent.routeKind==='tools'
    ? `Tools redirigidos a ${cfg.name.split(' ')[0]}`
    : `Chat redirigido a ${cfg.name.split(' ')[0]}`;
  showToast(msg,cfg.col,intent.activeKey);
}

function _appendClarificationTurn(agentKey,text,clarification){
  appendMsg('user','Tu',text);
  if(!chatH[agentKey])chatH[agentKey]=[];
  chatH[agentKey].push({role:'user',content:text});
  saveChatH(agentKey);

  appendMsg('agent',ACFG[agentKey].name,clarification,ACFG[agentKey].col);
  chatH[agentKey].push({role:'assistant',content:clarification});
  saveChatH(agentKey);
}

async function _handleBroadcastIntent(intent){
  const text=intent.text;
  const keys=intent.broadcastKeys.length?intent.broadcastKeys:_pickBroadcastAgents(text);

  appendMsg('user','Tu',text,'var(--acc)');
  showBroadcastLines(text);
  appendMsg('agent','Sistema',`Broadcast inteligente: responden ${keys.map(k=>ACFG[k].name.split(' ')[0]).join(', ')}.`,'var(--acc)');

  const collected=[];

  for(const k of keys){
    const cfg=ACFG[k];
    const ag=AG[k];
    _flowMetrics[k]={t0:Date.now(),tokens:0,tools:0,cost:0};

    const msgs=document.getElementById('cmsgs');
    const w=document.createElement('div');
    w.className='cmsg';

    const wd=document.createElement('div');
    wd.className='cwho';
    const dot=document.createElement('span');
    dot.style.background=cfg.col;
    wd.appendChild(dot);
    wd.appendChild(document.createTextNode(cfg.name.split(' ')[0]));
    wd.style.color=cfg.col;

    const bd=document.createElement('div');
    bd.className='cbody';
    renderRichText(bd,'',{allowEmphasis:false,cursor:true});

    w.appendChild(wd);
    w.appendChild(bd);
    msgs.appendChild(w);
    msgs.scrollTop=msgs.scrollHeight;

    await _prepareAgentForChat(k,text);

    const payload=_buildBroadcastPayload(k,text,{isolated:_shouldIsolateChatTurn(text,k)});
    const res=await groq(
      payload,
      (tok,full)=>{
        renderRichText(bd,full,{allowEmphasis:false,cursor:true});
        msgs.scrollTop=msgs.scrollHeight;
        ag.speech=full.slice(-18);
        ag.sa=.85;
      },
      _chatMaxTokens(text,true)+40
    );

    const final=res||'No pude responder con Groq en este momento.';
    renderRichText(bd,final,{allowEmphasis:false});
    collected.push(`${cfg.name.split(' ')[0]}: ${final}`);

    if(!chatH[k])chatH[k]=[];
    chatH[k].push({role:'user',content:text},{role:'assistant',content:final});
    saveChatH(k);

    const _cm=_flowMetrics[k];
    if(_cm){
      const _cp=COST_PER_1K[GMOD]||0.0005;
      const _cel=((Date.now()-_cm.t0)/1000).toFixed(1);
      const _cco=(_cm.tokens/1000*_cp).toFixed(5);
      logMetric(k,_cm.tokens,_cm.tools,_cco,_cel);
      _flowMetrics[k]={t0:Date.now(),tokens:0,tools:0,cost:0};
    }

    ag.setState('idle');
    recAct();
    playNt();
    await sleep(220);
  }

  if(intent.project){
    const summaryAgent=keys.includes('pm')?'pm':keys[0];
    const summaryPayload=[
      {role:'system',content:mkSys(summaryAgent)},
      {role:'system',content:'Cierra el broadcast como PM. Maximo 5 lineas. Formato exacto: Ya existe:, Esta flojo:, Cambio 1:, Cambio 2:, Orden:. Debes mencionar funciones o bloques reales de esta app. Prohibido responder con consenso generico.'},
      {role:'user',content:`Pregunta del creador: ${text}\n\nAportes:\n${collected.join('\n')}`}
    ];
    const summary=await groq(summaryPayload,()=>{},160);

    if(summary){
      appendMsg('agent',`${ACFG[summaryAgent].name.split(' ')[0]} resumen`,summary,ACFG[summaryAgent].col);
      _updateSharedProjectFromChat(summaryAgent,text,summary);
    }
  }

  _queuePsychologistVisit(text,keys.includes('pm')?'pm':keys[0]);
  _updateSharedProjectFromChat(keys.includes('pm')?'pm':keys[0],text,collected.join('\n'));
}

async function _handleDirectChatIntent(intent){
  const activeKey=intent.activeKey;
  const text=intent.text;

  appendMsg('user','Tu',text);
  if(!chatH[activeKey])chatH[activeKey]=[];
  chatH[activeKey].push({role:'user',content:text});
  saveChatH(activeKey);
  recAct();

  if(!_flowMetrics[activeKey])_flowMetrics[activeKey]={t0:Date.now(),tokens:0,tools:0,cost:0};

  const ag=AG[activeKey];
  await _prepareAgentForChat(activeKey,text);

  const isComplex=intent.complexity==='complex';
  const planner=isComplex?await _runPlanner(activeKey,text):'';
  const delegationNote=isComplex?await runAgentChain(activeKey,text):'';
  const enrichedText=[
    text,
    planner?`Planner interno:\n${planner}`:'',
    delegationNote||''
  ].filter(Boolean).join('\n\n');

  const msgs=document.getElementById('cmsgs');
  const w=document.createElement('div');
  w.className='cmsg';

  const wd=document.createElement('div');
  wd.className='cwho';
  const dot=document.createElement('span');
  dot.style.background=ACFG[activeKey]?.col||'var(--acc)';
  wd.appendChild(dot);
  wd.appendChild(document.createTextNode(ACFG[activeKey]?.name||activeKey));
  wd.style.color=ACFG[activeKey]?.col||'';

  const bd=document.createElement('div');
  bd.className='cbody';
  renderRichText(bd,'',{allowEmphasis:false,cursor:true});

  w.appendChild(wd);
  w.appendChild(bd);
  msgs.appendChild(w);
  msgs.scrollTop=msgs.scrollHeight;

  const payload=_buildChatPayload(activeKey,enrichedText);
  const result=await groq(
    payload,
    (tok,full)=>{
      renderRichText(bd,full,{allowEmphasis:false,cursor:true});
      msgs.scrollTop=msgs.scrollHeight;
      if(ag){
        ag.speech=full.slice(-18);
        ag.sa=.85;
      }
    },
    _chatMaxTokens(text)+(planner||delegationNote?60:0)
  );

  const final=result||'No pude responder con Groq en este momento.';

  if(ag){
    ag.setState('idle');
    _doChatResponseGesture(activeKey,final);
  }

  renderRichText(bd,final,{allowEmphasis:false});
  chatH[activeKey].push({role:'assistant',content:final});
  saveChatH(activeKey);
  playNt();

  _chatCount++;
  if(_chatCount===1)unlockAchievement('chat_master');
  if(_chatCount>=10)unlockAchievement('chat_master');

  maybeInterrupt(activeKey,text,final);
  _queuePsychologistVisit(text,activeKey);
  _updateSharedProjectFromChat(activeKey,text,final);

  if(chatH[activeKey].filter(m=>m.role!=='system').length>=MEM_THRESHOLD)compressMemory(activeKey);

  const _cm=_flowMetrics[activeKey];
  if(_cm){
    const _cp=COST_PER_1K[GMOD]||0.0005;
    const _cel=((Date.now()-_cm.t0)/1000).toFixed(1);
    const _cco=(_cm.tokens/1000*_cp).toFixed(5);
    logMetric(activeKey,_cm.tokens,_cm.tools,_cco,_cel);
    _flowMetrics[activeKey]={t0:Date.now(),tokens:0,tools:0,cost:0};
  }
}

async function sendChat(){
  if(!GKEY)return;
  const inp=document.getElementById('cinp');
  const sb=document.getElementById('csend');
  const text=inp.value.trim();
  if(!text)return;

  inp.value='';
  sb.disabled=true;

  try{
    const intent=_resolveChatIntent(text,chatAgent);

    _recordIntentResolution(intent);
    _applyResolvedIntentRouting(intent);

    // ← borraste el segundo bloque duplicado de aquí

    if(intent.type==='broadcast'){
      await _handleBroadcastIntent(intent);
      return;
    }

    if(intent.type==='goto'&&intent.goto){
      goTalkTo(intent.activeKey,intent.goto.targetKey,intent.goto.topic);
      return;
    }

    if(intent.type==='clarify'){
      _appendClarificationTurn(intent.activeKey,intent.text,intent.clarification);
      return;
    }

    await _handleDirectChatIntent(intent);
  }finally{
    sb.disabled=false;
    inp.focus();
  }
}

//  CADENA MULTI-AGENTE

const DELEGATE_CHAIN={
  ceo:['pm','devbe','qa'],
  pm:['devfe','ux','data'],
  devbe:['devops','qa','devfe'],
  devfe:['ux','qa','pm'],
  qa:['devbe','devops','pm'],
  devops:['devbe','qa','data'],
  ux:['pm','devfe','data'],
  data:['pm','ceo','devbe']
};

function _detectDelegationNeed(text,agentKey){
  const t=String(text||'').toLowerCase();
  const targets=[];
  const add=k=>{if(k!==agentKey&&!targets.includes(k))targets.push(k);};

  if(/\b(ui|ux|interfaz|pantalla|diseno|figma|flujo|experiencia)\b/.test(t)){add('ux');add('devfe');}
  if(/\b(frontend|react|html|css|componente|responsive)\b/.test(t))add('devfe');
  if(/\b(backend|api|arquitectura|db|sql|auth|servidor)\b/.test(t))add('devbe');
  if(/\b(qa|bug|test|testing|staging|regresion|validacion)\b/.test(t))add('qa');
  if(/\b(devops|deploy|infra|docker|k8s|logs|pipeline|scan|ip)\b/.test(t))add('devops');
  if(/\b(data|metricas|dashboard|reporte|csv|json|analitica)\b/.test(t))add('data');
  if(/\b(producto|roadmap|scope|backlog|prioridad|prioridades|seguimiento)\b/.test(t))add('pm');

  const mode=_classifyChatComplexity(text);
  if(mode==='complex'&&targets.length===0){
    (DELEGATE_CHAIN[agentKey]||[]).slice(0,2).forEach(add);
  }

  return targets.slice(0,3);
}

function _buildPlannerPrompt(agentKey,userMsg){
  const mode=_classifyChatComplexity(userMsg);
  if(mode!=='complex')return null;

  return [
    {role:'system',content:mkSys(agentKey)},
    {role:'system',content:'Actua como planner tecnico de esta app. Antes de responder al usuario, analiza la peticion y devuelve un microplan de 3 pasos maximo. Formato exacto: OBJETIVO:, PIEZAS REALES:, PLAN:. En PIEZAS REALES debes nombrar funciones, bloques o modulos reales de esta app. Prohibido responder con ideas abstractas como "implementar un sistema" si no dices que pieza tocar.'},
    {role:'user',content:userMsg}
  ];
}

async function _runPlanner(agentKey,userMsg){
  const mode=_classifyChatComplexity(userMsg);
  if(mode!=='complex'||!GKEY)return '';

  const res=await groq(_buildPlannerPrompt(agentKey,userMsg),()=>{},120);
  return res?res.trim():'';
}

const WAR_ROOM_CENTER = { x: 0, z: 2 }; // Centro de la oficina

function sendToWarRoom(agentKey, index) {
  const ag = AG[agentKey];
  if (!ag) return;
  
  ag.isCollaborating = true;
  // Calculamos una posición en círculo alrededor del centro para que no choquen
  const angle = (index / 5) * Math.PI * 2; 
  const targetX = WAR_ROOM_CENTER.x + Math.cos(angle) * 2.5;
  const targetZ = WAR_ROOM_CENTER.z + Math.sin(angle) * 2.5;
  
  ag.moveTo(targetX, targetZ);
  ag.say("Yendo a la War Room...");
}

function returnToDesk(agentKey) {
  const ag = AG[agentKey];
  if (!ag || !ag.isCollaborating) return;
  
  ag.isCollaborating = false;
  ag.moveTo(ag.homePos.x, ag.homePos.z);
  setTimeout(() => ag.say("De vuelta al puesto"), 1500);
}

function updateCollaboration(dt) {
  Object.keys(AG).forEach(k => {
    const ag = AG[k];
    if (ag.isCollaborating) {
      // Hacemos que el grupo del agente rote suavemente hacia el centro (0, 2)
      const dx = 0 - ag.group.position.x;
      const dz = 2 - ag.group.position.z;
      const targetRot = Math.atan2(dx, dz);
      ag.group.rotation.y += (targetRot - ag.group.rotation.y) * 0.05;
    }
  });
}

async function runAgentChain(startKey,userMsg){
  if(!GKEY||!userMsg){
    showToast('Escribe un mensaje primero','#cc3344');
    return '';
  }

  const delegates=_detectDelegationNeed(userMsg,startKey);
  if(!delegates.length)return '';

  const chain = [startKey, ...delegates];
  chain.forEach((k, i) => {
    setTimeout(() => sendToWarRoom(k, i), i * 300);
  });

  const msgs=document.getElementById('cmsgs');
  const owner=ACFG[startKey];
  const ownerShort=owner.name.split(' ')[0];
  let context=userMsg;
  const combined=[];

  showToast(`${ownerShort} delega en ${delegates.map(k=>ACFG[k].name.split(' ')[0]).join(', ')}`,owner.col,startKey);
  try{
    logEvent('chat','Delegacion activada',`${ownerShort} delega en ${delegates.map(k=>ACFG[k].name.split(' ')[0]).join(', ')}`,owner.col,startKey);
  }catch(e){}

  for(let i=0;i<delegates.length;i++){
    const k=delegates[i];
    const cfg=ACFG[k];
    const ag=AG[k];
    if(!ag)continue;

    ag.setState('thinking');
    showDelegationArrow(i===0?startKey:delegates[i-1],k);

    const w=document.createElement('div');
    w.className='cmsg';

    const wd=document.createElement('div');
    wd.className='cwho';
    const dot=document.createElement('span');
    dot.style.background=cfg.col;
    wd.appendChild(dot);
    wd.appendChild(document.createTextNode(`${ownerShort} -> ${cfg.name.split(' ')[0]}`));
    wd.style.color=cfg.col;

    const bd=document.createElement('div');
    bd.className='cbody';
    renderRichText(bd,'',{allowEmphasis:false,cursor:true});

    w.appendChild(wd);
    w.appendChild(bd);
    msgs.appendChild(w);
    msgs.scrollTop=msgs.scrollHeight;

    const prompt=i===0
      ? `${ownerShort} te delega esta consulta del creador: "${userMsg}". Responde desde tu rol en maximo 3 frases.`
      : `${ownerShort} sigue coordinando esta consulta. Toma en cuenta este aporte previo: "${context}". Aporta algo nuevo desde tu rol en maximo 3 frases.`;

    const payload=[
      {role:'system',content:mkSys(k)},
      {role:'system',content:'No repitas el problem completo. Aporta analisis util, riesgo si aplica y un siguiente paso breve.'},
      {role:'user',content:prompt}
    ];

    const res=await groq(
      payload,
      (tok,full)=>{
        renderRichText(bd,full,{allowEmphasis:false,cursor:true});
        msgs.scrollTop=msgs.scrollHeight;
        ag.speech=full.slice(-18);
        ag.sa=.85;
      },
      130
    );

    const final=res||'Sin respuesta disponible en este momento.';
    renderRichText(bd,final,{allowEmphasis:false});
    combined.push(`- ${cfg.name.split(' ')[0]}: ${final}`);
    context=final;
    ag.setState('idle');
    await sleep(260);
  }

  setTimeout(() => {
    chain.forEach(k => returnToDesk(k));
    showToast("🤝 Colaboración finalizada", "var(--acc)");
  }, 2000);

  return combined.length?`Aportes del equipo:\n${combined.join('\n')}`:'';
}


//  INTERRUPCIONES ESPONTÁNEAS 
window._interruptCooldown=0;
async function maybeInterrupt(agentKey,userMsg,agentReply){
  if(!GKEY||_interruptCooldown>0||Math.random()>.28)return;
  const others=Object.keys(ACFG).filter(k=>k!==agentKey&&AG[k]?.state==='idle');
  if(!others.length)return;
  const intruder=others[Math.floor(Math.random()*others.length)];
  if(getRelTone(intruder,agentKey)<.55&&Math.random()>.35)return;
  _interruptCooldown=4;
  await sleep(1400+Math.random()*1200);
  const cfg=ACFG[intruder],ag=AG[intruder];
  ag.setState('thinking');
  showToast(`💬 ${cfg.name.split(' ')[0]} interrumpe...`,cfg.col);
  const msgs=document.getElementById('cmsgs');
  const w=document.createElement('div');w.className='cmsg';
  const wd=document.createElement('div');wd.className='cwho';
  const dot=document.createElement('span');dot.style.background=cfg.col;wd.appendChild(dot);
  wd.appendChild(document.createTextNode(cfg.name.split(' ')[0]+' 💬'));wd.style.color=cfg.col;
  const bd=document.createElement('div');bd.className='cbody';renderRichText(bd,'',{allowEmphasis:false,cursor:true});
  w.appendChild(wd);w.appendChild(bd);msgs.appendChild(w);msgs.scrollTop=msgs.scrollHeight;
  const res=await groq([
    {role:'system',content:mkSys(intruder)},
    {role:'user',content:`${ACFG[agentKey].name.split(' ')[0]} dijo: "${agentReply.slice(0,60)}". Interrumpe brevemente con algo relevante. Max 12 palabras.`}
  ],(tok,full)=>{renderRichText(bd,full,{allowEmphasis:false,cursor:true});ag.speech=full.slice(-18);ag.sa=.8;msgs.scrollTop=msgs.scrollHeight;},35);
  if(res){renderRichText(bd,res,{allowEmphasis:false});ag.setState('idle');}
}

/*  #27 EXPORTAR CHAT  */
function exportChatMD(){
  const k=chatAgent==='all'?'ceo':chatAgent;
  const cfg=ACFG[k];
  const lines=[`# Chat · ${cfg.name} · Dev Teams`,`**Rol:** ${cfg.role}`,`**Fecha:** ${new Date().toLocaleString('es-CO')}`,`**Modelo:** ${GMOD}`,`---`,``];
  chatH[k].forEach(m=>{
    if(m.role==='system')return;
    const who=m.role==='user'?'**Tu**':`**${cfg.name}**`;
    lines.push(`${who}: ${m.content}`,``);
  });
  _downloadFile(`chat_${k}_${Date.now()}.md`,lines.join('\n'),'text/markdown');
  showToast('Chat exportado como MD ✓','#0fa855');
}
function exportChatTXT(){
  const k=chatAgent==='all'?'ceo':chatAgent;
  const cfg=ACFG[k];
  const lines=[`Chat · ${cfg.name} · Dev Teams`,`Rol: ${cfg.role}`,`Fecha: ${new Date().toLocaleString('es-CO')}`,`Modelo: ${GMOD}`,`${''.repeat(40)}`,``];
  chatH[k].forEach(m=>{
    if(m.role==='system')return;
    const who=m.role==='user'?'Tu':cfg.name;
    lines.push(`[${who}]`,m.content,``);
  });
  _downloadFile(`chat_${k}_${Date.now()}.txt`,lines.join('\n'),'text/plain');
  showToast('Chat exportado como TXT ✓','#0fa855');
}
function _downloadFile(name,content,mime){
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type:mime}));a.download=name;a.click();URL.revokeObjectURL(a.href);
}

// Auto-update board when agents complete tasks

// Expose to window for global compatibility
window._appendClarificationTurn = _appendClarificationTurn;
window._applyResolvedIntentRouting = _applyResolvedIntentRouting;
window._broadcastRoleAngle = _broadcastRoleAngle;
window._buildBroadcastPayload = _buildBroadcastPayload;
window._buildChatPayload = _buildChatPayload;
window._buildClarificationQuestion = _buildClarificationQuestion;
window._buildPlannerPrompt = _buildPlannerPrompt;
window._chatHistoryParts = _chatHistoryParts;
window._chatMaxTokens = _chatMaxTokens;
window._chatThinkDelay = _chatThinkDelay;
window._classifyChatComplexity = _classifyChatComplexity;
window._detectDelegationNeed = _detectDelegationNeed;
window._downloadFile = _downloadFile;
window._handleBroadcastIntent = _handleBroadcastIntent;
window._handleDirectChatIntent = _handleDirectChatIntent;
window._isProjectAppPrompt = _isProjectAppPrompt;
window._isWorkspaceToolIntent = _isWorkspaceToolIntent;
window._matchGotoIntent = _matchGotoIntent;
window._needsClarification = _needsClarification;
window._officeChatSnapshot = _officeChatSnapshot;
window._pickBroadcastAgents = _pickBroadcastAgents;
window._prepareAgentForChat = _prepareAgentForChat;
window._pushSharedUnique = _pushSharedUnique;
window._recordIntentResolution = _recordIntentResolution;
window._rememberSharedProjectFile = _rememberSharedProjectFile;
window._resolveChatIntent = _resolveChatIntent;
window._responseGuide = _responseGuide;
window._routeChatAgent = _routeChatAgent;
window._runPlanner = _runPlanner;
window._scoreChatAgents = _scoreChatAgents;
window._setSharedProjectMemory = _setSharedProjectMemory;
window._sharedMemoryPromptBlock = _sharedMemoryPromptBlock;
window._shouldIsolateChatTurn = _shouldIsolateChatTurn;
window._updateSharedProjectFromChat = _updateSharedProjectFromChat;
window._updateSharedProjectFromTask = _updateSharedProjectFromTask;
window.actBlock = actBlock;
window.addFlowTokens = addFlowTokens;
window.addFlowTool = addFlowTool;
window.addGreeting = addGreeting;
window.appendMsg = appendMsg;
window.compressMemory = compressMemory;
window.exportChatMD = exportChatMD;
window.exportChatTXT = exportChatTXT;
window.filterChatSearch = filterChatSearch;
window.getSharedContext = getSharedContext;
window.groq = groq;
window.loadSharedMemory = loadSharedMemory;
window.maybeInterrupt = maybeInterrupt;
window.mkBlock = mkBlock;
window.nextStep = nextStep;
window.qaInterrupt = qaInterrupt;
window.renderStages = renderStages;
window.returnToDesk = returnToDesk;
window.runAgentChain = runAgentChain;
window.runAnim = runAnim;
window.runMeeting = runMeeting;
window.saveSharedMemory = saveSharedMemory;
window.saveSharedProjectMemory = saveSharedProjectMemory;
window.scrollTo = scrollTo;
window.selAgent = selAgent;
window.sendChat = sendChat;
window.sendToWarRoom = sendToWarRoom;
window.setChatAgent = setChatAgent;
window.setMood = setMood;
window.setSt = setSt;
window.showFlowMetrics = showFlowMetrics;
window.startFlowMetrics = startFlowMetrics;
window.typeIt = typeIt;
window.typeItEl = typeItEl;
window.updateCollaboration = updateCollaboration;
window.updateMoods = updateMoods;
window.updateSharedDecision = updateSharedDecision;
window.API_PROVIDER = API_PROVIDER;
window.API_PROVIDERS = API_PROVIDERS;
window.COST_PER_1K = COST_PER_1K;
window.DEAD = DEAD;
window.DELEGATE_CHAIN = DELEGATE_CHAIN;
window.GKEY = GKEY;
window.GMOD = GMOD;
window.GREETS = GREETS;
window.MEM_THRESHOLD = MEM_THRESHOLD;
window.MODEL_STORAGE_KEYS = MODEL_STORAGE_KEYS;
window.MOOD_COLS = MOOD_COLS;
window.PROVIDER_KEY_NAMES = PROVIDER_KEY_NAMES;
window.SCN = SCN;
window.SHARED_MEMORY = SHARED_MEMORY;
window.WAR_ROOM_CENTER = WAR_ROOM_CENTER;
window.ZCAMS = ZCAMS;
window._bootTime = _bootTime;
window._currentGroqController = _currentGroqController;
window._defaultSharedProjectMemory = _defaultSharedProjectMemory;
window._flowMetrics = _flowMetrics;
window._interruptCooldown = _interruptCooldown;
window._interruptedAg = _interruptedAg;
window._lastIntentResolution = _lastIntentResolution;
window._meetCurrentLog = _meetCurrentLog;
window._meetingActive = _meetingActive;
window._moods = _moods;
window._sessionProviderKeys = _sessionProviderKeys;
window._sharedProjectMemory = _sharedProjectMemory;
window._workspaceDirHandle = _workspaceDirHandle;
window._workspaceIndex = _workspaceIndex;
window._workspaceIndexedAt = _workspaceIndexedAt;
window._workspaceLastFilePath = _workspaceLastFilePath;
window._workspaceLastSearch = _workspaceLastSearch;
window._workspaceOfficeReady = _workspaceOfficeReady;
window._workspacePdfReady = _workspacePdfReady;
window._workspacePickerItems = _workspacePickerItems;
window._workspacePickerMode = _workspacePickerMode;
window._workspaceViewerState = _workspaceViewerState;
window.activeAg = activeAg;
window.chatAgent = chatAgent;
window.chatH = chatH;
window.meetSpeaker = meetSpeaker;
window.profileKey = profileKey;
window.sleep = sleep;
