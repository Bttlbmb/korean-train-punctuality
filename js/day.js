import {esc,num,delay,colorDelay,tipText,hiddenTable,empty,pct0,backBtn} from './utils.js';
import {localeUtils,localizeTrain,stationName} from './locale.js';
const BUCKETS=[['ontime','Within 5 min'],['d2','6–10 min'],['d3','11–20 min'],['d4','21–30 min'],['d5','Over 30 min']];
const KOREAN_BUCKETS=[['ontime','5분 이내'],['d2','6–10분'],['d3','11–20분'],['d4','21–30분'],['d5','30분 초과']];
// A bucket's share of the day's stops: a whole percent from 10%, one decimal below that, and "<1%" for a sliver.
const slice=n=>n>=.1?`${Math.round(n*100)}%`:n>=.01?`${(n*100).toFixed(1)}%`:'<1%';
const dayName=(iso,locale='en')=>new Date(iso+'T12:00:00+09:00').toLocaleDateString(locale==='ko'?'ko-KR':'en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Seoul'});
// What a search result shows for this page. A date with no data has an empty page, which is not worth indexing, so it gets null.
export function pageInfo(day,iso,locale='en'){
 if(!day?.trains)return null;
 if(locale==='ko')return {title:`${dayName(iso,locale)} 열차 도착 지연 · Korean Train Stats`,
  description:`${dayName(iso,locale)}의 5분 이내 도착 비율은 ${pct0(day.share_punctual)}입니다. 열차 ${num(day.trains)}편 중 ${num(day.late_trains)}편에서 5분 초과 지연 기록이 확인되었습니다. 역별 도착 지연 분포와 지연이 가장 컸던 열차를 확인하세요.`};
 return {title:`${dayName(iso)}: Korail train delays · Korean Train Stats`,
  description:`${dayName(iso)}: ${pct0(day.share_punctual)} of Korail train stops (KTX, ITX and Mugunghwa) were within 5 minutes of schedule, and ${num(day.late_trains)} of ${num(day.trains)} trains had a stop more than 5 minutes late.`};
}
// A day page stays at its address for good, while a train has a page only with a run in the past month, so hasTrain says which trains to link.
export function renderDay(day,iso,hasTrain=()=>true,locale='en',stationId=()=>null){
 const ko=locale==='ko',{num,delay,minutes:duration,backBtn}=localeUtils(locale),name=dayName(iso,locale);
 if(!day)return ko?'<a class="back-link" href="ko/">‹ 처음으로</a>'+empty('이 날짜의 자료가 없습니다.',`<p class="muted">${esc(name)}의 도착 지연 기록을 확인할 수 없습니다. <a href="ko/">수집된 도착 기록 보기</a></p>`):`<a class="back-link" href="./">‹ Back</a>`+empty('No data for this day.',`<p class="muted">Reported delays for ${esc(name)} are not available. <a href="./">See the past 30 days</a></p>`);
 const summary=ko?`<p class="meta">열차 ${num(day.trains)}편 · 도착 기록 ${num(day.stops)}건</p><p class="meta train-stats">5분 이내 도착 비율 <b>${pct0(day.share_punctual)}</b> · <b>${num(day.trains)}편 중 ${num(day.late_trains)}편</b>에서 5분 초과 지연 기록 있음 · 5분 넘게 늦은 도착의 <span class="nb">지연 시간 중앙값 <b>${day.typical_late_delay==null?'—':duration(day.typical_late_delay)}</b></span></p>`:`<p class="meta">${num(day.trains)} trains with ${num(day.stops)} stops</p><p class="meta train-stats"><b>${pct0(day.share_punctual)}</b> of stops within 5 min · <b>${num(day.late_trains)} of ${num(day.trains)}</b> trains had a late stop · <b>${delay(day.typical_late_delay)}</b> typical delay when late</p>`;
 const head=`<div class="train-intro train-head"><div class="train-lead">${backBtn}<div><h1>${esc(name).replace(/\d{4}년 \d+월 \d+일|\d+ [A-Za-z]+ \d{4}$/,'<span class="nb">$&</span>')}</h1>${day.trains?summary:''}</div></div></div>`;
 if(!day.trains)return head+empty(ko?'집계할 수 있는 도착 기록이 없습니다.':'No reported delays for this day.');
 const part=n=>ko&&n<.01?'1% 미만':slice(n);
 const total=day.buckets.reduce((a,b)=>a+b,0),shown=(ko?KOREAN_BUCKETS:BUCKETS).map((b,i)=>({key:b[0],label:b[1],n:day.buckets[i],share:day.buckets[i]/total})).filter(b=>b.n);
 // The legend under the bar names every bucket with its share, including segments too narrow for a label.
 const bar=shown.map(b=>`<i class="seg" style="flex:${b.n};background:var(--${b.key})" ${tipText(b.label,ko?`도착 기록 ${num(b.n)}건`:`${num(b.n)} stops`)}></i>`).join(''),
  legend=shown.map(b=>`<span><i class="swatch" style="background:var(--${b.key})"></i>${b.label} <b>${part(b.share)}</b></span>`).join('');
 const barLabel=ko?`역별 도착 기록의 지연 시간 분포: ${shown.map(b=>`${b.label} ${part(b.share)}`).join(', ')}.`:`Share of stops by delay: ${shown.map(b=>`${part(b.share)} ${b.label.toLowerCase()}`).join(', ')}.`;
 const how=`<div class="chart-card"><div class="block-title"><h2>${ko?'도착 지연 시간 분포':'How late stops were'}</h2></div><div class="day-bar" role="img" aria-label="${barLabel}">${bar}</div><div class="day-bar-legend" aria-hidden="true">${legend}</div>${hiddenTable(ko?'지연 시간별 도착 기록':'Stops by delay',ko?['지연 시간','도착 기록 수']:['Delay','Stops'],shown.map(b=>[b.label,num(b.n)]))}</div>`;
 // The reported arrival is the scheduled one plus the reported delay; Korail reports no observed arrival time.
 const minutes=clock=>clock.split(':').reduce((h,m)=>h*60+ +m),at=(total,offset)=>`${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}${offset?`<sup>+${offset}</sup>`:''}`;
 const rows=day.most_delayed.map(raw=>{const t=ko?{...localizeTrain(raw),station:stationName(raw.station)}:raw,due=minutes(t.scheduled),late=due+t.delay;
  // The station's name leads to its page when it has one, and looks like the text around it.
  const id=stationId(raw.station),place=id?`<a class="plain-link" href="${ko?'ko/':''}station/${encodeURIComponent(id)}/">${esc(t.station)}</a>`:esc(t.station);return `<tr><td>${hasTrain(t.id)?`<a href="${ko?'ko/':''}train/${encodeURIComponent(t.id)}/">${esc(t.type)} ${t.number}</a>`:`${esc(t.type)} ${t.number}`}<span class="row-sub"><span><span>${esc(t.origin)} → ${esc(t.destination)}</span> <span class="at">${ko?`${place} 도착`:`at ${place}`}</span></span></span></td><td class="narrow-hide">${t.departure&&t.arrival?`${esc(t.origin)} <span class="run-time">${t.departure}</span> → ${esc(t.destination)} <span class="run-time">${at(minutes(t.arrival),t.arrival_day_offset)}</span>`:`${esc(t.origin)} → ${esc(t.destination)}`}</td><td class="narrow-hide">${place}</td><td>${at(due,t.scheduled_day_offset)}</td><td class="reported narrow-hide">${at(late,t.scheduled_day_offset+Math.floor(late/1440))}</td><td class="r"><span class="delay-chip"><i style="background:${colorDelay(t.delay)}"></i>${delay(t.delay)}</span></td></tr>`;}).join('');
 const biggest=`<div class="chart-card"><div class="block-title"><h2>${ko?'지연이 가장 컸던 열차':'Biggest delays'}</h2><span class="meta">${ko?'열차별 최대 도착 지연':'Largest delay at any stop'}</span></div>${rows?`<table class="day-table day-rows">${ko?'<caption class="sr-only">정차역 도착 지연이 가장 컸던 열차와 해당 역의 예정 시각 및 계산한 도착 시각</caption>':''}<thead><tr><th>${ko?'열차':'Train'}</th><th class="narrow-hide">${ko?'운행 구간':'Route'}</th><th class="narrow-hide">${ko?'정차역':'Where'}</th><th>${ko?'예정 시각':'Scheduled'}</th><th class="narrow-hide">${ko?'계산한 도착 시각':'Reported'}</th><th class="r">${ko?'지연':'Delay'}</th></tr></thead><tbody>${rows}</tbody></table>${ko?'<p class="meta">계산한 도착 시각은 예정 도착 시각에 코레일이 제공한 지연 시간을 더한 값이며, 실제 도착 시각을 관측한 값은 아닙니다.</p>':''}`:ko?'<p class="muted">5분을 초과한 도착 지연 기록이 없습니다.</p>':'<p class="muted">No stop was more than 5 minutes late.</p>'}</div>`;
 return head+`<div class="day-cards">${how}${biggest}</div>`;
}
