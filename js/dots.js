import {num,pct,hiddenTable} from './utils.js';
const hour=h=>`${String(h.hour%24).padStart(2,'0')}:00–${String((h.hour+1)%24).padStart(2,'0')}:00${h.hour>=24?' (+1 day)':''}`;
const rows=hours=>hours.filter(h=>h.arrivals).sort((a,b)=>a.hour-b.hour);
let observer;
export function dotFieldHTML(hours){
 const r=rows(hours),stops=r.reduce((a,h)=>a+h.arrivals,0),late=r.reduce((a,h)=>a+h.late,0);
 return `<div class="dot-field"><canvas id="dots" tabindex="0" role="img" aria-label="One dot per train stop, in scheduled-arrival order: ${num(late)} of ${num(stops)} stops were more than 5 minutes late. Arrow keys step through the hours."></canvas><p class="meta dot-read" id="dot-read" aria-live="polite"></p><div class="legend"><span><i class="swatch"></i>Within 5 min</span><span><i class="swatch" style="background:var(--d3)"></i>More than 5 min late</span><span>One dot per stop</span></div></div>${hiddenTable('Arrivals by hour',['Hour KST','Arrivals','More than 5 min late'],r.map(h=>[hour(h),h.arrivals,h.late]))}`;
}
// Within an hour only the counts are known, so the late dots are placed at random inside their hour, seeded by the date so a reload looks the same.
export function bindDotField(hours,iso,{height=90}={}){
 const canvas=document.querySelector('#dots'),read=document.querySelector('#dot-read');if(!canvas)return;
 const r=rows(hours);let seed=[...iso].reduce((a,c)=>a*31+c.charCodeAt(0)|0,7);const next=()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
 const dotList=[],hourList=[];
 r.forEach((h,k)=>{
  const a=Array.from({length:h.arrivals},(_,j)=>j<h.late?1:0);for(let j=a.length-1;j>0;j--){const m=Math.floor(next()*(j+1));[a[j],a[m]]=[a[m],a[j]];}
  a.forEach(v=>{dotList.push(v);hourList.push(k);});});
 const total=dotList.length,dots=Uint8Array.from(dotList),hourOf=Uint8Array.from(hourList);
 let active=-1,cols=1,pitch=2.5;
 const hint='Dots run in time order, 05:00 at the top left to after midnight at the bottom right. Move over them to see the hour.';
 const show=()=>{read.textContent=active<0?hint:`${hour(r[active])} · ${num(r[active].late)} of ${num(r[active].arrivals)} stops more than 5 min late (${pct(r[active].late/r[active].arrivals)})`;};
 function draw(){
  const width=canvas.parentElement.clientWidth;if(!width)return;
  const style=getComputedStyle(document.documentElement),on=style.getPropertyValue('--ontime').trim(),late=style.getPropertyValue('--d3').trim(),dpr=window.devicePixelRatio||1,fit=Math.sqrt(width*height/total);
  pitch=Math.max(2,Math.min(4,Math.round(fit*2)/2));cols=Math.floor(width/pitch);
  const h=Math.ceil(total/cols)*pitch,onR=pitch*.38,lateR=pitch*.5;
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(h*dpr);canvas.style.height=h+'px';
  const g=canvas.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);
  for(let n=0;n<total;n++){g.globalAlpha=active<0||hourOf[n]===active?1:.25;g.fillStyle=dots[n]?late:on;g.beginPath();g.arc((n%cols)*pitch+pitch/2,Math.floor(n/cols)*pitch+pitch/2,dots[n]?lateR:onR,0,6.2832);g.fill();}
 }
 const set=k=>{if(k!==active){active=k;draw();show();}};
 canvas.addEventListener('pointermove',e=>{const b=canvas.getBoundingClientRect(),n=Math.floor((e.clientY-b.top)/pitch)*cols+Math.floor((e.clientX-b.left)/pitch);set(n>=0&&n<total?hourOf[n]:-1);});
 canvas.addEventListener('pointerleave',()=>set(-1));
 canvas.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();set(Math.min(r.length-1,active+1));}else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();set(Math.max(0,active-1));}else if(e.key==='Escape')set(-1);});
 canvas.addEventListener('blur',()=>set(-1));
 observer?.disconnect();observer=new ResizeObserver(draw);observer.observe(canvas.parentElement);
 draw();show();
}
// One dot per train, in order of departure. A dot is in the late color when the train had at least one reported stop more than 5 minutes late.
const byDeparture=trains=>trains.slice().sort((a,b)=>a.departure.localeCompare(b.departure)||a.number-b.number);
const hadLate=t=>t.share_punctual!=null&&t.share_punctual<1;
export function trainDotsHTML(trains){
 const ts=byDeparture(trains),late=ts.filter(hadLate);
 return `<div class="dot-field"><canvas id="dots" tabindex="0" role="img" aria-label="One dot per train, in order of departure: ${num(late.length)} of ${num(ts.length)} trains had at least one stop more than 5 minutes late. Arrow keys step through the trains."></canvas><p class="meta dot-read" id="dot-read" aria-live="polite"></p><div class="legend"><span><i class="swatch"></i>On time at every stop</span><span><i class="swatch" style="background:var(--d3)"></i>At least one stop more than 5 min late</span></div></div>${hiddenTable('Trains with at least one late stop',['Train','Route','Departs','Stops within 5 min'],late.map(t=>[`${t.type} ${t.number}`,`${t.origin} → ${t.destination}`,t.departure,pct(t.share_punctual)]))}`;
}
export function bindTrainDots(trains,{height=130}={}){
 const canvas=document.querySelector('#dots'),read=document.querySelector('#dot-read');if(!canvas)return;
 const ts=byDeparture(trains);let active=-1,cols=1,pitch=9;
 const hint='Each dot is a train, in order of departure. Move over a dot to see the train.';
 const show=()=>{const t=ts[active];read.innerHTML=active<0?hint:`<b>${t.type} ${t.number}</b> · ${t.origin} → ${t.destination} · departs ${t.departure} · ${t.share_punctual==null?'no reported stops':t.share_punctual===1?'within 5 min at every stop':`${pct(t.share_punctual)} of its stops within 5 min`}`;};
 function draw(){
  const width=canvas.parentElement.clientWidth;if(!width)return;
  const style=getComputedStyle(document.documentElement),on=style.getPropertyValue('--ontime').trim(),lt=style.getPropertyValue('--d3').trim(),none=style.getPropertyValue('--line').trim(),dpr=window.devicePixelRatio||1;
  pitch=Math.max(6,Math.min(16,Math.floor(Math.sqrt(width*height/ts.length))));cols=Math.floor(width/pitch);
  while(pitch>6&&Math.ceil(ts.length/cols)*pitch>height*1.1){pitch--;cols=Math.floor(width/pitch);}
  const h=Math.ceil(ts.length/cols)*pitch;canvas.width=Math.round(width*dpr);canvas.height=Math.round(h*dpr);canvas.style.height=h+'px';
  const g=canvas.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);
  ts.forEach((t,n)=>{g.globalAlpha=active<0||n===active?1:.45;g.fillStyle=t.share_punctual==null?none:hadLate(t)?lt:on;g.beginPath();g.arc((n%cols)*pitch+pitch/2,Math.floor(n/cols)*pitch+pitch/2,pitch*(n===active?.5:.42),0,6.2832);g.fill();});
 }
 const set=n=>{if(n!==active){active=n;draw();show();}};
 canvas.addEventListener('pointermove',e=>{const b=canvas.getBoundingClientRect(),n=Math.floor((e.clientY-b.top)/pitch)*cols+Math.floor((e.clientX-b.left)/pitch);set(n>=0&&n<ts.length?n:-1);});
 canvas.addEventListener('pointerleave',()=>set(-1));
 canvas.addEventListener('keydown',e=>{const step={ArrowRight:1,ArrowLeft:-1,ArrowDown:cols,ArrowUp:-cols}[e.key];if(step){e.preventDefault();set(Math.max(0,Math.min(ts.length-1,(active<0?(step>0?-step:0):active)+step)));}else if(e.key==='Escape')set(-1);});
 canvas.addEventListener('blur',()=>set(-1));
 observer?.disconnect();observer=new ResizeObserver(draw);observer.observe(canvas.parentElement);
 draw();show();
}
