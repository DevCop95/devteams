// ui.js - Dashboard, overlays, panel switcher, theme & initialization
window.addEventListener('beforeunload',()=>teardownPathWorker(false));

  if(localStorage.getItem('theme')==='light')document.body.classList.add('light-mode');
'use strict';
/*  STATE  */
// #3 Rack status modal
const rm=document.createElement('div');rm.id='rackModal';
rm.style.cssText='display:none;position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.85);align-items:center;justify-content:center';
rm.innerHTML=`<div style="background:linear-gradient(180deg,var(--bg2),rgba(11,15,18,.95));border:1px solid #4caf5044;border-radius:18px;border-left:4px solid #4caf50;box-shadow:0 24px 60px rgba(0,0,0,.4);backdrop-filter:blur(10px);padding:20px;width:380px;display:flex;flex-direction:column;gap:8px" onclick="event.stopPropagation()">
  <div style="font-family:var(--mono);font-size:14px;font-weight:800;color:#4caf50;letter-spacing:.1em">⚙ SERVER RACK · Dev Teams</div>
  <div id="rackStats" style="display:flex;flex-direction:column;gap:4px"></div>
  <button onclick="document.getElementById('rackModal').style.display='none'" style="font-family:var(--mono);font-size:17px;padding:5px 12px;background:var(--bg3);border:1px solid var(--b2);color:var(--t2);cursor:pointer;align-self:flex-end;margin-top:4px">Cerrar</button>
</div>`;
rm.onclick=()=>rm.style.display='none';
document.body.appendChild(rm);


// #1 Pizarron interactivo
document.getElementById('boardModal')?.remove();
const bm=document.createElement('div');
bm.id='boardModal';
bm.style.cssText='display:none;position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.88);align-items:center;justify-content:center';
bm.innerHTML=`<div style="background:linear-gradient(180deg,var(--bg2),rgba(11,15,18,.95));border:1px solid var(--b2);border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.4);backdrop-filter:blur(10px);padding:20px;width:580px;max-height:88vh;overflow-y:auto;display:flex;flex-direction:column;gap:10px" onclick="event.stopPropagation()">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div style="font-family:var(--mono);font-size:14px;font-weight:800;color:var(--t1);letter-spacing:.1em">📋 WHITEBOARD · Dev Teams</div>
    <div style="display:flex;gap:4px">
      <button onclick="addSticky('yellow')" style="font-family:var(--mono);font-size:15px;padding:3px 8px;background:#c8a04022;border:1px solid #c8a040;color:#c8a040;cursor:pointer">+ Nota</button>
      <button onclick="addSticky('green')" style="font-family:var(--mono);font-size:15px;padding:3px 8px;background:#0fa85522;border:1px solid #0fa855;color:#0fa855;cursor:pointer">+ Task</button>
      <button onclick="addSticky('red')" style="font-family:var(--mono);font-size:15px;padding:3px 8px;background:#cc334422;border:1px solid #cc3344;color:#cc3344;cursor:pointer">+ Bug</button>
      <button onclick="addSticky('blue')" style="font-family:var(--mono);font-size:15px;padding:3px 8px;background:#3a8ccc22;border:1px solid #3a8ccc;color:#3a8ccc;cursor:pointer">+ Idea</button>
      <button onclick="document.getElementById('boardModal').style.display='none'" style="background:none;border:none;color:var(--t3);font-size:16px;cursor:pointer">X</button>
    </div>
  </div>
  <div style="font-family:var(--mono);font-size:15px;color:var(--t3)">Haz clic en una nota para editarla · arrastra para mover</div>
  <div id="stickyBoard" style="position:relative;background:var(--bg3);border:1px solid var(--b1);min-height:340px;overflow:hidden"></div>
  <div style="display:flex;gap:6px;align-items:center;border-top:1px solid var(--b1);padding-top:8px">
    <textarea id="boardText" style="font-family:var(--mono);font-size:17px;background:var(--bg);border:1px solid var(--b2);color:var(--t1);padding:8px;height:60px;flex:1;outline:none;resize:none" placeholder="Notas rapidas del equipo..."></textarea>
    <button onclick="saveBoard()" style="font-family:var(--mono);font-size:17px;font-weight:700;padding:8px 14px;background:var(--acc);color:#000;border:none;cursor:pointer">Guardar</button>
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
    tag.style.cssText=`font-family:var(--mono);font-size:14px;color:${c.border};font-weight:700;text-transform:uppercase`;
    tag.textContent=s.col;

    const del=document.createElement('button');
    del.type='button';
    del.textContent='×';
    del.style.cssText=`background:none;border:none;color:${c.border};font-size:14px;cursor:pointer;padding:0;line-height:1`;
    del.onclick=()=>{
      _stickies.splice(i,1);
      saveStickies();
      renderStickies();
    };

    head.appendChild(tag);
    head.appendChild(del);

    const body=document.createElement('div');
    body.contentEditable='true';
    body.style.cssText=`font-family:var(--mono);font-size:17px;color:${c.text};outline:none;min-height:48px;word-break:break-word`;
    body.textContent=s.text||'';
    body.onblur=()=>{
      _stickies[i].text=body.textContent||'';
      saveStickies();
    };

    const foot=document.createElement('div');
    foot.style.cssText=`font-family:var(--mono);font-size:14px;color:${c.border}44;margin-top:4px`;
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
  ov.innerHTML=`<div style="background:linear-gradient(180deg,var(--bg2),rgba(11,15,18,.95));border:1px solid #0fa85544;border-radius:18px;border-left:4px solid #0fa855;box-shadow:0 24px 60px rgba(0,0,0,.4);backdrop-filter:blur(10px);padding:22px;width:480px;display:flex;flex-direction:column;gap:10px" onclick="event.stopPropagation()">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="font-family:var(--mono);font-size:14px;font-weight:800;color:var(--t1)">🪑 SALA DE REUNIONES</div>
      <button onclick="document.getElementById('tableMenuOv').remove()" style="background:none;border:none;color:var(--t3);font-size:16px;cursor:pointer">X</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
      <button onclick="document.getElementById('tableMenuOv').remove();runMeeting()" style="font-family:var(--mono);font-size:15px;font-weight:700;padding:12px;background:rgba(15,168,85,.1);border:1px solid var(--acc);color:var(--acc);cursor:pointer">⇄ Iniciar Reunion<br><span style="font-size:15px;color:var(--t3);font-weight:400">Todo el equipo</span></button>
      <button onclick="showAgendaEditor()" style="font-family:var(--mono);font-size:15px;font-weight:700;padding:12px;background:rgba(58,140,204,.1);border:1px solid #3a8ccc;color:#3a8ccc;cursor:pointer">📅 Agenda del dia<br><span style="font-size:15px;color:var(--t3);font-weight:400">Editar items</span></button>
    </div>
    <div style="font-family:var(--mono);font-size:17px;color:var(--t2);letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid var(--b1);padding-bottom:4px">Agenda actual</div>
    <div id="agendaList" style="display:flex;flex-direction:column;gap:3px;max-height:200px;overflow-y:auto"></div>
    <div style="display:flex;gap:6px">
      <input id="agendaInp" style="flex:1;font-family:var(--mono);font-size:17px;background:var(--bg3);border:1px solid var(--b2);color:var(--t1);padding:6px 8px;outline:none" placeholder="Añadir item a la agenda...">
      <button onclick="addAgendaItem()" style="font-family:var(--mono);font-size:17px;font-weight:700;padding:6px 12px;background:var(--acc);color:#000;border:none;cursor:pointer">+</button>
    </div>
  </div>`;
  ov.onclick=()=>ov.remove();document.body.appendChild(ov);
  renderAgenda();
}
function renderAgenda(){
  const el=document.getElementById('agendaList');if(!el)return;
  if(!_agenda.length){el.innerHTML='<div style="font-family:var(--mono);font-size:17px;color:var(--t3);padding:6px">Sin items. Añade uno abajo.</div>';return;}
  el.innerHTML=_agenda.map((item,i)=>`
    <div style="display:flex;align-items:center;gap:6px;padding:5px 8px;background:${item.done?'var(--bg)':'var(--bg3)'};border:1px solid var(--b1);border-left:3px solid ${item.done?'var(--t3)':'var(--acc)'}">
      <input type="checkbox" ${item.done?'checked':''} onchange="_agenda[${i}].done=this.checked;localStorage.setItem('agenda',JSON.stringify(_agenda));renderAgenda()" style="cursor:pointer">
      <span style="font-family:var(--mono);font-size:17px;color:${item.done?'var(--t3)':'var(--t1)'};flex:1;text-decoration:${item.done?'line-through':'none'}">${item.text}</span>
      <span style="font-family:var(--mono);font-size:14px;color:var(--t3)">${item.time||''}</span>
      <button onclick="_agenda.splice(${i},1);localStorage.setItem('agenda',JSON.stringify(_agenda));renderAgenda()" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:15px">X</button>
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
  let calHTML=`<div style="background:linear-gradient(180deg,var(--bg2),rgba(11,15,18,.95));border:1px solid var(--b2);border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.4);backdrop-filter:blur(10px);padding:20px;width:480px;display:flex;flex-direction:column;gap:10px" onclick="event.stopPropagation()">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="font-family:var(--mono);font-size:14px;font-weight:800;color:var(--t1)">📅 SPRINT · ${monthName} ${now.getFullYear()}</div>
      <button onclick="document.getElementById('calOv').remove()" style="background:none;border:none;color:var(--t3);font-size:16px;cursor:pointer">X</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">
      ${['L','M','X','J','V','S','D'].map(d=>`<div style="font-family:var(--mono);font-size:15px;color:var(--t3);text-align:center;padding:4px">${d}</div>`).join('')}`;
  // Offset primer dia
  const firstDay=(sprintStart.getDay()+6)%7;
  for(let i=0;i<firstDay;i++)calHTML+=`<div></div>`;
  for(let d=1;d<=days;d++){
    const isToday=d===now.getDate();
    const hasEvent=events[d];
    const isWeekend=((d+firstDay-1)%7>=5);
    calHTML+=`<div style="font-family:var(--mono);font-size:15px;text-align:center;padding:4px 2px;background:${isToday?'var(--acc)':hasEvent?'rgba(58,140,204,.15)':'var(--bg3)'};border:1px solid ${isToday?'var(--acc)':hasEvent?'#3a8ccc44':'var(--b1)'};color:${isToday?'#000':isWeekend?'var(--t3)':'var(--t1)'};cursor:${hasEvent?'pointer':'default'};position:relative" ${hasEvent?`title="${hasEvent}" onclick="showToast('${hasEvent}','#3a8ccc')"`:''}>
      ${d}${hasEvent?`<div style="width:4px;height:4px;background:#3a8ccc;border-radius:50%;margin:1px auto 0"></div>`:''}
    </div>`;
  }
  calHTML+=`</div>
    <div style="font-family:var(--mono);font-size:15px;color:var(--t3);border-top:1px solid var(--b1);padding-top:6px">Proximos eventos:</div>
    <div style="display:flex;flex-direction:column;gap:3px;max-height:100px;overflow-y:auto">
      ${Object.entries(events).filter(([d])=>parseInt(d)>=now.getDate()).slice(0,4).map(([d,e])=>`
      <div style="display:flex;gap:8px;align-items:center;padding:4px 8px;background:var(--bg3);border:1px solid var(--b1)">
        <span style="font-family:var(--mono);font-size:17px;color:#3a8ccc;min-width:20px">${d}</span>
        <span style="font-family:var(--mono);font-size:17px;color:var(--t1)">${e}</span>
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
  const focusKeys=new Set([activeAg,meetSpeaker,window.followAg,profileKey,fpsAgKey].filter(Boolean));

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
function profileFlow(){if(profileKey)selAgent(profileKey);closeProfile();}
function profileFPS(){if(!profileKey)return;const k=profileKey;closeProfile();enterFPS(k);}
function profileChat(){if(!profileKey)return;setChatAgent(profileKey);switchPanel('consola');closeProfile();}

function profileFollow(){
  if(!profileKey)return;
  const k=profileKey;
  const same=window.followAg===k;
  closeProfile();

  if(same){
    window.followAg=null;
    window.followT=0;
    showToast('Camara libre','#c8a040');
    syncPanelContext();
    return;
  }

  window.followAg=k;
  window.followT=Number.POSITIVE_INFINITY;
  window.camZTgt=null;
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
    if(msgs)msgs.innerHTML='<div style="padding:10px 12px;font-family:var(--mono);font-size:17px;color:var(--t2)">Modo broadcast: tu mensaje se envia a todo el equipo y cada agente responde desde su rol.</div>';
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
  const providerTag=document.getElementById('noKeyProvider');
  if(providerTag)providerTag.textContent=providerLabel();
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
    _paletteAction('Workspace · Subir documentos','Carga archivos nuevos al folder uploads',()=>workspaceQuickAction('upload')),
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
  out.push({title:'Visitantes',meta:`Paula ${window._psychVisitor?'on':'off'} · Delivery ${window._deliveryMesh?'on':'off'}`});
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
    hasActiveKey()?`${providerLabel()} online`:'modo demo',
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
    const focusTag=window.followAg===profileKey?'camara':'perfil';
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
  if(followBtn)followBtn.textContent=window.followAg===k?'Dejar':'Seguir';
  updateProfileData();
  const yaredBtn=document.getElementById('apYaredBtn');
  if(k==='devbe'){
    if(!yaredBtn){
      const btn=document.createElement('button');btn.id='apYaredBtn';btn.className='ap-act';
      btn.textContent='⚡ Stats';btn.onclick=()=>{openYaredStats();closeProfile();};
      document.querySelector('.ap-acts').appendChild(btn);
    }else yaredBtn.style.display='';
  }else if(yaredBtn)yaredBtn.style.display='none';

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
  lbl.style.cssText=`position:absolute;font-family:var(--mono);font-size:14px;color:#c8a040;background:rgba(0,0,0,.9);border:1px solid #c8a04066;padding:1px 6px;pointer-events:none;white-space:nowrap;animation:fadeUp .4s`;
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
  t.innerHTML=`<span style="font-size:20px">${a.icon}</span><div><div style="font-family:var(--mono);font-size:15px;color:${a.col};font-weight:800;letter-spacing:.1em;text-transform:uppercase">Logro desbloqueado</div><div style="font-family:var(--mono);font-size:15px;font-weight:700;color:var(--t1)">${a.name}</div><div style="font-family:var(--mono);font-size:15px;color:var(--t3)">${a.desc}</div></div>`;
  document.body.appendChild(t);
  setTimeout(()=>{t.style.transition='opacity .4s';t.style.opacity='0';setTimeout(()=>t.remove(),420);},4000);
  if(sndOn)try{
    const ctx=getACtx();
    [523,659,784,1047].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.08,ctx.currentTime+i*.08);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+i*.08+.18);o.connect(g);g.connect(ctx.destination);o.start(ctx.currentTime+i*.08);o.stop(ctx.currentTime+i*.08+.2);});
  }catch(e){}
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
    badge.style.cssText=`font-family:var(--mono);font-size:14px;background:${cfg.col}22;border:1px solid ${cfg.col}44;color:${cfg.col};padding:0 3px;margin-left:2px;flex-shrink:0`;
    lbl.appendChild(badge);lbl._lvlBadge=badge;
  }
  lbl._lvlBadge.textContent='Lv'+lvl;
}
// Panel de XP
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
  if(!clrBtn){clrBtn=document.createElement('button');clrBtn.id='metricsClearBtn';clrBtn.textContent='Limpiar m?tricas';clrBtn.style.cssText='font-family:var(--mono);font-size:15px;padding:3px 8px;background:var(--bg3);border:1px solid var(--red);color:var(--red);cursor:pointer;margin-bottom:8px;display:block';clrBtn.onclick=()=>{_metricsLog=[];localStorage.removeItem('metricsLog');if(_metricsChart){_metricsChart.destroy();_metricsChart=null;}renderMetricsChart();};canvas.parentNode.insertBefore(clrBtn,canvas);}
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
  const dayStr=dayKeys.map(d=>`<span style="font-family:var(--mono);font-size:14px;color:var(--t3)">${d}: <span style="color:var(--acc)">${byDay[d]} tok</span></span>`).join(' · ');
  el.innerHTML=`
    <div style="font-family:var(--mono);font-size:15px;color:var(--t3);margin-bottom:4px;line-height:1.8">${dayStr||'Sin datos por dia aun'}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px">
      ${[['Total tokens',totalTokens,'#3a8ccc'],['Total runs',totalRuns,'#0fa855'],['Costo USD','$'+totalCost.toFixed(4),'#c8a040']].map(([l,v,c])=>`
      <div style="padding:6px 8px;background:var(--bg2);border:1px solid var(--b1);text-align:center">
        <div style="font-family:var(--mono);font-size:15px;color:var(--t3)">${l}</div>
        <div style="font-family:var(--mono);font-size:15px;font-weight:700;color:${c}">${v}</div>
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
        <div class="dash-strong">${providerLabel()}</div>
        <div class="dash-sub">${hasActiveKey() ? 'Conectado' : 'Demo mode'}</div>
      </div>
    </div>
  `;
}


/*  YARED IDLE SYSTEM  */
// Inspirado en: Cookie Clicker (acumulacion), Progress Knight (stats pasivos)
// Adventure Capitalist (multipliers), Idle Miner (zonas de produccion)
const _yaredIdle={
  builds:parseInt(localStorage.getItem('yrd_builds')||'0'),
  linesOfCode:parseInt(localStorage.getItem('yrd_loc')||'0'),
  deploysTotal:parseInt(localStorage.getItem('yrd_deploys')||'0'),
  coffeeConsumed:parseInt(localStorage.getItem('yrd_coffee')||'0'),
  bugsFixed:parseInt(localStorage.getItem('yrd_bugs')||'0'),
  uptime:parseFloat(localStorage.getItem('yrd_uptime')||'0'),
  lastSave:Date.now(),
  // Passive rates (per second)
  locRate:1.2,    // lines of code per second when working
  buildRate:0.08, // builds per second
  // Multipliers
  multiplier:1.0,
};
// Passive accumulation  idle core loop
function updateYaredIdle(dt){
  if(!AG['devbe'])return;
  const ag=AG['devbe'];
  // Passive income always running (idle mechanic)
  _yaredIdle.linesOfCode+=_yaredIdle.locRate*dt*_yaredIdle.multiplier;
  _yaredIdle.uptime+=dt;
  // Bonus when working
  if(ag.state==='working'){
    _yaredIdle.linesOfCode+=_yaredIdle.locRate*3*dt;
    _yaredIdle.builds+=_yaredIdle.buildRate*dt;
  }
  if(ag.state==='thinking'){
    _yaredIdle.linesOfCode+=_yaredIdle.locRate*1.5*dt;
  }
  // Milestone notifications (Cookie Clicker style)
  const loc=Math.floor(_yaredIdle.linesOfCode);
  const milestones=[100,500,1000,5000,10000,50000,100000];
  if(!_yaredIdle._lastMilestone)_yaredIdle._lastMilestone=0;
  const nextMile=milestones.find(m=>m>_yaredIdle._lastMilestone&&loc>=m);
  if(nextMile){
    _yaredIdle._lastMilestone=nextMile;
    AG['devbe']?.say(`🎯 ${nextMile.toLocaleString()} lineas!`);
    showToast(`⚡ Yared: ${nextMile.toLocaleString()} lineas de codigo escritas!`,'#3a8ccc');
    _yaredIdle.multiplier=Math.min(5,_yaredIdle.multiplier+0.1);
  }
  // Auto-save every 30s
  if(_yaredIdle.uptime%30<dt){
    localStorage.setItem('yrd_builds',Math.floor(_yaredIdle.builds));
    localStorage.setItem('yrd_loc',Math.floor(_yaredIdle.linesOfCode));
    localStorage.setItem('yrd_deploys',_yaredIdle.deploysTotal);
    localStorage.setItem('yrd_coffee',_yaredIdle.coffeeConsumed);
    localStorage.setItem('yrd_bugs',_yaredIdle.bugsFixed);
    localStorage.setItem('yrd_uptime',_yaredIdle.uptime.toFixed(0));
  }
}
// Coffee increments multiplier (Cookie Clicker click mechanic)
function yaredDrinkCoffee(){
  _yaredIdle.coffeeConsumed++;
  _yaredIdle.multiplier=Math.min(10,_yaredIdle.multiplier+0.05);
  _yaredIdle.locRate=Math.min(20,_yaredIdle.locRate*1.02);
  localStorage.setItem('yrd_coffee',_yaredIdle.coffeeConsumed);
  showToast(`☕ Cafe #${_yaredIdle.coffeeConsumed} · Multiplicador: ${_yaredIdle.multiplier.toFixed(2)}x`,'#3a8ccc');
}
// Deploy = big milestone (Adventure Capitalist business launch)
function yaredDeploy(){
  _yaredIdle.deploysTotal++;
  triggerDeployEffect(25,0,-14,'#4caf50');
  _yaredIdle.builds=Math.max(0,_yaredIdle.builds-1);
  _yaredIdle.multiplier=Math.min(10,_yaredIdle.multiplier+0.2);
  localStorage.setItem('yrd_deploys',_yaredIdle.deploysTotal);
  showToast(`🚀 Deploy #${_yaredIdle.deploysTotal} · ?${_yaredIdle.multiplier.toFixed(1)} activo!`,'#3a8ccc');
  AG['devbe']?.say(`🚀 Deploy #${_yaredIdle.deploysTotal} exitoso!`);
}
// Bug fixed = progress mechanic (Progress Knight skill up)
function yaredBugFixed(){
  _yaredIdle.bugsFixed++;
  _yaredIdle.linesOfCode+=50*_yaredIdle.multiplier;
  localStorage.setItem('yrd_bugs',_yaredIdle.bugsFixed);
}
// Stats panel for Yared idle

const _yaredUpgrades=[
  {id:'keyboard',name:'Teclado mecanico',desc:'?2 loc/s',cost:500,bought:false,apply:()=>_yaredIdle.locRate*=2},
  {id:'monitors',name:'Triple monitor',desc:'?1.5 multiplicador',cost:1000,bought:false,apply:()=>_yaredIdle.multiplier*=1.5},
  {id:'caffeine',name:'Cafeina IV',desc:'?3 efecto cafe',cost:2000,bought:false,apply:()=>_yaredIdle.coffeeConsumed+=10},
  {id:'assistant',name:'AI assistant',desc:'+5 loc/s pasivo',cost:5000,bought:false,apply:()=>_yaredIdle.locRate+=5},
  {id:'k8s',name:'K8s auto-deploy',desc:'deploy automatico cada 60s',cost:10000,bought:false,apply:()=>{setInterval(()=>{if(_yaredIdle.builds>=1)yaredDeploy();},60000);}},
];
// Load bought state
try{const b=JSON.parse(localStorage.getItem('yrd_upgrades')||'[]');b.forEach(id=>{const u=_yaredUpgrades.find(u=>u.id===id);if(u&&!u.bought){u.bought=true;u.apply();}});}catch(e){}

function prestigeYared(){
  const loc=Math.floor(_yaredIdle.linesOfCode);
  if(loc<50000){showToast('Necesitas 50,000 lineas para prestige','#cc3344');return;}
  const prestige=parseInt(localStorage.getItem('yrd_prestige')||'0')+1;
  localStorage.setItem('yrd_prestige',prestige);
  // Reset but keep multiplier bonus
  const bonusMul=1+prestige*0.5;
  ['yrd_builds','yrd_loc','yrd_deploys','yrd_coffee','yrd_bugs','yrd_upgrades'].forEach(k=>localStorage.removeItem(k));
  _yaredIdle.linesOfCode=0;_yaredIdle.builds=0;_yaredIdle.deploysTotal=0;
  _yaredIdle.multiplier=bonusMul;_yaredIdle.locRate=1.2*bonusMul;
  _yaredUpgrades.forEach(u=>u.bought=false);
  AG['devbe']?.say(`⚡ Prestige ${prestige}! ?${bonusMul.toFixed(1)}`);
  showToast(`⚡ PRESTIGE ${prestige} · Multiplicador base: ?${bonusMul.toFixed(1)}`,'#c8a040');
  document.getElementById('yaredStatsOv')?.remove();
}

function buyUpgrade(id){
  const u=_yaredUpgrades.find(u=>u.id===id);if(!u||u.bought)return;
  if(_yaredIdle.linesOfCode<u.cost){showToast(`Necesitas ${u.cost.toLocaleString()} lineas · tienes ${Math.floor(_yaredIdle.linesOfCode).toLocaleString()}`,'#cc3344');return;}
  _yaredIdle.linesOfCode-=u.cost;u.bought=true;u.apply();
  const bought=_yaredUpgrades.filter(u=>u.bought).map(u=>u.id);
  localStorage.setItem('yrd_upgrades',JSON.stringify(bought));
  showToast(`✅ ${u.name} comprado!`,'#3a8ccc');
  document.getElementById('yaredStatsOv')?.remove();openYaredStats();
}

function openYaredStats(){
  const existing=document.getElementById('yaredStatsOv');if(existing)existing.remove();
  const loc=Math.floor(_yaredIdle.linesOfCode);
  const ov=document.createElement('div');ov.id='yaredStatsOv';
  ov.style.cssText='position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center';
  ov.innerHTML=`<div style="background:linear-gradient(180deg,var(--bg2),rgba(11,15,18,.95));border:1px solid #3a8ccc44;border-radius:18px;border-left:4px solid #3a8ccc;box-shadow:0 24px 60px rgba(0,0,0,.4);backdrop-filter:blur(10px);padding:22px;width:380px;display:flex;flex-direction:column;gap:10px" onclick="event.stopPropagation()">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="font-family:var(--mono);font-size:14px;font-weight:800;color:#3a8ccc;letter-spacing:.1em">⚡ YARED · FOUNDER STATS</div>
      <button onclick="document.getElementById('yaredStatsOv').remove()" style="background:none;border:none;color:var(--t3);font-size:16px;cursor:pointer">X</button>
    </div>
    <div style="font-family:var(--mono);font-size:15px;color:var(--t3);letter-spacing:.08em">Dev Teams · Cartagena CO 🇨🇴 · Fundado por Yared</div>
    <div style="display:flex;flex-direction:column;gap:5px">
      ${[
        ['💻 Lineas de codigo',loc.toLocaleString(),'#3a8ccc',Math.min(100,loc/1000*100)],
        ['🚀 Deploys totales',_yaredIdle.deploysTotal,'#0fa855',Math.min(100,_yaredIdle.deploysTotal*5)],
        ['☕ Cafes consumidos',_yaredIdle.coffeeConsumed,'#8b4513',Math.min(100,_yaredIdle.coffeeConsumed*10)],
        ['Bugs arreglados',_yaredIdle.bugsFixed,'#d97020',Math.min(100,_yaredIdle.bugsFixed*5)],
        ['⚡ Multiplicador',_yaredIdle.multiplier.toFixed(2)+'x','#c8a040',Math.min(100,(_yaredIdle.multiplier-1)/9*100)],
        ['Uptime',Math.floor(_yaredIdle.uptime/60)+'m','#9060cc',100],
      ].map(([l,v,c,pct])=>`
        <div style="padding:6px 9px;background:var(--bg3);border:1px solid var(--b1)">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-family:var(--mono);font-size:17px;color:var(--t2)">${l}</span>
            <span style="font-family:var(--mono);font-size:15px;font-weight:700;color:${c}">${v}</span>
          </div>
          <div style="height:3px;background:var(--b1);border-radius:2px">
            <div style="height:100%;width:${pct}%;background:${c};border-radius:2px;transition:width .5s"></div>
          </div>
        </div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:4px">
      <button onclick="yaredDrinkCoffee()" style="font-family:var(--mono);font-size:17px;font-weight:700;padding:8px;background:rgba(139,69,19,.2);border:1px solid #8b4513;color:#8b4513;cursor:pointer">☕ Tomar cafe<br><span style="font-size:14px;color:var(--t3)">+0.05x multiplicador</span></button>
      <button onclick="yaredDeploy()" style="font-family:var(--mono);font-size:17px;font-weight:700;padding:8px;background:rgba(15,168,85,.1);border:1px solid var(--acc);color:var(--acc);cursor:pointer">🚀 Deploy<br><span style="font-size:14px;color:var(--t3)">+0.2x · requiere 1 build</span></button>
      <button onclick="prestigeYared()" style="font-family:var(--mono);font-size:17px;font-weight:700;padding:8px;background:rgba(200,160,64,.1);border:1px solid #c8a040;color:#c8a040;cursor:pointer">⚡ Prestige<br><span style="font-size:14px;color:var(--t3)">Requiere 50,000 loc</span></button>
    </div>
    <div style="font-family:var(--mono);font-size:15px;color:var(--t3);text-align:center">+${_yaredIdle.locRate.toFixed(1)} loc/s · auto-save cada 30s</div>
    <button onclick="['yrd_builds','yrd_loc','yrd_deploys','yrd_coffee','yrd_bugs','yrd_uptime','yrd_upgrades'].forEach(k=>localStorage.removeItem(k));location.reload()" style="font-family:var(--mono);font-size:14px;padding:3px;background:none;border:1px solid var(--b1);color:var(--t3);cursor:pointer">Reset stats</button>
    <div style="margin-top:8px;border-top:1px solid var(--b1);padding-top:8px">
      <div style="font-family:var(--mono);font-size:17px;color:var(--t2);margin-bottom:6px;font-weight:700">🛒 UPGRADES</div>
      <div style="display:flex;flex-direction:column;gap:4px">
        ${_yaredUpgrades.map(u=>`
          <div style="display:flex;align-items:center;gap:8px;padding:5px 8px;background:${u.bought?'rgba(58,140,204,.1)':'var(--bg3)'};border:1px solid ${u.bought?'#3a8ccc44':'var(--b1)'}">
            <div style="flex:1"><div style="font-family:var(--mono);font-size:17px;color:${u.bought?'#3a8ccc':'var(--t1)'};">${u.bought?'✓ ':''} ${u.name}</div><div style="font-family:var(--mono);font-size:14px;color:var(--t3)">${u.desc}</div></div>
            ${u.bought?'<span style="font-family:var(--mono);font-size:15px;color:#3a8ccc">ACTIVO</span>':`<button onclick="buyUpgrade('${u.id}')" style="font-family:var(--mono);font-size:15px;padding:3px 8px;background:var(--bg);border:1px solid var(--acc);color:var(--acc);cursor:pointer">${u.cost.toLocaleString()} loc</button>`}
          </div>`).join('')}
      </div>
    </div>
  </div>`;
  ov.onclick=()=>ov.remove();document.body.appendChild(ov);
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
        <div style="font-family:var(--mono);font-size:17px;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.task}</div>
        <div style="font-family:var(--mono);font-size:14px;padding:1px 6px;border:1px solid ${_taskStatusColor(t.status)};color:${_taskStatusColor(t.status)};text-transform:uppercase">${t.status}</div>
      </div>
      <div style="font-family:var(--mono);font-size:14px;color:var(--t3);margin-top:2px">${t.date} - ${t.agents.join(', ')} - ${t.priority}</div>
    </div>
    <div style="display:none;padding:6px 10px;background:var(--bg);font-family:var(--mono);font-size:15px;color:var(--t2);line-height:1.7;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;max-height:220px;overflow-y:auto;overflow-x:hidden;border-bottom:1px solid var(--b1);scrollbar-width:thin;scrollbar-color:var(--b2) transparent">
      <div style="margin-bottom:6px">Owner: ${t.owner||t.agents[0]||'-'} · Estado: ${t.status} · Origen: ${t.origin||'manual'}</div>
      <div style="margin-bottom:8px">${t.results}</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        <button onclick="event.stopPropagation();setTaskHistoryStatus('${t.id}','queued')" style="font-family:var(--mono);font-size:14px;padding:2px 6px;background:var(--bg3);border:1px solid #5b9bd5;color:#5b9bd5;cursor:pointer">Queue</button>
        <button onclick="event.stopPropagation();setTaskHistoryStatus('${t.id}','blocked')" style="font-family:var(--mono);font-size:14px;padding:2px 6px;background:var(--bg3);border:1px solid #cc3344;color:#cc3344;cursor:pointer">Bloqueada</button>
        <button onclick="event.stopPropagation();setTaskHistoryStatus('${t.id}','done')" style="font-family:var(--mono);font-size:14px;padding:2px 6px;background:var(--bg3);border:1px solid #0fa855;color:#0fa855;cursor:pointer">Done</button>
        <button onclick="event.stopPropagation();retryTaskHistory('${t.id}')" style="font-family:var(--mono);font-size:14px;padding:2px 6px;background:var(--bg3);border:1px solid #c8a040;color:#c8a040;cursor:pointer">Retry</button>
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
  if(window._deliveryMesh){
    if(window._deliveryMesh.userData?.shadowGroup)scene.remove(window._deliveryMesh.userData.shadowGroup);
    scene.remove(window._deliveryMesh);
    window._deliveryMesh=null;
  }

  if(window._psychVisitor){
    _clearPsychologistVisitor();
  }
  window._psychPending=null;
  window._psychBusy=false;
  window._psychPhase='idle';

  window._deliveryInside=false;
  window._psychInside=false;
  _refreshDoorLock();
  try{setDoorOpen(false,{force:true});}catch(e){}

  window._deliveryTimer=30;


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
  if(window.followAg)return window.followAg;
  if(currentPanel==='consola'&&chatAgent&&chatAgent!=='all')return chatAgent;
  return '';
}

function _resolveConsoleContextMode(){
  const taskOpen=document.getElementById('taskOv')?.classList.contains('show');
  const viewerOpen=document.getElementById('fileViewerOv')?.classList.contains('show')||document.getElementById('toolPickerOv')?.classList.contains('show');
  const focusAgent=_getUiFocusAgentKey();
  if(taskOpen)return 'task';
  if(viewerOpen)return 'workspace';
  if((profileKey||window.followAg)&&currentPanel!=='status'&&currentPanel!=='dash')return 'focus-chat';
  if(currentPanel==='consola')return 'chat-default';
  return currentPanel||'tree';
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

function agentWriteBoard(agKey,text){
  if(!_boardMesh)return;
  const existing=localStorage.getItem('boardNotes')||'';
  const cfg=ACFG[agKey];
  const newLine=`[${cfg.name.split(' ')[0]}] ${text}`;
  const updated=existing+'\n'+newLine;
  localStorage.setItem('boardNotes',updated);
  try{document.getElementById('boardText').value=updated;}catch(e){}
  if(_boardMesh){
    const t=makeTex(512,320,ctx=>{
      ctx.fillStyle='#040c04';ctx.fillRect(0,0,512,320);
      ctx.fillStyle='#0fa855';ctx.font='bold 13px monospace';ctx.fillText('WHITEBOARD · Dev Teams',14,22);
      ctx.strokeStyle='#1a3a1a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,32);ctx.lineTo(512,32);ctx.stroke();
      ctx.fillStyle='#b0d0b0';ctx.font='11px monospace';
      updated.split('\n').slice(-18).forEach((l,i)=>ctx.fillText(l.substring(0,48),14,50+i*15));
    });
    _boardMesh.material.map=t;_boardMesh.material.needsUpdate=true;
  }
}

function saveBoard(){
  const txt=document.getElementById('boardText')?.value||'';
  localStorage.setItem('boardNotes',txt);
  document.getElementById('boardModal').style.display='none';
  showToast('Pizarron guardado ✓','#c8a040');
  // Update 3D board texture
  if(_boardMesh){
    const t=makeTex(512,320,ctx=>{
      ctx.fillStyle='#040c04';ctx.fillRect(0,0,512,320);
      ctx.fillStyle='#0fa855';ctx.font='bold 13px monospace';ctx.fillText('WHITEBOARD · Dev Teams',14,22);
      ctx.strokeStyle='#1a3a1a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,32);ctx.lineTo(512,32);ctx.stroke();
      ctx.fillStyle='#b0d0b0';ctx.font='11px monospace';
      txt.split('\n').slice(0,18).forEach((l,i)=>ctx.fillText(l.substring(0,48),14,50+i*15));
    });
    _boardMesh.material.map=t;_boardMesh.material.needsUpdate=true;
  }
}
let _boardMesh=null;
function openBoard(){
  if(AG['ceo'])AG['ceo'].moveTo(-25,-7);
  renderStickies();
  document.getElementById('boardModal').style.display='flex';
}


let _coffeeLight=null,_coffeeSteam=[];
let _codeParticles=[];
//  PART?CULAS DE ESTADO 
let _stateParticles=[];
/*  KEYBOARD  */
document.addEventListener('keydown',e=>{
  if(e.code==='Escape'){closeApi();closeTask();closeProfile();if(fpsMode)exitFPS();return;}
  const t=e.target.tagName;if(t==='INPUT'||t==='SELECT'||t==='TEXTAREA')return;
  if(e.code==='KeyR')resetSim();
  if(e.code==='KeyM')runMeeting();
  if(e.code==='KeyC')resetCam();
  if(e.code==='KeyN')toggleDayNight();
if(e.key==='?')document.getElementById('kbdOv').classList.toggle('show');
  if(e.code==='KeyF'){e.preventDefault();toggleFPS();}  // â† #6 FPS key
  if(e.code==='Space'){e.preventDefault();if(!document.getElementById('btnNext').disabled)nextStep();}
  if(e.code==='KeyA')toggleAuto();
});

/*  #12 NOTIFICACIONES PUSH  */
function reqNotifPerm(){if('Notification' in window&&Notification.permission==='default')Notification.requestPermission();}
// Render shortcuts grid dynamically
(function(){
  const grid=document.getElementById('kbdGrid');if(!grid)return;
  const _frag=document.createDocumentFragment();
  [['Space','Siguiente paso'],['R','Reset'],['M','Reunion'],['F','FPS'],['N','Noche/Dia'],['A','Auto play'],['C','Reset camara'],['?','Shortcuts'],['Esc','Salir']].forEach(([k,v])=>{
    const d=document.createElement('div');d.className='kbd-item';
    d.innerHTML=`<span class="kbd-key">${k}</span><span class="kbd-desc">${v}</span>`;
    _frag.appendChild(d);
  });
  grid.appendChild(_frag);
})();
function pushNotif(title,body,col='#0fa855'){
  if(!('Notification' in window)||Notification.permission!=='granted')return;
  try{const n=new Notification('Dev Teams · '+title,{body,icon:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26"><rect x="2" y="2" width="10" height="10" fill="'+col+'"/></svg>',badge:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26"><circle cx="13" cy="13" r="10" fill="'+col+'"/></svg>'});setTimeout(()=>n.close(),5000);}catch(e){}
}

/*  INIT  */
async function _boot(){
  const _ld=document.createElement('div');_ld.id='ldScr';_ld.style.cssText='position:fixed;inset:0;z-index:9999;background:#0d0f0e;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:var(--mono)';
  _ld.innerHTML='<div style="font-size:22px;font-weight:800;color:#0fa855">Dev Teams</div><div style="font-size:15px;color:#2a3830;letter-spacing:.14em">CARGANDO ESCENA...</div><div id="ldBar" style="width:200px;height:2px;background:#1e2422"><div id="ldFill" style="height:100%;background:#0fa855;width:0%;transition:width .3s"></div></div>';
  document.body.appendChild(_ld);
  const _lf=document.getElementById('ldFill');
  let _lp=0;const _li=setInterval(()=>{_lp=Math.min(90,_lp+Math.random()*12);if(_lf)_lf.style.width=_lp+'%';},200);
  buildNav();
  reqNotifPerm();
  await initThree();
  setTimeout(()=>{clearInterval(_li);if(_lf)_lf.style.width='100%';setTimeout(()=>{_ld.style.opacity='0';_ld.style.transition='opacity .4s';setTimeout(()=>_ld.remove(),400);},300);},800);
  // #7: boot Web Worker after NAV is built
  initPathWorker();
  updateClock();
  setTimeout(fetchWeather,2000); // fetch after scene loads
  setTimeout(renderDashboard, 1200);
}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',_boot);}else{_boot();}

// Yared founder badge  permanent subtle glow
setTimeout(()=>{
  if(!AG['devbe'])return;
  const ag=AG['devbe'];
  // Persistent gold ring under Yared
  const founderRing=new THREE.Mesh(
    new THREE.TorusGeometry(.9,.04,6,32),
    new THREE.MeshBasicMaterial({color:0x3a8ccc,transparent:true,opacity:.5})
  );
  founderRing.rotation.x=Math.PI/2;founderRing.position.y=.04;
  ag.group.add(founderRing);
  // Animate ring
  let _rt=0;
  const _ringAnim=setInterval(()=>{
    _rt+=0.02;founderRing.material.opacity=.3+Math.sin(_rt)*0.2;
    founderRing.rotation.z+=0.01;
  },16);
  window._founderRingAnim=_ringAnim;
  // Floating "FOUNDER" tag
  const tag=document.createElement('div');tag.id='founderTag';
  tag.style.cssText='position:absolute;font-family:var(--mono);font-size:14px;font-weight:800;letter-spacing:.1em;color:#3a8ccc;background:rgba(0,0,8,.85);border:1px solid #3a8ccc44;padding:1px 5px;pointer-events:none;text-transform:uppercase;white-space:nowrap;opacity:.7';
  tag.textContent='⚡ FOUNDER';
  document.getElementById('speechLayer').appendChild(tag);
  setInterval(()=>{
    if(!ag.group||!camera)return;
    const wrap=document.getElementById('canvasWrap');if(!wrap)return;
    if(document.body.classList.contains('director-mode')&&window.followAg!=='devbe'&&activeAg!=='devbe'&&profileKey!=='devbe'){
      tag.style.display='none';
      return;
    }
    const {W,H}=getViewportSize();
    const wp=new THREE.Vector3(ag.group.position.x,ag.group.position.y+8,ag.group.position.z);
    wp.project(camera);
    if(wp.z<1){tag.style.display='block';tag.style.left=((wp.x*.5+.5)*W)+'px';tag.style.top=((-.5*wp.y+.5)*H - 8)+'px';tag.style.transform='translateX(-50%) translateY(-100%)';}
    else tag.style.display='none';
  },50);
},1500);

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
// Restaurar tema guardado
if(localStorage.getItem('theme')==='light'){
  document.body.classList.add('light-mode');
  const btn=document.getElementById('themeBtnHdr');
  if(btn) btn.innerHTML = '🌑 Oscuro';
} else {
  const btn=document.getElementById('themeBtnHdr');
  if(btn) btn.innerHTML = '☀️ Claro';
}
setTimeout(()=>{
  activeAg='ceo';
    if(isMobileUI())syncMobileChatBtn();
  document.getElementById('tnode-ceo')?.classList.add('active');
  renderStages();
  document.getElementById('btnNext').disabled=false;
  setUIMode(_uiMode);
  renderEventFeed();
  refreshOpsBar();
  applyCleanMode();
  applyDirectorMode();
  if(!_eventLog.length){
    logEvent('launch','Workspace listo','Dev Teams cargo y quedo listo para demo','#0fa855','ceo');
  }
},300);
// onboarding automatico desactivado

// Cargar memoria compartida al iniciar
setTimeout(() => {
  loadSharedMemory();
}, 800);

function clearSharedMemory() {
  if (!confirm('¿Estás seguro de borrar toda la memoria compartida del equipo?')) return;
  
  SHARED_MEMORY = {
    decisions: [],
    filesAnalyzed: [],
    openQuestions: [],
    roadmap: [],
    lastUpdate: Date.now()
  };
  saveSharedMemory();
  renderDashboard();
  showToast('Memoria compartida borrada', '#cc3344');
}

// Mejora visual de "pensando"
function enhanceThinkingVisual(agentKey) {
  const ag = AG[agentKey];
  if (!ag) return;
  
  // Partícula extra cuando está pensando
  if (ag.state === 'thinking') {
    spawnStateParticle(agentKey);
    // Efecto de pulso en el label
    const label = document.querySelector(`.agent-label[data-key="${agentKey}"]`);
    if (label) label.classList.add('thinking');
  }
}

// Llama a esta función dentro de _prepareAgentForChat, justo después de ag.setState('thinking')

function clearCurrentChat() {
  if (!confirm('¿Limpiar todo el historial de este chat?')) return;
  
  const key = chatAgent === 'all' ? 'ceo' : chatAgent;
  if (chatH[key]) chatH[key] = [];
  document.getElementById('cmsgs').innerHTML = '';
  
  showToast('Chat limpiado', '#cc3344', key);
}


let recognition = null;
let isListening = false;

function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition ||
      window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showToast("Tu navegador no soporta reconocimiento de voz", "var(--red)");
        return null;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'es-ES';
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => {
        isListening = true;
        document.getElementById('micBtn').classList.add('active');
        showToast("Escuchando...", "var(--acc)");
    };

    rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        document.getElementById('cinp').value = text;
        // Opcional: enviar automáticamente al terminar de hablar
        // sendChat();
    };

    rec.onerror = (e) => {
        console.error("Speech error", e);
        stopMic();
    };

    rec.onend = () => {
        stopMic();
    };

    return rec;
}

function toggleMic() {
    if (isListening) {
        stopMic();
    } else {
        if (!recognition) recognition = initSpeechRecognition();
        if (recognition) recognition.start();
    }
}

function stopMic() {
    isListening = false;
    if (recognition) recognition.stop();
    document.getElementById('micBtn').classList.remove('active');
}

setTimeout(()=>{
  updateImprovementPanel();
  setInterval(updateImprovementPanel,30000);
},3500);


// Expose to window for global compatibility
window._boot = _boot;
window._buildChart = _buildChart;
window._buildCommandPaletteEntries = _buildCommandPaletteEntries;
window._countAllChatMessages = _countAllChatMessages;
window._getUiFocusAgentKey = _getUiFocusAgentKey;
window._inferTaskPriority = _inferTaskPriority;
window._opsTimelineEntries = _opsTimelineEntries;
window._paletteAction = _paletteAction;
window._refreshMemoryBarUI = _refreshMemoryBarUI;
window._resetAllAgentXP = _resetAllAgentXP;
window._resolveConsoleContextMode = _resolveConsoleContextMode;
window._saveConsoleUiState = _saveConsoleUiState;
window._setConsolePreset = _setConsolePreset;
window._taskStatusColor = _taskStatusColor;
window._toggleCompactPanel = _toggleCompactPanel;
window._xpLevelProgress = _xpLevelProgress;
window.addAgendaItem = addAgendaItem;
window.addSticky = addSticky;
window.addTaskToHistory = addTaskToHistory;
window.addXP = addXP;
window.agentWriteBoard = agentWriteBoard;
window.applyCleanMode = applyCleanMode;
window.applyConsoleSections = applyConsoleSections;
window.applyDirectorMode = applyDirectorMode;
window.applyOpsCompact = applyOpsCompact;
window.buyUpgrade = buyUpgrade;
window.clearAgentMemory = clearAgentMemory;
window.clearAllAgentMemory = clearAllAgentMemory;
window.clearCurrentChat = clearCurrentChat;
window.clearSharedMemory = clearSharedMemory;
window.clearStickyListeners = clearStickyListeners;
window.closeCommandPalette = closeCommandPalette;
window.closeHeaderMenu = closeHeaderMenu;
window.closeProfile = closeProfile;
window.closeTask = closeTask;
window.dispatchTask = dispatchTask;
window.drawMMStatic = drawMMStatic;
window.enhanceThinkingVisual = enhanceThinkingVisual;
window.executeTask = executeTask;
window.filterCommandPalette = filterCommandPalette;
window.initConsole = initConsole;
window.initSpeechRecognition = initSpeechRecognition;
window.isMobileUI = isMobileUI;
window.logMetric = logMetric;
window.openAchievements = openAchievements;
window.openBoard = openBoard;
window.openCommandPalette = openCommandPalette;
window.openMeetHistory = openMeetHistory;
window.openProfile = openProfile;
window.openSprintCalendar = openSprintCalendar;
window.openTableMenu = openTableMenu;
window.openTask = openTask;
window.openXPPanel = openXPPanel;
window.openYaredStats = openYaredStats;
window.prestigeYared = prestigeYared;
window.profileChat = profileChat;
window.profileFPS = profileFPS;
window.profileFlow = profileFlow;
window.profileFollow = profileFollow;
window.pushNotif = pushNotif;
window.refreshOpsBar = refreshOpsBar;
window.refreshSceneCinemaHud = refreshSceneCinemaHud;
window.renderAgenda = renderAgenda;
window.renderCommandPaletteList = renderCommandPaletteList;
window.renderDashboard = renderDashboard;
window.renderMetricsChart = renderMetricsChart;
window.renderStickies = renderStickies;
window.renderTaskHistory = renderTaskHistory;
window.renderTaskHistoryLegacy = renderTaskHistoryLegacy;
window.reqNotifPerm = reqNotifPerm;
window.resetSim = resetSim;
window.retryTaskHistory = retryTaskHistory;
window.runAutoLoop = runAutoLoop;
window.runCommandPaletteAction = runCommandPaletteAction;
window.saveBoard = saveBoard;
window.saveChatH = saveChatH;
window.saveMeetToHistory = saveMeetToHistory;
window.saveStickies = saveStickies;
window.saveTaskHistory = saveTaskHistory;
window.setSpd = setSpd;
window.setTaskHistoryStatus = setTaskHistoryStatus;
window.startAuto = startAuto;
window.stopAuto = stopAuto;
window.stopMic = stopMic;
window.switchPanel = switchPanel;
window.switchStatusTab = switchStatusTab;
window.syncMobileChatBtn = syncMobileChatBtn;
window.syncPanelContext = syncPanelContext;
window.toggleAuto = toggleAuto;
window.toggleCleanMode = toggleCleanMode;
window.toggleConsoleSection = toggleConsoleSection;
window.toggleDirectorMode = toggleDirectorMode;
window.toggleHeaderMenu = toggleHeaderMenu;
window.toggleMic = toggleMic;
window.toggleMobileChat = toggleMobileChat;
window.toggleOpsCompact = toggleOpsCompact;
window.unlockAchievement = unlockAchievement;
window.updNodeStatus = updNodeStatus;
window.updateActSpark = updateActSpark;
window.updateConsoleContextHint = updateConsoleContextHint;
window.updateLevelBadge = updateLevelBadge;
window.updateMMDyn = updateMMDyn;
window.updateOverlays = updateOverlays;
window.updateProfileData = updateProfileData;
window.updateStatusPanel = updateStatusPanel;
window.updateVIP = updateVIP;
window.updateXPFromState = updateXPFromState;
window.updateYaredIdle = updateYaredIdle;
window.yaredBugFixed = yaredBugFixed;
window.yaredDeploy = yaredDeploy;
window.yaredDrinkCoffee = yaredDrinkCoffee;
window.LEVEL_TITLES = LEVEL_TITLES;
window.XP_PER_LEVEL = XP_PER_LEVEL;
window._ACHIEVEMENTS = _ACHIEVEMENTS;
window._agentXP = _agentXP;
window._boardMesh = _boardMesh;
window._chatCount = _chatCount;
window._cleanMode = _cleanMode;
window._codeParticles = _codeParticles;
window._coffeeLight = _coffeeLight;
window._commandPaletteEntries = _commandPaletteEntries;
window._consoleContextMode = _consoleContextMode;
window._consoleUiState = _consoleUiState;
window._dashKPIs = _dashKPIs;
window._directorMode = _directorMode;
window._meetHistory = _meetHistory;
window._metricsChart = _metricsChart;
window._metricsLog = _metricsLog;
window._opsCompact = _opsCompact;
window._panelCompact = _panelCompact;
window._stateParticles = _stateParticles;
window._stickies = _stickies;
window._stickyCleanup = _stickyCleanup;
window._stickyColors = _stickyColors;
window._taskHistory = _taskHistory;
window._vipKey = _vipKey;
window._yaredIdle = _yaredIdle;
window._yaredUpgrades = _yaredUpgrades;
window.bm = bm;
window.currentPanel = currentPanel;
window.isListening = isListening;
window.mmDCtx = mmDCtx;
window.recognition = recognition;
window.rm = rm;
