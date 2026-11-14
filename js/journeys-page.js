import {pairStats,resultHTML} from './journeys.js';
// The all-journeys page (js/journeys.js) arrives built with every listed journey in its table. This loads journeys/data.json, offers every pair of stations in the From and To dropdowns,
// shows the panel for a chosen pair, and makes the table filterable and sortable. If the data cannot load, the page stays as the built list.
// The choices live in the address (?from=Seoul&to=Busan&sort=share_desc), so a shared link or Back restores them. replaceState keeps Back from stepping through them.
const ko=document.documentElement.lang==='ko',locale=ko?'ko':'en';
const form=document.querySelector('#journeys-filters');
if(form){
 let data;
 try{const response=await fetch(new URL('../journeys/data.json',import.meta.url));if(!response.ok)throw Error(response.status);data=await response.json();}catch{data=null;}
 if(data)start(data);
}
function start(data){
 const $=s=>document.querySelector(s),status=$('#journeys-status'),count=$('#journeys-count'),reset=$('#journeys-reset'),none=$('#journeys-empty'),note=$('#journeys-note'),result=$('#journeys-result'),table=$('#journeys-table'),body=$('#journeys-rows'),
  from=$('#journeys-from'),to=$('#journeys-to'),sortSelect=$('#journeys-sort'),heads=[...document.querySelectorAll('#journeys-table th[data-key]')],rows=[...body.children],format=n=>n.toLocaleString(ko?'ko-KR':'en');
 rows.forEach((row,i)=>row._i=i);
 let key='',dir='ascending',all=false;
 const stations=data.stations,index=new Map(stations.map((s,i)=>[s[0],i])),label=i=>stations[i][ko?1:0],any=from.options[0].textContent;
 // next[i] holds the stations some train calls at after station i, and before[i] the stations it calls at before.
 const next=stations.map(()=>new Set()),before=stations.map(()=>new Set());
 for(const [,,,calls] of data.trains)for(let i=0;i<calls.length-1;i++){
  if(calls[i][2]==null)continue;
  for(let j=i+1;j<calls.length;j++)if(calls[j][1]!=null){next[calls[i][0]].add(calls[j][0]);before[calls[j][0]].add(calls[i][0]);}
 }
 // The From and To dropdowns become boxes you type in, because 272 stations are too many to scroll. A box matches the English and the Korean name, ignores spaces and hyphens, and reads "sh" as "s",
 // so "Haengshin" finds Haengsin. The hidden select keeps the choice, so the rest of the page works on it as before.
 const norm=text=>text.toLowerCase().replace(/sh/g,'s').replace(/[^a-z0-9가-힣]/g,'');
 function combobox(select){
  const field=select.closest('.trains-field'),input=document.createElement('input'),list=document.createElement('ul');
  input.type='text';input.id=`${select.id}-search`;input.className='station-input';input.placeholder=any;input.autocomplete='off';input.spellcheck=false;
  input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-expanded','false');input.setAttribute('aria-controls',`${select.id}-list`);
  list.id=`${select.id}-list`;list.className='station-list';list.setAttribute('role','listbox');list.hidden=true;
  field.querySelector('label').htmlFor=input.id;field.classList.add('combo');select.hidden=true;select.after(input,list);
  let active=-1,shown=[];
  const chosen=()=>select.value?select.selectedOptions[0].textContent:'';
  const starts=(o,q)=>norm(o.text).startsWith(q)||norm(o.value).startsWith(q);
  function paint(){
   [...list.children].forEach((li,i)=>{li.classList.toggle('active',i===active);li.setAttribute('aria-selected',String(shown[i]?.value===select.value));});
   input.setAttribute('aria-activedescendant',active>=0?`${list.id}-${active}`:'');
   list.children[active]?.scrollIntoView({block:'nearest'});
  }
  function open(query){
   const q=norm(query),all=[...select.options].slice(1).map(o=>({value:o.value,text:o.textContent,key:norm(o.value+o.textContent+(o.dataset.alt||''))}));
   shown=q?all.filter(o=>o.key.includes(q)).sort((a,b)=>starts(b,q)-starts(a,q)):all;
   active=shown.findIndex(o=>o.value===select.value);if(active<0)active=q&&shown.length?0:-1;
   list.replaceChildren(...(shown.length?shown.map((o,i)=>{const li=document.createElement('li');li.id=`${list.id}-${i}`;li.setAttribute('role','option');li.textContent=o.text;li.dataset.value=o.value;return li;}):[Object.assign(document.createElement('li'),{className:'none',textContent:ko?'일치하는 역이 없습니다':'No station matches'})]));
   list.hidden=false;input.setAttribute('aria-expanded','true');paint();
  }
  function close(){list.hidden=true;input.setAttribute('aria-expanded','false');active=-1;}
  function pick(value){select.value=value;refresh();close();select.dispatchEvent(new Event('input',{bubbles:true}));}
  function refresh(){input.value=chosen();input.classList.toggle('on',!!select.value);}
  input.addEventListener('focus',()=>{input.select();open('');});
  // Typing in the box is not a choice yet, so its input events stay out of the form's handler, which would reset the text.
  input.addEventListener('input',event=>{event.stopPropagation();open(input.value);});
  input.addEventListener('keydown',event=>{
   if(event.key==='ArrowDown'||event.key==='ArrowUp'){
    event.preventDefault();if(list.hidden){open(input.value===chosen()?'':input.value);return;}
    if(shown.length){active=event.key==='ArrowDown'?Math.min(active+1,shown.length-1):Math.max(active-1,0);paint();}
   }else if(event.key==='Enter'){event.preventDefault();if(!list.hidden&&active>=0)pick(shown[active].value);}
   else if(event.key==='Escape'){close();input.value=chosen();}
  });
  // The pointer keeps the focus in the box until the pick lands.
  list.addEventListener('mousedown',event=>event.preventDefault());
  list.addEventListener('click',event=>{const li=event.target.closest('li[data-value]');if(li)pick(li.dataset.value);});
  input.addEventListener('blur',()=>{
   close();
   if(!input.value.trim()&&select.value){select.value='';refresh();select.dispatchEvent(new Event('input',{bubbles:true}));}
   else refresh();
  });
  return {refresh};
 }
 const boxes=[combobox(from),combobox(to)];

 const value=select=>select.value;
 const cap=+body.dataset.cap||0,more=document.createElement('button');
 more.type='button';more.className='trains-more';more.hidden=true;more.setAttribute('aria-controls','journeys-rows');table.after(more);
 more.addEventListener('click',()=>{all=true;limit();rows.filter(r=>!r.hidden)[cap]?.querySelector('a')?.focus();});
 function limit(){
  let seen=0;for(const row of rows)row.classList.toggle('over',!all&&!row.hidden&&++seen>cap);
  const n=rows.filter(r=>!r.hidden).length;more.hidden=all||n<=cap;more.textContent=body.dataset.more.replace('{n}',format(n));
 }
 // Offer only the stations that still lead to a journey, given the other station.
 function fill(select,list,current){
  list.sort((a,b)=>ko?label(a).localeCompare(label(b),'ko'):label(a).localeCompare(label(b)));
  select.replaceChildren(new Option(any,''),...list.map(i=>{const o=new Option(label(i),stations[i][0]);o.dataset.alt=stations[i][ko?0:1];return o;}));
  select.value=list.some(i=>stations[i][0]===current)?current:'';
 }
 function options(){
  const f=index.get(value(from)),o=index.get(value(to));
  fill(from,stations.map((s,i)=>i).filter(i=>next[i].size&&(o==null||next[i].has(o))),value(from));
  fill(to,stations.map((s,i)=>i).filter(i=>before[i].size&&(f==null||before[i].has(f))),value(to));
  fill(from,stations.map((s,i)=>i).filter(i=>next[i].size&&(index.get(value(to))==null||next[i].has(index.get(value(to))))),value(from));
  boxes.forEach(box=>box.refresh());
 }
 function apply(){
  const f=value(from),o=value(to);let n=0;
  for(const row of rows){const ok=(!f||row.dataset.from===f)&&(!o||row.dataset.to===o);row.hidden=!ok;if(ok)n++;}
  // A chosen pair is answered by the panel alone, so the table and its count step aside; Reset brings them back.
  const pair=f&&o;
  count.hidden=!!pair;count.textContent=count.dataset.text.replace('{n}',format(n)).replace('{total}',format(rows.length));
  none.hidden=n>0||!!pair;table.style.display=pair?'none':'';note.hidden=!!pair;
  if(pair){result.innerHTML=resultHTML(pairStats(data,index.get(f),index.get(o)),stations[index.get(f)],stations[index.get(o)],locale);result.hidden=false;}else result.hidden=true;
  limit();
 }
 function sort(){
  const sign=dir==='ascending'?1:-1;
  rows.sort((x,y)=>{
   if(!key)return x._i-y._i;
   const a=x.dataset[key],b=y.dataset[key];
   if(key==='route')return sign*(ko?a.localeCompare(b,'ko'):a.localeCompare(b))||x._i-y._i;
   return sign*(a-b)||x._i-y._i;
  });
  body.append(...rows);limit();
  heads.forEach(h=>h.dataset.key===key?h.setAttribute('aria-sort',dir):h.removeAttribute('aria-sort'));
  sortSelect.value=key?`${key}:${dir}`:'num:descending';
 }
 // Show Reset and mark a chosen station whenever the page differs from its first state, and keep the address in step.
 function sync(){
  reset.hidden=!(value(from)||value(to)||key);
  from.classList.toggle('on',!!value(from));to.classList.toggle('on',!!value(to));
  const query=new URLSearchParams();
  if(value(from))query.set('from',value(from));
  if(value(to))query.set('to',value(to));
  if(key)query.set('sort',`${key}_${dir==='ascending'?'asc':'desc'}`);
  const text=query.toString();
  history.replaceState(history.state,'',location.pathname+(text?`?${text}`:'')+location.hash);
  const languageSwitch=document.querySelector('.language-switch');
  if(languageSwitch){const address=new URL(languageSwitch.href);address.search=location.search;languageSwitch.href=address.href;}
 }
 function setPair(f,o){
  from.value='';to.value='';options();
  from.value=f;options();to.value=o;options();
  all=false;apply();sync();
 }
// A long journey shows its first 40 trains; the button shows the rest and moves focus to the first new row.
 result.addEventListener('click',event=>{
  const button=event.target.closest('.trains-more');if(!button)return;
  const hidden=[...result.querySelectorAll('.rank-row.over')];hidden.forEach(row=>row.classList.remove('over'));button.remove();hidden[0]?.focus();
 });
 form.addEventListener('submit',event=>event.preventDefault());
 form.addEventListener('input',event=>{
  if(event.target===sortSelect){const [k,d]=sortSelect.value.split(':');[key,dir]=k==='num'&&d==='descending'?['','ascending']:[k,d];sort();}
  else{all=false;options();apply();}
  sync();
 });
 heads.forEach(h=>h.querySelector('button').addEventListener('click',()=>{
  const k=h.dataset.key;
  if(key===k)dir=dir==='ascending'?'descending':'ascending';else{key=k;dir=h.dataset.first||(k==='share'?'descending':'ascending');}
  sort();sync();
 }));
 reset.addEventListener('click',()=>{from.value='';to.value='';key='';dir='ascending';all=false;options();apply();sort();sync();});
 // A journey in a top list or the table opens its panel here instead of reloading the page.
 document.addEventListener('click',event=>{
  const link=event.target.closest('a.rank-row, #journeys-rows a');if(!link)return;
  const url=new URL(link.href);if(url.pathname!==location.pathname)return;
  event.preventDefault();setPair(url.searchParams.get('from')||'',url.searchParams.get('to')||'');
  document.querySelector('#find').scrollIntoView({behavior:'smooth',block:'start'});
 });
 // Restore the choices in the address; an unknown value is ignored.
 const query=new URLSearchParams(location.search),[k,d]=(query.get('sort')||'').split('_');
 if(heads.some(h=>h.dataset.key===k)&&(d==='asc'||d==='desc')){key=k;dir=d==='asc'?'ascending':'descending';}
 options();
 setPair(query.get('from')||'',query.get('to')||'');
 sort();sync();
 form.hidden=false;status.hidden=false;
}
