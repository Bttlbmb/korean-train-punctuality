import {esc,stamp,getJSON} from './utils.js';
import {renderTrain} from './train.js';
const main=document.querySelector('#main'),id=new URLSearchParams(location.search).get('train')||'';
async function render(){
 main.setAttribute('aria-busy','true');
 try{
  const [meta,{days},stationIndex,train]=await Promise.all([getJSON('meta.json'),getJSON('days.json'),getJSON('stations/index.json',true),getJSON(`trains/${id}.json`,true)]);
  document.title=`Train ${id.split('-')[0]} · Korean Train Punctuality`;
  document.querySelector('#footer').innerHTML=`<p>Reported arrival delays from Korail, not official statistics. On time means within 5 minutes of schedule. Train list: Mikołaj Kuranowski’s GTFS (CC BY 4.0) · Updated ${esc(stamp(meta.generated_at))}</p>`;
  main.innerHTML=renderTrain(train,days,stationIndex);
 }catch(err){main.innerHTML='<div class="empty"><h2>Data could not be loaded. Try again in a minute.</h2><p><button id="retry">Try again</button></p></div>';console.error(err);}
 finally{main.setAttribute('aria-busy','false');}
}
document.addEventListener('click',e=>{if(e.target.closest('#retry'))render();});
const tooltip=document.querySelector('#tooltip');
function showTip(mark,event){if(!mark)return;tooltip.textContent=mark.dataset.tip;tooltip.hidden=false;const r=mark.getBoundingClientRect(),x=event?.clientX??r.left+r.width/2,y=event?.clientY??r.top+r.height;tooltip.style.left=Math.max(12,Math.min(innerWidth-tooltip.offsetWidth-12,x+14))+'px';tooltip.style.top=Math.max(12,Math.min(innerHeight-tooltip.offsetHeight-12,y+18))+'px';}
document.addEventListener('pointerover',e=>showTip(e.target.closest('[data-tip]'),e));document.addEventListener('pointermove',e=>{if(e.target.closest('[data-tip]'))showTip(e.target.closest('[data-tip]'),e);});document.addEventListener('pointerout',e=>{if(e.target.closest('[data-tip]'))tooltip.hidden=true;});document.addEventListener('focusin',e=>showTip(e.target.closest('[data-tip]')));document.addEventListener('focusout',()=>tooltip.hidden=true);document.addEventListener('pointerdown',e=>{const mark=e.target.closest('[data-tip]');if(e.pointerType==='touch'&&mark)showTip(mark,e);else if(!mark)tooltip.hidden=true;});document.addEventListener('keydown',e=>{if(e.key==='Escape')tooltip.hidden=true;});
// A request without a train id belongs on the front page, which is where the train links are.
if(/^\d+-[a-z-]+$/.test(id))render();else location.replace('./');
