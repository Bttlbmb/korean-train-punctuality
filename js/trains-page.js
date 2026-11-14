// The all-trains page (js/trains.js), a station page (js/station.js), and the all-stations page (js/stations.js) arrive built with every row in their table. This shows the controls and makes the table filterable and sortable.
// A station page has only the To select (labelled Toward) and the all-stations page has only a name search (q), so every use of From, To, and q allows it to be missing.
// A row's data-type can list several types (a station is served by more than one).
// The choices live in the address (?types=KTX,ITX&from=Busan&to=Seoul&sort=dep_asc; on a station page ?types=KTX&to=Busan; on the all-stations page ?q=dae&types=KTX), so a shared link or Back restores them. replaceState keeps Back from stepping through them.
const ko=document.documentElement.lang==='ko';
const form=document.querySelector('#trains-filters');
if(form){
 const $=s=>document.querySelector(s),status=$('#trains-status'),count=$('#trains-count'),reset=$('#trains-reset'),none=$('#trains-empty'),body=$('#trains-rows'),
  from=$('#trains-from'),to=$('#trains-to'),q=$('#stations-q'),sortSelect=$('#trains-sort'),heads=[...document.querySelectorAll('.trains-table th[data-key]')],boxes=[...form.querySelectorAll('input[type=checkbox]')],
  rows=[...body.children],format=n=>n.toLocaleString(ko?'ko-KR':'en'),stationLabels=new Map([...((from||to)?.options||[])].map(o=>[o.value,o.textContent])),value=select=>select?.value||'';
 rows.forEach((row,i)=>row._i=i);
 let key='',dir='ascending',all=false;
 // A table whose body sets data-cap shows that many trains until the reader asks for all of them. The other rows stay in the page, and filters and sorting work on every row.
 const cap=+body.dataset.cap||0,more=cap?document.createElement('button'):null;
 if(more){more.type='button';more.className='trains-more';more.hidden=true;more.setAttribute('aria-controls','trains-rows');body.closest('table').after(more);
  more.addEventListener('click',()=>{all=true;limit();rows.filter(r=>!r.hidden)[cap]?.querySelector('a')?.focus();});}
 function limit(){
  if(!cap)return;
  let seen=0;for(const row of rows)row.classList.toggle('over',!all&&!row.hidden&&++seen>cap);
  const n=rows.filter(r=>!r.hidden).length;more.hidden=all||n<=cap;more.textContent=(body.dataset.more||(ko?'전체 {n}편 보기':'Show all {n} trains')).replace('{n}',format(n));
 }
 // A station with one train type has no type boxes, and every row stays.
 const ticked=()=>boxes.length?new Set(boxes.filter(b=>b.checked).map(b=>b.value)):{has:()=>true};
 const typed=(on,row)=>row.dataset.type.split(' ').some(type=>on.has(type)),words=()=>q?q.value.trim().toLowerCase():'';
 // Offer only the stations that still lead to a train, given the ticked types and the other station.
 function fill(select,own,other,otherKey){
  if(!select)return;
  const on=ticked(),found=new Set();
  for(const row of rows)if(typed(on,row)&&(!other||row.dataset[otherKey]===other))found.add(row.dataset[own]);
  const current=select.value;
  select.replaceChildren(new Option(select.options[0].textContent,''),...[...found].sort((a,b)=>ko?(stationLabels.get(a)||a).localeCompare(stationLabels.get(b)||b,'ko'):(stationLabels.get(a)||a).localeCompare(stationLabels.get(b)||b)).map(s=>new Option(stationLabels.get(s)||s,s)));
  select.value=found.has(current)?current:'';
 }
 const options=()=>{fill(from,'from',value(to),'to');fill(to,'to',value(from),'from');fill(from,'from',value(to),'to');};
 function apply(){
  const on=ticked(),word=words();let n=0;
  for(const row of rows){const ok=typed(on,row)&&(!value(from)||row.dataset.from===value(from))&&(!value(to)||row.dataset.to===value(to))&&(!word||row.dataset.search.includes(word));row.hidden=!ok;if(ok)n++;}
  count.textContent=(count.dataset.text||(ko?'전체 {total}편 중 {n}편':'{n} of {total} trains')).replace('{n}',format(n)).replace('{total}',format(rows.length));none.hidden=n>0;limit();
 }
 // Trains without a share (a dash) always come last.
 function sort(){
  const sign=dir==='ascending'?1:-1;
  rows.sort((x,y)=>{
   if(!key)return x._i-y._i;
   const a=x.dataset[key],b=y.dataset[key];
   if(key==='share'){if(a===''||b==='')return (a===''?1:0)-(b===''?1:0)||x._i-y._i;return sign*(a-b)||x._i-y._i;}
   if(key==='route')return sign*(ko?a.localeCompare(b,'ko'):a.localeCompare(b))||x._i-y._i;
   return sign*(a-b)||x._i-y._i;
  });
  body.append(...rows);limit();
  heads.forEach(h=>h.dataset.key===key?h.setAttribute('aria-sort',dir):h.removeAttribute('aria-sort'));
  sortSelect.value=key?`${key}:${dir}`:'';
 }
 // Show Reset and mark a chosen station whenever the table differs from its first state, and keep the address in step.
 function sync(){
  const unticked=boxes.some(b=>!b.checked);
  reset.hidden=!(unticked||value(from)||value(to)||words()||key);
  from?.classList.toggle('on',!!value(from));to?.classList.toggle('on',!!value(to));q?.classList.toggle('on',!!words());
  const query=new URLSearchParams();
  if(unticked)query.set('types',boxes.filter(b=>b.checked).map(b=>b.value).join(','));
  if(value(from))query.set('from',value(from));
  if(value(to))query.set('to',value(to));
  if(words())query.set('q',q.value.trim());
  if(key)query.set('sort',`${key}_${dir==='ascending'?'asc':'desc'}`);
  const text=query.toString().replace(/%2C/g,',');
  history.replaceState(history.state,'',location.pathname+(text?`?${text}`:'')+location.hash);
  const languageSwitch=document.querySelector('.language-switch');
  if(languageSwitch){const address=new URL(languageSwitch.href);address.search=location.search;languageSwitch.href=address.href;}
 }
 form.addEventListener('submit',event=>event.preventDefault());
 form.addEventListener('input',event=>{
  if(event.target===sortSelect){[key,dir]=sortSelect.value?sortSelect.value.split(':'):['','ascending'];sort();}
  else{options();apply();}
  sync();
 });
 heads.forEach(h=>h.querySelector('button').addEventListener('click',()=>{
  const k=h.dataset.key;
  if(key===k)dir=dir==='ascending'?'descending':'ascending';else{key=k;dir=h.dataset.first||(k==='share'?'descending':'ascending');}
  sort();sync();
 }));
 reset.addEventListener('click',()=>{
  boxes.forEach(b=>b.checked=true);if(from)from.value='';if(to)to.value='';if(q)q.value='';key='';all=false;dir='ascending';
  options();apply();sort();sync();
 });
 // Restore the choices in the address; an unknown value is ignored.
 const query=new URLSearchParams(location.search),wanted=query.get('types')?.split(',').filter(t=>boxes.some(b=>b.value===t));
 if(wanted?.length||query.get('types')==='')boxes.forEach(b=>b.checked=wanted.includes(b.value));
 if(from)from.value=query.get('from')||'';if(to)to.value=query.get('to')||'';if(q)q.value=query.get('q')||'';
 const [k,d]=(query.get('sort')||'').split('_');
 if(heads.some(h=>h.dataset.key===k)&&(d==='asc'||d==='desc')){key=k;dir=d==='asc'?'ascending':'descending';}
 options();
 // options() clears a station no train leaves from or reaches, so a bad address shows all trains.
 apply();sort();sync();
 form.hidden=false;status.hidden=false;
}
