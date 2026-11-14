import {esc,num,pct,date,getJSON} from './utils.js';
import {bindTrainDots} from './dots.js';
import {renderFront} from './front.js';
import {localeUtils,configureKoreanStations} from './locale.js';
// The built front page arrives with yesterday's figures. This refreshes it from the data, so the wording stays true on a day without an update, and makes the dots and bars interactive.
const main=document.querySelector('#main'),locale=document.documentElement.lang==='ko'?'ko':'en',ko=locale==='ko',localized=localeUtils(locale);
if(ko)configureKoreanStations(JSON.parse(document.querySelector('#korean-stations')?.textContent||'{}'));
const lateOf=s=>s.late??s.stops-s.punctual;
let barItems=[];
function bindBars(){
 const bars=document.querySelector('.bars'),read=document.querySelector('#bar-read');if(!bars)return;let active=-1,picked=-1;
 const hint=ko?'막대 하나가 하루입니다. 막대를 선택하면 해당 날짜의 페이지가 열립니다.':'One bar per day. Select to open.';
 const show=()=>{if(active<0){read.textContent=hint;return;}const {iso,d}=barItems[active],day=d?.weekday??new Date(iso+'T12:00:00+09:00').toLocaleDateString('en-GB',{weekday:'short',timeZone:'Asia/Seoul'});
  if(ko){read.innerHTML=d?`<b>${localized.date(iso)}</b> · 5분 이내 도착 비율 ${pct(d.share_punctual)} · 도착 기록 ${num(d.stops)}건 중 ${num(lateOf(d))}건이 5분 초과 지연`:`<b>${localized.date(iso)}</b> · 자료 미수집`;return;}
  read.innerHTML=d?`<b>${esc(day)} ${date(iso)}</b> · ${pct(d.share_punctual)} within 5 min · ${num(lateOf(d))} of ${num(d.stops)} stops late`:`<b>${esc(day)} ${date(iso)}</b> · not collected`;};
 const set=i=>{if(i===active)return;active=i;bars.querySelectorAll('.col').forEach((c,k)=>c.classList.toggle('on',k===i));show();};
 bars.addEventListener('pointerover',e=>{const c=e.target.closest('.col');if(c)set(+c.dataset.i);});
 // A bar with data is a link, so a mouse click follows it; on touch the first tap selects the bar and a second tap on it follows the link.
 const open=i=>{if(barItems[i]?.d)location.href=`${ko?'ko/':''}day/${barItems[i].iso}/`;};
 bars.addEventListener('click',e=>{const c=e.target.closest('.col');if(!c)return;const i=+c.dataset.i;if(!barItems[i].d)return;if(e.pointerType==='touch'&&i!==picked){e.preventDefault();picked=i;set(i);}});
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
  document.querySelector('#footer').innerHTML=localized.footer(meta);
  const front=renderFront(meta,days,y,m,locale);
  main.innerHTML=front.html;barItems=front.barItems;
  if(y.trains?.length)bindTrainDots(y.trains,{height:130,locale});
  bindBars();
 }catch(err){main.innerHTML=ko?'<div class="empty"><h2>자료를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</h2><p><button id="retry">다시 시도</button></p></div>':'<div class="empty"><h2>Data could not be loaded. Try again in a minute.</h2><p><button id="retry">Try again</button></p></div>';console.error(err);}
 finally{main.setAttribute('aria-busy','false');}
}
document.addEventListener('click',e=>{if(e.target.closest('#retry'))render();});
render();
