import {esc,num,pct0,range,backBtn,shareLegend,bar,empty,ROW_CAP,MIN_DAYS} from './utils.js';
import {localeUtils,localizeTrain,stationName} from './locale.js';
// The all-trains page (trains/): top lists, filters, and a table with a row for every train that ran in the past month.
// It needs no browser, so scripts/build.mjs builds the whole page, links included, and trains-page.js only adds the controls.
const TYPE_ORDER=['KTX','ITX-Saemaeul','ITX-Maum','ITX-Cheongchun','Mugunghwa','Other'];
const group=type=>type.startsWith('ITX')?'ITX':type;
const minutes=t=>+t.slice(0,2)*60+ +t.slice(3);
const RANK_DAYS=20;
// One row per train with a page: its journey and its share of stops within 5 minutes over the past month. A train with no run in the past month gets null.
export function trainRow(train){
 const w=train?.windows?.month;if(!train||!w?.runs)return null;
 const stops=train.timetables.at(-1).stops,first=stops[0],last=stops.at(-1);
 return {id:train.id,number:train.number,type:train.type,origin:train.origin,destination:train.destination,dep:first.departure,arr:last.arrival,off:last.arrival_day_offset||0,
  runs:w.runs,share:w.share_punctual??null,stops:stops.filter(s=>s.arrival!=null).length*w.runs};
}
const typeRank=type=>{const i=TYPE_ORDER.indexOf(type);return i<0?TYPE_ORDER.length:i;};
export const sortRows=rows=>[...rows].sort((a,b)=>typeRank(a.type)-typeRank(b.type)||a.number-b.number||a.id.localeCompare(b.id));
// A share needs ten recorded days to count, and a ranking twenty.
const shown=r=>r.runs>=MIN_DAYS?r.share:null,ranked=rows=>rows.filter(r=>r.runs>=RANK_DAYS&&r.share!=null);
// What a search result shows for this page.
export function pageInfo(rows,month,locale='en'){
 if(!rows?.length||!month?.from)return null;
 if(locale==='ko')return {title:'전체 열차의 지연과 5분 이내 도착 비율 · Korean Train Stats',description:`${localeUtils(locale).range(month.from,month.to)} 동안 코레일 열차 ${num(rows.length)}편의 역별 도착 기록을 비교합니다. KTX·ITX·무궁화호의 5분 이내 도착 비율과 운행 구간을 확인하세요.`};
 return {title:'All Korail trains and their punctuality · Korean Train Stats',
  description:`${num(rows.length)} Korail trains (KTX, ITX and Mugunghwa) with the share of their stops within 5 minutes of schedule, from ${range(month.from,month.to)}.`};
}
const href=(id,locale)=>`${locale==='ko'?'ko/':''}train/${encodeURIComponent(id)}/`,name=(r,locale)=>`${esc(locale==='ko'?localizeTrain(r).type:r.type)} ${esc(r.number)}`;
const card=(title,note,inner,id='')=>`<div class="chart-card"${id?` id="${id}"`:''}><div class="block-title"><h2>${title}</h2><span class="meta">${esc(note)}</span></div>${inner}</div>`;
const rank=(r,locale)=>`<a class="rank-row" href="${href(r.id,locale)}"><span class="rank-name">${name(r,locale)}</span><span class="rank-route">${esc(locale==='ko'?stationName(r.origin):r.origin)} → ${esc(locale==='ko'?stationName(r.destination):r.destination)}</span><span class="rank-share">${bar(r.share)}</span></a>`;
const arrival=r=>`${esc(r.arr)}${r.off?`<sup>+${r.off}</sup>`:''}`;
function tableRow(r,locale){
 const ko=locale==='ko',s=shown(r),route=ko?`${stationName(r.origin)} → ${stationName(r.destination)}`:`${r.origin} → ${r.destination}`;
 return `<tr data-type="${esc(group(r.type))}" data-from="${esc(r.origin)}" data-to="${esc(r.destination)}" data-num="${r.number}" data-route="${esc(route)}" data-dep="${minutes(r.dep)}" data-arr="${minutes(r.arr)+r.off*1440}" data-share="${s==null?'':s}">`
  +`<td class="t"><a href="${href(r.id,locale)}">${name(r,locale)}</a></td><td class="r">${esc(route)}</td><td class="dep">${esc(r.dep)}</td><td class="arr">${arrival(r)}</td>`
  +`<td class="s">${bar(s)}</td></tr>`;
}
const SORTS=[['','Train type'],['num:ascending','Train number'],['dep:ascending','Departs, earliest'],['arr:ascending','Arrives, earliest'],['share:descending','Within 5 min, highest'],['share:ascending','Within 5 min, lowest'],['route:ascending','Route']];
export function renderTrains(rows,month,locale='en'){
 if(locale==='ko')return renderKoreanTrains(rows,month);
 if(!rows?.length||!month?.summary?.all)return empty('No trains with a run in the past month.');
 rows=sortRows(rows);
 const total=num(rows.length),withShare=ranked(rows);
 const perfect=withShare.filter(r=>r.share>=1).length;
 const tie=(a,b)=>b.stops-a.stops||a.id.localeCompare(b.id);
 const best=[...withShare].sort((a,b)=>b.share-a.share||tie(a,b)).slice(0,5),worst=[...withShare].sort((a,b)=>a.share-b.share||a.stops-b.stops||a.id.localeCompare(b.id)).slice(0,5);
 const note='Stops within 5 min, past 30 days';
 const head=`<div class="train-intro train-head"><div class="train-lead">${backBtn}<div><h1>All trains</h1><p class="meta">${total} trains · Data for ${range(month.from,month.to)}</p>`
  +`<p class="meta train-stats"><b>${pct0(month.summary.all.share_punctual)}</b> of stops within 5 min · <b>${num(perfect)}</b> trains had no late stop</p></div></div></div>`;
 const lists=`<div class="trains-lists">${card('Most punctual',note,`<div class="rank-rows">${best.map(rank).join('')}</div><p class="rank-note">${num(perfect)} trains were within 5 min at every stop.</p>`)}`
  +`${card('Least punctual',note,`<div class="rank-rows">${worst.map(rank).join('')}</div><p class="rank-note">Trains with at least ${RANK_DAYS} recorded days.</p>`)}</div>`;
 const boxes=[];for(const r of rows){const g=group(r.type),box=boxes.find(b=>b.g===g);if(box)box.n++;else boxes.push({g,n:1});}
 const stations=[...new Set(rows.flatMap(r=>[r.origin,r.destination]))].sort((a,b)=>a.localeCompare(b)),options=stations.map(s=>`<option>${esc(s)}</option>`).join('');
 const filters=`<form class="trains-filters" id="trains-filters" hidden><fieldset><legend>Train types</legend><div class="type-chips">${boxes.map(b=>`<label><input type="checkbox" name="type" value="${esc(b.g)}" checked>${esc(b.g)} <span>${num(b.n)}</span></label>`).join('')}</div></fieldset>`
  +`<div class="trains-field"><label for="trains-from">Starts at</label><select id="trains-from"><option value="">Any station</option>${options}</select></div>`
  +`<div class="trains-field"><label for="trains-to">Ends at</label><select id="trains-to"><option value="">Any station</option>${options}</select></div>`
  +`<div class="trains-field sort-field"><label for="trains-sort">Sort by</label><select id="trains-sort">${SORTS.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></div></form>`
  +`<div class="trains-status" id="trains-status" hidden><p class="meta" id="trains-count" aria-live="polite">${total} of ${total} trains</p><button type="button" id="trains-reset" hidden>Reset</button></div>`
  +`<div class="trains-key">${shareLegend()}<span class="meta">A dash means fewer than ${MIN_DAYS} recorded days</span></div>`;
 const th=(key,label,cls='')=>`<th${cls?` class="${cls}"`:''} data-key="${key}"><button type="button">${label}</button></th>`;
 const table=`<table class="trains-table"><thead><tr>${th('num','Train')}${th('route','Route')}${th('dep','Departs')}${th('arr','Arrives')}${th('share','Within 5 min','s')}</tr></thead><tbody id="trains-rows" data-cap="${ROW_CAP}">${rows.map(tableRow).join('')}</tbody></table>`
  +`<p class="trains-empty" id="trains-empty" hidden>No trains match these filters.</p>`;
 return head+lists+card('Find a train','Share of stops within 5 min, past 30 days',filters+table,'find');
}

// Korean uses the same row values and thresholds; station filter values remain the public English query keys.
function renderKoreanTrains(rows,month){
 if(!rows?.length||!month?.summary?.all)return empty('이 기간에 운행 기록이 있는 열차가 없습니다.');
 rows=sortRows(rows);
 const ko=localeUtils('ko'),total=num(rows.length),withShare=ranked(rows),perfect=withShare.filter(r=>r.share>=1).length;
 const tie=(a,b)=>b.stops-a.stops||a.id.localeCompare(b.id);
 const best=[...withShare].sort((a,b)=>b.share-a.share||tie(a,b)).slice(0,5),worst=[...withShare].sort((a,b)=>a.share-b.share||a.stops-b.stops||a.id.localeCompare(b.id)).slice(0,5);
 const note='역별 도착 기록 중 5분 이내에 도착한 비율';
 const head=`<div class="train-intro train-head"><div class="train-lead">${ko.backBtn}<div><h1>전체 열차</h1><p class="meta">열차 ${total}편 · ${ko.range(month.from,month.to)}</p>`
  +`<p class="meta train-stats"><span class="meta-line">5분 이내 도착 비율 <b>${pct0(month.summary.all.share_punctual)}</b></span><span class="meta-sep"> · </span><span class="meta-line">기록된 모든 도착이 5분 이내인 열차 <b>${num(perfect)}편</b></span></p></div></div></div>`;
 const lists=`<div class="trains-lists">${card('5분 이내 도착 비율 상위 열차',note,`<div class="rank-rows">${best.map(r=>rank(r,'ko')).join('')}</div><p class="rank-note">${RANK_DAYS}일 이상 운행 기록이 있는 열차를 비교합니다. 이 중 ${num(perfect)}편은 기록된 모든 도착이 5분 이내입니다.</p>`)}`
  +`${card('5분 이내 도착 비율 하위 열차',note,`<div class="rank-rows">${worst.map(r=>rank(r,'ko')).join('')}</div><p class="rank-note">${RANK_DAYS}일 이상 운행 기록이 있는 열차를 비교합니다. 지연 정보가 없는 도착 기록은 비율에서 제외합니다.</p>`)}</div>`;
 const boxes=[];for(const r of rows){const g=group(r.type),box=boxes.find(b=>b.g===g);if(box)box.n++;else boxes.push({g,n:1});}
 const stations=[...new Set(rows.flatMap(r=>[r.origin,r.destination]))].sort((a,b)=>stationName(a).localeCompare(stationName(b),'ko'));
 const options=stations.map(s=>`<option value="${esc(s)}">${esc(stationName(s))}</option>`).join('');
 const sorts=['열차 종류','열차 번호','출발 시각 빠른 순','도착 시각 빠른 순','5분 이내 도착 비율 높은 순','5분 이내 도착 비율 낮은 순','운행 구간'];
 const filters=`<form class="trains-filters" id="trains-filters" hidden><fieldset><legend>열차 종류</legend><div class="type-chips">${boxes.map(b=>`<label><input type="checkbox" name="type" value="${esc(b.g)}" checked>${esc(localizeTrain({type:b.g}).type)} <span>${num(b.n)}</span></label>`).join('')}</div></fieldset>`
  +`<div class="trains-field"><label for="trains-from">출발역</label><select id="trains-from"><option value="">전체 역</option>${options}</select></div>`
  +`<div class="trains-field"><label for="trains-to">종착역</label><select id="trains-to"><option value="">전체 역</option>${options}</select></div>`
  +`<div class="trains-field sort-field"><label for="trains-sort">정렬 기준</label><select id="trains-sort">${SORTS.map(([v],i)=>`<option value="${v}">${sorts[i]}</option>`).join('')}</select></div></form>`
  +`<div class="trains-status" id="trains-status" hidden><p class="meta" id="trains-count" aria-live="polite">전체 ${total}편 중 ${total}편</p><button type="button" id="trains-reset" hidden>초기화</button></div>`
  +`<div class="trains-key">${ko.shareLegend()}<span class="meta">운행 기록이 ${MIN_DAYS}일 미만이거나 도착 비율을 계산할 자료가 없으면 ‘—’로 표시합니다.</span></div>`;
 const th=(key,label,cls='')=>`<th${cls?` class="${cls}"`:''} data-key="${key}"><button type="button">${label}</button></th>`;
 const table=`<table class="trains-table"><thead><tr>${th('num','열차')}${th('route','운행 구간')}${th('dep','출발')}${th('arr','도착')}${th('share','5분 이내 도착 비율','s')}</tr></thead><tbody id="trains-rows" data-cap="${ROW_CAP}">${rows.map(r=>tableRow(r,'ko')).join('')}</tbody></table>`
  +`<p class="trains-empty" id="trains-empty" hidden>선택한 조건에 맞는 열차가 없습니다. 조건을 바꾸거나 초기화해 주세요.</p>`;
 return head+lists+card('열차 찾기','열차의 첫 출발역과 마지막 도착역 기준입니다.',filters+table,'find');
}
