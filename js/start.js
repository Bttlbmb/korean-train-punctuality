import {esc,num,pct,date,range,footer,getJSON,hiddenTable,empty} from './utils.js';
import {trainDotsHTML,bindTrainDots} from './dots.js';
const main=document.querySelector('#main');
const lateOf=s=>s.late??s.stops-s.punctual;
let barItems=[];
const shareColor=n=>`var(--${n>=.90?'ontime':n>=.85?'d1':n>=.80?'d2':n>=.75?'d3':n>=.65?'d4':'d5'})`;
const period=(eyebrow,big,sentence,sub,vis)=>`<section class="period"><div class="p-num"><p class="eyebrow">${eyebrow}</p><div class="hero">${big}</div></div><div class="p-text"><h2>${sentence}</h2><p class="sub">${sub}</p></div><div class="p-vis">${vis}</div></section>`;
// Yesterday in Korea time. "Yesterday" and "past 30 days" are only true when the newest complete day is this date.
const isFresh=to=>to===new Date(Date.now()-864e5).toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'});
function yesterdayRow(w,s){
 const trains=w.trains||[];
 const sub=s.typical_late_delay!=null?`Typical delay when late: ${s.typical_late_delay} min`:'';
 const day=(opts)=>new Date(w.to+'T12:00:00+09:00').toLocaleDateString('en-GB',{...opts,timeZone:'Asia/Seoul'}),short=day({weekday:'short',day:'numeric',month:'short'}),fresh=isFresh(w.to);
 return period(fresh?`Yesterday · ${short}`:short,pct(s.share_punctual),`of Korail train stops were on time ${fresh?'yesterday':'on '+day({weekday:'long',day:'numeric',month:'long'})}.`,sub,trains.length?trainDotsHTML(trains):'<p class="muted">Train data is not available for this date.</p>');
}
function monthRow(w,s,days){
 const inWindow=days.filter(d=>d.date>=w.from&&d.date<=w.to&&d.share_punctual!=null),byDate=new Map(inWindow.map(d=>[d.date,d])),worst=inWindow.length>1?inWindow.reduce((a,b)=>b.share_punctual<a.share_punctual?b:a):null,best=inWindow.length>1?inWindow.reduce((a,b)=>b.share_punctual>a.share_punctual?b:a):null;
 const dates=[];for(let t=new Date(w.from+'T12:00:00Z');t<=new Date(w.to+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+1))dates.push(t.toISOString().slice(0,10));
 barItems=dates.map(iso=>({iso,d:byDate.get(iso)}));
 const bars=barItems.map(({d},i)=>d?`<span class="col link" data-i="${i}"><i style="height:${Math.max(.5,d.share_punctual*100)}%;background:${shareColor(d.share_punctual)}"></i></span>`:`<span class="col" data-i="${i}"><i class="uncollected" style="height:6px"></i></span>`).join('');
 const sub=[s.typical_late_delay!=null?`Typical delay when late: ${s.typical_late_delay} min`:'',best?`Best day: ${esc(best.weekday)} ${date(best.date)} (${pct(best.share_punctual)})`:'',worst?`Worst day: ${esc(worst.weekday)} ${date(worst.date)} (${pct(worst.share_punctual)})`:''].filter(Boolean).join('<br>');
 const fresh=isFresh(w.to),period30=w.days<30?`the ${w.days} days collected so far`:fresh?'the past 30 days':`the 30 days to ${date(w.to)}`;
 const vis=`<div class="bars-wrap"><span class="axis-label" style="bottom:100%">100%</span><span class="axis-label" style="bottom:50%">50%</span><span class="axis-label" style="bottom:0">0%</span><div class="bars" tabindex="0" role="img" aria-label="Share of stops within 5 minutes for each day, on a 0 to 100 percent axis, ${esc(range(w.from,w.to))}. Arrow keys step through the days, and Enter opens the selected day’s page.">${bars}</div></div><div class="bar-dates"><span class="meta">${date(w.from)}</span><span class="meta">${date(w.to)}</span></div><p class="meta dot-read" id="bar-read" aria-live="polite"></p>${hiddenTable('Daily punctuality',['Date','Within 5 min'],inWindow.map(d=>[d.date,pct(d.share_punctual)]))}`;
 return period(fresh?`Past 30 days · ${range(w.from,w.to,false)}`:range(w.from,w.to,false),pct(s.share_punctual),`of stops were on time in ${period30}.`,sub,vis);
}
function bindBars(){
 const bars=document.querySelector('.bars'),read=document.querySelector('#bar-read');if(!bars)return;let active=-1,picked=-1;
 const hint='Move over a bar to see the day, and click it to open its page.';
 const show=()=>{if(active<0){read.textContent=hint;return;}const {iso,d}=barItems[active],day=d?.weekday??new Date(iso+'T12:00:00+09:00').toLocaleDateString('en-GB',{weekday:'short',timeZone:'Asia/Seoul'});
  read.innerHTML=d?`<b>${esc(day)} ${date(iso)}</b> · ${pct(d.share_punctual)} within 5 min · ${num(lateOf(d))} of ${num(d.stops)} stops late`:`<b>${esc(day)} ${date(iso)}</b> · not collected`;};
 const set=i=>{if(i===active)return;active=i;bars.classList.toggle('has-active',i>=0);bars.querySelectorAll('.col').forEach((c,k)=>c.classList.toggle('on',k===i));show();};
 bars.addEventListener('pointerover',e=>{const c=e.target.closest('.col');if(c)set(+c.dataset.i);});
 // A mouse click opens the day's page; on touch the first tap selects the bar and a second tap on it opens the page.
 const open=i=>{if(barItems[i]?.d)location.href=`app.html?day=${barItems[i].iso}`;};
 bars.addEventListener('click',e=>{const c=e.target.closest('.col');if(!c)return;const i=+c.dataset.i;if(!barItems[i].d)return;if(e.pointerType==='touch'&&i!==picked){picked=i;set(i);return;}open(i);});
 bars.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')picked=-1;});
 bars.addEventListener('pointerleave',()=>{if(picked<0)set(-1);});
 bars.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();set(Math.max(0,Math.min(barItems.length-1,(active<0?(e.key==='ArrowRight'?-1:barItems.length):active)+(e.key==='ArrowRight'?1:-1))));}else if(e.key==='Enter'&&active>=0)open(active);else if(e.key==='Escape'){picked=-1;set(-1);}});
 bars.addEventListener('blur',()=>{if(picked<0)set(-1);});
 show();
}
async function render(){
 main.setAttribute('aria-busy','true');
 try{
  const [meta,{days},y,m]=await Promise.all([getJSON('meta.json'),getJSON('days.json'),getJSON('windows/yesterday.json'),getJSON('windows/month.json')]);
  const ys=y.summary?.all,ms=m.summary?.all;
  document.querySelector('#footer').innerHTML=footer(meta);
  if(!ys?.stops||!ms?.stops){main.innerHTML=empty('No complete days yet.',`<p class="muted">${meta.collecting_date?date(meta.collecting_date,true)+' is still collecting. ':''}Punctuality figures appear after a day is complete.</p>`);return;}
  main.innerHTML=`<h1 class="sr-only">How punctual are South Korea’s trains?</h1>`+yesterdayRow(y,ys)+monthRow(m,ms,days);
  if(y.trains?.length)bindTrainDots(y.trains,{height:130});
  bindBars();
 }catch(err){main.innerHTML='<div class="empty"><h2>Data could not be loaded. Try again in a minute.</h2><p><button id="retry">Try again</button></p></div>';console.error(err);}
 finally{main.setAttribute('aria-busy','false');}
}
document.addEventListener('click',e=>{if(e.target.closest('#retry'))render();});
render();
