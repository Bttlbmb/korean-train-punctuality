import {esc,num,pct0,bar,empty,ROW_CAP,MIN_DAYS} from './utils.js';
import {localeUtils,localizeTrain,stationName} from './locale.js';
import {pinHTML} from './train.js';
// A station page (station/<id>/): the station on the map, the most and least punctual trains that call there, and a table of every train.
// It needs no browser, so scripts/build.mjs builds the whole page and trains-page.js only adds the controls.
const group=type=>type.startsWith('ITX')?'ITX':type;
const GROUPS=['KTX','ITX','Mugunghwa','Other'];
const minutes=t=>+t.slice(0,2)*60+ +t.slice(3);
const RANK_DAYS=20;
// A table this short or shorter has no controls.
const FEW=10;
// A train can call at one station twice (Hongseong, on the ITX-Maum loop), so a stop is matched across timetable versions by its station and which visit it is.
const visits=stops=>{const seen=new Map();return stops.map(s=>{const n=seen.get(s.station_id)||0;seen.set(s.station_id,n+1);return `${s.station_id}#${n}`;});};
// One row for every call of every train that ran in the past month, grouped by station ID: its scheduled time, and how many reported arrivals there were and how many were within 5 minutes.
// A train that starts at the station has no arrival, so no delay. Trains with no run in the past month have no page and no row.
export function stationRows(trains){
 const by=new Map();
 for(const train of trains){
  const w=train.windows?.month;if(!w?.runs)continue;
  const tmap=new Map(train.timetables.map(t=>[t.id,t])),keys=new Map(train.timetables.map(t=>[t.id,visits(t.stops)])),stops=train.timetables.at(-1).stops,own=visits(stops);
  const runs=train.runs.filter(r=>r.status==='ok'&&r.date>=w.from&&r.date<=w.to);
  stops.forEach((s,i)=>{
   let reported=0,within=0;
   if(s.arrival!=null)for(const r of runs){
    const k=keys.get(r.timetable)?.indexOf(own[i]),stop=k>=0?tmap.get(r.timetable).stops[k]:null,d=stop?.arrival!=null?r.delays?.[stop.ordinal]??null:null;
    if(d!=null){reported++;if(d<=5)within++;}
   }
   const starts=s.arrival==null;
   (by.get(s.station_id)||by.set(s.station_id,[]).get(s.station_id)).push({id:train.id,number:train.number,type:train.type,origin:train.origin,destination:train.destination,
    time:starts?s.departure:s.arrival,off:(starts?s.departure_day_offset:s.arrival_day_offset)||0,starts,ends:i===stops.length-1,reported,within});
  });
 }
 for(const rows of by.values())rows.sort((a,b)=>minutes(a.time)+a.off*1440-minutes(b.time)-b.off*1440||a.id.localeCompare(b.id));
 return by;
}
const share=rows=>{const n=rows.reduce((a,r)=>a+r.reported,0);return n?rows.reduce((a,r)=>a+r.within,0)/n:null;};
const own=r=>r.reported>=MIN_DAYS?r.within/r.reported:null;
const figures=rows=>({arrivals:rows.reduce((a,r)=>a+r.reported,0),share:share(rows)});
// A train that starts and ends at the station (the ITX-Maum loop at Hongseong) has a row for each visit, so rows can outnumber trains.
export const trainCount=rows=>new Set(rows.map(r=>r.id)).size;
// What a search result shows for this page. A station with no reported arrival in the past month has nothing to show, so it gets null.
export function pageInfo(station,rows,month,locale='en'){
 const {arrivals,share:all}=figures(rows||[]);if(!station||!month?.from||!arrivals)return null;
 if(locale==='ko'){
  const name=stationName(station.name);
  return {title:`${name}역 열차 도착 지연 · Korean Train Stats`,description:`${name}역에 정차하는 코레일 열차 ${num(trainCount(rows))}편의 도착 기록. ${localeUtils(locale).range(month.from,month.to)} 동안 도착 기록 ${num(arrivals)}건 중 ${pct0(all)}가 5분 이내에 도착했습니다.`};
 }
 return {title:`${station.name} station train delays · Korean Train Stats`,description:`Korail trains at ${station.name}: ${pct0(all)} of ${num(arrivals)} reported stops were within 5 minutes of schedule, across ${num(trainCount(rows))} trains, from ${localeUtils('en').range(month.from,month.to)}.`};
}
const href=(id,locale)=>`${locale==='ko'?'ko/':''}train/${encodeURIComponent(id)}/`,trainName=(r,locale)=>`${esc(locale==='ko'?localizeTrain(r).type:r.type)} ${esc(r.number)}`;
const place=(name,locale)=>esc(locale==='ko'?stationName(name):name);
export const card=(title,note,inner,id='')=>`<div class="chart-card"${id?` id="${id}"`:''}><div class="block-title"><h2>${title}</h2><span class="meta">${esc(note)}</span></div>${inner}</div>`;
const rank=(r,locale)=>`<a class="rank-row" href="${href(r.id,locale)}"><span class="rank-name">${trainName(r,locale)}</span><span class="rank-route">${esc(r.time)} · ${place(r.origin,locale)} → ${place(r.destination,locale)}</span><span class="rank-share">${bar(own(r))}</span></a>`;
const SORTS=[['',['Arrival time','도착 시각 빠른 순']],['num:ascending',['Train number','열차 번호 순']],['share:descending',['Within 5 min, highest','5분 이내 도착 비율 높은 순']],['share:ascending',['Within 5 min, lowest','5분 이내 도착 비율 낮은 순']],['route:ascending',['Toward','방면 순']]];
function tableRow(r,locale){
 const ko=locale==='ko',s=own(r),toward=r.ends?(ko?'이 역이 종착역':'Ends here'):place(r.destination,locale);
 const time=`${esc(r.time)}${r.off?`<sup>+${r.off}</sup>`:''}${r.starts?`<small>${ko?'출발':'departs'}</small>`:''}`;
 return `<tr data-type="${esc(group(r.type))}" data-to="${esc(r.destination)}" data-num="${r.number}" data-route="${toward}" data-arr="${minutes(r.time)+r.off*1440}" data-share="${s==null?'':s}">`
  +`<td class="arr">${time}</td><td class="t"><a href="${href(r.id,locale)}">${trainName(r,locale)}</a></td><td class="r">${toward}</td><td class="s">${bar(s)}</td></tr>`;
}
export function renderStation(station,rows,month,locale='en'){
 const ko=locale==='ko',L=localeUtils(locale),{backBtn,range,shareLegend}=L,t=(en,kr)=>ko?kr:en;
 const {arrivals,share:all}=figures(rows||[]);
 if(!station||!arrivals)return empty(t('No reported stops at this station in the past month.','이 기간에 이 역의 도착 기록이 없습니다.'));
 const name=place(station.name,locale),starts=rows.filter(r=>r.starts).length,trains=trainCount(rows),calls=rows.length!==trains;
 const types=GROUPS.map(g=>({g,rows:rows.filter(r=>group(r.type)===g)})).filter(x=>x.rows.length),typed=types.filter(x=>x.g!=='Other'&&figures(x.rows).arrivals);
 const label=g=>ko?localizeTrain({type:g}).type:g;
 const stats=t(`<b>${pct0(all)}</b> of stops within 5 min`,`5분 이내 도착 비율 <b>${pct0(all)}</b>`)+(typed.length>1?typed.map(x=>` · ${esc(label(x.g))} <b>${pct0(share(x.rows))}</b>`).join(''):'');
 const meta=ko?`열차 ${num(trains)}편 정차${starts?` · 그중 ${num(starts)}편은 이 역에서 출발`:''}</span><span class="meta-sep"> · </span><span class="meta-line">${range(month.from,month.to)} · 도착 기록 ${num(arrivals)}건`:`${num(trains)} ${trains===1?'train stops':'trains stop'} here${starts?` · ${num(starts)} ${starts===1?'starts':'start'} here`:''}</span><span class="meta-sep"> · </span><span class="meta-line">Data for ${num(arrivals)} stops from ${range(month.from,month.to)}`;
 const head=`<div class="train-intro train-head"><div class="train-lead">${backBtn}<div><h1>${ko?`${name}역`:`${name} station`}</h1><p class="meta"><span class="meta-line">${meta}</span></p><p class="meta train-stats">${stats}</p></div></div>${pinHTML(station)}</div>`;
 // Two lists when at least four trains have enough days to rank; a train is never in both.
 const ranked=rows.filter(r=>r.reported>=RANK_DAYS),k=Math.min(5,Math.floor(ranked.length/2)),perfect=ranked.filter(r=>r.within===r.reported).length;
 const tie=(a,b)=>b.reported-a.reported||a.id.localeCompare(b.id)||a.time.localeCompare(b.time);
 const best=[...ranked].sort((a,b)=>b.within/b.reported-a.within/a.reported||tie(a,b)).slice(0,k),worst=[...ranked].sort((a,b)=>a.within/a.reported-b.within/b.reported||tie(a,b)).filter(r=>!best.includes(r)).slice(0,k);
 const note=t('Stops within 5 min, past 30 days','도착 기록 중 5분 이내에 도착한 비율');
 const lists=k<2?'':`<div class="trains-lists">${card(t('Most punctual','5분 이내 도착 비율 상위 열차'),note,`<div class="rank-rows">${best.map(r=>rank(r,locale)).join('')}</div><p class="rank-note">${perfect?t(`${num(perfect)} ${perfect===1?'train was':'trains were'} within 5 min on every recorded day.`,`도착 기록이 ${RANK_DAYS}일 이상인 열차 중 ${num(perfect)}편은 모든 도착이 5분 이내였습니다.`):t(`Trains with at least ${RANK_DAYS} recorded days.`,`도착 기록이 ${RANK_DAYS}일 이상인 열차를 비교합니다.`)}</p>`)}`
  +`${card(t('Least punctual','5분 이내 도착 비율 하위 열차'),note,`<div class="rank-rows">${worst.map(r=>rank(r,locale)).join('')}</div><p class="rank-note">${t(`Trains with at least ${RANK_DAYS} recorded days.`,`도착 기록이 ${RANK_DAYS}일 이상인 열차를 비교합니다. 지연 정보가 없는 도착 기록은 비율에서 제외합니다.`)}</p>`)}</div>`;
 // "Toward" is a train's last stop; a train that ends here gets its own entry, valued with the station's own name.
 const towards=new Map();for(const r of rows)towards.set(r.destination,r.ends?(ko?'이 역이 종착역':'Ends here'):place(r.destination,locale));
 const options=[...towards].sort((a,b)=>ko?a[1].localeCompare(b[1],'ko'):a[1].localeCompare(b[1])).map(([v,l])=>`<option value="${esc(v)}">${l}</option>`).join('');
 const boxes=types.map(x=>`<label><input type="checkbox" name="type" value="${esc(x.g)}" checked>${esc(label(x.g))} <span>${num(trainCount(x.rows))}</span></label>`).join('');
 const total=num(rows.length);

 const few=rows.length<=FEW;
 const controls=few?'':`<form class="trains-filters station-filters" id="trains-filters" hidden>${types.length>1?`<fieldset><legend>${t('Train types','열차 종류')}</legend><div class="type-chips">${boxes}</div></fieldset>`:''}`
  +`<div class="trains-field"><label for="trains-to">${t('Toward','방면')}</label><select id="trains-to"><option value="">${t('Any direction','전체 방면')}</option>${options}</select></div>`
  +`<div class="trains-field sort-field"><label for="trains-sort">${t('Sort by','정렬 기준')}</label><select id="trains-sort">${SORTS.map(([v,[e,kr]])=>`<option value="${v}">${t(e,kr)}</option>`).join('')}</select></div></form>`
  +`<div class="trains-status" id="trains-status" hidden><p class="meta" id="trains-count" aria-live="polite"${calls?` data-text="${t('{n} of {total} stops','전체 정차 {total}회 중 {n}회')}"`:''}>${calls?t(`${total} of ${total} stops`,`전체 정차 ${total}회 중 ${total}회`):t(`${total} of ${total} trains`,`전체 ${total}편 중 ${total}편`)}</p><button type="button" id="trains-reset" hidden>${t('Reset','초기화')}</button></div>`;
 const legend=`<div class="trains-key">${shareLegend()}<span class="meta">${t(`A dash means fewer than ${MIN_DAYS} recorded days, or a train that starts here`,`도착 기록이 ${MIN_DAYS}일 미만이거나 이 역에서 출발하는 열차는 ‘—’로 표시합니다.`)}</span></div>`;
 const th=(name,text,cls='')=>few?`<th${cls?` class="${cls}"`:''}>${text}</th>`:`<th${cls?` class="${cls}"`:''} data-key="${name}"><button type="button">${text}</button></th>`;
 const table=`<table class="trains-table station-table"><thead><tr>${th('arr',t('Arrives','도착'))}${th('num',t('Train','열차'))}${th('route',t('Toward','방면'))}${th('share',t('Within 5 min','5분 이내 도착 비율'),'s')}</tr></thead><tbody id="trains-rows"${rows.length>ROW_CAP?` data-cap="${ROW_CAP}"`:''}${calls?` data-more="${t('Show all {n} stops','전체 정차 {n}회 보기')}"`:''}>${rows.map(r=>tableRow(r,locale)).join('')}</tbody></table>`
  +`<p class="trains-empty" id="trains-empty" hidden>${t('No trains match these filters.','선택한 조건에 맞는 열차가 없습니다. 조건을 바꾸거나 초기화해 주세요.')}</p>`;
 return head+lists+card(ko?`${name}역의 열차 찾기`:`Find a train at ${name}`,t('Share of stops within 5 min, past 30 days','도착 기록 중 5분 이내에 도착한 비율'),controls+legend+table,'find');
}
