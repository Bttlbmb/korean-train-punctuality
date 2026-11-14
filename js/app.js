// The pages arrive built by scripts/build.mjs. This adds the tooltips, on a train page the day strip that highlights one day's dots, on the list pages the filters, and a back arrow that goes back one page when the reader came from this site.
const tooltip=document.querySelector('#tooltip');
function bindDayStrip(){
 const strip=document.querySelector('.day-strip');if(!strip)return;
 const cells=[...strip.children];let active=-1;
 const rail=document.querySelector('.rail'),mark=i=>{rail?.querySelectorAll('.rail-dot').forEach(d=>d.classList.toggle('hl',i>=0&&d.dataset.date===cells[i].dataset.date));rail?.querySelector('.rail-run')?.remove();if(!rail||i<0)return;const o=rail.getBoundingClientRect(),p=[...rail.querySelectorAll('.rail-dot.hl')].map(d=>{const r=d.getBoundingClientRect();return [r.left+r.width/2-o.left,r.top+r.height/2-o.top];});if(p.length<2)return;rail.insertAdjacentHTML('beforeend',`<svg class="rail-run" width="${o.width}" height="${o.height}" aria-hidden="true"><path d="${p.map((q,k)=>(k?'L':'M')+q[0].toFixed(1)+','+q[1].toFixed(1)).join('')}"/></svg>`);};
 strip.addEventListener('pointerover',e=>{const c=e.target.closest('.day-cell');if(c)mark(cells.indexOf(c));});strip.addEventListener('pointerleave',()=>mark(active));
 const set=i=>{mark(i);active=i;cells.forEach((c,k)=>c.classList.toggle('on',k===i));if(i<0)tooltip.hidden=true;else showTip(cells[i]);};
 strip.addEventListener('keydown',e=>{const step={ArrowRight:1,ArrowLeft:-1}[e.key];if(step){e.preventDefault();set(Math.max(0,Math.min(cells.length-1,(active<0?(step>0?-1:cells.length):active)+step)));}else if(e.key==='Escape')set(-1);});
 strip.addEventListener('blur',()=>set(-1));
}
function showTip(mark,event){if(!mark)return;tooltip.textContent=mark.dataset.tip;tooltip.hidden=false;const r=mark.getBoundingClientRect(),x=event?.clientX??r.left+r.width/2,y=event?.clientY??r.top+r.height;tooltip.style.left=Math.max(12,Math.min(innerWidth-tooltip.offsetWidth-12,x+14))+'px';tooltip.style.top=Math.max(12,Math.min(innerHeight-tooltip.offsetHeight-12,y+18))+'px';}
document.addEventListener('pointerover',e=>showTip(e.target.closest('[data-tip]'),e));document.addEventListener('pointermove',e=>{if(e.target.closest('[data-tip]'))showTip(e.target.closest('[data-tip]'),e);});document.addEventListener('pointerout',e=>{if(e.target.closest('[data-tip]'))tooltip.hidden=true;});document.addEventListener('focusin',e=>showTip(e.target.closest('[data-tip]')));document.addEventListener('focusout',()=>tooltip.hidden=true);document.addEventListener('pointerdown',e=>{const mark=e.target.closest('[data-tip]');if(e.pointerType==='touch'&&mark)showTip(mark,e);else if(!mark)tooltip.hidden=true;});document.addEventListener('keydown',e=>{if(e.key==='Escape')tooltip.hidden=true;});
bindDayStrip();
// On a phone a stop's track is 78 to 130 px for a 17-minute axis, so the stacks of days with the same delay run into their neighbors. This lays the dots out again with the track's real width (a tighter grid and, under 100 px, smaller dots):
// a stack keeps its minute unless a neighbor needs the room, and no dot crosses the dashed 5-minute line or leaves the track. The .out dots (later than the axis, with an arrow) stay at the track's end, in one stack of up to 5 arrows 5.5 px apart at every width (an arrowhead is about 5 px tall) whose extra columns step inward, and the other dots keep clear of them. The built page has the unpacked layout (see dotsHTML in train.js).
function packRailDots(){
 for(const track of document.querySelectorAll('.rail-track')){
  const dots=[...track.querySelectorAll('.rail-dot:not(.out)')],outs=[...track.querySelectorAll('.rail-dot.out')];if(!dots.length&&!outs.length)continue;
  const W=track.clientWidth,[pitch,perColumn,size]=W<100?[4.2,7,3.8]:W<260?[4.8,6,4.5]:[5.5,5,4.5],limit=track.querySelector('.rail-limit'),line=limit?parseFloat(limit.style.left)/100*W:W;
  track.style.setProperty('--dot',size+'px');const room=outs.length?(Math.ceil(outs.length/5)-1)*12+2.5:0,bins=new Map();for(const d of dots){const x=parseFloat(d.style.left.match(/calc\(([-\d.]+)%/)?.[1]??d.dataset.x);d.dataset.x=x;const key=(d.classList.contains('late')?'L':'O')+x;if(!bins.has(key))bins.set(key,{x,late:d.classList.contains('late'),dots:[]});bins.get(key).dots.push(d);}
  for(const late of [false,true]){
   const group=[...bins.values()].filter(b=>b.late===late).sort((a,b)=>a.x-b.x);if(!group.length)continue;
   const lo=late?Math.min(line+1.5,W):0,hi=late?W-room:Math.max(line-1.5,0);
   for(const b of group){b.cols=Math.ceil(b.dots.length/perColumn);b.w=b.cols*pitch;b.pos=b.x/100*W;}
   for(let pass=0;pass<80;pass++){
    for(let i=1;i<group.length;i++){const need=group[i-1].pos+(group[i-1].w+group[i].w)/2+(pitch>4.5?.4:.2),over=need-group[i].pos;if(over>0){group[i].pos+=over/2;group[i-1].pos-=over/2;}}
    for(const b of group)b.pos=Math.max(lo+b.w/2,Math.min(hi-b.w/2,b.pos));
   }
   for(const b of group)b.dots.forEach((d,j)=>{const column=Math.floor(j/perColumn),inColumn=Math.min(b.dots.length-column*perColumn,perColumn);d.style.left=`${b.pos+(column-(b.cols-1)/2)*pitch}px`;d.style.top=`calc(50% + ${((j%perColumn)-(inColumn-1)/2)*pitch}px)`;});
  }
  outs.forEach((d,j)=>{const column=Math.floor(j/5),inColumn=Math.min(outs.length-column*5,5);d.style.left=`${W-column*12}px`;d.style.top=`calc(50% + ${((j%5)-(inColumn-1)/2)*5.5}px)`;});
 }
}
const rail=document.querySelector('.rail');
if(rail){packRailDots();let frame;new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(packRailDots);}).observe(rail);}
if(document.querySelector('#trains-filters'))import('./trains-page.js');
if(document.querySelector('#journeys-filters'))import('./journeys-page.js');
// The back arrow links to the front page, which is right for a reader who arrived from a search or a bookmark. A reader who came from another page of this site in the same language (a train page from a station page, say) goes back one step instead, with the filters and scroll position they had. Without a page to go back to, or with a modifier key, the link works as it is. A reload reports the page itself as its referrer, so the decision is kept in the history entry's state.
const back=document.querySelector('.back-btn');
if(back&&history.length>1){
 const ref=document.referrer?new URL(document.referrer):null,korean=url=>url.pathname.startsWith(new URL('ko/',document.baseURI).pathname);
 if(history.state?.fromSite||(ref&&ref.origin===location.origin&&ref.pathname!==location.pathname&&korean(ref)===korean(location))){
  const label=document.documentElement.lang==='ko'?'이전 페이지로':'Back to previous page';
  history.replaceState({...history.state,fromSite:true},'');
  back.setAttribute('aria-label',label);back.dataset.tip=label;
  back.addEventListener('click',event=>{if(event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();history.back();});
 }
}
