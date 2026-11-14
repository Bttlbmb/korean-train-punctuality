import {esc,num,pct0,range,shareLegend,bar,empty,ROW_CAP,MIN_DAYS} from './utils.js';
import {localeUtils,localizeTrain} from './locale.js';
import {card} from './station.js';
// The all-journeys page (journeys/): top lists, From and To dropdowns, and a table of every journey that at least 40 trains make, built from the train files.
// A journey is two stations in order, whichever trains call at both. Its share is the share of arrivals at the second station within 5 minutes.
// scripts/build.mjs builds the whole page and writes journeys/data.json, which js/journeys-page.js loads to answer a search for any two stations.
const GROUPS=['KTX','ITX','Mugunghwa','Other'];
const group=type=>type.startsWith('ITX')?'ITX':type;
const minutes=t=>+t.slice(0,2)*60+ +t.slice(3);
// A journey is listed from 40 trains; a share is shown from 10 trains, so a search for a rare pair still gets its trains, but no overall share.
export const MIN_TRAINS=40,SHOW_TRAINS=10,SHOWN_ROWS=3;
// Each train's stops in the current timetable as [station index, arrival minute, departure minute, reported arrivals, arrivals within 5 minutes], where a minute counts from midnight of the first day.
// A train that calls at a station twice (the ITX-Maum loop at Hongseong) is left out, because a pair of stations in order would be ambiguous.
export function journeyData(trains,stations){
 const byId=new Map(stations.map(s=>[s.id,s])),index=new Map(),names=[],rows=[];
 const at=id=>{let i=index.get(id);if(i==null){i=names.length;index.set(id,i);const s=byId.get(id);names.push([s?.name??id,s?.name_ko||s?.name||id]);}return i;};
 for(const train of trains){
  const w=train.windows?.month;if(!w?.runs)continue;
  const stops=train.timetables.at(-1).stops;
  if(new Set(stops.map(s=>s.station_id)).size!==stops.length)continue;
  const tmap=new Map(train.timetables.map(t=>[t.id,t])),runs=train.runs.filter(r=>r.status==='ok'&&r.date>=w.from&&r.date<=w.to);
  const calls=stops.map(s=>{
   let reported=0,within=0;
   if(s.arrival!=null)for(const r of runs){
    const stop=tmap.get(r.timetable).stops.find(x=>x.station_id===s.station_id),d=stop?.arrival!=null?r.delays?.[stop.ordinal]??null:null;
    if(d!=null){reported++;if(d<=5)within++;}
   }
   return [at(s.station_id),s.arrival==null?null:minutes(s.arrival)+(s.arrival_day_offset||0)*1440,s.departure==null?null:minutes(s.departure)+(s.departure_day_offset||0)*1440,reported,within];
  });
  rows.push([train.id,train.number,train.type,calls]);
 }
 return {stations:names,trains:rows};
}
// The trains that call at station a and later at station b (indexes into data.stations), by departure from a, with the arrivals reported at b and the typical (median) time between the stations.
export function pairStats(data,a,b){
 const trains=[];let reported=0,within=0;
 for(const [id,number,type,calls] of data.trains){
  const i=calls.findIndex(c=>c[0]===a),j=calls.findIndex(c=>c[0]===b);
  if(i<0||j<0||i>=j||calls[i][2]==null||calls[j][1]==null)continue;
  reported+=calls[j][3];within+=calls[j][4];
  trains.push({id,number,type,dep:calls[i][2],arr:calls[j][1],reported:calls[j][3],within:calls[j][4]});
 }
 trains.sort((x,y)=>x.dep-y.dep||x.id.localeCompare(y.id));
 const times=trains.map(t=>t.arr-t.dep).sort((x,y)=>x-y);
 return {trains,reported,within,typical:times.length?times[times.length>>1]:null};
}
// One row per journey that MIN_TRAINS or more trains make: how many trains, the types, the typical time (the median), and the reported arrivals at the second station.
export function journeyList(data){
 const by=new Map(),n=data.stations.length;
 for(const [id,,type,calls] of data.trains)for(let i=0;i<calls.length-1;i++){
  if(calls[i][2]==null)continue;
  for(let j=i+1;j<calls.length;j++){
   if(calls[j][1]==null)continue;
   const k=calls[i][0]*n+calls[j][0];let p=by.get(k);
   if(!p)by.set(k,p={a:calls[i][0],b:calls[j][0],ids:new Set(),types:new Set(),times:[],reported:0,within:0});
   p.ids.add(id);p.types.add(group(type));p.times.push(calls[j][1]-calls[i][2]);p.reported+=calls[j][3];p.within+=calls[j][4];
  }
 }
 const name=i=>data.stations[i];
 return [...by.values()].filter(p=>p.ids.size>=MIN_TRAINS&&p.reported).map(p=>{
  p.times.sort((x,y)=>x-y);
  return {from:name(p.a)[0],fromKo:name(p.a)[1],to:name(p.b)[0],toKo:name(p.b)[1],trains:p.ids.size,types:GROUPS.filter(g=>p.types.has(g)),mins:p.times[p.times.length>>1],arrivals:p.reported,share:p.within/p.reported};
 }).sort((x,y)=>y.trains-x.trains||x.from.localeCompare(y.from)||x.to.localeCompare(y.to));
}
// What a search result shows for this page.
export function pageInfo(rows,month,locale='en'){
 if(!rows?.length||!month?.from)return null;
 if(locale==='ko')return {title:'전체 구간의 열차 도착 지연과 5분 이내 도착 비율 · Korean Train Stats',description:`${localeUtils(locale).range(month.from,month.to)} 동안 코레일 열차가 두 역에 차례로 정차한 구간 ${num(rows.length)}개의 도착 기록을 비교합니다. 구간별 열차 수와 5분 이내 도착 비율을 확인하세요.`};
 return {title:'All Korail journeys and their punctuality · Korean Train Stats',description:`${num(rows.length)} journeys between two stations that at least ${MIN_TRAINS} Korail trains make, with the share of arrivals within 5 minutes of schedule, from ${range(month.from,month.to)}.`};
}
const stationNames=(r,locale)=>locale==='ko'?[r.fromKo,r.toKo]:[r.from,r.to];
const href=(r,locale)=>`${locale==='ko'?'ko/':''}journeys/?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`;
const types=(r,locale)=>r.types.map(g=>locale==='ko'?localizeTrain({type:g}).type:g).join(', ');
const trainsText=(n,locale)=>locale==='ko'?`열차 ${num(n)}편`:`${num(n)} ${n===1?'train':'trains'}`;
// A journey time of 60 minutes or more reads as hours and minutes; a delay switches only at 100 minutes (minutes in js/utils.js).
const duration=(m,ko)=>{const h=Math.floor(m/60),r=m%60;return m<60?(ko?`${m}분`:`${m} min`):ko?`${h}시간${r?` ${r}분`:''}`:`${h} h${r?` ${r} min`:''}`;};
const clock=m=>`${String(Math.floor(m%1440/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
const rank=(r,locale)=>{const [a,b]=stationNames(r,locale);return `<a class="rank-row" href="${href(r,locale)}"><span class="rank-name">${esc(a)} → ${esc(b)}</span><span class="rank-route">${trainsText(r.trains,locale)}</span><span class="rank-share">${bar(r.share)}</span></a>`;};
function tableRow(r,locale){
 const [a,b]=stationNames(r,locale),took=duration(r.mins,locale==='ko'),count=trainsText(r.trains,locale);
 return `<tr data-from="${esc(r.from)}" data-to="${esc(r.to)}" data-num="${r.trains}" data-route="${esc(a+' → '+b)}" data-time="${r.mins}" data-share="${r.share}">`
  +`<td class="t"><a href="${href(r,locale)}">${esc(a)} → ${esc(b)}</a></td><td class="r">${esc(types(r,locale))}<span class="mob"> · ${esc(took)} · ${esc(count)}</span></td><td class="tm">${esc(took)}</td><td class="tn">${locale==='ko'?`${num(r.trains)}편`:esc(count)}</td><td class="s">${bar(r.share)}</td></tr>`;
}
// The panel under the dropdowns for a pair of stations: the share at the second station in one line, then the first trains by departure as rank rows. from and to are [English name, Korean name].
export function resultHTML(stats,from,to,locale='en'){
 const ko=locale==='ko',t=(en,kr)=>ko?kr:en,a=esc(ko?from[1]:from[0]),b=esc(ko?to[1]:to[0]),n=stats.trains.length;
 if(!n)return `<p class="meta">${t(`No train calls at ${a} and then at ${b}.`,`${a}에 정차한 뒤 ${b}에 정차하는 열차가 없습니다.`)}</p>`;
 const enough=n>=SHOW_TRAINS&&stats.reported>0,share=enough?stats.within/stats.reported:null,first=stats.trains.slice(0,SHOWN_ROWS);
 const rows=first.map(r=>{
  const own=r.reported>=MIN_DAYS?r.within/r.reported:null,name=esc(`${ko?localizeTrain(r).type:r.type} ${r.number}`),plus=Math.floor(r.arr/1440)-Math.floor(r.dep/1440);
  return `<a class="rank-row" href="${ko?'ko/':''}train/${encodeURIComponent(r.id)}/"><span class="rank-name">${name}</span><span class="rank-route">${clock(r.dep)} → ${clock(r.arr)}${plus>0?`<sup>+${plus}</sup>`:''}</span><span class="rank-share">${bar(own)}</span></a>`;
 }).join('');
 const took=stats.typical==null?'':` · <span class="nb">${t('typical','예정 소요 시간')} ${esc(duration(stats.typical,ko))}</span>`;
 const note=n>first.length?t(`First ${first.length} of ${num(n)} trains, by departure from ${a}.`,`${a} 출발이 빠른 ${first.length}편만 표시합니다. 전체 ${num(n)}편.`):'';
 return `<p class="jr-fig"><b>${share==null?'—':pct0(share)}</b> ${t(`within 5 min at ${b}`,`${b} 도착 기록 중 5분 이내`)} · ${trainsText(n,locale)}${took}</p><div class="rank-rows">${rows}</div>${note?`<p class="rank-note">${note}</p>`:''}`;
}
const SORTS=[['num:descending',['Most trains','열차 많은 순']],['route:ascending',['Name','이름 순']],['share:descending',['Within 5 min, highest','5분 이내 도착 비율 높은 순']],['share:ascending',['Within 5 min, lowest','5분 이내 도착 비율 낮은 순']],['time:ascending',['Typical time, shortest','예정 소요 시간 짧은 순']]];
export function renderJourneys(rows,month,locale='en'){
 const ko=locale==='ko',{range:period,backBtn}=localeUtils(locale),t=(en,kr)=>ko?kr:en;
 if(!rows?.length||!month?.from)return empty(t(`No journeys with at least ${MIN_TRAINS} trains in the past month.`,`이 기간에 열차가 ${MIN_TRAINS}편 이상인 구간이 없습니다.`));
 const total=num(rows.length);
 const head=`<div class="train-intro train-head"><div class="train-lead">${backBtn}<div><h1>${t('All journeys','전체 구간')}</h1><p class="meta">${ko?`구간 ${total}개 · ${period(month.from,month.to)}`:`${total} journeys · Data for ${period(month.from,month.to)}`}</p></div></div></div>`;
 const busiest=[...rows].slice(0,5),least=[...rows].sort((a,b)=>a.share-b.share||b.arrivals-a.arrivals||a.from.localeCompare(b.from)||a.to.localeCompare(b.to)).slice(0,5);
 const lists=`<div class="trains-lists">${card(t('Busiest','열차가 많은 구간'),t('Trains that call at both · within 5 min','두 역에 모두 정차하는 열차 수 · 5분 이내 도착 비율'),`<div class="rank-rows">${busiest.map(r=>rank(r,locale)).join('')}</div><p class="rank-note">${t('Ranked by the number of trains that call at both.','두 역에 모두 정차하는 열차 수가 많은 순서입니다.')}</p>`)}`
  +`${card(t('Least punctual','5분 이내 도착 비율 하위 구간'),t('Arrivals at the second station within 5 min','도착역 도착 기록 중 5분 이내에 도착한 비율'),`<div class="rank-rows">${least.map(r=>rank(r,locale)).join('')}</div><p class="rank-note">${t(`Journeys with at least ${MIN_TRAINS} trains.`,`열차가 ${MIN_TRAINS}편 이상인 구간을 비교합니다.`)}</p>`)}</div>`;
 const any=t('Any station','전체 역');
 const controls=`<form class="trains-filters" id="journeys-filters" hidden><div class="trains-field"><label for="journeys-from">${t('From','출발역')}</label><select id="journeys-from"><option value="">${any}</option></select></div>`
  +`<div class="trains-field"><label for="journeys-to">${t('To','도착역')}</label><select id="journeys-to"><option value="">${any}</option></select></div>`
  +`<div class="trains-field sort-field"><label for="journeys-sort">${t('Sort by','정렬 기준')}</label><select id="journeys-sort">${SORTS.map(([v,[e,kr]])=>`<option value="${v}">${t(e,kr)}</option>`).join('')}</select></div></form>`
  +`<div class="trains-status" id="journeys-status" hidden><p class="meta" id="journeys-count" aria-live="polite" data-text="${t('{n} of {total} journeys','전체 {total}개 중 {n}개')}">${ko?`전체 ${total}개 중 ${total}개`:`${total} of ${total} journeys`}</p><button type="button" id="journeys-reset" hidden>${t('Reset','초기화')}</button></div>`
  +`<div class="jres" id="journeys-result" hidden></div>`
  +`<div class="trains-key">${ko?localeUtils('ko').shareLegend():shareLegend()}<span class="meta">${t(`A dash means fewer than ${SHOW_TRAINS} trains call at both stations, or fewer than ${MIN_DAYS} recorded days for a train`,`두 역에 모두 정차하는 열차가 ${SHOW_TRAINS}편 미만이거나 열차의 도착 기록이 ${MIN_DAYS}일 미만이면 ‘—’로 표시합니다.`)}</span></div>`;
 const th=(key,text,cls='',first='')=>`<th${cls?` class="${cls}"`:''} data-key="${key}"${first?` data-first="${first}"`:''}><button type="button">${text}</button></th>`;
 const table=`<table class="trains-table" id="journeys-table"><thead><tr>${th('route',t('Journey','구간'))}<th>${t('Served by','정차 열차 종류')}</th>${th('time',t('Typical time','예정 소요 시간'))}${th('num',t('Trains','열차'),'','descending')}${th('share',t('Within 5 min','5분 이내 도착 비율'),'s')}</tr></thead><tbody id="journeys-rows" data-cap="${ROW_CAP}" data-more="${t('Show all {n} journeys','전체 {n}개 보기')}">${rows.map(r=>tableRow(r,locale)).join('')}</tbody></table>`
  +`<p class="trains-empty" id="journeys-empty" hidden>${t('No journeys match these filters.','선택한 조건에 맞는 구간이 없습니다. 조건을 바꾸거나 초기화해 주세요.')}</p>`
  +`<p class="rank-note" id="journeys-note">${t(`The table lists journeys with at least ${MIN_TRAINS} trains. Choose any two stations to find other journeys.`,`표에는 열차가 ${MIN_TRAINS}편 이상인 구간만 있습니다. 두 역을 선택하면 다른 구간도 확인할 수 있습니다.`)}</p>`;
 return head+lists+card(t('Find a journey','구간 찾기'),t('Share of arrivals at the second station within 5 min, past 30 days','도착역 도착 기록 중 5분 이내에 도착한 비율'),controls+table,'find');
}
