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

function _normalizeWorkspacePath(p){
  return String(p||'').trim().replace(/\\/g,'/').replace(/^\.\//,'').replace(/^\/+/,'');
}

function _isTextFile(name){
  return /\.(html|css|js|mjs|cjs|json|md|txt|csv|yml|yaml|xml|svg|ts|tsx|jsx)$/i.test(name);
}

function _isPdfFile(name){
  return /\.pdf$/i.test(name);
}

function _isExcelFile(name){
  return /\.(xlsx|xls)$/i.test(name);
}

function _isWordFile(name){
  return /\.(docx|doc)$/i.test(name);
}

function _workspaceToolAgentKey(){
  return chatAgent==='all'?'pm':(chatAgent||'pm');
}

function _workspaceDisplayName(pathLike){
  const path=_normalizeWorkspacePath(pathLike);
  if(!path)return '';
  const parts=path.split('/');
  return parts[parts.length-1]||path;
}

function _workspaceQuickQueryValue(){
  const quick=document.getElementById('toolMiniQuery')?.value?.trim()||'';
  const chat=document.getElementById('cinp')?.value?.trim()||'';
  return quick||chat;
}

function _setWorkspaceQuickQuery(value=''){
  const el=document.getElementById('toolMiniQuery');
  if(el)el.value=value;
}

function _refreshWorkspaceQuickUI(){
  const meta=document.getElementById('toolMiniMeta');
  if(!meta)return;
  if(!_workspaceDirHandle){
    meta.textContent='Sin carpeta conectada';
    return;
  }
  const bits=[_workspaceDirHandle.name||'workspace'];
  if(_workspaceIndex.length)bits.push(`${_workspaceIndex.length} archivos`);
  if(_workspaceLastFilePath)bits.push(`ultimo: ${_workspaceDisplayName(_workspaceLastFilePath)}`);
  meta.textContent=bits.join(' · ');
}

function _rememberWorkspaceFile(pathLike){
  _workspaceLastFilePath=_normalizeWorkspacePath(pathLike);
  _rememberSharedProjectFile(_workspaceLastFilePath,'archivo abierto');
  _refreshWorkspaceQuickUI();
}

function _refreshWorkspaceQuickUI(){
  const meta=document.getElementById('toolMiniMeta');
  if(!meta)return;
  if(!_workspaceDirHandle){
    meta.textContent='Sin carpeta conectada';
    updateConsoleContextHint();
    return;
  }
  const bits=[_workspaceDirHandle.name||'workspace'];
  if(_workspaceIndex.length)bits.push(`${_workspaceIndex.length} archivos`);
  if(_workspaceLastFilePath)bits.push(`ultimo: ${_workspaceDisplayName(_workspaceLastFilePath)}`);
  meta.textContent=bits.join(' · ');
  updateConsoleContextHint();
}

function _refreshWorkspaceQuickUI(){
  const meta=document.getElementById('toolMiniMeta');
  if(!meta)return;
  if(!_workspaceDirHandle){
    meta.textContent='Sin carpeta conectada';
    updateConsoleContextHint();
    refreshSceneCinemaHud();
    refreshOpsBar();
    return;
  }
  const bits=[_workspaceDirHandle.name||'workspace'];
  if(_workspaceIndex.length)bits.push(`${_workspaceIndex.length} archivos`);
  if(_workspaceLastFilePath)bits.push(`ultimo: ${_workspaceDisplayName(_workspaceLastFilePath)}`);
  meta.textContent=bits.join(' · ');
  updateConsoleContextHint();
  refreshSceneCinemaHud();
  refreshOpsBar();
}

function _workspaceToolReply(agentKey,userText,msg){
  const who=ACFG[agentKey]?.name||'Agente';
  const col=ACFG[agentKey]?.col||'var(--acc)';
  appendMsg('user','Tu',userText);
  appendMsg('agent',who,msg,col);
  if(!chatH[agentKey])chatH[agentKey]=[];
  chatH[agentKey].push({role:'user',content:userText},{role:'assistant',content:msg});
  saveChatH(agentKey);
  _refreshWorkspaceQuickUI();
  return true;
}

function _workspaceKindLabel(fileData){
  return {
    pdf:'PDF',
    excel:'Excel',
    word:'Word',
    text:'Texto'
  }[fileData?.kind]||'Archivo';
}

function _workspaceViewerMeta(fileData){
  const bits=[fileData.path,_workspaceKindLabel(fileData)];
  if(fileData.kind==='pdf'&&fileData.pageCount)bits.push(`${fileData.pageCount} paginas`);
  if(fileData.kind==='excel'&&fileData.sheetCount)bits.push(`${fileData.sheetCount} hojas`);
  if(fileData.truncated)bits.push('vista parcial');
  return bits.join(' · ');
}

function closeWorkspaceViewer(ev){
  if(ev===true){
    document.getElementById('fileViewerOv')?.classList.remove('show');
    syncPanelContext();
    return;
  }
  if(!ev||ev.target===ev.currentTarget){
    document.getElementById('fileViewerOv')?.classList.remove('show');
    syncPanelContext();
  }
}

function openWorkspaceViewer(fileData,agentKey){
  _workspaceViewerState={fileData,agentKey};
  document.getElementById('fileViewerTitle').textContent=fileData.path;
  document.getElementById('fileViewerMeta').textContent=_workspaceViewerMeta(fileData);
  document.getElementById('fileViewerHint').textContent=fileData.kind==='excel'
    ?'Vista resumida por hojas y filas. Usa Analizar para pedir una revision al agente actual.'
    :fileData.kind==='pdf'
      ?'Vista extraida del PDF. Si el archivo es un escaneo, el texto puede ser parcial.'
      :fileData.kind==='word'
        ?'Vista extraida del documento Word. Usa Analizar si quieres resumen o riesgos.'
        :'Vista del archivo actual. Usa Analizar si quieres revision por rol.';
  document.getElementById('fileViewerContent').textContent=fileData.text||'[sin contenido]';
  document.getElementById('fileViewerOv')?.classList.add('show');
  if(currentPanel!=='consola')switchPanel('consola');
  syncPanelContext();
}

async function workspaceViewerAction(kind){
  if(!_workspaceViewerState||!_workspaceViewerState.fileData)return;
  const {fileData,agentKey}= _workspaceViewerState;

  if(kind==='copy'){
    try{
      await navigator.clipboard.writeText(fileData.text||'');
      showToast('Contenido copiado al portapapeles','#0fa855',agentKey);
    }catch(e){
      showToast('No pude copiar el contenido','#cc3344',agentKey);
    }
    return;
  }

  if(kind==='analyze'){
    await _handleBrowserToolCommand(`/analizar ${fileData.path}`,agentKey||_workspaceToolAgentKey(),`Viewer > Analizar ${fileData.path}`);
  }
}

function _workspaceInteractiveSummary(userText,title,summary){
  return `${title}\n${summary||''}`.trim()||userText;
}

function _appendWorkspaceInteractiveList(agentKey,userText,title,summary,items=[]){
  const who=ACFG[agentKey]?.name||'Agente';
  const col=ACFG[agentKey]?.col||'var(--acc)';
  appendMsg('user','Tu',userText);
  const body=appendMsg('agent',who,_workspaceInteractiveSummary(userText,title,summary),col);
  body.innerHTML='';

  const card=document.createElement('div');
  card.className='tool-card';

  const head=document.createElement('div');
  head.className='tool-card-head';
  head.innerHTML=`<div><div class="tool-card-title">${escapeHtml(title)}</div><div class="tool-card-sub">${safeTextToHtml(summary||'')}</div></div>`;

  const list=document.createElement('div');
  list.className='tool-card-list';

  items.forEach(item=>{
    const row=document.createElement('div');
    row.className='tool-card-row';

    const main=document.createElement('div');
    main.className='tool-card-main';

    const path=document.createElement('div');
    path.className='tool-card-path';
    path.textContent=item.path;

    const meta=document.createElement('div');
    meta.className='tool-card-meta';
    meta.textContent=item.meta||'';

    main.appendChild(path);
    if(item.meta)main.appendChild(meta);

    const actions=document.createElement('div');
    actions.className='tool-card-actions';

    const openBtn=document.createElement('button');
    openBtn.type='button';
    openBtn.className='tool-card-btn acc';
    openBtn.textContent='Abrir';
    openBtn.onclick=()=>openWorkspacePath(item.path,agentKey,`Tools > Abrir ${item.path}`);

    const analyzeBtn=document.createElement('button');
    analyzeBtn.type='button';
    analyzeBtn.className='tool-card-btn';
    analyzeBtn.textContent='Analizar';
    analyzeBtn.onclick=()=>_handleBrowserToolCommand(`/analizar ${item.path}`,agentKey,`Tools > Analizar ${item.path}`);

    actions.appendChild(openBtn);
    actions.appendChild(analyzeBtn);

    row.appendChild(main);
    row.appendChild(actions);
    list.appendChild(row);
  });

  card.appendChild(head);
  card.appendChild(list);
  body.appendChild(card);

  if(!chatH[agentKey])chatH[agentKey]=[];
  chatH[agentKey].push({role:'user',content:userText},{role:'assistant',content:_workspaceInteractiveSummary(userText,title,summary)});
  saveChatH(agentKey);
  return true;
}

async function openWorkspacePath(pathLike,agentKey,userLabel=''){
  try{
    const fileData=await _readWorkspaceText(pathLike,60000);
    openWorkspaceViewer(fileData,agentKey);
    const msg=`Abri ${fileData.path} en el visor. Tipo: ${_workspaceKindLabel(fileData)}.${fileData.truncated?' Se mostro una vista parcial.':''}`;
    return _workspaceToolReply(agentKey,userLabel||`Tools > Abrir ${pathLike}`,msg);
  }catch(e){
    return _workspaceToolReply(agentKey,userLabel||`Tools > Abrir ${pathLike}`,`No pude abrir el archivo: ${e?.message||'error'}`);
  }
}

async function _ensurePdfJs(){
  if(!window.pdfjsLib)throw new Error('No pude cargar el lector de PDF');
  if(!_workspacePdfReady){
    pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    _workspacePdfReady=true;
  }
  return pdfjsLib;
}

function _ensureOfficeReaders(){
  if(!window.XLSX)throw new Error('No pude cargar el lector de Excel');
  if(!window.mammoth)throw new Error('No pude cargar el lector de Word');
  _workspaceOfficeReady=true;
  return _workspaceOfficeReady;
}

async function _readWorkspacePdf(file,maxChars=60000,maxPages=12){
  const lib=await _ensurePdfJs();
  const data=await file.arrayBuffer();
  const pdf=await lib.getDocument({data}).promise;
  const pages=[];
  let totalLen=0;
  const pageLimit=Math.min(pdf.numPages,maxPages);

  for(let i=1;i<=pageLimit;i++){
    const page=await pdf.getPage(i);
    const content=await page.getTextContent();
    const text=content.items
      .map(item=>String(item?.str||'').trim())
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g,' ')
      .trim();
    if(!text)continue;
    const chunk=`--- Pagina ${i} ---\n${text}`;
    pages.push(chunk);
    totalLen+=chunk.length+2;
    if(totalLen>=maxChars)break;
  }

  const joined=pages.join('\n\n').trim()||'[PDF sin texto extraible. Puede ser un escaneo o una imagen.]';
  return {
    text:joined.length>maxChars?joined.slice(0,maxChars):joined,
    fullLength:joined.length,
    truncated:joined.length>maxChars||pdf.numPages>pageLimit,
    pageCount:pdf.numPages,
    kind:'pdf'
  };
}

async function _readWorkspaceExcel(file,maxChars=60000,maxSheets=6,maxRows=30){
  _ensureOfficeReaders();
  const data=await file.arrayBuffer();
  const wb=XLSX.read(data,{type:'array'});
  const sheetNames=wb.SheetNames.slice(0,maxSheets);
  const blocks=[];
  let totalLen=0;

  for(const name of sheetNames){
    const ws=wb.Sheets[name];
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,blankrows:false,defval:''}).slice(0,maxRows);
    const normalized=rows.map(row=>row.map(cell=>String(cell??'').trim()).join(' | ').trim()).filter(Boolean);
    const chunk=`--- Hoja ${name} ---\n${normalized.join('\n')||'[sin filas visibles]'}`;
    blocks.push(chunk);
    totalLen+=chunk.length+2;
    if(totalLen>=maxChars)break;
  }

  const joined=blocks.join('\n\n').trim()||'[Excel sin datos legibles.]';
  return {
    text:joined.length>maxChars?joined.slice(0,maxChars):joined,
    fullLength:joined.length,
    truncated:joined.length>maxChars||wb.SheetNames.length>sheetNames.length,
    kind:'excel',
    sheetNames:wb.SheetNames,
    sheetCount:wb.SheetNames.length
  };
}

async function _readWorkspaceWord(file,maxChars=60000){
  _ensureOfficeReaders();
  if(/\.doc$/i.test(file.name))throw new Error('Los archivos .doc antiguos no se pueden leer bien en navegador. Usa .docx o conviertelo primero.');
  const data=await file.arrayBuffer();
  const res=await mammoth.extractRawText({arrayBuffer:data});
  const text=String(res?.value||'').replace(/\n{3,}/g,'\n\n').trim()||'[Documento Word sin texto legible.]';
  return {
    text:text.length>maxChars?text.slice(0,maxChars):text,
    fullLength:text.length,
    truncated:text.length>maxChars,
    kind:'word'
  };
}

async function _walkWorkspace(dirHandle,prefix='',out=[],limit=500){
  for await (const entry of dirHandle.values()){
    const rel=prefix?`${prefix}/${entry.name}`:entry.name;

    if(entry.kind==='file'){
      out.push({path:rel,name:entry.name,handle:entry});
      if(out.length>=limit)break;
      continue;
    }

    if(/^(node_modules|\.git|dist|build|coverage|\.next|out)$/i.test(entry.name))continue;
    await _walkWorkspace(entry,rel,out,limit);
    if(out.length>=limit)break;
  }
  return out;
}

async function _indexWorkspace(force=false){
  if(!_workspaceDirHandle)return [];
  if(!force&&_workspaceIndex.length)return _workspaceIndex;
  _workspaceIndex=await _walkWorkspace(_workspaceDirHandle,'',[],500);
  _workspaceIndexedAt=Date.now();
  _refreshWorkspaceQuickUI();
  return _workspaceIndex;
}

function _formatWorkspaceList(files,maxItems=120){
  const slice=files.slice(0,maxItems).map(f=>`- ${f.path}`);
  const extra=files.length>maxItems?`\n... y ${files.length-maxItems} mas.`:'';
  return `Archivos disponibles (${files.length}):\n${slice.join('\n')}${extra}`;
}


function _findWorkspaceFile(pathLike){
  const q=_normalizeWorkspacePath(pathLike).toLowerCase();
  if(!q)return null;

  const exact=_workspaceIndex.find(f=>f.path.toLowerCase()===q);
  if(exact)return exact;

  const tail=_workspaceIndex.find(f=>f.path.toLowerCase().endsWith('/'+q)||f.name.toLowerCase()===q||f.path.toLowerCase().endsWith(q));
  return tail||null;
}

async function _pickWorkspaceFolder(){
  if(!window.showDirectoryPicker)throw new Error('Tu navegador no soporta File System Access API');
  _workspaceDirHandle=await window.showDirectoryPicker({mode:'readwrite'});
  _workspaceLastFilePath='';
  _setSharedProjectMemory({activeFile:'',lastWorkspaceAction:'carpeta conectada'});
  const files=await _indexWorkspace(true);
  _refreshWorkspaceQuickUI();
  return `Carpeta "${_workspaceDirHandle.name}" conectada con ${files.length} archivos indexados.`;
}

async function _readWorkspaceText(pathLike,maxChars=60000){
  if(!_workspaceDirHandle)throw new Error('Primero conecta una carpeta con /carpeta');
  await _indexWorkspace();

  const fileEntry=_findWorkspaceFile(pathLike);
  if(!fileEntry)throw new Error(`No encontre el archivo: ${pathLike}`);

  const file=await fileEntry.handle.getFile();
  if(_isPdfFile(fileEntry.name)){
    const pdfData=await _readWorkspacePdf(file,maxChars);
    _rememberWorkspaceFile(fileEntry.path);
    return {
      path:fileEntry.path,
      text:pdfData.text,
      fullLength:pdfData.fullLength,
      truncated:pdfData.truncated,
      pageCount:pdfData.pageCount,
      kind:'pdf'
    };
  }

  if(_isExcelFile(fileEntry.name)){
    const excelData=await _readWorkspaceExcel(file,maxChars);
    _rememberWorkspaceFile(fileEntry.path);
    return {
      path:fileEntry.path,
      text:excelData.text,
      fullLength:excelData.fullLength,
      truncated:excelData.truncated,
      kind:'excel',
      sheetNames:excelData.sheetNames,
      sheetCount:excelData.sheetCount
    };
  }

  if(_isWordFile(fileEntry.name)){
    const wordData=await _readWorkspaceWord(file,maxChars);
    _rememberWorkspaceFile(fileEntry.path);
    return {
      path:fileEntry.path,
      text:wordData.text,
      fullLength:wordData.fullLength,
      truncated:wordData.truncated,
      kind:'word'
    };
  }

  if(!_isTextFile(fileEntry.name)){
    throw new Error('Ese archivo no se puede abrir en el visor. Prueba con TXT, MD, JSON, JS, PDF, XLSX, XLS o DOCX.');
  }

  const text=await file.text();
  _rememberWorkspaceFile(fileEntry.path);

  return {
    path:fileEntry.path,
    text:text.length>maxChars?text.slice(0,maxChars):text,
    fullLength:text.length,
    truncated:text.length>maxChars,
    kind:'text'
  };
}


async function _searchWorkspaceText(term,maxHits=30){
  if(!_workspaceDirHandle)throw new Error('Primero conecta una carpeta con /carpeta');
  await _indexWorkspace();

  const q=String(term||'').trim().toLowerCase();
  if(!q)throw new Error('Debes indicar el texto a buscar');

  const hits=[];

  for(const fileEntry of _workspaceIndex){
    if(hits.length>=maxHits)break;

    try{
      const file=await fileEntry.handle.getFile();
      let lines=[];

      if(_isTextFile(fileEntry.name)){
        const text=await file.text();
        lines=text.split(/\r?\n/);
      }else if(_isPdfFile(fileEntry.name)){
        const pdfData=await _readWorkspacePdf(file,26000,8);
        lines=pdfData.text.split(/\r?\n/);
      }else if(_isExcelFile(fileEntry.name)){
        const excelData=await _readWorkspaceExcel(file,26000,4,20);
        lines=excelData.text.split(/\r?\n/);
      }else if(_isWordFile(fileEntry.name)){
        if(/\.doc$/i.test(fileEntry.name))continue;
        const wordData=await _readWorkspaceWord(file,26000);
        lines=wordData.text.split(/\r?\n/);
      }else{
        continue;
      }

      for(let i=0;i<lines.length;i++){
        if(lines[i].toLowerCase().includes(q)){
          hits.push({
            path:fileEntry.path,
            line:i+1,
            text:lines[i].trim()
          });

          if(hits.length>=maxHits)break;
        }
      }
    }catch{}
  }

  return hits;
}

function _downloadTextFile(name,text){
  const blob=new Blob([text],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
}

async function _analyzeWorkspaceFile(pathLike,agentKey){
  const fileData=await _readWorkspaceText(pathLike,40000);
  if(!GKEY)throw new Error('Necesitas Groq conectado para analizar');
  _rememberWorkspaceFile(fileData.path);

  const payload=[
    {role:'system',content:mkSys(agentKey)},
    {role:'system',content:'Analiza este archivo desde tu rol. Responde con este orden: Resumen, Riesgos, Recomendacion, Siguiente paso. No inventes nada.'},
    {role:'user',content:`Archivo: ${fileData.path}\n\nContenido:\n${fileData.text}`}
  ];

  const res=await groq(payload,()=>{},220);
  return {
    path:fileData.path,
    analysis:res||'No pude generar un analisis con Groq.'
  };
}

function _workspaceToolHelp(){
  return [
    'Tools disponibles:',
    'Tambien puedes usar el mini menu de la consola sin escribir comandos.',
    'Lectura soportada: TXT, MD, JSON, JS, PDF, XLSX, XLS y DOCX.',
    '/carpeta  -> conectar carpeta local',
    '/indexar  -> refrescar indice',
    '/archivos -> listar archivos',
    '/leer ruta -> abrir archivo',
    '/buscar texto -> buscar en proyecto',
    '/analizar ruta -> revisar archivo con Groq',
    '/exportar -> bajar chat actual'
  ].join('\n');
}

function _workspaceReadMessage(fileData){
  const meta=[];
  meta.push(_workspaceKindLabel(fileData));
  if(fileData.kind==='pdf'&&fileData.pageCount)meta.push(`${fileData.pageCount} paginas`);
  if(fileData.kind==='excel'&&fileData.sheetCount)meta.push(`${fileData.sheetCount} hojas`);
  if(fileData.truncated)meta.push('vista parcial');
  return `Abri ${fileData.path} en el visor [${meta.join(' · ')}].`;
}

// ==================== NUEVO SISTEMA DE TOOLS ====================
async function _handleBrowserToolCommand(rawText, agentKey, userLabel = '') {
  const text = String(rawText || '').trim();
  // Mostrar contexto de memoria compartida cuando se habla de mejoras
  if (text.toLowerCase().includes('mejorar') || text.toLowerCase().includes('cambiar')) {
    const sharedHint = document.createElement('div');
    sharedHint.style.cssText = 'font-size:8px;color:var(--t3);padding:4px 10px;background:rgba(200,160,64,0.1);border-left:3px solid #c8a040;margin:6px 0';
    sharedHint.textContent = 'Memoria compartida activa: ' + (SHARED_MEMORY.decisions.length || 0) + ' decisiones';
    document.getElementById('cmsgs').appendChild(sharedHint);
  }
  const lower = text.toLowerCase();
  const who = ACFG[agentKey]?.name || 'Agente';
  const col = ACFG[agentKey]?.col || 'var(--acc)';

  const reply = (msg) => {
    appendMsg('user', 'Tu', userLabel || text);
    appendMsg('agent', who, msg, col);
    if (!chatH[agentKey]) chatH[agentKey] = [];
    chatH[agentKey].push({ role: 'user', content: text }, { role: 'assistant', content: msg });
    saveChatH(agentKey);
    return true;
  };

  // Comandos básicos
  if (/^\/(tools|ayuda|herramientas)/i.test(text)) {
    return reply(_workspaceToolHelp());
  }

  if (/^\/carpeta/i.test(text)) {
    try {
      const msg = await _pickWorkspaceFolder();
      updateSharedDecision(agentKey, `Conectó carpeta: ${_workspaceDirHandle?.name}`);
      showToast('Carpeta conectada', '#0fa855', agentKey);
      return reply(msg);
    } catch (e) {
      return reply(`Error al conectar carpeta: ${e.message}`);
    }
  }

  if (/^\/leer\s+(.+)/i.test(text)) {
    const match = text.match(/^\/leer\s+(.+)/i);
    try {
      const fileData = await _readWorkspaceText(match[1]);
      openWorkspaceViewer(fileData, agentKey);
      updateSharedDecision(agentKey, `Leyó archivo: ${fileData.path}`);
      return reply(_workspaceReadMessage(fileData));
    } catch (e) {
      return reply(`No se pudo leer el archivo: ${e.message}`);
    }
  }

  if (/^\/buscar\s+(.+)/i.test(text)) {
    const match = text.match(/^\/buscar\s+(.+)/i);
    try {
      const hits = await _searchWorkspaceText(match[1]);
      updateSharedDecision(agentKey, `Buscó: "${match[1]}"`);
      return _appendWorkspaceInteractiveList(agentKey, userLabel || text, `Resultados para "${match[1]}"`, '', hits.map(h => ({ path: h.path, meta: `Línea ${h.line}` })));
    } catch (e) {
      return reply(`Error en búsqueda: ${e.message}`);
    }
  }

  if (/^\/analizar\s+(.+)/i.test(text)) {
    const match = text.match(/^\/analizar\s+(.+)/i);
    try {
      const data = await _analyzeWorkspaceFile(match[1], agentKey);
      updateSharedDecision(agentKey, `Analizó: ${data.path}`);
      return reply(`Análisis completado:\n\n${data.analysis}`);
    } catch (e) {
      return reply(`Error al analizar: ${e.message}`);
    }
  }

  return false; // No se manejó como tool → sigue con chat normal
}

function _workspacePickerTag(path){
  const ext=(path.split('.').pop()||'').toUpperCase();
  return ext||'FILE';
}

function closeWorkspaceFilePicker(ev){
  if(ev===true){
    document.getElementById('toolPickerOv')?.classList.remove('show');
    syncPanelContext();
    return;
  }
  if(!ev||ev.target===ev.currentTarget){
    document.getElementById('toolPickerOv')?.classList.remove('show');
    syncPanelContext();
  }
}

function filterWorkspaceFilePicker(query=''){
  const list=document.getElementById('toolPickerList');
  if(!list)return;
  const q=String(query||'').trim().toLowerCase();
  list.innerHTML='';

  const rows=_workspacePickerItems.filter(item=>{
    if(!q)return true;
    return item.path.toLowerCase().includes(q)||item.name.toLowerCase().includes(q);
  });

  if(!rows.length){
    const empty=document.createElement('div');
    empty.className='mdsc';
    empty.textContent='No hay archivos que coincidan con ese filtro.';
    list.appendChild(empty);
    return;
  }

  rows.slice(0,160).forEach(item=>{
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='tool-picker-item';
    btn.onclick=()=>chooseWorkspaceFilePickerItem(item.path);

    const path=document.createElement('div');
    path.className='tool-picker-path';
    path.textContent=item.path;

    const tag=document.createElement('div');
    tag.className='tool-picker-tag';
    tag.textContent=_workspacePickerTag(item.path);

    btn.appendChild(path);
    btn.appendChild(tag);
    list.appendChild(btn);
  });
}

async function openWorkspaceFilePicker(mode='read'){
  const agentKey=_workspaceToolAgentKey();
  try{
    const files=await _indexWorkspace();
    if(!files.length){
      return _workspaceToolReply(agentKey,'Tools > Workspace','No hay archivos indexados. Conecta una carpeta primero.');
    }
    _workspacePickerMode=mode;
    _workspacePickerItems=files.slice();
    const ov=document.getElementById('toolPickerOv');
    const title=document.getElementById('toolPickerTitle');
    const desc=document.getElementById('toolPickerDesc');
    const search=document.getElementById('toolPickerSearch');
    if(title)title.textContent=mode==='analyze'?'Elegir archivo para analizar':'Elegir archivo para leer';
    if(desc)desc.textContent=mode==='analyze'
      ?'Haz clic en un archivo del workspace para mandarlo a Groq desde el agente actual.'
      :'Haz clic en un archivo del workspace para abrirlo en el chat.';
    if(search){
      search.value=_workspaceQuickQueryValue();
    }
    filterWorkspaceFilePicker(search?.value||'');
    ov?.classList.add('show');
    if(currentPanel!=='consola')switchPanel('consola');
    syncPanelContext();
    search?.focus();
  }catch(e){
    return _workspaceToolReply(agentKey,'Tools > Workspace',`No pude abrir el selector de archivos: ${e?.message||'error'}`);
  }
}

async function chooseWorkspaceFilePickerItem(path){
  closeWorkspaceFilePicker(true);
  const agentKey=_workspaceToolAgentKey();
  const mode=_workspacePickerMode==='analyze'?'analyze':'read';
  const cmd=mode==='analyze'?`/analizar ${path}`:`/leer ${path}`;
  const label=mode==='analyze'?`Tools > Analizar ${path}`:`Tools > Leer ${path}`;
  await _handleBrowserToolCommand(cmd,agentKey,label);
}

async function workspaceQuickAction(kind){
  const agentKey=_workspaceToolAgentKey();
  const query=_workspaceQuickQueryValue();
  if(query)_workspaceLastSearch=query;

  if(kind==='folder')return _handleBrowserToolCommand('/carpeta',agentKey,'Tools > Carpeta');
  if(kind==='files')return _handleBrowserToolCommand('/archivos',agentKey,'Tools > Archivos');
  if(kind==='export')return _handleBrowserToolCommand('/exportar',agentKey,'Tools > Exportar chat');

  if(kind==='last'){
    if(!_workspaceLastFilePath){
      return _workspaceToolReply(agentKey,'Tools > Ultimo','Todavia no has abierto ningun archivo del workspace.');
    }
    _setWorkspaceQuickQuery(_workspaceLastFilePath);
    return _handleBrowserToolCommand(`/leer ${_workspaceLastFilePath}`,agentKey,`Tools > Leer ultimo (${_workspaceDisplayName(_workspaceLastFilePath)})`);
  }

  if(kind==='search'){
    if(!query){
      return _workspaceToolReply(agentKey,'Tools > Buscar','Escribe texto en el mini campo o en el input principal para buscar.');
    }
    return _handleBrowserToolCommand(`/buscar ${query}`,agentKey,`Tools > Buscar ${query}`);
  }

  if(kind==='read'){
    if(query){
      return _handleBrowserToolCommand(`/leer ${query}`,agentKey,`Tools > Leer ${query}`);
    }
    if(_workspaceLastFilePath){
      return _handleBrowserToolCommand(`/leer ${_workspaceLastFilePath}`,agentKey,`Tools > Leer ultimo (${_workspaceDisplayName(_workspaceLastFilePath)})`);
    }
    return openWorkspaceFilePicker('read');
  }

  if(kind==='analyze'){
    if(query){
      return _handleBrowserToolCommand(`/analizar ${query}`,agentKey,`Tools > Analizar ${query}`);
    }
    if(_workspaceLastFilePath){
      return _handleBrowserToolCommand(`/analizar ${_workspaceLastFilePath}`,agentKey,`Tools > Analizar ultimo (${_workspaceDisplayName(_workspaceLastFilePath)})`);
    }
    return openWorkspaceFilePicker('analyze');
  }

  return false;
}

