// Email Builder v2 — clean rebuild
(function(){
  'use strict';

  // DOM helpers
  const $=(s,e=document)=>e.querySelector(s);
  const $$=(s,e=document)=>e.querySelectorAll(s);
  const esc=(s)=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const clamp=(n,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Number.isFinite(+n)?+n:0));
  const dataUriFromSvg=(code)=>'data:image/svg+xml;utf8,'+encodeURIComponent(code);

  // Default inline SVG avatar (A on mint block)
  const DEFAULT_IMG=dataUriFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="100%" height="100%" fill="#00FFD1"/><text x="50%" y="54%" dy=".1em" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="56" fill="#000">A</text></svg>');

  // Store (projects with versions)
  const STORE_KEY='emailBuilder.projects.v2';
  let store={ projects:{} };
  const uid=()=>('p_'+Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4));
  const loadStore=()=>{ try{ const s=localStorage.getItem(STORE_KEY); store=s?JSON.parse(s):{projects:{}}; }catch{ store={projects:{}}; } };
  const saveStore=()=>{ localStorage.setItem(STORE_KEY, JSON.stringify(store)); };

  // App state
  let currentProjectId=null; let currentVersionId=null; let currentConfig={};

  // Elements
  const dashboardView=$('#dashboard-view');
  const projectView=$('#project-view');
  const tmplList=$('#tmpl-list');
  const projList=$('#proj-list');
  const projNameInput=$('#proj-name-input');
  const versionStrip=$('#version-strip');
  const formPane=$('#form-pane');
  const jsonPane=$('#json-pane');
  const editor=$('#config-editor');
  const livePreview=$('#live-preview');
  const projTemplateName=$('#proj-template-name');
  const statusBar=$('#status-bar');

  // Preview
  const writePreview=(html)=>{ try{const d=livePreview.contentDocument; d.open(); d.write(html); d.close();}catch{} };
  let prevTimer=null;
  const schedulePreview=()=>{ clearTimeout(prevTimer); prevTimer=setTimeout(()=>{ writePreview(buildCurrentHtml()); }, 60); };

  // Token utilities
  const TOKEN_RE=/{{\s*([A-Za-z0-9_.-]+)\s*}}/g;
  function findTokens(html){ const set=new Set(); let m; while((m=TOKEN_RE.exec(html))){ set.add(m[1]); } return set; }
  function extractPlaceholders(html){
    const tokens=findTokens(html); const map={}; const groups={};
    for(const t of tokens){ const mm=t.match(/^(.*)_([0-9]+)$/); if(mm){ const base=mm[1]; const i=parseInt(mm[2],10)-1; if(!groups[base]) groups[base]=[]; groups[base][i]=''; } else { map[t]=''; } }
    for(const base in groups){ map[base]=groups[base].map(v=>v||''); }
    // Default images for anything that looks like an image/icon token
    for(const k in map){ if(typeof map[k]==='string' && /ICON|IMAGE/i.test(k)) map[k]=DEFAULT_IMG; if(Array.isArray(map[k]) && /ICON|IMAGE/i.test(k)) map[k]=map[k].map(()=>DEFAULT_IMG); }
    return map;
  }

  // Canonical config from tokens
  function toCanonicalConfig(html){
    const raw=extractPlaceholders(html); const tokens=findTokens(html); const cfg={};
    const get=(...names)=>{ for(const n of names){ if(n in raw) return raw[n]; } return undefined; };
    const str=(...names)=>String(get(...names)||'');
    const num=(...names)=>clamp(get(...names)||0);
    // Basics
    cfg.projectName=str('PROJECT_NAME','projectName');
    cfg.projectIconUrl=str('PROJECT_ICON_URL','projectIconUrl'); if(!cfg.projectIconUrl) cfg.projectIconUrl=DEFAULT_IMG;
    cfg.updateDate=str('UPDATE_DATE','updateDate');
    cfg.preheader=str('PREHEADER','preheader');
    cfg.updateSummary=str('UPDATE_SUMMARY','updateSummary');
    cfg.progressPercent=num('PROGRESS_PERCENT','progressPercent');
    // Lists
    cfg.whatsNew=(get('WHATS_NEW_ITEM','whatsNew')||[]).map(x=>String(x||''));
    cfg.risks=(get('RISK_ITEM','risks')||[]).map(x=>String(x||''));
    // Workstreams from TRACK_n_LABEL/PERCENT or workstreams_label_n + workstreams_percent_n
    const ws=[]; let i=1; while(true){
      const a=`TRACK_${i}_LABEL`, b=`TRACK_${i}_PERCENT`, a2=`workstreams_label_${i}`, b2=`workstreams_percent_${i}`;
      const label=(a in raw?raw[a]:a2 in raw?raw[a2]:null);
      const pct=(b in raw?raw[b]:b2 in raw?raw[b2]:null);
      if(label==null && pct==null){ break; }
      ws.push({ label:String((Array.isArray(label)?label[0]:label)||''), percent:clamp((Array.isArray(pct)?pct[0]:pct)||0) });
      i++;
    }
    cfg.workstreams=ws;
    // Milestones from MILESTONE_n and MILESTONE_n_DATE or milestone_label_n, milestone_date_n
    const ms=[]; i=1; while(true){ const la=`MILESTONE_${i}`, da=`MILESTONE_${i}_DATE`, la2=`milestone_label_${i}`, da2=`milestone_date_${i}`;
      const l=(la in raw?raw[la]:la2 in raw?raw[la2]:null); const d=(da in raw?raw[da]:da2 in raw?raw[da2]:null);
      if(l==null && d==null) break; ms.push({ label:String((Array.isArray(l)?l[0]:l)||''), date:String((Array.isArray(d)?d[0]:d)||'') }); i++; }
    cfg.milestones=ms;
    // CTA
    cfg.cta={ label:str('CTA_LABEL','cta_label','cta.label'), url:str('CTA_URL','cta_url','cta.url') };
    // Footer
    cfg.footerText=str('FOOTER_TEXT','footerText');
    // Contributors footer (CONTRIB_n_NAME, CONTRIB_n_IMAGE_URL)
    const contributors=[]; i=1; while(true){ const n=`CONTRIB_${i}_NAME`, u=`CONTRIB_${i}_IMAGE_URL`; if(!(n in raw) && !(u in raw)) break; contributors.push({ name:String(raw[n]||''), imageUrl:String(raw[u]||DEFAULT_IMG) }); i++; }
    if(contributors.length) cfg.contributors=contributors;
    return cfg;
  }

  // Build final HTML by replacing tokens from canonical config
  function buildFromTemplateHtml(html, cfg){
    const tokens=[...findTokens(html)]; const map={};
    const put=(name,val)=>{ map[name]=String(val==null?'':val); };
    // Basics
    put('PROJECT_NAME', cfg.projectName);
    put('PROJECT_ICON_URL', cfg.projectIconUrl||DEFAULT_IMG);
    put('UPDATE_DATE', cfg.updateDate);
    put('PREHEADER', cfg.preheader);
    put('UPDATE_SUMMARY', cfg.updateSummary);
    put('PROGRESS_PERCENT', clamp(cfg.progressPercent));
    // CTA / Footer
    if(cfg.cta){ put('CTA_LABEL', cfg.cta.label||'Open'); put('CTA_URL', cfg.cta.url||'#'); }
    if('footerText' in cfg){ put('FOOTER_TEXT', cfg.footerText); }
    // Lists
    const wn = cfg.whatsNew||[]; const rk = cfg.risks||[];
    for(let i=0;i<Math.max(wn.length,3);i++) put(`WHATS_NEW_ITEM_${i+1}`, wn[i]||'');
    for(let i=0;i<Math.max(rk.length,2);i++) put(`RISK_ITEM_${i+1}`, rk[i]||'');
    // Workstreams
    const ws=cfg.workstreams||[]; for(let i=0;i<Math.max(ws.length,3);i++){ const w=ws[i]||{}; put(`TRACK_${i+1}_LABEL`, w.label||''); put(`TRACK_${i+1}_PERCENT`, clamp(w.percent||0)); }
    // Milestones
    const ms=cfg.milestones||[]; for(let i=0;i<Math.max(ms.length,3);i++){ const m=ms[i]||{}; put(`MILESTONE_${i+1}`, m.label||''); put(`MILESTONE_${i+1}_DATE`, m.date||''); }
    // Contributors
    const cs=cfg.contributors||[]; for(let i=0;i<cs.length;i++){ const c=cs[i]||{}; put(`CONTRIB_${i+1}_NAME`, c.name||''); put(`CONTRIB_${i+1}_IMAGE_URL`, c.imageUrl||DEFAULT_IMG); }
    // Replace
    let out=html; for(const name of tokens){ const re=new RegExp('{{\\s*'+name.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')+'\\s*}}','g'); out=out.replace(re, esc(map[name]??'')); }
    return out;
  }

  function buildCurrentHtml(){ const p=store.projects[currentProjectId]; if(!p) return '<!doctype html><meta charset="utf-8"><title>Preview</title>'; if(p.templateHtml) return buildFromTemplateHtml(p.templateHtml, currentConfig); return '<!doctype html><meta charset="utf-8"><body style="font:14px Segoe UI,Arial;padding:16px">No template loaded</body>'; }

  // Persistence helpers
  function persistCurrentConfig(){ const p=store.projects[currentProjectId]; if(!p) return; const v=p.versions.find(x=>x.id===currentVersionId); if(!v) return; v.config=currentConfig; v.updatedAt=Date.now(); p.updatedAt=v.updatedAt; saveStore(); }

  // UI builders
  function h3(label){ const h=document.createElement('h3'); h.textContent=label; h.style.fontSize='14px'; h.style.color='#cfd5db'; h.style.margin='8px 0'; return h; }
  function deepSet(obj,path,val){ const parts=path.split('.'); let cur=obj; for(let i=0;i<parts.length-1;i++){ const k=parts[i]; if(cur[k]==null||typeof cur[k]!=='object') cur[k]={}; cur=cur[k]; } cur[parts[parts.length-1]]=val; }
  function inferType(key,val){ if(Array.isArray(val)) return 'list'; if(typeof val==='number') return key.toLowerCase().includes('percent')?'percent':'number'; if(typeof val==='boolean') return 'checkbox'; if(typeof val==='string'){ const lk=key.toLowerCase(); if(lk.includes('url')||lk.includes('icon')) return 'image'; if(lk.includes('summary')||lk.includes('footer')) return 'textarea'; return 'text'; } if(typeof val==='object'&&val) return 'group'; return 'text'; }
  function buildPrimitiveInput(path,label,type,value,onChange){ const wrap=document.createElement('div'); wrap.style.marginBottom='10px'; const id='f_'+path.replace(/[^a-z0-9]+/gi,'_')+'_'+Math.random().toString(36).slice(2,6); const lab=document.createElement('label'); lab.className='muted'; lab.textContent=label; lab.htmlFor=id; wrap.appendChild(lab); if(type==='textarea'){ const ta=document.createElement('textarea'); ta.id=id; ta.className='input'; ta.style.minHeight='80px'; ta.value=value||''; ta.addEventListener('input',()=>{ onChange(ta.value); persistCurrentConfig(); schedulePreview(); }); wrap.appendChild(ta); return wrap; } if(type==='checkbox'){ const cb=document.createElement('input'); cb.id=id; cb.type='checkbox'; cb.checked=!!value; cb.addEventListener('change',()=>{ onChange(cb.checked); persistCurrentConfig(); schedulePreview(); }); wrap.appendChild(cb); return wrap; } if(type==='percent'){ const row=document.createElement('div'); row.style.display='flex'; row.style.gap='8px'; const num=document.createElement('input'); num.id=id; num.type='number'; num.className='input'; num.min='0'; num.max='100'; num.step='1'; num.style.maxWidth='120px'; num.value=(value??0); num.addEventListener('input',()=>{ onChange(clamp(num.value)); persistCurrentConfig(); schedulePreview(); }); const rng=document.createElement('input'); rng.type='range'; rng.min='0'; rng.max='100'; rng.step='1'; rng.value=(value??0); rng.setAttribute('aria-labelledby',id); rng.addEventListener('input',()=>{ num.value=rng.value; onChange(clamp(rng.value)); persistCurrentConfig(); schedulePreview(); }); row.appendChild(num); row.appendChild(rng); wrap.appendChild(row); return wrap; } if(type==='image'){ const grp=document.createElement('div'); grp.className='controls'; grp.setAttribute('role','group'); grp.setAttribute('aria-label','Image input mode'); const urlBtn=document.createElement('button'); urlBtn.className='btn'; urlBtn.textContent='URL'; const svgBtn=document.createElement('button'); svgBtn.className='btn ghost'; svgBtn.textContent='SVG code'; const genBtn=document.createElement('button'); genBtn.className='btn ghost'; genBtn.textContent='SVG from name'; const url=document.createElement('input'); url.id=id; url.type='text'; url.className='input'; url.placeholder='https://...'; url.value=value||''; url.style.marginTop='6px'; const svg=document.createElement('textarea'); svg.className='input'; svg.style.display='none'; svg.style.minHeight='100px'; svg.placeholder='<svg>...</svg>'; const prev=document.createElement('img'); prev.alt='preview'; prev.style.width='44px'; prev.style.height='44px'; prev.style.borderRadius='8px'; prev.style.border='1px solid #2a2a2a'; prev.style.marginLeft='8px'; function useURL(){ urlBtn.className='btn'; svgBtn.className='btn ghost'; url.style.display=''; svg.style.display='none'; prev.src=url.value||DEFAULT_IMG; onChange(url.value||DEFAULT_IMG); persistCurrentConfig(); schedulePreview(); } function useSVG(){ urlBtn.className='btn ghost'; svgBtn.className='btn'; url.style.display='none'; svg.style.display=''; const v=svg.value.trim(); const data=v?dataUriFromSvg(v):DEFAULT_IMG; prev.src=data; onChange(data); persistCurrentConfig(); schedulePreview(); } function genSVG(){ const ch=(String(currentConfig.projectName||'A').trim()[0]||'A').toUpperCase(); const code=`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="100%" height="100%" fill="#00FFD1"/><text x="50%" y="54%" dy=".1em" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="56" fill="#000">${esc(ch)}</text></svg>`; svg.value=code; useSVG(); } url.addEventListener('input',()=>useURL()); svg.addEventListener('input',()=>useSVG()); urlBtn.addEventListener('click',e=>{e.preventDefault();useURL();}); svgBtn.addEventListener('click',e=>{e.preventDefault();useSVG();}); genBtn.addEventListener('click',e=>{e.preventDefault();genSVG();}); grp.appendChild(urlBtn); grp.appendChild(svgBtn); grp.appendChild(genBtn); grp.appendChild(prev); wrap.appendChild(grp); wrap.appendChild(url); wrap.appendChild(svg); useURL(); return wrap; } const inp=document.createElement('input'); inp.id=id; inp.type=(type==='number'?'number':'text'); inp.className='input'; inp.value=(value??''); inp.addEventListener('input',()=>{ onChange(inp.value); persistCurrentConfig(); schedulePreview(); }); wrap.appendChild(inp); return wrap; }
  function buildListPrimitive(path,label,arr,onChange){ const wrap=document.createElement('div'); const list=document.createElement('div'); list.className='list'; const add=document.createElement('button'); add.className='btn ghost'; add.textContent='Add'; add.addEventListener('click',e=>{ e.preventDefault(); const next=[...arr,'']; onChange(next); editor.value=JSON.stringify(currentConfig,null,2); persistCurrentConfig(); schedulePreview(); render(); }); function render(){ list.innerHTML=''; (arr||[]).forEach((v,idx)=>{ const row=document.createElement('div'); row.className='list-item'; const t=document.createElement('input'); t.type='text'; t.className='input'; t.value=v||''; t.style.flex='1'; t.addEventListener('input',()=>{ const next=[...arr]; next[idx]=t.value; onChange(next); editor.value=JSON.stringify(currentConfig,null,2); persistCurrentConfig(); schedulePreview(); }); const del=document.createElement('button'); del.className='btn ghost'; del.textContent='Remove'; del.addEventListener('click',e=>{ e.preventDefault(); const next=[...arr]; next.splice(idx,1); onChange(next); editor.value=JSON.stringify(currentConfig,null,2); persistCurrentConfig(); schedulePreview(); render(); }); row.appendChild(t); row.appendChild(del); list.appendChild(row); }); } render(); wrap.appendChild(list); wrap.appendChild(add); return wrap; }
  function buildListObjects(path,label,arr,fields,onChange){ const wrap=document.createElement('div'); const list=document.createElement('div'); list.className='list'; const add=document.createElement('button'); add.className='btn ghost'; add.textContent='Add'; add.addEventListener('click',e=>{ e.preventDefault(); const blank={}; fields.forEach(f=>blank[f.path]=f.type==='percent'?0:(f.type==='checkbox'?false:(f.type==='image'?DEFAULT_IMG:''))); const next=[...arr,blank]; onChange(next); editor.value=JSON.stringify(currentConfig,null,2); persistCurrentConfig(); schedulePreview(); render(); }); function render(){ list.innerHTML=''; (arr||[]).forEach((obj,idx)=>{ const row=document.createElement('div'); row.className='list-item'; row.style.flexDirection='column'; const grid=document.createElement('div'); grid.style.display='grid'; grid.style.gridTemplateColumns='repeat(auto-fit,minmax(160px,1fr))'; grid.style.gap='8px'; fields.forEach(f=>{ const ctl=buildPrimitiveInput(`${path}.${idx}.${f.path}`, f.label, f.type, obj[f.path], v=>{ const next=[...arr]; next[idx]={...obj,[f.path]:v}; onChange(next); editor.value=JSON.stringify(currentConfig,null,2); }); grid.appendChild(ctl); }); const actions=document.createElement('div'); actions.className='controls'; const del=document.createElement('button'); del.className='btn ghost'; del.textContent='Remove'; del.addEventListener('click',e=>{ e.preventDefault(); const next=[...arr]; next.splice(idx,1); onChange(next); editor.value=JSON.stringify(currentConfig,null,2); persistCurrentConfig(); schedulePreview(); render(); }); actions.appendChild(del); row.appendChild(grid); row.appendChild(actions); list.appendChild(row); }); } render(); wrap.appendChild(list); wrap.appendChild(add); return wrap; }

  function renderFormFromConfig(cfg){ const container=$('#dynamic-form'); if(!container) return; container.innerHTML='';
    // Basics
    const basics=document.createElement('div'); ['projectName','projectIconUrl','updateDate','preheader','updateSummary','progressPercent'].forEach(k=>{ if(k in cfg){ const t=inferType(k,cfg[k]); const ctl=buildPrimitiveInput(k,k,t,cfg[k],nv=>{ if(t==='percent') nv=clamp(nv); deepSet(currentConfig,k,nv); editor.value=JSON.stringify(currentConfig,null,2); }); basics.appendChild(ctl);} }); if(basics.childNodes.length){ const sec=document.createElement('div'); sec.appendChild(h3('Basics')); sec.appendChild(basics); container.appendChild(sec); }
    // Groups
    if(cfg.cta&&typeof cfg.cta==='object'){ const sec=document.createElement('div'); sec.appendChild(h3('Call To Action')); const grid=document.createElement('div'); grid.style.display='grid'; grid.style.gridTemplateColumns='repeat(auto-fit,minmax(160px,1fr))'; grid.style.gap='8px'; ['label','url'].forEach(sub=>{ const ctl=buildPrimitiveInput(`cta.${sub}`, sub, 'text', cfg.cta[sub],nv=>{ deepSet(currentConfig,`cta.${sub}`,nv); editor.value=JSON.stringify(currentConfig,null,2); }); grid.appendChild(ctl); }); sec.appendChild(grid); container.appendChild(sec); }
    if(Array.isArray(cfg.whatsNew)){ const wrap=buildListPrimitive('whatsNew','What\'s New',cfg.whatsNew,arr=>{ deepSet(currentConfig,'whatsNew',arr); editor.value=JSON.stringify(currentConfig,null,2); }); const sec=document.createElement('div'); sec.appendChild(h3('What\'s New')); sec.appendChild(wrap); container.appendChild(sec); }
    if(Array.isArray(cfg.risks)){ const wrap=buildListPrimitive('risks','Risks & Blockers',cfg.risks,arr=>{ deepSet(currentConfig,'risks',arr); editor.value=JSON.stringify(currentConfig,null,2); }); const sec=document.createElement('div'); sec.appendChild(h3('Risks & Blockers')); sec.appendChild(wrap); container.appendChild(sec); }
    if(Array.isArray(cfg.workstreams)){ const wrap=buildListObjects('workstreams','Workstreams',cfg.workstreams,[{path:'label',label:'Label',type:'text'},{path:'percent',label:'Percent',type:'percent'}],arr=>{ deepSet(currentConfig,'workstreams',arr); editor.value=JSON.stringify(currentConfig,null,2); }); const sec=document.createElement('div'); sec.appendChild(h3('Workstreams')); sec.appendChild(wrap); container.appendChild(sec); }
    if(Array.isArray(cfg.milestones)){ const wrap=buildListObjects('milestones','Milestones',cfg.milestones,[{path:'label',label:'Label',type:'text'},{path:'date',label:'Date',type:'text'}],arr=>{ deepSet(currentConfig,'milestones',arr); editor.value=JSON.stringify(currentConfig,null,2); }); const sec=document.createElement('div'); sec.appendChild(h3('Milestones')); sec.appendChild(wrap); container.appendChild(sec); }
    if(Array.isArray(cfg.contributors)){ const wrap=buildListObjects('contributors','Contributors',cfg.contributors,[{path:'name',label:'Name',type:'text'},{path:'imageUrl',label:'Image',type:'image'}],arr=>{ deepSet(currentConfig,'contributors',arr); editor.value=JSON.stringify(currentConfig,null,2); }); const sec=document.createElement('div'); sec.appendChild(h3('Contributors')); sec.appendChild(wrap); container.appendChild(sec); }
    if('footerText' in cfg){ const sec=document.createElement('div'); sec.appendChild(h3('Footer')); const ctl=buildPrimitiveInput('footerText','Footer Text','textarea',cfg.footerText,nv=>{ deepSet(currentConfig,'footerText',nv); editor.value=JSON.stringify(currentConfig,null,2); }); sec.appendChild(ctl); container.appendChild(sec); }
  }

  // Dashboard and project rendering
  function renderDashboard(){ dashboardView.style.display=''; projectView.style.display='none'; tmplList.innerHTML=''; projList.innerHTML='';
    // Templates registry (if loaded)
    if(window.__templateRegistry && window.__templateRegistry.length){ window.__templateRegistry.forEach(t=>{ const card=document.createElement('div'); card.className='card'; const h=document.createElement('h3'); h.textContent=t.name; const p=document.createElement('p'); p.textContent=t.description||t.file; const actions=document.createElement('div'); actions.className='controls'; const btn=document.createElement('button'); btn.className='btn'; btn.textContent='Create Project'; btn.addEventListener('click',async()=>{ try{ const res=await fetch('templates/'+t.file); const html=await res.text(); createProjectFromHtml(html, t.name); }catch{ alert('Unable to fetch template over file://. Use Load HTML.'); } }); actions.appendChild(btn); card.appendChild(h); card.appendChild(p); card.appendChild(actions); tmplList.appendChild(card); }); } else { const empty=document.createElement('div'); empty.className='muted'; empty.textContent='Load HTML to import a template (or serve over HTTP for registry)'; tmplList.appendChild(empty); }
    // Projects
    const items=Object.values(store.projects).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)); items.forEach(p=>{ const item=document.createElement('div'); item.className='list-item'; const title=document.createElement('div'); title.className='title'; title.textContent=p.name||'Untitled'; const meta=document.createElement('div'); meta.className='meta'; meta.textContent=`${new Date(p.updatedAt||p.createdAt).toLocaleString()} • ${(p.versions||[]).length} versions`; const left=document.createElement('div'); left.appendChild(title); left.appendChild(meta); const actions=document.createElement('div'); actions.className='controls'; const open=document.createElement('button'); open.className='btn'; open.textContent='Open'; open.addEventListener('click',()=>openProject(p.id)); const del=document.createElement('button'); del.className='btn ghost'; del.textContent='Delete'; del.addEventListener('click',()=>{ if(confirm('Delete project?')){ delete store.projects[p.id]; saveStore(); renderDashboard(); } }); actions.appendChild(open); actions.appendChild(del); item.appendChild(left); item.appendChild(actions); projList.appendChild(item); });
  }

  function renderVersionStrip(){ versionStrip.innerHTML=''; const p=store.projects[currentProjectId]; if(!p) return; (p.versions||[]).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)).forEach(v=>{ const chip=document.createElement('button'); chip.className='chip'+(v.id===currentVersionId?' active':''); chip.type='button'; chip.textContent=v.name; chip.title=new Date(v.updatedAt||v.createdAt).toLocaleString(); chip.addEventListener('click',()=>openProject(currentProjectId,v.id)); versionStrip.appendChild(chip); }); }

  // Project
  function createProjectFromHtml(html, name){ const id=uid(); const now=Date.now(); const vid=uid(); const cfg=toCanonicalConfig(html); store.projects[id]={ id, name: name||'Custom Template', templateHtml: html, createdAt: now, updatedAt: now, versions:[{ id: vid, name: 'v1', config: cfg, isDraft:true, createdAt: now, updatedAt: now }] }; saveStore(); openProject(id,vid); }
  function openProject(id, versionId){ const p=store.projects[id]; if(!p) return; currentProjectId=id; currentVersionId=versionId||(p.versions&&p.versions[0]&&p.versions[0].id); const v=p.versions.find(x=>x.id===currentVersionId) || p.versions[0]; currentVersionId=v.id; currentConfig=JSON.parse(JSON.stringify(v.config||{})); editor.value=JSON.stringify(currentConfig,null,2); dashboardView.style.display='none'; projectView.style.display=''; projTemplateName.textContent=p.name||'Template'; projNameInput.value=p.name||''; renderVersionStrip(); renderFormFromConfig(currentConfig); schedulePreview(); }

  function addVersion(){ const p=store.projects[currentProjectId]; if(!p) return; const now=Date.now(); const vid=uid(); const baseName='v'+(p.versions.length+1); p.versions.push({ id:vid, name:baseName, config: JSON.parse(JSON.stringify(currentConfig)), isDraft:true, createdAt: now, updatedAt: now }); p.updatedAt=now; saveStore(); openProject(p.id, vid); }
  function deleteCurrentVersion(){ const p=store.projects[currentProjectId]; if(!p) return; if(p.versions.length<=1){ alert('At least one version is required.'); return; } const ix=p.versions.findIndex(x=>x.id===currentVersionId); if(ix>=0){ p.versions.splice(ix,1); saveStore(); const next=p.versions[Math.max(0,ix-1)]; openProject(p.id,next.id); } }

  // Registry loader (HTTP only)
  async function loadTemplateRegistry(){ try{ const res=await fetch('templates/manifest.json',{cache:'no-store'}); if(!res.ok) throw new Error('fetch failed'); const list=await res.json(); window.__templateRegistry=list; }catch(e){ window.__templateRegistry=[]; }
  }

  // Wire up controls
  function bindEvents(){
    // Normalize any garbled text in back button
    const backBtn=$('#back-dashboard'); if(backBtn) backBtn.textContent='Back to Dashboard';
    $('#load-template').addEventListener('click',()=>$('#template-file').click());
    $('#template-file').addEventListener('change',e=>{ const f=e.target.files&&e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ createProjectFromHtml(String(r.result||''), f.name.replace(/\.[^.]+$/,'')); }; r.readAsText(f); e.target.value=''; });
    $('#new-from-scratch').addEventListener('click',()=>{ const html='<!doctype html><meta charset="utf-8"><body style="font:14px Segoe UI,Arial;padding:24px">Paste or load a template HTML to start.</body>'; createProjectFromHtml(html,'Blank Template'); });
    // Projects toolbar
    $('#proj-export-all').addEventListener('click',()=>{ const blob=new Blob([JSON.stringify(store,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='projects.json'; a.click(); URL.revokeObjectURL(a.href); });
    $('#proj-import-all').addEventListener('click',()=>$('#proj-import-all-file').click());
    $('#proj-import-all-file').addEventListener('change',e=>{ const f=e.target.files&&e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const json=JSON.parse(String(r.result||'{}')); if(json&&json.projects){ store=json; saveStore(); renderDashboard(); } }catch(err){ alert('Invalid JSON: '+err.message); } }; r.readAsText(f); e.target.value=''; });

    // Project view controls
    $('#back-dashboard').addEventListener('click',()=>{ renderDashboard(); });
    $('#proj-export').addEventListener('click',()=>{ const p=store.projects[currentProjectId]; if(!p) return; const blob=new Blob([JSON.stringify(p,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=(p.name||'project')+'.json'; a.click(); URL.revokeObjectURL(a.href); });
    $('#proj-import').addEventListener('click',()=>$('#proj-import-file').click());
    $('#proj-import-file').addEventListener('change',e=>{ const f=e.target.files&&e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const p=JSON.parse(String(r.result||'{}')); if(p&&p.id&&p.versions){ store.projects[p.id]=p; saveStore(); openProject(p.id,p.versions[0].id); } }catch(err){ alert('Invalid project JSON: '+err.message); } }; r.readAsText(f); e.target.value=''; });
    $('#proj-delete').addEventListener('click',()=>{ const p=store.projects[currentProjectId]; if(!p) return; if(confirm('Delete this project?')){ delete store.projects[p.id]; saveStore(); renderDashboard(); } });
    $('#proj-load-template').addEventListener('click',()=>$('#proj-template-file').click());
    $('#proj-template-file').addEventListener('change',e=>{ const p=store.projects[currentProjectId]; if(!p) return; const f=e.target.files&&e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ const html=String(r.result||''); const cfg=toCanonicalConfig(html); const now=Date.now(); const vid=uid(); p.templateHtml=html; p.versions.push({ id:vid, name:'v'+(p.versions.length+1), config: cfg, isDraft:true, createdAt: now, updatedAt: now }); p.updatedAt=now; saveStore(); openProject(p.id,vid); }; r.readAsText(f); e.target.value=''; });
    $('#add-version').addEventListener('click',addVersion);

    // Editor mode toggle
    $('#mode-form').addEventListener('click',()=>{ formPane.style.display=''; jsonPane.style.display='none'; });
    $('#mode-json').addEventListener('click',()=>{ formPane.style.display='none'; jsonPane.style.display=''; });
    $('#sync-from-json').addEventListener('click',()=>{ try{ const obj=JSON.parse(editor.value||'{}'); currentConfig=obj; persistCurrentConfig(); renderFormFromConfig(currentConfig); schedulePreview(); statusBar.textContent='Synced from JSON'; setTimeout(()=>statusBar.textContent='',1200); }catch(e){ alert('Invalid JSON: '+e.message); } });
    // Copy/Download HTML
    $('#copy-html').addEventListener('click',async()=>{ const html=buildCurrentHtml(); try{ await navigator.clipboard.writeText(html); statusBar.textContent='Copied HTML'; setTimeout(()=>statusBar.textContent='',1200);}catch{ const ta=document.createElement('textarea'); ta.value=html; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); statusBar.textContent='Copied HTML'; setTimeout(()=>statusBar.textContent='',1200);} });
    $('#download-html').addEventListener('click',()=>{ const p=store.projects[currentProjectId]||{}; const html=buildCurrentHtml(); const blob=new Blob([html],{type:'text/html;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=((p.name||'email')+'.html').replace(/\s+/g,'-').toLowerCase(); a.click(); URL.revokeObjectURL(a.href); });

    // Project name
    projNameInput.addEventListener('input',()=>{ const p=store.projects[currentProjectId]; if(!p) return; p.name=projNameInput.value||'Untitled'; projTemplateName.textContent=p.name; p.updatedAt=Date.now(); saveStore(); });
  }

  // Boot
  loadStore();
  bindEvents();
  loadTemplateRegistry().then(renderDashboard).catch(renderDashboard);
})();
