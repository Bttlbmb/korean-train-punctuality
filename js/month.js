import {esc,num,pct,pct0,colorDelay,hiddenTable,empty} from './utils.js';
import {localeUtils,localizeTrain,stationName} from './locale.js';

// Reconstruct the complete calendar month's existing figures from its archived day files.
// The headline pools countable arrival records; it is never an average of daily percentages.
export function monthFigures(key,documents){
 const [year,month]=key.split('-').map(Number),length=new Date(Date.UTC(year,month,0)).getUTCDate();
 const days=[];
 for(let n=1;n<=length;n++){
  const iso=`${key}-${String(n).padStart(2,'0')}`,day=documents.get(iso);
  if(!day)return null;
  days.push(day);
 }
 const buckets=Array(5).fill(0);for(const day of days)day.buckets.forEach((n,i)=>buckets[i]+=n);
 const stops=buckets.reduce((a,b)=>a+b,0),most_delayed=days.flatMap(day=>day.most_delayed.map(t=>({...t,date:day.date})))
  .sort((a,b)=>b.delay-a.delay||a.date.localeCompare(b.date)||a.departure.localeCompare(b.departure)||a.number-b.number||a.type.localeCompare(b.type)).slice(0,10);
 return {days,buckets,stops,share_punctual:stops?buckets[0]/stops:null,most_delayed};
}
const monthName=key=>`${+key.slice(0,4)}년 ${+key.slice(5)}월`;
export function pageInfo(key,figures){
 if(!figures)return null;
 if(!figures.stops)return {title:`${monthName(key)} 열차 도착 기록 · Korean Train Stats`,description:`${monthName(key)}의 수집은 완료되었으나 집계 가능한 도착 기록이 없습니다.`};
 return {title:`${monthName(key)} 열차 도착 지연 통계 · Korean Train Stats`,description:`${monthName(key)}의 역별 도착 기록 ${num(figures.stops)}건 중 5분 이내 도착 비율은 ${pct0(figures.share_punctual)}입니다. 날짜별 비율과 주요 지연 기록을 확인하세요.`};
}
export function renderMonth(key,f,hasTrain=()=>true){
 if(!f)return empty('이달의 집계 자료가 없습니다.');
 const {date,delay,backBtn,shareLegend}=localeUtils('ko'),counted=f.days.filter(d=>d.stops>0&&d.share_punctual!=null),best=counted.length?counted.reduce((a,b)=>b.share_punctual>a.share_punctual?b:a):null,worst=counted.length?counted.reduce((a,b)=>b.share_punctual<a.share_punctual?b:a):null;
 const head=`<div class="train-intro train-head"><div class="train-lead">${backBtn}<div><h1>${monthName(key)}</h1><p class="meta">수집 완료 ${f.days.length}일 · 역별 도착 기록 ${num(f.stops)}건</p><p class="meta train-stats">5분 이내 도착 비율 <b>${pct0(f.share_punctual)}</b>${best?` · 가장 높은 날 <b>${date(best.date)} (${pct0(best.share_punctual)})</b> · 가장 낮은 날 <b>${date(worst.date)} (${pct0(worst.share_punctual)})</b>`:''}</p></div></div></div>`;
 const bars=f.days.map(d=>d.share_punctual==null||!d.stops?`<span class="col"><i class="uncollected" style="height:6px" data-tip="${date(d.date)} · 집계할 수 있는 도착 기록 없음"></i></span>`:`<a class="col link" href="ko/day/${d.date}/" aria-label="${date(d.date)} · 5분 이내 도착 비율 ${pct(d.share_punctual)}"><i style="height:${Math.max(.5,d.share_punctual*100)}%"></i></a>`).join('');
 const daily=`<div class="chart-card"><div class="block-title"><h2>날짜별 5분 이내 도착 비율</h2></div><div class="bars-wrap"><span class="axis-label" style="bottom:100%">100%</span><span class="axis-label" style="bottom:50%">50%</span><span class="axis-label" style="bottom:0">0%</span><div class="bars fill" role="group" aria-label="날짜별 5분 이내 도착 비율 · 세로축 0~100%">${bars}</div></div><div class="bar-dates"><span class="meta">${date(f.days[0].date)}</span><span class="meta">${date(f.days.at(-1).date)}</span></div>${shareLegend('bar-legend')}${hiddenTable('날짜별 5분 이내 도착 비율',['날짜','5분 이내 도착 비율'],f.days.map(d=>[date(d.date,true),pct(d.share_punctual)]))}</div>`;
 const labels=['5분 이내','6–10분','11–20분','21–30분','30분 초과'],colors=['ontime','d2','d3','d4','d5'];
 const shown=f.buckets.map((n,i)=>({n,label:labels[i],color:colors[i]})).filter(b=>b.n),slice=n=>n>=.1?`${Math.round(n*100)}%`:n>=.01?`${(n*100).toFixed(1)}%`:'1% 미만';
 const how=`<div class="chart-card"><div class="block-title"><h2>도착 지연 시간 분포</h2></div><div class="day-bar" role="img" aria-label="${esc(shown.map(b=>`${b.label}: ${slice(b.n/f.stops)}`).join(', '))}">${shown.map(b=>`<i class="seg" style="flex:${b.n};background:var(--${b.color})" data-tip="${b.label}: ${num(b.n)}건"></i>`).join('')}</div><div class="day-bar-legend" aria-hidden="true">${shown.map(b=>`<span><i class="swatch" style="background:var(--${b.color})"></i>${b.label} <b>${slice(b.n/f.stops)}</b></span>`).join('')}</div>${hiddenTable('지연 시간별 도착 기록',['지연 시간','도착 기록'],shown.map(b=>[b.label,`${num(b.n)}건`]))}</div>`;
 const rows=f.most_delayed.map(raw=>{const t=localizeTrain(raw),name=`${esc(t.type)} ${t.number}`;return `<tr><td>${hasTrain(t.id)?`<a href="ko/train/${esc(t.id)}/">${name}</a>`:name}<span class="row-sub"><span><span>${esc(t.origin)} → ${esc(t.destination)}</span> <span class="at">${esc(stationName(t.station))}</span></span></span></td><td class="narrow-hide">${esc(t.origin)} → ${esc(t.destination)}</td><td class="nw"><a href="ko/day/${t.date}/">${date(t.date)}</a></td><td class="narrow-hide">${esc(stationName(t.station))}</td><td class="r"><span class="delay-chip"><i style="background:${colorDelay(t.delay)}"></i>${delay(t.delay)}</span></td></tr>`;}).join('');
 const biggest=`<div class="chart-card"><div class="block-title"><h2>지연 기록 상위 10건</h2><span class="meta">각 운행일의 열차별 최대 도착 지연</span></div>${rows?`<table class="day-table day-rows"><thead><tr><th>열차</th><th class="narrow-hide">운행 구간</th><th>날짜</th><th class="narrow-hide">정차역</th><th class="r">지연</th></tr></thead><tbody>${rows}</tbody></table>`:'<p class="muted">5분을 초과해 지연된 도착 기록이 없습니다.</p>'}</div>`;
 return head+`<div class="day-cards">${daily}${f.stops?how+biggest:empty('집계할 수 있는 도착 기록이 없습니다.')}</div>`;
}
