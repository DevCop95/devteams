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

function teardownPathWorker(resolvePending=false){
  if(pathWorker){try{pathWorker.terminate();}catch(e){}pathWorker=null;}
  document.getElementById('wkBadge')?.classList.remove('on');
  if(!resolvePending){_wkCallbacks.clear();return;}
  _wkCallbacks.forEach(req=>{
    try{req.resolve(astar(req.sx,req.sz,req.tx,req.tz));}
    catch(e){req.resolve(null);}
  });
  _wkCallbacks.clear();
}
window.addEventListener('beforeunload',()=>teardownPathWorker(false));
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

