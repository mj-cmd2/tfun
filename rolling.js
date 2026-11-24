const editorialAssets={
 home:{before:[['hp-01',580,760],['hp-02',580,794],['hp-03',580,968]],after:[['hp-04',580,1568]]},
 tf:{before:[['2027-01',540,1132]],after:[['2027-02',540,676],['2027-03',540,762],['2027-04',540,1388]]}
};
function mountEditorial(context){
 const before=$('mock'),after=$('mockAfter');
 if(before.dataset.context===context)return;
 before.dataset.context=context;
 before.replaceChildren();after.replaceChildren();
 const sections=editorialAssets[context];
 before.classList.toggle('hidden',!sections);after.classList.toggle('hidden',!sections);
 if(!sections)return;
 function mount(target,items,eagerFirst){
  const frag=document.createDocumentFragment();
  items.forEach(([name,w,h],i)=>{
   const img=document.createElement('img');img.alt='Contenus éditoriaux de démonstration';img.width=w;img.height=h;img.decoding='async';img.loading=eagerFirst&&i===0?'eager':'lazy';img.src='./'+name+'.webp';frag.append(img);
  });target.append(frag);
 }
 mount(before,sections.before,true);mount(after,sections.after,false);
}

const $=id=>document.getElementById(id);const colors=['#080b64','#06a3c7','#ed007e','#d51c48','#006ac1','#e5ae00','#29976d','#8b53af','#dd7a36','#596b86','#a95072','#706546','#34948c','#a76c34','#637bd0','#a43b7d','#4b8d39','#a25844','#73812e','#8b84aa'];const people=Array.from({length:20},(_,i)=>({id:i,name:`${['A.','B.','C.','D.','E.','F.','G.','H.','I.','J.','K.','L.','M.','N.','O.','P.','Q.','R.','S.','T.'][i]} ${['Armand','Bernard','Caron','Dubois','Etienne','Faure','Girard','Hamon','Imbert','Joly','Klein','Laurent','Moreau','Noël','Olivier','Petit','Quentin','Roux','Simon','Thomas'][i]}`,party:`Parti ${String.fromCharCode(65+i)}`,color:colors[i]}));
const iso=d=>d.toISOString().slice(0,10),fmt=s=>new Date(s+'T12:00:00Z').toLocaleDateString('fr-FR',{day:'numeric',month:'short',timeZone:'UTC'});function dates(a,b){let arr=[];for(let d=new Date(a+'T12:00Z');iso(d)<=b;d.setUTCDate(d.getUTCDate()+1))if(d.getUTCDay()!=0&&d.getUTCDay()!=6)arr.push(iso(d));return arr}const full1=dates('2027-01-11','2027-04-18'),full2=dates('2027-04-19','2027-05-02');function make(ds,t){let old;return ds.map((date,k)=>{let n=t===2?2:date>='2027-03-15'?8:20;let weights=Array.from({length:n},(_,i)=>t===2?50+(i?1:-1)*5*Math.sin(k*.42):Math.max(.3,([29,16,14,13,8,5,4,3][i]||1.1)+(i<5?3*Math.sin(k*.17+i*1.9):.3*Math.sin(k*.3+i))));if(t===1&&k>4&&k%13===5&&old&&old.length===n) return {date,values:old.slice()};let sum=weights.reduce((a,b)=>a+b,0);let values=weights.map(v=>Math.round(v/sum*1000)/10);values[0]=Math.round((values[0]+100-values.reduce((a,b)=>a+b,0))*10)/10;old=values;return {date,values}})}const all={1:make(full1,1),2:make(full2,2)};
const rankCache=new WeakMap(), dateCache=new Map();
for(const series of Object.values(all))series.forEach((d,i)=>{rankCache.set(d,d.values.map((v,id)=>({...people[id],v,delta:i&&series[i-1].values[id]!=null?Math.round((v-series[i-1].values[id])*10)/10:null})).sort((a,b)=>b.v-a.v||a.id-b.id));dateCache.set(d.date,fmt(d.date));});

const setText=(el,v)=>{if(el.textContent!==String(v))el.textContent=v};
const setStyle=(el,k,v)=>{if(el.style[k]!==v)el.style[k]=v};
let structureKey='',chartKey='',axisKey='',timingKey='',timings=[],dataRevision=0;
let tour=1,index=0,playing=false,timer=null,used=(()=>{try{return sessionStorage.getItem('rolling-autoplay')==='1'}catch{return false}})(),visible=false,pausedViewport=false,data=[],nodes=new Map(),lastScrub=-1;function cfg(){return {view:$('view').value,mode:$('mode').value,limit:+$('limit').value,period:$('period').value,auto:$('auto').checked,variation:$('variation').checked,cta:$('cta').checked,scope:$('scope').value}}function ranked(i){return rankCache.get(data[i]).slice(0,cfg().limit)}function number(v){return v.toFixed(1).replace('.',',')}function stop(){playing=false;clearTimeout(timer);timer=null}function render(){
 const c=cfg();if(!data.length)return;
 const d=data[index],graph=c.view==='graph',context=$('context').value,layout=$('barLayout').value;
 const key=JSON.stringify([c,context,tour,dataRevision,layout,$('timelineOn').checked,$('controlPosition').value,$('titleInput').value,$('baselineInput').value]);
 if(key!==structureKey){
  structureKey=key;
  setText($('title'),$('titleInput').value);setText($('baseline'),$('baselineInput').value);
  document.querySelectorAll('[data-context]').forEach(b=>{let active=b.dataset.context===context;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active)});
  mountEditorial(context);
  $('tours').classList.remove('hidden');document.querySelectorAll('[data-tour]').forEach(b=>b.classList.toggle('active',+b.dataset.tour===tour));
  document.querySelectorAll('[data-view-icon]').forEach(b=>b.classList.toggle('active',b.dataset.viewIcon===c.view));
  $('viewToggle').setAttribute('aria-checked',graph);setText($('viewLabel'),graph?'Graphique':'Petits chevaux');
  $('race').classList.toggle('hidden',graph);$('graph').classList.toggle('hidden',!graph);$('legend').classList.add('hidden');$('graphDate').classList.add('hidden');$('controlPanel').classList.remove('hidden');$('visual').classList.toggle('graph-panel',graph);
  $('controls').classList.toggle('hidden',graph||c.mode==='static');$('timeline').classList.toggle('hidden',graph||c.mode==='static'||!$('timelineOn').checked);$('ctaButton').classList.toggle('hidden',!c.cta);
  let axis=timelineAxis();$('scrub').min=axis.start;$('scrub').max=axis.end;
  const ak=tour+':'+axis.end;if(ak!==axisKey){axisKey=ak;$('months').innerHTML=[...new Set(axis.dates.map(x=>new Date(x+'T12:00Z').toLocaleDateString('fr-FR',{month:'short'})))].map(x=>'<span>'+x+'</span>').join('')}
  updateControlLayout();
 }
 const date=dateCache.get(d.date)||fmt(d.date);
 setText($('date'),date);$('scrub').value=index;$('scrub').setAttribute('aria-valuetext',date);
 $('prev').disabled=playing||index===0;$('next').disabled=playing||index===data.length-1;$('play').disabled=data.length<2;
 setText($('play'),playing?'Ⅱ Pause':index===data.length-1?'↻ Rejouer':index===0?'▷ Lire':'▷ Reprendre');
 if(graph){draw();return}
 let top=layout==='uniform'?Infinity:layout==='levels'?3:Number(layout),rowOffset=i=>layout==='levels'?Math.min(i,3)*48+Math.min(Math.max(0,i-3),3)*35+Math.max(0,i-6)*26:Math.min(i,top)*48+Math.max(0,i-top)*35;
 let rows=ranked(index),ids=new Set(rows.map(p=>p.id)),cut=tour===1&&rows.length>2;
 for(let [id,node] of nodes)node.classList.toggle('hidden',!ids.has(id));
 rows.forEach((p,i)=>{
  let el=nodes.get(p.id);
  if(!el){el=document.createElement('div');el.className='candidate';el.innerHTML='<div class="name"></div><div class="track"><div class="bar"><span class="rank"></span><span class="portrait"></span><span class="score"><span class="scoreValue"></span><span class="delta"></span></span></div></div>';
   el.querySelector('.name').innerHTML=p.name+'<span class="party">'+p.party+'</span>';el.querySelector('.portrait').textContent=p.name[0]+p.name.split(' ')[1][0];el.querySelector('.bar').style.background=p.color;
   el.parts={bar:el.querySelector('.bar'),rank:el.querySelector('.rank'),score:el.querySelector('.scoreValue'),delta:el.querySelector('.delta')};
   nodes.set(p.id,el);$('race').append(el);
  }
  el.classList.remove('hidden');el.classList.toggle('compact',i>=top);el.classList.toggle('micro',layout==='levels'&&i>=6);
  setStyle(el,'transform','translateY('+(rowOffset(i)+(cut&&i>=2?18:0))+'px)');
  setStyle(el.parts.bar,'width',Math.min(100,p.v/55*100)+'%');setText(el.parts.rank,i+1);setText(el.parts.score,number(p.v)+' %');
  setText(el.parts.delta,c.variation&&p.delta!==null?(p.delta>0?'+':'')+number(p.delta)+' pt':'');
 });
 let line=$('race').querySelector('.cut');
 if(cut&&!line){line=document.createElement('div');line.className='cut';line.textContent='Deuxième tour';line.style.top='96px';$('race').append(line)}
 if(line)line.classList.toggle('hidden',!cut);
 setStyle($('race'),'height',(rowOffset(rows.length)+(cut?18:0))+'px');
}
function timelineAxis(){let full=tour===1?full1:full2;let scope=cfg().scope;let end=full.length-1;if(scope==='available')end=data.length-1;return {start:0,end,dates:full.slice(0,end+1)}}function draw(){
 const svg=$('graph'),L=25,R=190,T=14,B=320,den=Math.max(1,data.length-1),X=i=>L+i/den*(R-L),Y=v=>B-v/55*(B-T),shown=ranked(index),ids=new Set(shown.map(p=>p.id));
 const key=dataRevision+':'+cfg().limit+':'+(cfg().limit<20?[...ids].sort((a,b)=>a-b).join(','):'all');
 if(key!==chartKey||!svg.querySelector('.graph-overlay')){
  chartKey=key;let base='';
  for(let v=0;v<=50;v+=10)base+='<line x1="'+L+'" x2="320" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="#e0def2" stroke-dasharray="3 3"/><text x="1" y="'+(Y(v)+3)+'" font-size="9" fill="#3025ab">'+v+'%</text>';
  for(const p of people){
   if(cfg().limit<20&&!ids.has(p.id))continue;
   let paths=[],current=[];
   data.forEach((d,i)=>{if(d.values[p.id]!=null)current.push(X(i)+','+Y(d.values[p.id]));else if(current.length){paths.push(current);current=[]}});
   if(current.length)paths.push(current);
   for(const points of paths)base+='<polyline points="'+points.join(' ')+'" fill="none" stroke="'+p.color+'" stroke-width="1.8"/>';
  }
  let last='';data.forEach((d,i)=>{let m=d.date.slice(0,7);if(m!==last){base+='<text x="'+X(i)+'" y="338" font-size="9" fill="#3025ab">'+new Date(d.date+'T12:00Z').toLocaleDateString('fr-FR',{month:'short'})+'</text>';last=m}});
  svg.innerHTML='<g class="graph-base">'+base+'</g><g class="graph-overlay"></g>';
 }
 const xx=X(index),labels=shown,pos=labels.map(p=>Y(p.v));
 for(let i=1;i<pos.length;i++)pos[i]=Math.max(pos[i],pos[i-1]+14);
 if(pos.at(-1)>B){pos[pos.length-1]=B;for(let i=pos.length-2;i>=0;i--)pos[i]=Math.min(pos[i],pos[i+1]-14)}
 let overlay=svg.querySelector('.graph-overlay');
 let cursor=overlay.querySelector('.cursor');
 if(!cursor){cursor=document.createElementNS('http://www.w3.org/2000/svg','line');cursor.setAttribute('class','cursor');cursor.setAttribute('y1',T);cursor.setAttribute('y2',B);cursor.setAttribute('stroke','#777');cursor.setAttribute('stroke-dasharray','3 3');overlay.append(cursor)}
 cursor.setAttribute('x1',xx);cursor.setAttribute('x2',xx);
 const active=new Set(labels.map(p=>String(p.id)));
 overlay.querySelectorAll('[data-candidate]').forEach(n=>{n.style.display=active.has(n.dataset.candidate)?'':'none'});
 labels.forEach((p,i)=>{
  let group=overlay.querySelector('[data-candidate="'+p.id+'"]');
  if(!group){group=document.createElementNS('http://www.w3.org/2000/svg','g');group.dataset.candidate=p.id;group.innerHTML='<circle r="2.5" fill="'+p.color+'"/><line x2="198" stroke="'+p.color+'" opacity=".5" stroke-dasharray="2 2"/><text x="201" font-size="10" fill="#3025ab"></text>';overlay.append(group)}
  group.style.display='';const [circle,line,label]=group.children,y=Y(p.v);circle.setAttribute('cx',xx);circle.setAttribute('cy',y);line.setAttribute('x1',xx);line.setAttribute('y1',y);line.setAttribute('y2',pos[i]);label.setAttribute('y',pos[i]+3);setText(label,p.name+' '+number(p.v)+'%');
 });
}
function weights(){return data.slice(0,-1).map((d,i)=>{if($('speed').value==='linear')return 1;let next=data[i+1],change=d.values.reduce((s,v,j)=>s+Math.abs(v-(next.values[j]||0)),0);return .25+Math.log1p(change)})}function tick(){if(!playing)return;if(index>=data.length-1){stop();render();return}let key=dataRevision+':'+$('speed').value+':'+$('duration').value;if(key!==timingKey){timingKey=key;let ws=weights(),total=ws.reduce((a,b)=>a+b,0)||1;let duration=Math.min(90000,Math.max(5000,+$('duration').value*1000||30000));timings=ws.map(w=>duration*w/total)}let ms=timings[index];timer=setTimeout(()=>{index++;if(index===data.length-1)stop();render();tick()},ms)}function start(){cancelInteraction();if(data.length<2||cfg().mode==='static'||cfg().view==='graph')return;if(index===data.length-1)index=0;playing=true;used=true;try{sessionStorage.setItem('rolling-autoplay','1')}catch{};render();tick()}function maybeAuto(){if(!refreshing&&visible&&magnetReady()&&!$('settings').open&&!used&&cfg().auto&&cfg().mode==='dynamic'&&cfg().view==='race'){index=0;start()}}function reload(){cancelInteraction();stop();pausedViewport=false;if(cfg().period<'2027-04-19')tour=1;data=all[tour].filter(d=>d.date<=cfg().period);dataRevision++;index=Math.max(0,data.length-1);render();maybeAuto()}
$('play').onclick=()=>{if(playing){stop();render()}else start()};$('prev').onclick=()=>{if(index>0){index--;render()}};$('next').onclick=()=>{if(index<data.length-1){index++;render()}};let interactionFrame=0,pendingIndex=null;
function selectDate(next,fromScrub=false){const target=Math.max(0,Math.min(data.length-1,next));if(fromScrub){if(playing)stop();if(lastScrub!==target){navigator.vibrate?.(8);lastScrub=target}}
 pendingIndex=target;if(!interactionFrame)interactionFrame=requestAnimationFrame(()=>{interactionFrame=0;const n=pendingIndex;pendingIndex=null;if(n!==null){index=n;render()}})}
function cancelInteraction(){if(interactionFrame)cancelAnimationFrame(interactionFrame);interactionFrame=0;pendingIndex=null}
$('scrub').oninput=e=>selectDate(+e.target.value,true);let scrubbing=false;function scrubAt(e){let r=$('scrub').getBoundingClientRect(),ratio=Math.max(0,Math.min(1,(e.clientX-r.left-8)/(r.width-16)));$('scrub').value=Math.round(ratio*Number($('scrub').max));$('scrub').dispatchEvent(new Event('input'))} $('scrub').addEventListener('pointerdown',e=>{e.preventDefault();scrubbing=true;$('scrub').setPointerCapture(e.pointerId);scrubAt(e)});$('scrub').addEventListener('pointermove',e=>{if(scrubbing)scrubAt(e)});['pointerup','pointercancel'].forEach(t=>$('scrub').addEventListener(t,()=>scrubbing=false));$('scrub').addEventListener('wheel',e=>{e.preventDefault();$('scrub').value=Math.max(0,Math.min(data.length-1,(pendingIndex??index)+(e.deltaY>0||e.deltaX>0?1:-1)));$('scrub').dispatchEvent(new Event('input'))},{passive:false});document.querySelectorAll('[data-tour]').forEach(b=>b.onclick=()=>{tour=+b.dataset.tour;if(tour===2&&cfg().period<'2027-04-19')$('period').value='2027-04-30';reload()});$('viewToggle').onclick=()=>{$('view').value=cfg().view==='race'?'graph':'race';reload()};document.querySelectorAll('[data-context]').forEach(b=>b.onclick=()=>{$('context').value=b.dataset.context;preset()});$('openSettings').onclick=()=>$('settings').showModal();$('closeSettings').onclick=()=>$('settings').close();$('settings').addEventListener('click',e=>{if(e.target===$('settings')){let r=$('settings').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('settings').close()}});let drag=false;function explore(e){let r=$('graph').getBoundingClientRect(),x=(e.clientX-r.left)/r.width*330;selectDate(Math.round((x-25)/165*(data.length-1)))}$('graph').addEventListener('pointerdown',e=>{drag=true;$('graph').setPointerCapture(e.pointerId);explore(e)});$('graph').addEventListener('pointermove',e=>{if(drag||e.pointerType==='mouse')explore(e)});['pointerup','pointercancel'].forEach(x=>$('graph').addEventListener(x,()=>drag=false));function preset(){cancelInteraction();resetMagnet();visible=false;window.scrollTo(0,0);let x=$('context').value;$('view').value='race';$('mode').value=x==='home'?'static':'dynamic';$('limit').value=x==='landing'?'20':'5';$('auto').checked=x==='landing'||x==='tf';$('cta').checked=x!=='landing';reload();requestAnimationFrame(()=>{let r=$('visual').getBoundingClientRect();visible=r.top<innerHeight&&r.bottom>0;maybeAuto()})}$('context').onchange=preset;for(let id of ['view','mode','period'])$(id).onchange=reload;for(let id of ['limit','variation','cta','scope','timelineOn','titleInput','baselineInput','barLayout','controlPosition'])$(id).oninput=render;$('auto').onchange=maybeAuto;for(let id of ['duration','speed'])$(id).onchange=()=>{if(playing){clearTimeout(timer);tick()}};$('ctaButton').onclick=()=>{$('context').value='landing';preset();$('module').scrollIntoView({behavior:'smooth'})};let refreshing=false;
function refreshTest(){
 cancelInteraction();refreshing=true;stop();pausedViewport=false;used=false;visible=false;lastScrub=-1;
 try{sessionStorage.removeItem('rolling-autoplay')}catch{}
 if($('settings').open)$('settings').close();
 window.scrollTo({top:0,behavior:'instant'});$('race').scrollTop=0;$('visual').scrollTop=0;resetMagnet();reload();
 requestAnimationFrame(()=>{requestAnimationFrame(()=>{resetMagnet();let r=$('visual').getBoundingClientRect();visible=r.top<innerHeight&&r.bottom>0;refreshing=false;maybeAuto()})});
}
$('reset').onclick=refreshTest;$('refreshTest').onclick=refreshTest;
let magnetLatched=false, magnetLastY=window.scrollY, magnetFrame=0, snapping=false, snapToken=0;
function updateControlLayout(){const el=$('rollingComponent'), active=cfg().view==='race'&&cfg().mode==='dynamic', pos=$('controlPosition').value;el.classList.toggle('global-controls',active&&pos==='global');el.classList.toggle('internal-controls',active&&pos==='internal');if(active&&pos==='internal'){const header=document.querySelector('.app-header').offsetHeight+el.querySelector('header').offsetHeight+el.querySelector('.module-toolbar').offsetHeight;el.style.setProperty('--race-max',Math.max(120,innerHeight-header-$('controlPanel').offsetHeight-55)+'px')}}
function resetMagnet(){magnetLatched=false;magnetLastY=window.scrollY;snapping=false;snapToken++}
function geometry(){const r=$('rollingComponent').getBoundingClientRect(),top=Math.max(0,document.querySelector('.app-header').getBoundingClientRect().bottom),bottom=innerHeight;return {r,top,bottom,px:Math.max(0,Math.min(r.bottom,bottom)-Math.max(r.top,top))}}
function magnetReady(){if(!$('magnet').checked)return true;const {r,top}=geometry();return !snapping&&(magnetLatched||Math.abs(r.top-top)<8||r.top<top)}
function magnetCheck(){
 magnetFrame=0;const y=scrollY,down=y>magnetLastY;magnetLastY=y;
 const {r,top,bottom,px}=geometry();if(!px&&!snapping)magnetLatched=false;
 if(snapping||!$('magnet').checked||$('settings').open||!down||magnetLatched||r.height<=0||r.top<=top+2||px/Math.min(r.height,Math.max(1,bottom-top))<=Number($('magnetThreshold').value))return;
 magnetLatched=true;snapping=true;const token=++snapToken,target=y+r.top-top;let last=y,stable=0,frames=0;
 scrollTo({top:target,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 function settle(){if(token!==snapToken)return;const now=scrollY;stable=Math.abs(now-last)<.5?stable+1:0;last=now;frames++;if(Math.abs(now-target)<2||stable>=8||frames>120){snapping=false;maybeAuto();return}requestAnimationFrame(settle)}requestAnimationFrame(settle);
}
window.addEventListener('scroll',()=>{if(!magnetFrame)magnetFrame=requestAnimationFrame(magnetCheck)},{passive:true});
window.addEventListener('resize',updateControlLayout);
for(const id of ['magnet','magnetThreshold'])$(id).addEventListener('change',()=>{resetMagnet();maybeAuto()});
$('settings').addEventListener('close',()=>{updateControlLayout();maybeAuto()});
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible&&playing){pausedViewport=true;stop();render()}else if(visible){if(pausedViewport){pausedViewport=false;render()}else maybeAuto()}},{threshold:0}).observe($('visual'));reload();