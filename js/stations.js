import {esc,num,pct0,range,shareLegend,bar,empty,ROW_CAP} from './utils.js';
import {localeUtils,localizeTrain} from './locale.js';
import {card,trainCount} from './station.js';
// The all-stations page (stations/): top lists, a name search and type boxes, and a table with a row for every station where a train reported an arrival in the past month.
// It needs no browser, so scripts/build.mjs builds the whole page, links included, and trains-page.js only adds the controls.
const GROUPS=['KTX','ITX','Mugunghwa','Other'];
const group=type=>type.startsWith('ITX')?'ITX':type;
const MIN_ARRIVALS=10,RANK_ARRIVALS=200;
// One row per station with a page: how many trains call there, the train types, and its reported arrivals and the share within 5 minutes. calls comes from stationRows in js/station.js.
export function stationList(stations,calls){
 const rows=[];
 for(const station of stations){
  const own=calls.get(station.id)||[],arrivals=own.reduce((a,r)=>a+r.reported,0);
  if(!arrivals)continue;
  const within=own.reduce((a,r)=>a+r.within,0);
  rows.push({id:station.id,name:station.name,nameKo:station.name_ko||station.name,trains:trainCount(own),types:GROUPS.filter(g=>own.some(r=>group(r.type)===g)),arrivals,share:within/arrivals});
 }
 return rows;
}
// What a search result shows for this page.
export function pageInfo(rows,month,locale='en'){
 if(!rows?.length||!month?.from)return null;
 if(locale==='ko')return {title:'전체 역의 열차 도착 지연과 5분 이내 도착 비율 · Korean Train Stats',description:`${localeUtils(locale).range(month.from,month.to)} 동안 코레일 열차가 정차한 역 ${num(rows.length)}곳의 도착 기록을 비교합니다. 역별 정차 열차 수와 5분 이내 도착 비율을 확인하세요.`};
 return {title:'All Korail stations and their punctuality · Korean Train Stats',description:`${num(rows.length)} stations where Korail trains call, with the share of stops within 5 minutes of schedule, from ${range(month.from,month.to)}.`};
}
const href=(id,locale)=>`${locale==='ko'?'ko/':''}station/${encodeURIComponent(id)}/`,label=(r,locale)=>esc(locale==='ko'?r.nameKo:r.name);
const shown=r=>r.arrivals>=MIN_ARRIVALS?r.share:null;
const byName=(locale,get)=>(a,b)=>locale==='ko'?get(a).localeCompare(get(b),'ko'):get(a).localeCompare(get(b));
const types=(r,locale)=>r.types.map(g=>locale==='ko'?localizeTrain({type:g}).type:g).join(', ');
const rank=(r,locale,sub)=>`<a class="rank-row" href="${href(r.id,locale)}"><span class="rank-name">${label(r,locale)}</span><span class="rank-route">${sub}</span><span class="rank-share">${bar(shown(r))}</span></a>`;
function tableRow(r,locale){
 const ko=locale==='ko',s=shown(r),text=ko?`${r.nameKo} ${r.name}`:`${r.name} ${r.nameKo}`;
 return `<tr data-type="${r.types.join(' ')}" data-search="${esc(text.toLowerCase())}" data-num="${r.trains}" data-route="${esc(ko?r.nameKo:r.name)}" data-share="${s==null?'':s}">`
  +`<td class="t"><a href="${href(r.id,locale)}">${label(r,locale)}</a></td><td class="r">${esc(types(r,locale))}</td><td class="arr">${ko?`${num(r.trains)}편`:`${num(r.trains)} ${r.trains===1?'train':'trains'}`}</td><td class="s">${bar(s)}</td></tr>`;
}
const SORTS=[['',['Name','이름 순']],['num:descending',['Most trains','정차 열차 많은 순']],['share:descending',['Within 5 min, highest','5분 이내 도착 비율 높은 순']],['share:ascending',['Within 5 min, lowest','5분 이내 도착 비율 낮은 순']]];
export function renderStations(rows,month,locale='en'){
 const ko=locale==='ko',{range:period,backBtn}=localeUtils(locale),t=(en,kr)=>ko?kr:en;
 if(!rows?.length||!month?.from)return empty(t('No stations with a reported stop in the past month.','이 기간에 도착 기록이 있는 역이 없습니다.'));
 rows=[...rows].sort(byName(locale,r=>ko?r.nameKo:r.name));
 const total=num(rows.length),arrivals=rows.reduce((a,r)=>a+r.arrivals,0),all=rows.reduce((a,r)=>a+r.arrivals*r.share,0)/arrivals;
 const head=`<div class="train-intro train-head"><div class="train-lead">${backBtn}<div><h1>${t('All stations','전체 역')}</h1><p class="meta">${ko?`역 ${total}곳 · ${period(month.from,month.to)}`:`${total} stations · Data for ${period(month.from,month.to)}`}</p>`
  +`<p class="meta train-stats">${t(`<b>${pct0(all)}</b> of stops within 5 min`,`5분 이내 도착 비율 <b>${pct0(all)}</b>`)}</p></div></div></div>`;
 // Busiest is a way to find the big stations. Most punctual is left out: many small stations tie at 100%.
 const ranked=rows.filter(r=>r.arrivals>=RANK_ARRIVALS);
 const busiest=[...rows].sort((a,b)=>b.trains-a.trains||b.arrivals-a.arrivals||a.id.localeCompare(b.id)).slice(0,5);
 const least=[...ranked].sort((a,b)=>a.share-b.share||b.arrivals-a.arrivals||a.id.localeCompare(b.id)).slice(0,5);
 const trainsText=r=>ko?`열차 ${num(r.trains)}편`:`${num(r.trains)} ${r.trains===1?'train':'trains'}`;
 const lists=ranked.length<5?'':`<div class="trains-lists">${card(t('Busiest','정차 열차가 많은 역'),t('Trains that call · stops within 5 min','정차 열차 수 · 5분 이내 도착 비율'),`<div class="rank-rows">${busiest.map(r=>rank(r,locale,trainsText(r))).join('')}</div><p class="rank-note">${t('Ranked by the number of trains that call there.','정차하는 열차 수가 많은 순서입니다.')}</p>`)}`
  +`${card(t('Least punctual','5분 이내 도착 비율 하위 역'),t('Stops within 5 min, past 30 days','도착 기록 중 5분 이내에 도착한 비율'),`<div class="rank-rows">${least.map(r=>rank(r,locale,trainsText(r))).join('')}</div><p class="rank-note">${t(`Stations with at least ${RANK_ARRIVALS} reported stops.`,`도착 기록이 ${RANK_ARRIVALS}건 이상인 역을 비교합니다.`)}</p>`)}</div>`;
 const boxes=GROUPS.map(g=>({g,n:rows.filter(r=>r.types.includes(g)).length})).filter(x=>x.n).map(x=>`<label><input type="checkbox" name="type" value="${x.g}" checked>${esc(ko?localizeTrain({type:x.g}).type:x.g)} <span>${num(x.n)}</span></label>`).join('');
 const controls=`<form class="trains-filters" id="trains-filters" hidden><div class="trains-field search-field"><label for="stations-q">${t('Search by name','이름으로 찾기')}</label><input id="stations-q" type="search" placeholder="${t('Station name','역 이름')}" autocomplete="off" spellcheck="false"></div>`
  +`<fieldset><legend>${t('Served by','정차 열차 종류')}</legend><div class="type-chips">${boxes}</div></fieldset>`
  +`<div class="trains-field sort-field"><label for="trains-sort">${t('Sort by','정렬 기준')}</label><select id="trains-sort">${SORTS.map(([v,[e,kr]])=>`<option value="${v}">${t(e,kr)}</option>`).join('')}</select></div></form>`
  +`<div class="trains-status" id="trains-status" hidden><p class="meta" id="trains-count" aria-live="polite" data-text="${t('{n} of {total} stations','전체 {total}곳 중 {n}곳')}">${ko?`전체 ${total}곳 중 ${total}곳`:`${total} of ${total} stations`}</p><button type="button" id="trains-reset" hidden>${t('Reset','초기화')}</button></div>`
  +`<div class="trains-key">${ko?localeUtils('ko').shareLegend():shareLegend()}<span class="meta">${t(`A dash means fewer than ${MIN_ARRIVALS} reported stops`,`도착 기록이 ${MIN_ARRIVALS}건 미만이면 ‘—’로 표시합니다.`)}</span></div>`;
 const th=(key,text,cls='',first='')=>`<th${cls?` class="${cls}"`:''} data-key="${key}"${first?` data-first="${first}"`:''}><button type="button">${text}</button></th>`;
 const table=`<table class="trains-table"><thead><tr>${th('route',t('Station','역'))}<th>${t('Served by','정차 열차 종류')}</th>${th('num',t('Trains','정차 열차'),'','descending')}${th('share',t('Within 5 min','5분 이내 도착 비율'),'s')}</tr></thead><tbody id="trains-rows" data-cap="${ROW_CAP}" data-more="${t('Show all {n} stations','전체 {n}곳 보기')}">${rows.map(r=>tableRow(r,locale)).join('')}</tbody></table>`
  +`<p class="trains-empty" id="trains-empty" hidden>${t('No stations match these filters.','선택한 조건에 맞는 역이 없습니다. 조건을 바꾸거나 초기화해 주세요.')}</p>`;
 return head+lists+card(t('Find a station','역 찾기'),t('Share of stops within 5 min, past 30 days','도착 기록 중 5분 이내에 도착한 비율'),controls+table,'find');
}
