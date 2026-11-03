import {footer,getJSON} from './utils.js';
import {renderTrain,pageInfo} from './train.js';
const main=document.querySelector('#main'),id=new URLSearchParams(location.search).get('train')||'';
// The title, description, and canonical address for search engines. A page with nothing to show asks not to be indexed.
function describePage(info){
 document.head.appendChild(Object.assign(document.createElement('link'),{rel:'canonical',href:new URL(`./app.html?train=${encodeURIComponent(id)}`,document.baseURI).href}));
 if(!info){document.head.appendChild(Object.assign(document.createElement('meta'),{name:'robots',content:'noindex'}));return;}
 document.title=info.title;document.querySelector('meta[name=description]').content=info.description;
}
async function render(){
 main.setAttribute('aria-busy','true');
 try{
  const [meta,{days},stationIndex,train]=await Promise.all([getJSON('meta.json'),getJSON('days.json'),getJSON('stations/index.json',true),getJSON(`trains/${id}.json`,true)]);
  describePage(pageInfo(train));
  document.querySelector('#footer').innerHTML=footer(meta);
  main.innerHTML=renderTrain(train,days,stationIndex);
  bindDayStrip();
 }catch(err){main.innerHTML='<div class="empty"><h2>Data could not be loaded. Try again in a minute.</h2><p><button id="retry">Try again</button></p></div>';console.error(err);}
 finally{main.setAttribute('aria-busy','false');}
}
document.addEventListener('click',e=>{if(e.target.closest('#retry'))render();});
const tooltip=document.querySelector('#tooltip');
function bindDayStrip(){
 const strip=document.querySelector('.day-strip');if(!strip)return;
 const cells=[...strip.children];let active=-1;
 const rail=document.querySelector('.rail'),mark=i=>{rail?.classList.toggle('has-hl',i>=0);rail?.querySelectorAll('.rail-dot').forEach(d=>d.classList.toggle('hl',i>=0&&d.dataset.date===cells[i].dataset.date));};
 strip.addEventListener('pointerover',e=>{const c=e.target.closest('.day-cell');if(c)mark(cells.indexOf(c));});strip.addEventListener('pointerleave',()=>mark(active));
 const set=i=>{mark(i);active=i;strip.classList.toggle('has-active',i>=0);cells.forEach((c,k)=>c.classList.toggle('on',k===i));if(i<0)tooltip.hidden=true;else showTip(cells[i]);};
 strip.addEventListener('keydown',e=>{const step={ArrowRight:1,ArrowLeft:-1}[e.key];if(step){e.preventDefault();set(Math.max(0,Math.min(cells.length-1,(active<0?(step>0?-1:cells.length):active)+step)));}else if(e.key==='Escape')set(-1);});
 strip.addEventListener('blur',()=>set(-1));
}
function showTip(mark,event){if(!mark)return;tooltip.textContent=mark.dataset.tip;tooltip.hidden=false;const r=mark.getBoundingClientRect(),x=event?.clientX??r.left+r.width/2,y=event?.clientY??r.top+r.height;tooltip.style.left=Math.max(12,Math.min(innerWidth-tooltip.offsetWidth-12,x+14))+'px';tooltip.style.top=Math.max(12,Math.min(innerHeight-tooltip.offsetHeight-12,y+18))+'px';}
document.addEventListener('pointerover',e=>showTip(e.target.closest('[data-tip]'),e));document.addEventListener('pointermove',e=>{if(e.target.closest('[data-tip]'))showTip(e.target.closest('[data-tip]'),e);});document.addEventListener('pointerout',e=>{if(e.target.closest('[data-tip]'))tooltip.hidden=true;});document.addEventListener('focusin',e=>showTip(e.target.closest('[data-tip]')));document.addEventListener('focusout',()=>tooltip.hidden=true);document.addEventListener('pointerdown',e=>{const mark=e.target.closest('[data-tip]');if(e.pointerType==='touch'&&mark)showTip(mark,e);else if(!mark)tooltip.hidden=true;});document.addEventListener('keydown',e=>{if(e.key==='Escape')tooltip.hidden=true;});
// A request without a train id belongs on the front page, which is where the train links are.
if(/^\d+-[a-z-]+$/.test(id))render();else location.replace('./');
