//  REUNIÓN 1:1 
async function runMeeting1on1(k1,k2){
  if(!GKEY){showToast('Necesitas API key Groq','#cc3344');return;}
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
    w.innerHTML=`<div style="padding:8px 12px;font-family:var(--mono);font-size:9px;color:var(--t2);border-bottom:1px solid var(--b1);margin-bottom:6px;font-weight:700">1:1 - ${cfg1.name.split(' ')[0]} / ${cfg2.name.split(' ')[0]} · bloqueado hasta finalizar</div>`;
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
      entry.innerHTML=`<span style="font-family:var(--mono);font-size:8px;font-weight:700;color:${cfg.col};min-width:48px">${cfg.name.split(' ')[0]}</span><span style="font-family:var(--mono);font-size:9px;color:var(--t1);flex:1"><span class="tcur"></span></span>`;
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
    <div style="font-family:var(--mono);font-size:11px;font-weight:800;color:var(--t1)">Reunion 1:1 - Elige 2 agentes</div>
    <div id="picker1on1" style="display:grid;grid-template-columns:1fr 1fr;gap:4px"></div>
    <div style="display:flex;gap:8px">
      <button id="start1on1" onclick="if(window._sel1on1?.length===2){document.getElementById('1on1Ov').remove();runMeeting1on1(window._sel1on1[0],window._sel1on1[1]);}" style="font-family:var(--mono);font-size:10px;font-weight:700;padding:8px 16px;background:var(--acc);color:#000;border:none;cursor:pointer;opacity:.4">Iniciar</button>
      <button onclick="document.getElementById('1on1Ov').remove()" style="font-family:var(--mono);font-size:10px;padding:8px 16px;background:var(--bg3);border:1px solid var(--b2);color:var(--t2);cursor:pointer">Cancelar</button>
    </div>
  </div>`;
  ov.onclick=()=>ov.remove();document.body.appendChild(ov);
  window._sel1on1=[];
  const picker=document.getElementById('picker1on1');
  Object.entries(ACFG).forEach(([k,cfg])=>{
    const btn=document.createElement('button');
    btn.style.cssText=`display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--bg3);border:1px solid var(--b1);color:var(--t2);font-family:var(--mono);font-size:9px;cursor:pointer;transition:all .12s`;
    btn.innerHTML=`<span style="width:18px;height:18px;background:${cfg.col}22;color:${cfg.col};display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:800">${cfg.name.split(' ').map(n=>n[0]).join('')}</span>${cfg.name.split(' ')[0]}`;
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
      <div style="font-family:var(--mono);font-size:10px;font-weight:800;color:${cfg.col}">💻 ${cfg.name} · ${cfg.role}</div>
      <button onclick="document.getElementById('monitorAgOv').remove()" style="background:none;border:none;color:var(--t3);font-size:16px;cursor:pointer">X</button>
    </div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.9;color:#0fa855;white-space:pre">${screenContents[agKey]||'Sin datos'}</div>
    <div style="margin-top:10px;display:flex;gap:6px">
      <button onclick="setChatAgent('${agKey}');switchPanel('consola');document.getElementById('monitorAgOv').remove()" style="font-family:var(--mono);font-size:9px;padding:6px 12px;background:${cfg.col}22;border:1px solid ${cfg.col};color:${cfg.col};cursor:pointer">💬 Chat con ${cfg.name.split(' ')[0]}</button>
      <button onclick="selAgent('${agKey}');switchPanel('flujo');document.getElementById('monitorAgOv').remove()" style="font-family:var(--mono);font-size:9px;padding:6px 12px;background:var(--bg3);border:1px solid var(--b2);color:var(--t2);cursor:pointer">⚡ Ver Flujo</button>
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
  const centerFlash=pL(0x0fa855,3,12,cx,2.5,cz);
  setTimeout(()=>scene.remove(centerFlash),400);
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
  const sl=new THREE.PointLight(0xd45000,0.4,5);
  sl.position.set(0,2.5,0);g.add(sl);

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

// #3 Rack status modal
const rm=document.createElement('div');rm.id='rackModal';
rm.style.cssText='display:none;position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.85);align-items:center;justify-content:center';
rm.innerHTML=`<div style="background:var(--bg2);border:1px solid #4caf5044;border-left:3px solid #4caf50;padding:20px;width:380px;display:flex;flex-direction:column;gap:8px" onclick="event.stopPropagation()">
  <div style="font-family:var(--mono);font-size:11px;font-weight:800;color:#4caf50;letter-spacing:.1em">⚙ SERVER RACK · Dev Teams</div>
  <div id="rackStats" style="display:flex;flex-direction:column;gap:4px"></div>
  <button onclick="document.getElementById('rackModal').style.display='none'" style="font-family:var(--mono);font-size:9px;padding:5px 12px;background:var(--bg3);border:1px solid var(--b2);color:var(--t2);cursor:pointer;align-self:flex-end;margin-top:4px">Cerrar</button>
</div>`;
rm.onclick=()=>rm.style.display='none';
document.body.appendChild(rm);


// #1 Pizarron interactivo
document.getElementById('boardModal')?.remove();
const bm=document.createElement('div');
bm.id='boardModal';
bm.style.cssText='display:none;position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.88);align-items:center;justify-content:center';
bm.innerHTML=`<div style="background:var(--bg2);border:1px solid var(--b2);padding:20px;width:580px;max-height:88vh;overflow-y:auto;display:flex;flex-direction:column;gap:10px" onclick="event.stopPropagation()">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div style="font-family:var(--mono);font-size:11px;font-weight:800;color:var(--t1);letter-spacing:.1em">📋 WHITEBOARD · Dev Teams</div>
    <div style="display:flex;gap:4px">
      <button onclick="addSticky('yellow')" style="font-family:var(--mono);font-size:8px;padding:3px 8px;background:#c8a04022;border:1px solid #c8a040;color:#c8a040;cursor:pointer">+ Nota</button>
      <button onclick="addSticky('green')" style="font-family:var(--mono);font-size:8px;padding:3px 8px;background:#0fa85522;border:1px solid #0fa855;color:#0fa855;cursor:pointer">+ Task</button>
      <button onclick="addSticky('red')" style="font-family:var(--mono);font-size:8px;padding:3px 8px;background:#cc334422;border:1px solid #cc3344;color:#cc3344;cursor:pointer">+ Bug</button>
      <button onclick="addSticky('blue')" style="font-family:var(--mono);font-size:8px;padding:3px 8px;background:#3a8ccc22;border:1px solid #3a8ccc;color:#3a8ccc;cursor:pointer">+ Idea</button>
      <button onclick="document.getElementById('boardModal').style.display='none'" style="background:none;border:none;color:var(--t3);font-size:16px;cursor:pointer">X</button>
    </div>
  </div>
  <div style="font-family:var(--mono);font-size:8px;color:var(--t3)">Haz clic en una nota para editarla · arrastra para mover</div>
  <div id="stickyBoard" style="position:relative;background:var(--bg3);border:1px solid var(--b1);min-height:340px;overflow:hidden"></div>
  <div style="display:flex;gap:6px;align-items:center;border-top:1px solid var(--b1);padding-top:8px">
    <textarea id="boardText" style="font-family:var(--mono);font-size:9px;background:var(--bg);border:1px solid var(--b2);color:var(--t1);padding:8px;height:60px;flex:1;outline:none;resize:none" placeholder="Notas rapidas del equipo..."></textarea>
    <button onclick="saveBoard()" style="font-family:var(--mono);font-size:9px;font-weight:700;padding:8px 14px;background:var(--acc);color:#000;border:none;cursor:pointer">Guardar</button>
  </div>
</div>`;
bm.onclick=()=>bm.style.display='none';
document.body.appendChild(bm);
try{document.getElementById('boardText').value=localStorage.getItem('boardNotes')||'';}catch(e){}

//  STICKY NOTES 
let _stickies=[];
try{_stickies=JSON.parse(localStorage.getItem('stickies')||'[]');}catch(e){}
const _stickyColors={
  yellow:{bg:'#2a2000',border:'#c8a040',text:'#f0d060'},
  green:{bg:'#001a08',border:'#0fa855',text:'#0fa855'},
  red:{bg:'#1a0008',border:'#cc3344',text:'#ff6677'},
  blue:{bg:'#001020',border:'#3a8ccc',text:'#6ab4ff'}
};

let _stickyCleanup=[];
function clearStickyListeners(){
  _stickyCleanup.forEach(fn=>fn());
  _stickyCleanup=[];
}
function renderStickies(){
  const board=document.getElementById('stickyBoard');
  if(!board)return;

  clearStickyListeners();
  board.innerHTML='';

  _stickies.forEach((s,i)=>{
    const c=_stickyColors[s.col]||_stickyColors.yellow;

    const el=document.createElement('div');
    el.style.cssText=`position:absolute;left:${s.x}px;top:${s.y}px;width:130px;min-height:80px;background:${c.bg};border:1px solid ${c.border};padding:7px;cursor:move;user-select:none;z-index:${i+1}`;

    const head=document.createElement('div');
    head.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:4px';

    const tag=document.createElement('div');
    tag.style.cssText=`font-family:var(--mono);font-size:7px;color:${c.border};font-weight:700;text-transform:uppercase`;
    tag.textContent=s.col;

    const del=document.createElement('button');
    del.type='button';
    del.textContent='×';
    del.style.cssText=`background:none;border:none;color:${c.border};font-size:11px;cursor:pointer;padding:0;line-height:1`;
    del.onclick=()=>{
      _stickies.splice(i,1);
      saveStickies();
      renderStickies();
    };

    head.appendChild(tag);
    head.appendChild(del);

    const body=document.createElement('div');
    body.contentEditable='true';
    body.style.cssText=`font-family:var(--mono);font-size:9px;color:${c.text};outline:none;min-height:48px;word-break:break-word`;
    body.textContent=s.text||'';
    body.onblur=()=>{
      _stickies[i].text=body.textContent||'';
      saveStickies();
    };

    const foot=document.createElement('div');
    foot.style.cssText=`font-family:var(--mono);font-size:7px;color:${c.border}44;margin-top:4px`;
    foot.textContent=s.author||'anon';

    el.appendChild(head);
    el.appendChild(body);
    el.appendChild(foot);

    let dx=0,dy=0,dragging=false;

    el.addEventListener('mousedown',ev=>{
      if(ev.target===del||ev.target===body)return;
      dragging=true;
      dx=ev.clientX-s.x;
      dy=ev.clientY-s.y;
      ev.preventDefault();
    });

    const onMove=ev=>{
      if(!dragging)return;
      s.x=Math.max(0,Math.min(ev.clientX-dx,board.clientWidth-135));
      s.y=Math.max(0,Math.min(ev.clientY-dy,board.clientHeight-90));
      el.style.left=s.x+'px';
      el.style.top=s.y+'px';
    };

    const onUp=()=>{
      if(!dragging)return;
      dragging=false;
      saveStickies();
    };

    window.addEventListener('mousemove',onMove);
    window.addEventListener('mouseup',onUp);
    _stickyCleanup.push(()=>window.removeEventListener('mousemove',onMove));
    _stickyCleanup.push(()=>window.removeEventListener('mouseup',onUp));

    board.appendChild(el);
  });
}

function addSticky(col){
  const agent=Object.keys(ACFG)[Math.floor(Math.random()*8)];
  _stickies.push({col,text:'',x:20+Math.random()*300,y:20+Math.random()*200,author:ACFG[agent].name.split(' ')[0]});
  saveStickies();renderStickies();
}
function saveStickies(){localStorage.setItem('stickies',JSON.stringify(_stickies));}

function openTableMenu(){
  const existing=document.getElementById('tableMenuOv');if(existing)existing.remove();
  const ov=document.createElement('div');ov.id='tableMenuOv';
  ov.style.cssText='position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center';
  ov.innerHTML=`<div style="background:var(--bg2);border:1px solid #0fa85544;border-left:4px solid #0fa855;padding:22px;width:480px;display:flex;flex-direction:column;gap:10px" onclick="event.stopPropagation()">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="font-family:var(--mono);font-size:11px;font-weight:800;color:var(--t1)">🪑 SALA DE REUNIONES</div>
      <button onclick="document.getElementById('tableMenuOv').remove()" style="background:none;border:none;color:var(--t3);font-size:16px;cursor:pointer">X</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
      <button onclick="document.getElementById('tableMenuOv').remove();runMeeting()" style="font-family:var(--mono);font-size:10px;font-weight:700;padding:12px;background:rgba(15,168,85,.1);border:1px solid var(--acc);color:var(--acc);cursor:pointer">⇄ Iniciar Reunion<br><span style="font-size:8px;color:var(--t3);font-weight:400">Todo el equipo</span></button>
      <button onclick="showAgendaEditor()" style="font-family:var(--mono);font-size:10px;font-weight:700;padding:12px;background:rgba(58,140,204,.1);border:1px solid #3a8ccc;color:#3a8ccc;cursor:pointer">📅 Agenda del dia<br><span style="font-size:8px;color:var(--t3);font-weight:400">Editar items</span></button>
    </div>
    <div style="font-family:var(--mono);font-size:9px;color:var(--t2);letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid var(--b1);padding-bottom:4px">Agenda actual</div>
    <div id="agendaList" style="display:flex;flex-direction:column;gap:3px;max-height:200px;overflow-y:auto"></div>
    <div style="display:flex;gap:6px">
      <input id="agendaInp" style="flex:1;font-family:var(--mono);font-size:9px;background:var(--bg3);border:1px solid var(--b2);color:var(--t1);padding:6px 8px;outline:none" placeholder="Añadir item a la agenda...">
      <button onclick="addAgendaItem()" style="font-family:var(--mono);font-size:9px;font-weight:700;padding:6px 12px;background:var(--acc);color:#000;border:none;cursor:pointer">+</button>
    </div>
  </div>`;
  ov.onclick=()=>ov.remove();document.body.appendChild(ov);
  renderAgenda();
}
function renderAgenda(){
  const el=document.getElementById('agendaList');if(!el)return;
  if(!_agenda.length){el.innerHTML='<div style="font-family:var(--mono);font-size:9px;color:var(--t3);padding:6px">Sin items. Añade uno abajo.</div>';return;}
  el.innerHTML=_agenda.map((item,i)=>`
    <div style="display:flex;align-items:center;gap:6px;padding:5px 8px;background:${item.done?'var(--bg)':'var(--bg3)'};border:1px solid var(--b1);border-left:3px solid ${item.done?'var(--t3)':'var(--acc)'}">
      <input type="checkbox" ${item.done?'checked':''} onchange="_agenda[${i}].done=this.checked;localStorage.setItem('agenda',JSON.stringify(_agenda));renderAgenda()" style="cursor:pointer">
      <span style="font-family:var(--mono);font-size:9px;color:${item.done?'var(--t3)':'var(--t1)'};flex:1;text-decoration:${item.done?'line-through':'none'}">${item.text}</span>
      <span style="font-family:var(--mono);font-size:7px;color:var(--t3)">${item.time||''}</span>
      <button onclick="_agenda.splice(${i},1);localStorage.setItem('agenda',JSON.stringify(_agenda));renderAgenda()" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:11px">X</button>
    </div>`).join('');
}
function addAgendaItem(){
  const inp=document.getElementById('agendaInp');if(!inp||!inp.value.trim())return;
  const now=new Date();
  _agenda.push({text:inp.value.trim(),done:false,time:now.getHours()+':'+String(now.getMinutes()).padStart(2,'0')});
  inp.value='';localStorage.setItem('agenda',JSON.stringify(_agenda));renderAgenda();
}
//  CALENDARIO SPRINT 
function openSprintCalendar(){
  const existing=document.getElementById('calOv');if(existing)existing.remove();
  const now=new Date();
  const sprintStart=new Date(now.getFullYear(),now.getMonth(),1);
  const sprintEnd=new Date(now.getFullYear(),now.getMonth()+1,0);
  const days=sprintEnd.getDate();
  const events={
    3:'Deploy v12',5:'Sprint planning',8:'Code review',
    10:'Metrics review',14:'Mid-sprint check',18:'Bug bash',
    22:'📋 Sprint review',24:'🎯 Retrospectiva',28:'🚀 Deploy v13'
  };
  const ov=document.createElement('div');ov.id='calOv';
  ov.style.cssText='position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center';
  const monthName=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][now.getMonth()];
  let calHTML=`<div style="background:var(--bg2);border:1px solid var(--b2);padding:20px;width:480px;display:flex;flex-direction:column;gap:10px" onclick="event.stopPropagation()">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="font-family:var(--mono);font-size:11px;font-weight:800;color:var(--t1)">📅 SPRINT · ${monthName} ${now.getFullYear()}</div>
      <button onclick="document.getElementById('calOv').remove()" style="background:none;border:none;color:var(--t3);font-size:16px;cursor:pointer">X</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">
      ${['L','M','X','J','V','S','D'].map(d=>`<div style="font-family:var(--mono);font-size:8px;color:var(--t3);text-align:center;padding:4px">${d}</div>`).join('')}`;
  // Offset primer dia
  const firstDay=(sprintStart.getDay()+6)%7;
  for(let i=0;i<firstDay;i++)calHTML+=`<div></div>`;
  for(let d=1;d<=days;d++){
    const isToday=d===now.getDate();
    const hasEvent=events[d];
    const isWeekend=((d+firstDay-1)%7>=5);
    calHTML+=`<div style="font-family:var(--mono);font-size:8px;text-align:center;padding:4px 2px;background:${isToday?'var(--acc)':hasEvent?'rgba(58,140,204,.15)':'var(--bg3)'};border:1px solid ${isToday?'var(--acc)':hasEvent?'#3a8ccc44':'var(--b1)'};color:${isToday?'#000':isWeekend?'var(--t3)':'var(--t1)'};cursor:${hasEvent?'pointer':'default'};position:relative" ${hasEvent?`title="${hasEvent}" onclick="showToast('${hasEvent}','#3a8ccc')"`:''}>
      ${d}${hasEvent?`<div style="width:4px;height:4px;background:#3a8ccc;border-radius:50%;margin:1px auto 0"></div>`:''}
    </div>`;
  }
  calHTML+=`</div>
    <div style="font-family:var(--mono);font-size:8px;color:var(--t3);border-top:1px solid var(--b1);padding-top:6px">Proximos eventos:</div>
    <div style="display:flex;flex-direction:column;gap:3px;max-height:100px;overflow-y:auto">
      ${Object.entries(events).filter(([d])=>parseInt(d)>=now.getDate()).slice(0,4).map(([d,e])=>`
      <div style="display:flex;gap:8px;align-items:center;padding:4px 8px;background:var(--bg3);border:1px solid var(--b1)">
        <span style="font-family:var(--mono);font-size:9px;color:#3a8ccc;min-width:20px">${d}</span>
        <span style="font-family:var(--mono);font-size:9px;color:var(--t1)">${e}</span>
      </div>`).join('')}
    </div>
  </div>`;
  ov.innerHTML=calHTML;ov.onclick=()=>ov.remove();document.body.appendChild(ov);
  showToast('📅 Sprint calendar','#3a8ccc');
}

try{document.getElementById('boardText').value=localStorage.getItem('boardNotes')||'';}catch(e){}

/*  MINIMAP  */
function drawMMStatic(){
  const c=document.getElementById('mmStatic'),ctx=c.getContext('2d');const W=156,H=130;
  const tx=x=>((x+27)/56)*W,tz=z=>((z+20)/38)*H;
  ctx.fillStyle='#060606';ctx.fillRect(0,0,W,H);
  [[-22,-12,12,14,'rgba(200,160,64,.12)'],[-9,-12,12,14,'rgba(58,140,204,.1)'],[0,-12,12,14,'rgba(144,96,204,.1)'],[11,-12,12,14,'rgba(217,112,32,.1)'],[21,-12,10,14,'rgba(76,175,80,.1)'],[-14,-1,12,10,'rgba(91,155,213,.08)'],[-3,-1,12,10,'rgba(233,30,140,.08)'],[9,-1,12,10,'rgba(0,188,212,.08)'],[0,5,20,12,'rgba(15,168,85,.06)']].forEach(([cx,cz,w,h,col])=>{ctx.fillStyle=col;ctx.fillRect(tx(cx-w/2),tz(cz-h/2),(w/56)*W,(h/38)*H);});
  ctx.fillStyle='rgba(255,255,255,.04)';OBS.forEach(o=>{if(o.hw<2.5&&o.hd<2.5)ctx.fillRect(tx(o.cx-o.hw),tz(o.cz-o.hd),(o.hw*2/56)*W,(o.hd*2/38)*H);});
  [['CEO',-22,-5,'#c8a040'],['BE',-9,-5,'#3a8ccc'],['FE',0,-5,'#9060cc'],['QA',11,-5,'#d97020'],['OPS',21,-5,'#4caf50'],['PM',-14,3,'#5b9bd5'],['UX',-3,3,'#e91e8c'],['DAT',9,3,'#00bcd4']].forEach(([l,x,z,c])=>{ctx.fillStyle=c+'88';ctx.font='6px monospace';ctx.textAlign='center';ctx.fillText(l,tx(x),tz(z));});
  ctx.strokeStyle='#1e1e1e';ctx.lineWidth=1;ctx.strokeRect(0,0,W,H);
}
let mmDCtx=null;
function updateMMDyn(){
  const c=document.getElementById('mmDyn');if(!mmDCtx)mmDCtx=c.getContext('2d');
  const ctx=mmDCtx,W=156,H=130;const tx=x=>((x+27)/56)*W,tz=z=>((z+20)/38)*H;
  ctx.clearRect(0,0,W,H);
  // draw FPS indicator on minimap
  if(fpsMode&&fpsAgKey){const ag=AG[fpsAgKey];if(ag){const mx=tx(ag.group.position.x),mz=tz(ag.group.position.z);ctx.strokeStyle=ACFG[fpsAgKey].col+'99';ctx.lineWidth=2;ctx.beginPath();ctx.arc(mx,mz,9,0,Math.PI*2);ctx.stroke();// draw FOV cone
    ctx.save();ctx.translate(mx,mz);ctx.rotate(-fpsYaw);ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,12,-0.5,0.5);ctx.closePath();ctx.fillStyle=ACFG[fpsAgKey].col+'22';ctx.fill();ctx.restore();}}
  Object.entries(AG).forEach(([k,ag])=>{if(ag.path&&ag.path.length>1){ctx.strokeStyle=ACFG[k].col+'44';ctx.lineWidth=1;ctx.setLineDash([2,2]);ctx.beginPath();ctx.moveTo(tx(ag.group.position.x),tz(ag.group.position.z));ag.path.slice(0,8).forEach(p=>ctx.lineTo(tx(p.x),tz(p.z)));ctx.stroke();ctx.setLineDash([]);}});
  Object.entries(AG).forEach(([k,ag])=>{if(!ag||!ag.group)return;const mx=tx(ag.group.position.x),mz=tz(ag.group.position.z),isAct=k===activeAg;if(isAct){ctx.fillStyle=ACFG[k].col+'22';ctx.beginPath();ctx.arc(mx,mz,10,0,Math.PI*2);ctx.fill();}ctx.fillStyle=ACFG[k].col;ctx.beginPath();ctx.arc(mx,mz,isAct?5:3,0,Math.PI*2);ctx.fill();if(ag.state!=='idle'&&ag.state!=='walking'){ctx.strokeStyle=ACFG[k].col;ctx.globalAlpha=.5;ctx.lineWidth=1;ctx.beginPath();ctx.arc(mx,mz,7,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}});
}

/*  OVERLAYS  */
function updateOverlays(){
  const wrap=document.getElementById('canvasWrap'),{W,H}=getViewportSize();
  const focusKeys=new Set([activeAg,meetSpeaker,followAg,profileKey,fpsAgKey].filter(Boolean));

  Object.entries(AG).forEach(([k,ag],idx)=>{
    if(fpsMode&&ag.key===fpsAgKey){
      ag.bubbleEl.style.display='none';
      ag.labelEl.style.display='none';
      return;
    }

    if(ag.sa>0.04){
      const wp=new THREE.Vector3(ag.group.position.x,ag.group.position.y+6.2,ag.group.position.z);
      wp.project(camera);
      ag.bubbleEl.style.cssText=`display:block;left:${((wp.x*.5+.5)*W).toFixed(0)}px;top:${((-.5*wp.y+.5)*H).toFixed(0)}px;opacity:${Math.min(1,ag.sa).toFixed(2)};border-color:${ACFG[ag.key].col}55;`;
      ag.bubbleEl.textContent=ag.speech;
    }else ag.bubbleEl.style.display='none';

    const lp=new THREE.Vector3(ag.group.position.x,ag.group.position.y+4.2,ag.group.position.z);
    lp.project(camera);

    if(lp.z<1){
      const isFocus=focusKeys.has(k);
      const isBusy=ag.sa>0.04||ag.state==='thinking'||ag.state==='reading'||ag.state==='working';
      const isRelevant=isFocus||k===activeAg||isBusy;
      const isDim=focusKeys.size>0&&!isFocus&&isBusy;
      if(!isRelevant){
        ag.labelEl.style.display='none';
        ag.labelEl.classList.remove('is-focus','is-dim');
        return;
      }
      const lift=isFocus?6:0;
      const stagger=(idx%2)*4;

      ag.labelEl.style.display='flex';
      ag.labelEl.style.left=((lp.x*.5+.5)*W)+'px';
      ag.labelEl.style.top=((-.5*lp.y+.5)*H - lift - stagger)+'px';
      ag.labelEl.style.opacity=isDim?'.38':(isFocus?'1':'.82');
      ag.labelEl.style.transform=`translateX(-50%) translateY(-100%) scale(${isFocus?1.08:isDim?0.92:1})`;
      ag.labelEl.style.zIndex=isFocus?'14':'11';
      ag.labelEl.classList.toggle('is-focus',isFocus);
      ag.labelEl.classList.toggle('is-dim',isDim);
    }else{
      ag.labelEl.style.display='none';
      ag.labelEl.classList.remove('is-focus','is-dim');
    }
  });
}

function updNodeStatus(key,state){
  const el=document.getElementById('ns-'+key);if(!el)return;
  const isFPS=fpsMode&&key===fpsAgKey;
    const map={thinking:['thinking','think'],reading:['reading','read'],walking:['walking','walk'],idle:['idle','idle'],working:['working','work'],speaking:['speaking','speak'],fps:['fps','fps']};
  const[cls,lbl]=map[isFPS?'fps':key===meetSpeaker?'speaking':state]||['idle','idle'];
  el.className='tst '+cls;el.textContent=lbl;
}

/*  AGENT PROFILE  */
function openProfile(k,px,py){
  profileKey=k;const cfg=ACFG[k],ag=AG[k];
  if(GKEY&&chatAgent!==k)setChatAgent(k);
  document.getElementById('apAv').textContent=cfg.name.split(' ').map(n=>n[0]).join('');
  document.getElementById('apAv').style.cssText=`background:${cfg.col}22;color:${cfg.col}`;
  document.getElementById('apNm').textContent=cfg.name;document.getElementById('apRl').textContent=cfg.role;
  document.getElementById('apFl').style.background=cfg.col;document.getElementById('apFl').style.color='#000';
  const followBtn=document.getElementById('apFollow');
  if(followBtn)followBtn.textContent=followAg===k?'Dejar':'Seguir';
  updateProfileData();
  const wrap=document.getElementById('canvasWrap'),{W,H}=getViewportSize();
  let l=px+14,t=py-10;if(l+215>W)l=px-225;if(t+180>H)t=H-185;if(t<0)t=5;

// Show Yared idle button in profile
  const yaredBtn=document.getElementById('apYaredBtn');
  if(k==='devbe'){
    if(!yaredBtn){
      const btn=document.createElement('button');btn.id='apYaredBtn';btn.className='ap-act';
      btn.textContent='⚡ Stats';btn.onclick=()=>{openYaredStats();closeProfile();};
      document.querySelector('.ap-acts').appendChild(btn);
    }else yaredBtn.style.display='';
  }else if(yaredBtn)yaredBtn.style.display='none';

  const el=document.getElementById('agentProfile');el.style.left=l+'px';el.style.top=t+'px';el.classList.add('show');
  syncPanelContext();
}
function updateProfileData(){
  if(!profileKey)return;const ag=AG[profileKey],cfg=ACFG[profileKey];
  const st=document.getElementById('apSt');st.textContent=ag.state;st.style.color=cfg.col;st.style.borderColor=cfg.col+'44';
  document.getElementById('apTm').textContent=ag.stateTime<60?`${Math.floor(ag.stateTime)}s`:`${Math.floor(ag.stateTime/60)}m`;
  document.getElementById('apLast').textContent=ag.lastMsg?`"${ag.lastMsg.slice(0,36)}"` :'';
}
function closeProfile(){profileKey=null;document.getElementById('agentProfile').classList.remove('show');syncPanelContext();}
function profileFlow(){if(profileKey)selAgent(profileKey);closeProfile();}
function profileFollow(){if(!profileKey)return;followAg=profileKey;followT=6.;closeProfile();showToast('Siguiendo → '+ACFG[profileKey].name.split(' ')[0],ACFG[profileKey].col);}
function profileFPS(){if(!profileKey)return;const k=profileKey;closeProfile();enterFPS(k);}
function profileChat(){if(!profileKey)return;setChatAgent(profileKey);switchPanel('consola');closeProfile();}

function profileFollow(){
  if(!profileKey)return;
  const k=profileKey;
  const same=followAg===k;
  closeProfile();

  if(same){
    followAg=null;
    followT=0;
    showToast('Camara libre','#c8a040');
    syncPanelContext();
    return;
  }

  followAg=k;
  followT=Number.POSITIVE_INFINITY;
  camZTgt=null;
  if(chatAgent!==k)setChatAgent(k);
  if(currentPanel!=='consola')switchPanel('consola');
  const ag=AG[k];
  if(ag){
    orb.tgt.set(ag.group.position.x,ag.group.position.y+1.8,ag.group.position.z);
    orb.radius=Math.min(orb.radius,24);
    refreshCam();
  }
  showToast('Siguiendo a '+ACFG[k].name.split(' ')[0],ACFG[k].col);
  syncPanelContext();
}

function openProfile(k,px,py){
  profileKey=k;
  const cfg=ACFG[k],ag=AG[k];
  if(GKEY&&chatAgent!==k)setChatAgent(k);
  document.getElementById('apAv').textContent=cfg.name.split(' ').map(n=>n[0]).join('');
  document.getElementById('apAv').style.cssText=`background:${cfg.col}22;color:${cfg.col}`;
  document.getElementById('apNm').textContent=cfg.name;
  document.getElementById('apRl').textContent=cfg.role;
  document.getElementById('apFl').style.background=cfg.col;
  document.getElementById('apFl').style.color='#000';
  const followBtn=document.getElementById('apFollow');
  if(followBtn)followBtn.textContent=followAg===k?'Dejar':'Seguir';
  updateProfileData();

  const yaredBtn=document.getElementById('apYaredBtn');
  if(yaredBtn)yaredBtn.remove();

  const wrap=document.getElementById('canvasWrap'),{W,H}=getViewportSize();
  let l=px+14,t=py-10;
  if(l+215>W)l=px-225;
  if(t+180>H)t=H-185;
  if(t<0)t=5;

  const el=document.getElementById('agentProfile');
  el.style.left=l+'px';
  el.style.top=t+'px';
  el.classList.add('show');
  syncPanelContext();
}

let _opsCompact=localStorage.getItem('opsCompact')!=='0';
let _commandPaletteEntries=[];

function applyOpsCompact(){
  const bar=document.getElementById('opsBar');
  const btn=document.getElementById('opsCompactBtn');
  if(bar)bar.classList.toggle('compact',_opsCompact);
  if(btn)btn.textContent=_opsCompact?'Expandir':'Compacto';
}

function toggleOpsCompact(){
  _opsCompact=!_opsCompact;
  localStorage.setItem('opsCompact',_opsCompact?'1':'0');
  applyOpsCompact();
}

function _countAllChatMessages(){
  return Object.keys(ACFG).reduce((acc,k)=>acc+(chatH[k]||[]).filter(m=>m.role!=='system').length,0);
}

function _refreshMemoryBarUI(){
  const memBar=document.getElementById('memBar');
  const info=document.getElementById('memInfo');
  if(!memBar||!info)return;
  memBar.style.display=GKEY?'flex':'none';
  const total=_countAllChatMessages();
  if(chatAgent==='all'){
    info.textContent=`${total} mensajes del equipo · limpieza global`;
    return;
  }
  const own=(chatH[chatAgent]||[]).filter(m=>m.role==='user').length;
  info.textContent=`${own} mensajes de ${ACFG[chatAgent]?.name.split(' ')[0]||'agente'} · ${total} totales`;
}

function clearAllAgentMemory(){
  Object.keys(ACFG).forEach(k=>{
    chatH[k]=[];
    try{localStorage.removeItem('chat_'+k);}catch(e){}
  });
  _sharedProjectMemory=_defaultSharedProjectMemory();
  saveSharedProjectMemory();
  _lastIntentResolution=null;
  const msgs=document.getElementById('cmsgs');
  if(msgs)msgs.innerHTML='';
  if(chatAgent==='all'){
    if(msgs)msgs.innerHTML='<div style="padding:10px 12px;font-family:var(--mono);font-size:9px;color:var(--t2)">Modo broadcast: tu mensaje se envia a todo el equipo y cada agente responde desde su rol.</div>';
  }else if(msgs){
    addGreeting();
  }
  _refreshMemoryBarUI();
  updateConsoleContextHint();
  refreshOpsBar();
  renderDashboard();
  refreshSceneCinemaHud();
  visualCleanupEffect(); // <--- HOOKED UP
  showToast('Memoria del equipo limpiada','#cc3344');
}

function clearAgentMemory(k){
  if(!k||k==='all'){clearAllAgentMemory();return;}
  chatH[k]=[];
  try{localStorage.removeItem('chat_'+k);}catch(e){}
  if(chatAgent===k){
    const msgs=document.getElementById('cmsgs');
    if(msgs)msgs.innerHTML='';
    addGreeting();
  }
  _refreshMemoryBarUI();
  refreshOpsBar();
  refreshSceneCinemaHud();
  showToast('Memoria de '+ACFG[k].name.split(' ')[0]+' limpiada','#cc3344');
}

function saveChatH(k){
  try{localStorage.setItem('chat_'+k,JSON.stringify((chatH[k]||[]).slice(-60)));}catch(e){}
  _refreshMemoryBarUI();
}

function initConsole(){
  const nk=document.getElementById('noKeyMsg'),cb=document.getElementById('casBar');
  const ms=document.getElementById('cmsgs'),ip=document.querySelector('.cinp-area');
  const tw=document.getElementById('toolMiniWrap'),sw=document.getElementById('chatSearchWrap');
  const rail=document.getElementById('consoleRail');
  if(!GKEY){
    nk.style.display='block';
    if(cb)cb.style.display='none';
    if(ms)ms.style.display='none';
    if(ip)ip.style.display='none';
    if(tw)tw.style.display='none';
    if(sw)sw.style.display='none';
    if(rail)rail.style.display='none';
    return;
  }
  nk.style.display='none';
  if(rail)rail.style.display='flex';
  if(ms)ms.style.display='flex';
  if(ip)ip.style.display='flex';
  _refreshWorkspaceQuickUI();
  applyConsoleSections();
  _refreshMemoryBarUI();
  updateConsoleContextHint();
  applyOpsCompact();
  refreshSceneCinemaHud();
  if(chatAgent!=='all'&&chatH[chatAgent].length===0)addGreeting();
}

function _paletteAction(label,meta,run){
  return {id:label.toLowerCase().replace(/[^a-z0-9]+/g,'-'),label,meta,run};
}

function _buildCommandPaletteEntries(){
  return [
    _paletteAction('Abrir tarea','Asignar o reintentar trabajo',()=>openTask()),
    _paletteAction('Demo guiada','Recorrido visible de la app',()=>startDemoTour()),
    _paletteAction('Limpiar memoria del equipo','Borra historiales y memoria compartida',()=>clearAllAgentMemory()),
    _paletteAction('Workspace · Conectar carpeta','Abrir selector local',()=>workspaceQuickAction('folder')),
    _paletteAction('Workspace · Ver archivos','Lista del workspace',()=>workspaceQuickAction('files')),
    _paletteAction('Workspace · Ultimo archivo','Reabrir ultimo archivo',()=>workspaceQuickAction('last')),
    _paletteAction('Workspace · Leer archivo','Abrir picker o leer ultimo',()=>workspaceQuickAction('read')),
    _paletteAction('Workspace · Analizar archivo','Enviar archivo al agente actual',()=>workspaceQuickAction('analyze')),
    _paletteAction('Ir a Chat','Panel conversacional',()=>switchPanel('consola')),
    _paletteAction('Ir a Equipo','Arbol del equipo',()=>switchPanel('tree')),
    _paletteAction('Ir a Estado','Vista operativa',()=>switchPanel('status')),
    _paletteAction('Ir a Dashboard','Resumen ejecutivo',()=>switchPanel('dash')),
    ...Object.keys(ACFG).map(k=>_paletteAction(`Hablar con ${ACFG[k].name.split(' ')[0]}`,ACFG[k].role,()=>{setChatAgent(k);switchPanel('consola');})),
    _paletteAction('Modo Director',_directorMode?'Desactivar foco de demo':'Activar foco de demo',()=>toggleDirectorMode()),
    _paletteAction('Reunion de equipo','Iniciar conversacion grupal',()=>runMeeting())
  ];
}

function renderCommandPaletteList(items){
  const el=document.getElementById('cmdPaletteList');
  if(!el)return;
  _commandPaletteEntries=items;
  el.innerHTML=items.map((item,i)=>`
    <button class="tool-picker-item" type="button" onclick="runCommandPaletteAction('${item.id}')">
      <div class="tool-picker-path">${escapeHtml(item.label)}</div>
      <div class="tool-picker-tag">${escapeHtml(item.meta||'accion')}</div>
    </button>
  `).join('')||'<div class="tool-picker-item" style="cursor:default"><div class="tool-picker-path">Sin resultados</div><div class="tool-picker-tag">ajusta tu busqueda</div></div>';
}

function filterCommandPalette(q=''){
  const query=String(q||'').trim().toLowerCase();
  const all=_buildCommandPaletteEntries();
  const items=!query?all:all.filter(item=>`${item.label} ${item.meta||''}`.toLowerCase().includes(query));
  renderCommandPaletteList(items);
}

function runCommandPaletteAction(id){
  const item=_commandPaletteEntries.find(x=>x.id===id);
  if(!item)return;
  closeCommandPalette(true);
  item.run();
}

function openCommandPalette(){
  const ov=document.getElementById('cmdPaletteOv');
  if(!ov)return;
  ov.classList.add('show');
  filterCommandPalette('');
  setTimeout(()=>{
    const input=document.getElementById('cmdPaletteInput');
    if(input){input.value='';input.focus();}
  },20);
}

function closeCommandPalette(ev){
  if(ev===true){
    document.getElementById('cmdPaletteOv')?.classList.remove('show');
    return;
  }
  if(!ev||ev.target===ev.currentTarget){
    document.getElementById('cmdPaletteOv')?.classList.remove('show');
  }
}

document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){
    e.preventDefault();
    openCommandPalette();
  }
});

function _opsTimelineEntries(){
  const out=[];
  const focusKey=_getUiFocusAgentKey();
  if(focusKey&&ACFG[focusKey])out.push({title:ACFG[focusKey].name.split(' ')[0],meta:`${ACFG[focusKey].role} · ${AG[focusKey]?.state||'idle'}`});
  if(_sharedProjectMemory.activeFile||_workspaceLastFilePath)out.push({title:'Archivo activo',meta:_workspaceDisplayName(_sharedProjectMemory.activeFile||_workspaceLastFilePath)});
  if(_lastIntentResolution)out.push({title:'Ultima intencion',meta:[_lastIntentResolution.type,_lastIntentResolution.routeKind].filter(Boolean).join(' / ')});
  if(_taskHistory[0])out.push({title:'Ultima tarea',meta:`${_taskHistory[0].status||'done'} · ${String(_taskHistory[0].task||'').slice(0,48)}`});
  out.push({title:'Visitantes',meta:`Paula ${_psychVisitor?'on':'off'} · Delivery ${_deliveryMesh?'on':'off'}`});
  return out.slice(0,4);
}

function refreshSceneCinemaHud(){
  const title=document.getElementById('sceneCinemaTitle');
  const meta=document.getElementById('sceneCinemaMeta');
  if(!title||!meta)return;
  const focusKey=_getUiFocusAgentKey();
  if(focusKey&&ACFG[focusKey]){
    title.textContent=`${ACFG[focusKey].name.split(' ')[0]} en foco`;
    meta.textContent=[
      ACFG[focusKey].role,
      AG[focusKey]?.state||'idle',
      _sharedProjectMemory.activeFile?_workspaceDisplayName(_sharedProjectMemory.activeFile):''
    ].filter(Boolean).join(' · ');
    return;
  }
  if(_sharedProjectMemory.activeFile||_workspaceLastFilePath){
    title.textContent='Workspace activo';
    meta.textContent=_workspaceDisplayName(_sharedProjectMemory.activeFile||_workspaceLastFilePath);
    return;
  }
  title.textContent=_directorMode?'Modo director':'Vista general';
  meta.textContent=currentPanel==='consola'?'Chat listo para operar':'Sin foco activo';
}

function refreshOpsBar(){
  const nowEl=document.getElementById('opsNow');
  const metaEl=document.getElementById('opsMeta');
  const summaryEl=document.getElementById('opsSummary');
  const timelineEl=document.getElementById('opsTimeline');
  if(!nowEl||!metaEl)return;

  let now='Listo para operar';
  if(_demoTourOn)now='Demo guiada en curso';
  else if(meetSpeaker&&ACFG[meetSpeaker])now=`${ACFG[meetSpeaker].name.split(' ')[0]} lidera la conversacion`;
  else if(activeAg&&typeof AG!=='undefined'&&AG[activeAg])now=`${ACFG[activeAg].name.split(' ')[0]} · ${AG[activeAg].state}`;

  const panelMap={tree:'equipo',flujo:'flujo',consola:'chat',status:'estado',dash:'dashboard'};
  metaEl.textContent=[
    GKEY?'Groq online':'modo demo',
    `panel ${panelMap[currentPanel]||currentPanel}`,
    `${_activeAgentsCount()} activos`
  ].join(' - ');
  nowEl.textContent=now;

  const taskCounts=_taskHistory.reduce((acc,t)=>{
    const k=t.status||'done';
    acc[k]=(acc[k]||0)+1;
    return acc;
  },{});
  if(summaryEl){
    summaryEl.innerHTML=[
      `<span class="ops-chip"><b>chat</b> ${chatAgent==='all'?'broadcast':ACFG[chatAgent]?.name.split(' ')[0]||'equipo'}</span>`,
      `<span class="ops-chip"><b>memoria</b> ${_countAllChatMessages()} msgs</span>`,
      `<span class="ops-chip"><b>tareas</b> ${taskCounts.running||0} run · ${taskCounts.blocked||0} block</span>`,
      `<span class="ops-chip"><b>workspace</b> ${_workspaceDirHandle?`${_workspaceIndex.length} archivos`:'sin carpeta'}</span>`
    ].join('');
  }
  if(timelineEl){
    timelineEl.innerHTML=_opsTimelineEntries().map(item=>`
      <div class="ops-step">
        <strong>${escapeHtml(item.title||'Paso')}</strong>
        <span>${escapeHtml(item.meta||'')}</span>
      </div>
    `).join('');
  }
  applyOpsCompact();
  refreshSceneCinemaHud();
}

function updateProfileData(){
  if(!profileKey)return;
  const ag=AG[profileKey],cfg=ACFG[profileKey];
  const st=document.getElementById('apSt');
  st.textContent=ag.state;
  st.style.color=cfg.col;
  st.style.borderColor=cfg.col+'44';
  document.getElementById('apTm').textContent=ag.stateTime<60?`${Math.floor(ag.stateTime)}s`:`${Math.floor(ag.stateTime/60)}m`;
  document.getElementById('apLast').textContent=ag.lastMsg?`"${ag.lastMsg.slice(0,56)}"`:'Sin mensaje reciente';
  const note=document.getElementById('apNote');
  if(note)note.textContent=ag._activityLock?`Bloqueado en: ${ag._activityLock}`:_nextActionFor(profileKey);
  const chips=document.getElementById('apChips');
  if(chips){
    const focusTag=followAg===profileKey?'camara':'perfil';
    const fileTag=_sharedProjectMemory.activeFile?_workspaceDisplayName(_sharedProjectMemory.activeFile):'sin archivo';
    chips.innerHTML=[
      `<span class="ap-chip">${escapeHtml(cfg.role)}</span>`,
      `<span class="ap-chip">${escapeHtml(ag.state)}</span>`,
      `<span class="ap-chip">${escapeHtml(focusTag)}</span>`,
      `<span class="ap-chip">${escapeHtml(fileTag)}</span>`
    ].join('');
  }
}

function openProfile(k,px,py){
  profileKey=k;
  const cfg=ACFG[k];
  if(GKEY&&chatAgent!==k)setChatAgent(k);
  document.getElementById('apAv').textContent=cfg.name.split(' ').map(n=>n[0]).join('');
  document.getElementById('apAv').style.cssText=`background:${cfg.col}22;color:${cfg.col}`;
  document.getElementById('apNm').textContent=cfg.name;
  document.getElementById('apRl').textContent=cfg.role;
  document.getElementById('apFl').style.background=cfg.col;
  document.getElementById('apFl').style.color='#000';
  const followBtn=document.getElementById('apFollow');
  if(followBtn)followBtn.textContent=followAg===k?'Dejar':'Seguir';
  updateProfileData();

  const wrap=document.getElementById('canvasWrap'),{W,H}=getViewportSize();
  let l=px+14,t=py-10;
  if(l+260>W)l=px-270;
  if(t+245>H)t=H-250;
  if(t<0)t=8;

  const el=document.getElementById('agentProfile');
  el.style.left=l+'px';
  el.style.top=t+'px';
  el.classList.add('show');
  refreshSceneCinemaHud();
  syncPanelContext();
}

function closeProfile(){
  profileKey=null;
  document.getElementById('agentProfile').classList.remove('show');
  refreshSceneCinemaHud();
  syncPanelContext();
}

/*  STATUS PANEL  */
function updateStatusPanel(){
  const scroll=document.getElementById('statusScroll');

  if(!scroll.children.length){
    Object.entries(ACFG).forEach(([k,cfg])=>{
      const card=document.createElement('div');
      card.className='sc-card';
      card.id='scc-'+k;
      card.style.borderLeftColor=cfg.col;
      card.onclick=()=>selAgent(k);
      card.innerHTML=`<div class="sc-top"><div class="sc-av" id="scav-${k}" style="background:${cfg.col}22;color:${cfg.col}">${cfg.name.split(' ').map(n=>n[0]).join('')}</div><div class="sc-info"><div class="sc-nm">${cfg.name}</div><div class="sc-rl">${cfg.role}</div></div><div class="sc-right"><div class="sc-st" id="scst-${k}" style="color:${cfg.col};border-color:${cfg.col}44">idle</div><div class="sc-tm" id="sctm-${k}">0s</div></div></div><div class="sc-bar"><div class="sc-bar-fill" id="scbf-${k}" style="background:${cfg.col};width:0%"></div></div><div class="sc-msg" id="scmsg-${k}">Esperando siguiente accion</div>`;
      scroll.appendChild(card);
    });
  }

  Object.entries(ACFG).forEach(([k,cfg])=>{
    const ag=AG[k];if(!ag)return;
    const isSpeaker=k===meetSpeaker,isFPS=fpsMode&&k===fpsAgKey;
    const card=document.getElementById('scc-'+k);
    if(card)card.classList.toggle('is-active',k===activeAg);

    const stEl=document.getElementById('scst-'+k);
    if(stEl)stEl.textContent=isFPS?'fps':isSpeaker?'speak':ag.state;

    const tmEl=document.getElementById('sctm-'+k);
    if(tmEl)tmEl.textContent=ag.stateTime<60?`${Math.floor(ag.stateTime)}s`:`${Math.floor(ag.stateTime/60)}m`;

    const bf=document.getElementById('scbf-'+k);
    if(bf){
      const pct=ag.state==='working'?Math.min(100,ag.stateTime/8*100):(ag.state==='thinking'||ag.state==='reading')?50:ag.state==='walking'?30:0;
      bf.style.width=pct+'%';
      bf.style.opacity=pct>0?'1':'.2';
    }

    const ms=document.getElementById('scmsg-'+k);
    if(ms)ms.textContent=ag.lastMsg?ag.lastMsg.slice(0,48):_nextActionFor(k);
  });

  const tot=ACT.reduce((a,b)=>a+b,0);
  const el=document.getElementById('actNow');
  if(el)el.textContent=tot+' eventos';

  refreshOpsBar();
}

function updateActSpark(){
  const spark=document.getElementById('actSpark');if(!spark)return;
  if(!spark.children.length){for(let i=0;i<60;i++){const b=document.createElement('div');b.className='act-bar-el';b.style.height='1px';spark.appendChild(b);}}
  const bars=[...spark.children];bars.forEach((b,i)=>{const bi=(actIdx-59+i+60)%60;const v=Math.min(ACT[bi],8)/8;b.style.height=Math.max(1,Math.round(v*26))+'px';b.style.background=v>0?`rgba(15,168,85,${Math.max(.15,v*.8).toFixed(2)})`:'rgba(30,30,30,1)';});
}

//  AGENTE VIP 
let _vipKey=null,_vipCrown=null,_vipLabel=null;
function updateVIP(){
  // El agente con mas tokens/actividad hoy
  if(!_metricsLog.length)return;
  const today=new Date().toDateString();
  const scores={};
  _metricsLog.filter(m=>new Date(m.ts).toDateString()===today).forEach(m=>{
    scores[m.agKey]=(scores[m.agKey]||0)+m.tokens;
  });
  const top=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0];
  if(!top)return;
  const newVip=top[0];
  if(newVip===_vipKey)return;
  // Limpiar anterior
  if(_vipCrown&&AG[_vipKey]){AG[_vipKey].group.remove(_vipCrown);_vipCrown=null;}
  if(_vipLabel)_vipLabel.remove();
  _vipKey=newVip;
  if(!AG[_vipKey])return;
  // Corona 3D
  const crownGroup=new THREE.Group();
  const gold=new THREE.MeshBasicMaterial({color:0xc8a040});
  const base=new THREE.Mesh(new THREE.BoxGeometry(.5,.1,.5),gold);
  crownGroup.add(base);
  [[-.18,0],[0,.12],[.18,0]].forEach(([ox,oy])=>{
    const spike=new THREE.Mesh(new THREE.CylinderGeometry(0,.07,.22,4),gold);
    spike.position.set(ox,.15+oy,0);crownGroup.add(spike);
  });
  crownGroup.position.set(0,2.85,0);
  AG[_vipKey].group.add(crownGroup);_vipCrown=crownGroup;
  // Label HTML
  const lbl=document.createElement('div');
  lbl.style.cssText=`position:absolute;font-family:var(--mono);font-size:7px;color:#c8a040;background:rgba(0,0,0,.9);border:1px solid #c8a04066;padding:1px 6px;pointer-events:none;white-space:nowrap;animation:fadeUp .4s`;
  lbl.textContent='👑 MVP · '+top[1]+' tok';
  document.getElementById('speechLayer').appendChild(lbl);_vipLabel=lbl;
  // Posicion
  const _updV=setInterval(()=>{
    if(!AG[_vipKey]||!camera)return;
    const wrap=document.getElementById('canvasWrap');if(!wrap)return;
    const {W,H}=getViewportSize();
    const wp=new THREE.Vector3(AG[_vipKey].group.position.x,AG[_vipKey].group.position.y+5.2,AG[_vipKey].group.position.z);
    wp.project(camera);
    if(wp.z<1){lbl.style.display='block';lbl.style.left=((wp.x*.5+.5)*W)+'px';lbl.style.top=((-.5*wp.y+.5)*H - 20)+'px';lbl.style.transform='translateX(-50%)';}
    else lbl.style.display='none';
  },50);
  showToast('👑 MVP del dia: '+ACFG[_vipKey].name.split(' ')[0]+'  '+top[1]+' tokens','#c8a040');
}

//  ACHIEVEMENTS 
const _ACHIEVEMENTS={
  first_flow:{id:'first_flow',name:'Primer Flujo',desc:'Completaste tu primer flujo de agente',icon:'⚡',col:'#c8a040',unlocked:false},
  first_meeting:{id:'first_meeting',name:'Primera Reunion',desc:'Iniciaste tu primera reunion de equipo',icon:'👥',col:'#0fa855',unlocked:false},
  deploy_master:{id:'deploy_master',name:'Deploy Master',desc:'Yared llego a 5 deploys',icon:'🚀',col:'#3a8ccc',unlocked:false},
  coffee_addict:{id:'coffee_addict',name:'Coffee Addict',desc:'Tomaste 5 cafes',icon:'☕',col:'#8b4513',unlocked:false},
  chat_master:{id:'chat_master',name:'Chat Master',desc:'Enviaste 10 mensajes',icon:'💬',col:'#9060cc',unlocked:false},
  night_owl:{id:'night_owl',name:'Night Owl',desc:'Activaste el modo noche',icon:'🌙',col:'#5b9bd5',unlocked:false},
  vip_found:{id:'vip_found',name:'MVP Detectado',desc:'Un agente se convirtio en MVP',icon:'👑',col:'#c8a040',unlocked:false},
  bugsquash: {
  id: 'bugsquash',
  name: 'Bug Crusher',
  desc: 'QA detecto un bug critico',
  icon: '!',
  col: '#cc3344',
  unlocked: false
},

};
try{const saved=JSON.parse(localStorage.getItem('achievements')||'{}');Object.keys(saved).forEach(k=>{if(_ACHIEVEMENTS[k])_ACHIEVEMENTS[k].unlocked=saved[k];});}catch(e){}
let _chatCount=0;
function unlockAchievement(id){
  const a=_ACHIEVEMENTS[id];if(!a||a.unlocked)return;
  a.unlocked=true;
  const saved={};Object.keys(_ACHIEVEMENTS).forEach(k=>{saved[k]=_ACHIEVEMENTS[k].unlocked;});
  localStorage.setItem('achievements',JSON.stringify(saved));
  // Toast especial
  const t=document.createElement('div');
  t.style.cssText=`position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:var(--bg2);border:2px solid ${a.col};padding:10px 18px;z-index:600;animation:fadeUp .3s;pointer-events:none;display:flex;align-items:center;gap:10px;min-width:260px`;
  t.innerHTML=`<span style="font-size:20px">${a.icon}</span><div><div style="font-family:var(--mono);font-size:8px;color:${a.col};font-weight:800;letter-spacing:.1em;text-transform:uppercase">Logro desbloqueado</div><div style="font-family:var(--mono);font-size:10px;font-weight:700;color:var(--t1)">${a.name}</div><div style="font-family:var(--mono);font-size:8px;color:var(--t3)">${a.desc}</div></div>`;
  document.body.appendChild(t);
  setTimeout(()=>{t.style.transition='opacity .4s';t.style.opacity='0';setTimeout(()=>t.remove(),420);},4000);
  if(sndOn)try{
    const ctx=getACtx();
    [523,659,784,1047].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.08,ctx.currentTime+i*.08);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+i*.08+.18);o.connect(g);g.connect(ctx.destination);o.start(ctx.currentTime+i*.08);o.stop(ctx.currentTime+i*.08+.2);});
  }catch(e){}
}
function openAchievements(){
  const existing=document.getElementById('achOv');if(existing)existing.remove();
  const ov=document.createElement('div');ov.id='achOv';
  ov.style.cssText='position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center';
  const total=Object.values(_ACHIEVEMENTS).length;
  const done=Object.values(_ACHIEVEMENTS).filter(a=>a.unlocked).length;
  ov.innerHTML=`<div style="background:var(--bg2);border:1px solid var(--b2);padding:20px;width:420px;display:flex;flex-direction:column;gap:8px" onclick="event.stopPropagation()">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="font-family:var(--mono);font-size:11px;font-weight:800;color:var(--t1)">LOGROS ? ${done}/${total}</div>
      <button onclick="document.getElementById('achOv').remove()" style="background:none;border:none;color:var(--t3);font-size:16px;cursor:pointer">X</button>
    </div>
    <div style="height:3px;background:var(--b1)"><div style="height:100%;width:${done/total*100}%;background:var(--acc);transition:width .6s"></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
      ${Object.values(_ACHIEVEMENTS).map(a=>`
      <div style="padding:8px 10px;background:${a.unlocked?'var(--bg3)':'var(--bg)'};border:1px solid ${a.unlocked?a.col+'44':'var(--b1)'};opacity:${a.unlocked?1:.45}">
        <div style="font-size:16px;margin-bottom:4px">${a.icon}</div>
        <div style="font-family:var(--mono);font-size:9px;font-weight:700;color:${a.unlocked?a.col:'var(--t3)'};">${a.name}</div>
        <div style="font-family:var(--mono);font-size:7px;color:var(--t3);margin-top:2px">${a.desc}</div>
      </div>`).join('')}
    </div>
  </div>`;
  ov.onclick=()=>ov.remove();document.body.appendChild(ov);
}

//  SISTEMA XP Y NIVELES 
let _agentXP={};
try{_agentXP=JSON.parse(localStorage.getItem('agentXP')||'{}');}catch(e){}
Object.keys(ACFG).forEach(k=>{if(!_agentXP[k])_agentXP[k]={xp:0,level:1};});
const XP_PER_LEVEL=100;
const LEVEL_TITLES=['Trainee','Junior','Mid','Senior','Staff','Principal','Architect','Fellow','Distinguished','Legend'];
function addXP(agKey,amount,reason=''){
  if(!_agentXP[agKey])_agentXP[agKey]={xp:0,level:1};
  const prev=_agentXP[agKey];
  prev.xp+=amount;
  const newLevel=Math.min(9,Math.floor(prev.xp/XP_PER_LEVEL)+1);
  if(newLevel>prev.level){
    prev.level=newLevel;
    const title=LEVEL_TITLES[newLevel-1];
    AG[agKey]?.say(`🎉 Level ${newLevel}!`);
    showToast(`🎉 ${ACFG[agKey].name.split(' ')[0]} subio a ${title} (Lv.${newLevel})`,ACFG[agKey].col);
    // Efecto de nivel
    if(AG[agKey]){
      AG[agKey].agentLight.intensity=3;
      setTimeout(()=>AG[agKey].agentLight.intensity=0,800);
      // Particulas de nivel
      for(let i=0;i<12;i++){
        setTimeout(()=>{
          const star=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,.08),new THREE.MeshBasicMaterial({color:0xc8a040}));
          const ag=AG[agKey];
          star.position.set(ag.group.position.x+(Math.random()-.5)*.8,ag.group.position.y+1.8+Math.random()*.4,ag.group.position.z+(Math.random()-.5)*.8);
          scene.add(star);
          let _st=0;
          const _si=setInterval(()=>{_st+=.016;star.position.y+=.04;star.rotation.z+=.1;star.material.opacity=Math.max(0,1-_st*1.5);if(_st>1){clearInterval(_si);scene.remove(star);}},16);
        },i*60);
      }
    }
  }
  try{localStorage.setItem('agentXP',JSON.stringify(_agentXP));}catch(e){}
}
// XP automatico por estados
function updateXPFromState(agKey,dt){
  if(!_agentXP[agKey])return;
  const ag=AG[agKey];if(!ag)return;
  if(ag.state==='working')addXP(agKey,dt*.8,'working');
  else if(ag.state==='thinking')addXP(agKey,dt*.4,'thinking');
  else if(ag.state==='reading')addXP(agKey,dt*.3,'reading');
}
// Badge de nivel en label
function updateLevelBadge(agKey){
  if(!AG[agKey]||!_agentXP[agKey])return;
  const lvl=_agentXP[agKey].level;
  const cfg=ACFG[agKey];
  const lbl=AG[agKey].labelEl;
  if(!lbl._lvlBadge){
    const badge=document.createElement('span');
    badge.style.cssText=`font-family:var(--mono);font-size:6px;background:${cfg.col}22;border:1px solid ${cfg.col}44;color:${cfg.col};padding:0 3px;margin-left:2px;flex-shrink:0`;
    lbl.appendChild(badge);lbl._lvlBadge=badge;
  }
  lbl._lvlBadge.textContent='Lv'+lvl;
}
// Panel de XP
function openXPPanel(){
  const existing=document.getElementById('xpOv');if(existing)existing.remove();
  const ov=document.createElement('div');ov.id='xpOv';
  ov.style.cssText='position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center';
  ov.innerHTML=`<div style="background:var(--bg2);border:1px solid var(--b2);padding:20px;width:420px;display:flex;flex-direction:column;gap:6px" onclick="event.stopPropagation()">
    <div style="display:flex;justify-content:space-between">
      <div style="font-family:var(--mono);font-size:11px;font-weight:800;color:var(--t1)">⚡ XP · NIVELES DEL EQUIPO</div>
      <button onclick="document.getElementById('xpOv').remove()" style="background:none;border:none;color:var(--t3);font-size:16px;cursor:pointer">X</button>
    </div>
    ${Object.entries(ACFG).map(([k,cfg])=>{
      const data=_agentXP[k]||{xp:0,level:1};
      const pct=(data.xp%XP_PER_LEVEL)/XP_PER_LEVEL*100;
      const title=LEVEL_TITLES[data.level-1];
      return `<div style="padding:8px 10px;background:var(--bg3);border:1px solid var(--b1);border-left:3px solid ${cfg.col}">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-family:var(--mono);font-size:9px;font-weight:700;color:${cfg.col}">${cfg.name.split(' ')[0]}</span>
          <span style="font-family:var(--mono);font-size:8px;color:var(--t2)">${title} · Lv.${data.level}</span>
          <span style="font-family:var(--mono);font-size:8px;color:var(--t3)">${Math.floor(data.xp)} XP</span>
        </div>
        <div style="height:4px;background:var(--b1);border-radius:2px">
          <div style="height:100%;width:${pct.toFixed(0)}%;background:${cfg.col};border-radius:2px;transition:width .6s"></div>
        </div>
      </div>`;
    }).join('')}
    <button onclick="if(confirm('¿Resetear todo el XP?')){localStorage.removeItem('agentXP');Object.keys(ACFG).forEach(k=>_agentXP[k]={xp:0,level:1});document.getElementById('xpOv').remove();showToast('XP reseteado')}" style="font-family:var(--mono);font-size:7px;padding:3px;background:none;border:1px solid var(--b1);color:var(--t3);cursor:pointer;margin-top:4px">Reset XP</button>
  </div>`;
  ov.onclick=()=>ov.remove();document.body.appendChild(ov);
}

/*  #22 MÉTRICAS HISTÓRICAS  */
function _xpLevelProgress(data){
  return Math.max(0,Math.min(100,((data?.xp||0)%XP_PER_LEVEL)/XP_PER_LEVEL*100));
}

function _resetAllAgentXP(){
  localStorage.removeItem('agentXP');
  Object.keys(ACFG).forEach(k=>_agentXP[k]={xp:0,level:1});
  document.getElementById('xpOv')?.remove();
  showToast('XP reseteado');
}

function openAchievements(){
  const existing=document.getElementById('achOv');if(existing)existing.remove();
  const ov=document.createElement('div');ov.id='achOv';ov.className='overlay show';
  const total=Object.values(_ACHIEVEMENTS).length;
  const done=Object.values(_ACHIEVEMENTS).filter(a=>a.unlocked).length;
  const pct=total?((done/total)*100):0;
  ov.innerHTML=`<div class="mbox premium meet-hist-wrap" onclick="event.stopPropagation()">
    <button class="mx" onclick="document.getElementById('achOv').remove()" aria-label="Cerrar">&times;</button>
    <div class="mttl">Logros del equipo</div>
    <div class="modal-sub">${done}/${total} desbloqueados. Si, estan funcionando: se actualizan con reuniones, chat, noche y flujos clave.</div>
    <div class="ach-progress"><div class="ach-progress-fill" style="width:${pct.toFixed(1)}%"></div></div>
    <div class="modal-scroll ach-grid">
      ${Object.values(_ACHIEVEMENTS).map(a=>`
        <div class="ach-card ${a.unlocked?'':'locked'}" style="border-color:${a.unlocked?a.col+'44':'var(--b1)'}">
          <div class="ach-icon">${a.icon}</div>
          <div class="ach-name" style="color:${a.unlocked?a.col:'var(--t2)'}">${a.name}</div>
          <div class="ach-desc">${a.desc}</div>
        </div>
      `).join('')}
    </div>
  </div>`;
  ov.onclick=()=>ov.remove();document.body.appendChild(ov);
}

function openXPPanel(){
  const existing=document.getElementById('xpOv');if(existing)existing.remove();
  const ov=document.createElement('div');ov.id='xpOv';ov.className='overlay show';
  ov.innerHTML=`<div class="mbox premium meet-hist-wrap" onclick="event.stopPropagation()">
    <button class="mx" onclick="document.getElementById('xpOv').remove()" aria-label="Cerrar">&times;</button>
    <div class="mttl">XP y niveles del equipo</div>
    <div class="modal-sub">El XP si esta funcionando. Sube automaticamente por estados como <em>working</em>, <em>thinking</em> y <em>reading</em>, y se guarda en localStorage.</div>
    <div class="modal-scroll xp-list">
      ${Object.entries(ACFG).map(([k,cfg])=>{
        const data=_agentXP[k]||{xp:0,level:1};
        const pct=_xpLevelProgress(data);
        const title=LEVEL_TITLES[Math.max(0,(data.level||1)-1)]||'Trainee';
        return `<div class="xp-card" style="border-left:3px solid ${cfg.col}">
          <div class="xp-head">
            <span class="xp-name" style="color:${cfg.col}">${cfg.name.split(' ')[0]}</span>
            <span class="xp-meta"><span>${title} · Lv.${data.level}</span><span>${Math.floor(data.xp)} XP</span></span>
          </div>
          <div class="xp-bar"><div class="xp-fill" style="width:${pct.toFixed(0)}%;background:${cfg.col}"></div></div>
        </div>`;
      }).join('')}
    </div>
    <div class="modal-action-row">
      <button class="modal-btn-danger" onclick="if(confirm('¿Resetear todo el XP?'))_resetAllAgentXP()">Reset XP</button>
    </div>
  </div>`;
  ov.onclick=()=>ov.remove();document.body.appendChild(ov);
}

let _metricsLog=[];
try{_metricsLog=JSON.parse(localStorage.getItem('metricsLog')||'[]');}catch(e){}
let _metricsChart=null;
function logMetric(agKey,tokens,tools,cost,elapsed){
  _metricsLog.push({ts:Date.now(),agKey,tokens,tools,cost:parseFloat(cost),elapsed:parseFloat(elapsed)});
  if(_metricsLog.length>200)_metricsLog.shift();
  try{localStorage.setItem('metricsLog',JSON.stringify(_metricsLog));}catch(e){}
}
function switchStatusTab(tab){
  const sa=document.getElementById('stab-agents');
  const sm=document.getElementById('stab-metrics');
  const ss=document.getElementById('statusScroll');
  const mp=document.getElementById('metricsPanel');
  if(!sa||!sm||!ss||!mp)return;
  sa.className='cas-btn'+(tab==='agents'?' on':'');
  sm.className='cas-btn'+(tab==='metrics'?' on':'');
  ss.style.display=tab==='agents'?'flex':'none';
  mp.style.display=tab==='metrics'?'flex':'none';
  if(tab==='metrics'){
    // Destroy old chart to force re-render
    if(_metricsChart){_metricsChart.destroy();_metricsChart=null;}
    renderMetricsChart();
  }
}
function renderMetricsChart(){
  const canvas=document.getElementById('metricsChart');if(!canvas)return;
  // Boton limpiar metricas
  let clrBtn=document.getElementById('metricsClearBtn');
  if(!clrBtn){clrBtn=document.createElement('button');clrBtn.id='metricsClearBtn';clrBtn.textContent='Limpiar m?tricas';clrBtn.style.cssText='font-family:var(--mono);font-size:8px;padding:3px 8px;background:var(--bg3);border:1px solid var(--red);color:var(--red);cursor:pointer;margin-bottom:8px;display:block';clrBtn.onclick=()=>{_metricsLog=[];localStorage.removeItem('metricsLog');if(_metricsChart){_metricsChart.destroy();_metricsChart=null;}renderMetricsChart();};canvas.parentNode.insertBefore(clrBtn,canvas);}
  // Group by agent
  const byAgent={};
  _metricsLog.forEach(m=>{if(!byAgent[m.agKey])byAgent[m.agKey]={tokens:0,tools:0,cost:0,runs:0};byAgent[m.agKey].tokens+=m.tokens;byAgent[m.agKey].tools+=m.tools;byAgent[m.agKey].cost+=m.cost;byAgent[m.agKey].runs++;});
  const labels=Object.keys(byAgent).map(k=>ACFG[k]?.name.split(' ')[0]||k);
  const tokData=Object.keys(byAgent).map(k=>byAgent[k].tokens);
  const cols=Object.keys(byAgent).map(k=>(ACFG[k]?.col||'#0fa855')+'cc');
  if(_metricsChart){_metricsChart.destroy();_metricsChart=null;}
  if(!labels.length){canvas.style.display='none';return;}
  canvas.style.display='block';
  if(typeof Chart==='undefined'){
    const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js';
    s.onload=()=>_buildChart(canvas,labels,tokData,cols,byAgent);
    document.head.appendChild(s);
  }else _buildChart(canvas,labels,tokData,cols,byAgent);
}
function _buildChart(canvas,labels,tokData,cols,byAgent){
  _metricsChart=new Chart(canvas,{type:'bar',data:{labels,datasets:[{label:'Tokens',data:tokData,backgroundColor:cols,borderRadius:2}]},options:{responsive:true,plugins:{legend:{display:false},tooltip:{callbacks:{afterLabel:ctx=>{const k=Object.keys(byAgent)[ctx.dataIndex];const d=byAgent[k];return [`Tools: ${d.tools}`,`Costo: $${d.cost.toFixed(5)}`,`Runs: ${d.runs}`];}}}},scales:{x:{ticks:{color:'#5a6e5a',font:{family:'JetBrains Mono',size:9}},grid:{color:'#1e1e1e'}},y:{ticks:{color:'#5a6e5a',font:{family:'JetBrains Mono',size:9}},grid:{color:'#1e1e1e'}}}}});
  // Summary cards
  const el=document.getElementById('metricsSummary');
  const totalTokens=Object.values(byAgent).reduce((a,b)=>a+b.tokens,0);
  const totalCost=Object.values(byAgent).reduce((a,b)=>a+b.cost,0);
  const totalRuns=Object.values(byAgent).reduce((a,b)=>a+b.runs,0);
  // Group by day
  const byDay={};
  _metricsLog.forEach(m=>{const d=new Date(m.ts).toLocaleDateString('es-CO');if(!byDay[d])byDay[d]=0;byDay[d]+=m.tokens;});
  const dayKeys=Object.keys(byDay).slice(-7);
  const dayStr=dayKeys.map(d=>`<span style="font-family:var(--mono);font-size:7px;color:var(--t3)">${d}: <span style="color:var(--acc)">${byDay[d]} tok</span></span>`).join(' · ');
  el.innerHTML=`
    <div style="font-family:var(--mono);font-size:8px;color:var(--t3);margin-bottom:4px;line-height:1.8">${dayStr||'Sin datos por dia aun'}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px">
      ${[['Total tokens',totalTokens,'#3a8ccc'],['Total runs',totalRuns,'#0fa855'],['Costo USD','$'+totalCost.toFixed(4),'#c8a040']].map(([l,v,c])=>`
      <div style="padding:6px 8px;background:var(--bg2);border:1px solid var(--b1);text-align:center">
        <div style="font-family:var(--mono);font-size:8px;color:var(--t3)">${l}</div>
        <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:${c}">${v}</div>
      </div>`).join('')}
    </div>
    </div>`;
}

//  DASHBOARD EJECUTIVO 
const _dashKPIs={velocity:94,coverage:87,bugRate:2.1,deploys:14,nps:72,morale:88,uptime:99.8,sprint:62};
function renderDashboard() {
  const kpis = document.getElementById('dashKpis');
  const activity = document.getElementById('dashActivity');
  const health = document.getElementById('dashHealth');

  kpis.innerHTML = `
    <div class="dash-kpi">
      <div class="dash-kpi-lbl">Agentes Activos</div>
      <div class="dash-kpi-val">${Object.keys(AG).length}</div>
      <div class="dash-kpi-bar"><div class="dash-kpi-fill" style="width:85%;background:var(--acc)"></div></div>
    </div>
    <div class="dash-kpi">
      <div class="dash-kpi-lbl">Decisiones Tomadas</div>
      <div class="dash-kpi-val">${SHARED_MEMORY.decisions.length}</div>
      <div class="dash-kpi-bar"><div class="dash-kpi-fill" style="width:65%;background:#c8a040"></div></div>
    </div>
  `;

  // Actividad reciente (decisiones)
  activity.innerHTML = `<div class="dash-section-title">Decisiones Recientes del Equipo</div>`;
  
  if (SHARED_MEMORY.decisions.length === 0) {
    activity.innerHTML += `<div class="dash-empty">Aún no hay decisiones registradas</div>`;
  } else {
    SHARED_MEMORY.decisions.slice(0, 6).forEach(d => {
      const time = new Date(d.timestamp).toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'});
      activity.innerHTML += `
        <div class="dash-row">
          <div class="dash-dot" style="background:#c8a040"></div>
          <div class="dash-main">
            <div class="dash-strong">${d.agent}</div>
            <div class="dash-sub">${d.decision}</div>
          </div>
          <div class="dash-time">${time}</div>
        </div>`;
    });
  }

  // Salud operativa
  health.innerHTML = `
    <div class="dash-section-title">Salud Operativa</div>
    <div class="dash-row">
      <div class="dash-dot" style="background:var(--acc)"></div>
      <div class="dash-main">
        <div class="dash-strong">Workspace</div>
        <div class="dash-sub">${_workspaceDirHandle ? 'Conectado ✓' : 'Sin conectar'}</div>
      </div>
    </div>
    <div class="dash-row">
      <div class="dash-dot" style="background:var(--cyan)"></div>
      <div class="dash-main">
        <div class="dash-strong">Groq</div>
        <div class="dash-sub">${GKEY ? 'Conectado' : 'Demo mode'}</div>
      </div>
    </div>
  `;
}

function _saveConsoleUiState(){
  try{localStorage.setItem('consoleUiState',JSON.stringify(_consoleUiState));}catch(e){}
}

function _setConsolePreset(preset){
  const presets={
    'chat-default':{agents:true,search:false,tools:false},
    'focus-chat':{agents:false,search:false,tools:false},
    'workspace':{agents:false,search:true,tools:true}
  };
  const next=presets[preset];
  if(!next)return;
  _consoleUiState={..._consoleUiState,...next};
  _saveConsoleUiState();
  applyConsoleSections();
}

function applyConsoleSections(){
  const map=[
    ['agents','casBar','consoleAgentsBtn','flex'],
    ['search','chatSearchWrap','consoleSearchBtn','flex'],
    ['tools','toolMiniWrap','consoleToolsBtn','flex']
  ];

  map.forEach(([key,elId,btnId,display])=>{
    const el=document.getElementById(elId);
    const btn=document.getElementById(btnId);
    const on=!!_consoleUiState[key];
    if(el)el.style.display=on?display:'none';
    if(btn)btn.classList.toggle('on',on);
  });
}

function toggleConsoleSection(section){
  if(!_consoleUiState.hasOwnProperty(section))return;
  _consoleUiState[section]=!_consoleUiState[section];
  _saveConsoleUiState();
  applyConsoleSections();
}

function _getUiFocusAgentKey(){
  if(profileKey)return profileKey;
  if(followAg)return followAg;
  if(currentPanel==='consola'&&chatAgent&&chatAgent!=='all')return chatAgent;
  return '';
}

function _resolveConsoleContextMode(){
  const taskOpen=document.getElementById('taskOv')?.classList.contains('show');
  const viewerOpen=document.getElementById('fileViewerOv')?.classList.contains('show')||document.getElementById('toolPickerOv')?.classList.contains('show');
  const focusAgent=_getUiFocusAgentKey();
  if(taskOpen)return 'task';
  if(viewerOpen)return 'workspace';
  if((profileKey||followAg)&&currentPanel!=='status'&&currentPanel!=='dash')return 'focus-chat';
  if(currentPanel==='consola')return 'chat-default';
  return currentPanel||'tree';
}

function updateConsoleContextHint(){
  const el=document.getElementById('consoleContextHint');
  if(!el)return;
  const focusKey=_getUiFocusAgentKey();
  const labels={
    'focus-chat':focusKey?`En foco · ${ACFG[focusKey]?.name.split(' ')[0]||focusKey}`:'En foco · chat limpio',
    'workspace':_workspaceLastFilePath?`Workspace · ${_workspaceDisplayName(_workspaceLastFilePath)}`:'Workspace · leer, buscar o analizar',
    'task':'Tareas · cola y estados',
    'chat-default':chatAgent==='all'?'Broadcast inteligente':'Chat directo'
  };
  el.textContent=labels[_consoleContextMode]||'Contexto activo';
}

function syncPanelContext(){
  const nextMode=_resolveConsoleContextMode();
  if(nextMode===_consoleContextMode){
    document.body.classList.toggle('scene-focus',nextMode==='focus-chat'||nextMode==='workspace');
    updateConsoleContextHint();
    return;
  }

  _consoleContextMode=nextMode;
  document.body.dataset.contextMode=nextMode;
  document.body.classList.toggle('scene-focus',nextMode==='focus-chat'||nextMode==='workspace');

  if(nextMode==='task'&&!_directorMode&&currentPanel!=='status'){
    switchPanel('status');
    return;
  }

  if(nextMode==='workspace'){
    _setConsolePreset('workspace');
  }else if(nextMode==='focus-chat'){
    _setConsolePreset('focus-chat');
  }else if(nextMode==='chat-default'){
    _setConsolePreset('chat-default');
  }else{
    applyConsoleSections();
  }

  updateConsoleContextHint();
}

function updateConsoleContextHint(){
  const el=document.getElementById('consoleContextHint');
  const titleEl=document.getElementById('consoleContextTitle');
  const metaEl=document.getElementById('consoleContextMeta');
  if(!el||!titleEl||!metaEl)return;

  const focusKey=_getUiFocusAgentKey();
  const taskCounts=(_taskHistory||[]).reduce((acc,t)=>{
    const st=t?.status||'queued';
    acc[st]=(acc[st]||0)+1;
    return acc;
  },{});

  const labels={
    'focus-chat':{
      title:focusKey?`En foco · ${ACFG[focusKey]?.name.split(' ')[0]||focusKey}`:'En foco · chat limpio',
      meta:focusKey?`${ACFG[focusKey]?.role||'Agente'} · ${AG[focusKey]?.state||'idle'}`:'Seguir a un agente deja solo lo esencial.'
    },
    'workspace':{
      title:_workspaceLastFilePath?`Workspace · ${_workspaceDisplayName(_workspaceLastFilePath)}`:'Workspace listo',
      meta:_workspaceIndex.length?`${_workspaceIndex.length} archivos indexados · leer, buscar o analizar`:'Conecta carpeta y abre un archivo para trabajar aquí.'
    },
    'task':{
      title:'Tareas activas',
      meta:`${taskCounts.queued||0} en cola · ${taskCounts.running||0} en curso · ${taskCounts.blocked||0} bloqueadas`
    },
    'chat-default':{
      title:chatAgent==='all'?'Broadcast inteligente':`Chat directo · ${ACFG[chatAgent]?.name.split(' ')[0]||'equipo'}`,
      meta:_workspaceLastFilePath?`Archivo activo: ${_workspaceDisplayName(_workspaceLastFilePath)}`:'Haz una pregunta o abre un archivo para dar contexto.'
    }
  };

  const cfg=labels[_consoleContextMode]||{title:'Contexto activo',meta:'Panel listo para trabajar.'};
  titleEl.textContent=cfg.title;
  metaEl.textContent=cfg.meta;
  el.style.borderColor=_consoleContextMode==='focus-chat'&&focusKey?(ACFG[focusKey]?.col||'var(--b1)')+'55':_consoleContextMode==='workspace'?'rgba(91,155,213,.35)':_consoleContextMode==='task'?'rgba(15,168,85,.35)':'var(--b1)';
}


/* onboarding guiado desactivado */

/*  CONSOLE  */
let chatAgent='ceo';
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
function saveChatH(k){try{localStorage.setItem('chat_'+k,JSON.stringify(chatH[k].slice(-60)));}catch(e){}}
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

function clearAgentMemory(k){chatH[k]=[];localStorage.removeItem('chat_'+k);if(chatAgent===k){document.getElementById('cmsgs').innerHTML='';addGreeting();}showToast('Memoria de '+ACFG[k].name.split(' ')[0]+' limpiada','#cc3344');}
function initConsole(){const nk=document.getElementById('noKeyMsg'),cb=document.getElementById('casBar');const ms=document.getElementById('cmsgs'),ip=document.querySelector('.cinp-area');const tw=document.getElementById('toolMiniWrap');const sw=document.getElementById('chatSearchWrap');const rail=document.getElementById('consoleRail');if(!GKEY){nk.style.display='block';if(cb)cb.style.display='none';if(ms)ms.style.display='none';if(ip)ip.style.display='none';if(tw)tw.style.display='none';if(sw)sw.style.display='none';if(rail)rail.style.display='none';return;}nk.style.display='none';if(rail)rail.style.display='flex';if(ms)ms.style.display='flex';if(ip)ip.style.display='flex';_refreshWorkspaceQuickUI();applyConsoleSections();updateConsoleContextHint();if(chatAgent!=='all'&&chatH[chatAgent].length===0)addGreeting();}
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
  chatAgent=k;document.querySelectorAll('.cas-btn').forEach(b=>b.classList.remove('on'));document.getElementById('cas-'+k)?.classList.add('on');
  _refreshWorkspaceQuickUI();
  const badge=document.getElementById('cagbadge');
  if(k==='all'){
    badge.textContent='TODOS';
    badge.style.color='var(--acc)';
    document.getElementById('cmsgs').innerHTML='<div style="padding:10px 12px;font-family:var(--mono);font-size:9px;color:var(--t2)">Modo broadcast: tu mensaje se envia a todo el equipo y cada agente responde desde su rol.</div>';
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
  const memBar=document.getElementById('memBar');
  if(memBar&&k!=='all'){memBar.style.display='flex';document.getElementById('memInfo').textContent=`${chatH[k].filter(m=>m.role==='user').length} mensajes guardados`;}
  const ag=AG[k];
  if(ag){ag.say('Hola');ag.setState('thinking');setTimeout(()=>ag.setState('idle'),1200);}
  syncPanelContext();
}

function setChatAgent(k){
  chatAgent=k;
  document.querySelectorAll('.cas-btn').forEach(b=>b.classList.remove('on'));
  document.getElementById('cas-'+k)?.classList.add('on');
  _refreshWorkspaceQuickUI();
  const badge=document.getElementById('cagbadge');
  if(k==='all'){
    badge.textContent='TODOS';
    badge.style.color='var(--acc)';
    document.getElementById('cmsgs').innerHTML='<div style="padding:10px 12px;font-family:var(--mono);font-size:9px;color:var(--t2)">Modo broadcast: tu mensaje se envia a todo el equipo y cada agente responde desde su rol.</div>';
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