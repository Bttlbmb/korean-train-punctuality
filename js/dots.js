import {esc,num,pct,hiddenTable} from './utils.js';
import {localizeTrain} from './locale.js';
let observer;
// One dot per train, in order of departure. A dot is in the late color when the train had at least one reported stop more than 5 minutes late.
const byDeparture=trains=>trains.slice().sort((a,b)=>a.departure.localeCompare(b.departure)||a.number-b.number);
const hadLate=t=>t.share_punctual!=null&&t.share_punctual<1;
export function trainDotsHTML(trains,locale='en'){
 const ts=byDeparture(trains),late=ts.filter(hadLate);
 if(locale==='ko')return `<div class="dot-field"><canvas id="dots" tabindex="0" role="img" aria-label="출발 시각순으로 열차 한 편당 점 하나를 표시합니다. ${num(ts.length)}편 중 ${num(late.length)}편은 한 곳 이상의 정차역에서 5분을 초과해 지연되었습니다. 방향키로 열차를 선택하고 Enter 키로 해당 열차의 페이지를 엽니다."></canvas><p class="meta dot-read" id="dot-read" aria-live="polite"></p><div class="legend"><span><i class="swatch"></i>도착 기록이 모두 5분 이내</span><span><i class="swatch" style="background:var(--d3)"></i>5분 초과 지연 기록 있음</span><span><i class="swatch" style="background:var(--line)"></i>도착 기록 없음</span></div></div>${hiddenTable('5분 초과 지연 기록이 있는 열차',['열차','운행 구간','출발 시각','5분 이내 도착 비율'],late.map(raw=>{const t=localizeTrain(raw);return [`${t.type} ${t.number}`,`${t.origin} → ${t.destination}`,t.departure,pct(t.share_punctual)];}))}`;
 return `<div class="dot-field"><canvas id="dots" tabindex="0" role="img" aria-label="One dot per train, in order of departure: ${num(late.length)} of ${num(ts.length)} trains had at least one stop more than 5 minutes late. Arrow keys step through the trains, and Enter opens the selected train’s page."></canvas><p class="meta dot-read" id="dot-read" aria-live="polite"></p><div class="legend"><span><i class="swatch"></i>On time at every stop</span><span><i class="swatch" style="background:var(--d3)"></i>Over 5 min late at a stop</span></div></div>${hiddenTable('Trains with at least one late stop',['Train','Route','Departs','Stops within 5 min'],late.map(t=>[`${t.type} ${t.number}`,`${t.origin} → ${t.destination}`,t.departure,pct(t.share_punctual)]))}`;
}
const trainHref=(t,locale)=>`${locale==='ko'?'ko/':''}train/${encodeURIComponent(t.id)}/`;
export function bindTrainDots(trains,{height=130,locale='en'}={}){
 const ko=locale==='ko';
 const canvas=document.querySelector('#dots'),read=document.querySelector('#dot-read');if(!canvas)return;
 const ts=byDeparture(trains);let active=-1,picked=-1,cols=1,pitch=9;
 const hint=ko?'출발 시각순으로 열차 한 편당 점 하나입니다. 점을 선택하면 열차 페이지가 열립니다.':'One dot per train, by departure time. Select to open.';
 const show=()=>{const raw=ts[active],t=ko&&raw?localizeTrain(raw):raw;
  if(ko){read.innerHTML=active<0?hint:`<b>${esc(t.type)} ${t.number}</b> · ${esc(t.origin)} → ${esc(t.destination)} · ${esc(t.departure)} 출발 · ${t.share_punctual==null?'도착 기록 없음':t.share_punctual===1?'도착 기록이 모두 5분 이내':`5분 이내 도착 비율 ${pct(t.share_punctual)}`}`;return;}
  read.innerHTML=active<0?hint:`<b>${esc(t.type)} ${t.number}</b> · ${esc(t.origin)} → ${esc(t.destination)} · departs ${esc(t.departure)} · ${t.share_punctual==null?'no reported stops':t.share_punctual===1?'within 5 min at every stop':`${pct(t.share_punctual)} of its stops within 5 min`}`;};
 function draw(){
  const width=canvas.parentElement.clientWidth;if(!width)return;
  const style=getComputedStyle(document.documentElement),on=style.getPropertyValue('--ontime').trim(),lt=style.getPropertyValue('--d3').trim(),none=style.getPropertyValue('--line').trim(),dpr=window.devicePixelRatio||1;
  pitch=Math.max(6,Math.min(16,Math.floor(Math.sqrt(width*height/ts.length))));cols=Math.floor(width/pitch);
  while(pitch>6&&Math.ceil(ts.length/cols)*pitch>height*1.1){pitch--;cols=Math.floor(width/pitch);}
  const h=Math.ceil(ts.length/cols)*pitch;canvas.width=Math.round(width*dpr);canvas.height=Math.round(h*dpr);canvas.style.height=h+'px';
  const g=canvas.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);
  const surface=style.getPropertyValue('--surface').trim();
  // Only the active dot changes: larger, darker, and ringed in the card color. The others keep their color.
  ts.forEach((t,n)=>{const x=(n%cols)*pitch+pitch/2,y=Math.floor(n/cols)*pitch+pitch/2,hl=n===active,base=t.share_punctual==null?none:hadLate(t)?lt:on;
   if(hl){g.fillStyle=surface;g.beginPath();g.arc(x,y,pitch*.56,0,6.2832);g.fill();}
   g.fillStyle=base;if(hl&&t.share_punctual!=null)g.fillStyle=`color-mix(in srgb,${base} 62%,${hadLate(t)?'#6a1e06':'#04402e'})`;
   g.beginPath();g.arc(x,y,pitch*(hl?.5:.42),0,6.2832);g.fill();});
 }
 const set=n=>{if(n!==active){active=n;canvas.style.cursor=n>=0?'pointer':'';draw();show();}};
 const indexAt=e=>{const b=canvas.getBoundingClientRect(),n=Math.floor((e.clientY-b.top)/pitch)*cols+Math.floor((e.clientX-b.left)/pitch);return n>=0&&n<ts.length?n:-1;};
 canvas.addEventListener('pointermove',e=>set(indexAt(e)));
 // A mouse click opens the page; on touch the first tap selects the dot and a second tap on it opens the page.
 canvas.addEventListener('click',e=>{const n=indexAt(e);if(n<0)return;if(e.pointerType==='touch'&&n!==picked){picked=n;set(n);return;}location.href=trainHref(ts[n],locale);});
 canvas.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')picked=-1;});
 canvas.addEventListener('pointerleave',()=>{if(picked<0)set(-1);});
 canvas.addEventListener('keydown',e=>{const step={ArrowRight:1,ArrowLeft:-1,ArrowDown:cols,ArrowUp:-cols}[e.key];if(step){e.preventDefault();set(Math.max(0,Math.min(ts.length-1,(active<0?(step>0?-step:0):active)+step)));}else if(e.key==='Enter'&&active>=0)location.href=trainHref(ts[active],locale);else if(e.key==='Escape'){picked=-1;set(-1);}});
 canvas.addEventListener('blur',()=>{if(picked<0)set(-1);});
 observer?.disconnect();observer=new ResizeObserver(draw);observer.observe(canvas.parentElement);
 draw();show();
}
