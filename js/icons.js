/* Monochrome UI icon layer: replaces decorative emoji without adding a font dependency. */
(function(){
  const paths={
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/>',
    moon:'<path d="M20 15.3A8 8 0 0 1 8.7 4 8 8 0 1 0 20 15.3Z"/>',
    gear:'<path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/><circle cx="12" cy="12" r="4"/>',
    chart:'<path d="M4 19V5M4 19h16M8 16v-5M12 16V7M16 16v-9"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
    box:'<path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/>',
    trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    book:'<path d="M4 5a3 3 0 0 1 3-2h13v17H7a3 3 0 0 0-3 3V5Z"/><path d="M4 20a3 3 0 0 1 3-3h13"/>',
    rocket:'<path d="M14 5c2-2 5-2 5-2s0 3-2 5l-4 4-3-3 4-4Z"/><path d="m10 9-4 1-3 3 6 1M14 13l-1 6-3 3-1-6M8 16l-3 3M17 8l2 2"/>',
    music:'<path d="M9 18V5l10-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3ZM19 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z"/>',
    mic:'<rect x="8" y="3" width="8" height="12" rx="4"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/>',
    camera:'<path d="M4 7h4l2-2h4l2 2h4v12H4V7Z"/><circle cx="12" cy="13" r="3"/>',
    chat:'<path d="M20 11a7 7 0 0 1-7 7H8l-5 3 1-5a7 7 0 1 1 16-5Z"/>',
    users:'<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 6"/>',
    target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    warning:'<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5M12 17v1"/>',
    lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    leaf:'<path d="M20 4C10 4 4 9 4 16c0 3 2 4 4 4 7 0 12-6 12-16Z"/><path d="M4 20c2-5 6-8 11-10"/>',
    coffee:'<path d="M5 8h12v7a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V8ZM17 10h2a3 3 0 0 1 0 6h-2M8 4c0 1 1 1 1 2M12 4c0 1 1 1 1 2"/>',
    bolt:'<path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    cursor:'<path d="m5 3 5 17 3-7 7-3L5 3Z"/>',
    terminal:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v1"/>',
    sparkle:'<path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2ZM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/>'
  };
  const entries=[
    ['☀️','sun','Tema claro'],['🌑','moon','Tema oscuro'],['🌙','moon','Modo noche'],['🌅','sun','Amanecer'],['🌆','moon','Anochecer'],['☀','sun','Día'],['⛅','sun','Parcialmente nublado'],
    ['⚙','gear','Configuración'],['⚙️','gear','Configuración'],['📊','chart','Métricas'],['📈','chart','Dashboard'],['📋','book','Lista'],['📚','book','Biblioteca'],['📅','calendar','Calendario'],['📦','box','Entrega'],['🗑','trash','Eliminar'],['🗑️','trash','Eliminar'],['✕','close','Cerrar'],['×','close','Cerrar'],
    ['🎧','mic','Audio'],['🎵','music','Música'],['💬','chat','Chat'],['📡','users','Broadcast'],['👥','users','Equipo'],['👑','target','MVP'],['🎯','target','Objetivo'],['⚡','bolt','Acción'],['🚀','rocket','Deploy'],['🚪','lock','Acceso'],['🔒','lock','Bloqueado'],['⚠️','warning','Advertencia'],['⚠','warning','Advertencia'],['🌿','leaf','Plantas'],['💀','warning','Alerta'],['💧','leaf','Agua'],['☕','coffee','Café'],['💻','terminal','Terminal'],['🖱','cursor','Cámara'],['🖱️','cursor','Cámara'],['💡','sparkle','Idea'],['✨','sparkle','Mejora'],['🆘','warning','Ayuda'],['💭','chat','Memoria'],['🤝','users','Colaboración'],['🪑','users','Reunión'],['📖','book','Lectura'],['🎄','sparkle','Evento'],['🎃','sparkle','Evento'],['🥵','warning','Calor'],['🌧','warning','Lluvia'],['⛈','warning','Tormenta'],['💨','info','Viento'],['🧹','trash','Limpieza'],['🇨🇴','info','Colombia'],['🎉','sparkle','Celebración'],['🛒','box','Mejoras'],['🛑','warning','Detener'],['⏹','close','Detener'],['🔍','target','Buscar'],['❗','warning','Alerta']
  ];
  const map=new Map(entries.map(([emoji,kind,label])=>[emoji,{kind,label}]));
  const keys=[...map.keys()].sort((a,b)=>b.length-a.length).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  const rx=new RegExp(keys.join('|'),'g');
  function svg(key){return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[key]||paths.info}</svg>`;}
  function scan(root){
    if(!root||!document.body)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){
      const p=n.parentElement;
      if(!p||p.closest('script,style,template,.ui-icon,[contenteditable="true"]'))return NodeFilter.FILTER_REJECT;
      rx.lastIndex=0;
      return rx.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    const nodes=[];let n;while((n=walker.nextNode()))nodes.push(n);
    nodes.forEach(node=>{
      const frag=document.createDocumentFragment();let last=0;rx.lastIndex=0;let m;
      while((m=rx.exec(node.nodeValue))){
        if(m.index>last)frag.appendChild(document.createTextNode(node.nodeValue.slice(last,m.index)));
        const key=m[0];
        const kind=map.get(key)?.kind||'info';
        const label=map.get(key)?.label||'Icon';
        const span=document.createElement('span');span.className='ui-icon';span.dataset.icon=kind;span.title=label;span.setAttribute('aria-label',label);span.innerHTML=svg(kind);frag.appendChild(span);last=m.index+key.length;
      }
      if(last<node.nodeValue.length)frag.appendChild(document.createTextNode(node.nodeValue.slice(last)));
      node.replaceWith(frag);
    });
  }
  window.uiIcon=svg;
  window.addEventListener('DOMContentLoaded',()=>{
    scan(document.body);
    new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1||n.nodeType===3)scan(n);}))).observe(document.body,{childList:true,subtree:true});
  });
})();
