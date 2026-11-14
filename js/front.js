import {esc,pct,date,range,hiddenTable,empty,shareLegend,minutes} from './utils.js';
import {trainDotsHTML} from './dots.js';
import {localeUtils} from './locale.js';
// The front page's markup, from its four data files. It needs no browser, so scripts/build.mjs uses it to build the page and start.js to refresh it.
const period=(eyebrow,big,sentence,sub,vis)=>`<section class="period"><div class="p-num"><p class="eyebrow">${eyebrow}</p><div class="hero">${big}</div></div><div class="p-text"><h2>${sentence}</h2><p class="sub">${sub}</p></div><div class="p-vis">${vis}</div></section>`;
// Yesterday in Korea time. "Yesterday" and "past 30 days" are only true when the newest complete day is this date.
const isFresh=to=>to===new Date(Date.now()-864e5).toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'});
function yesterdayRow(w,s,locale){
 const ko=locale==='ko';
 const trains=w.trains||[];
 const sub=s.typical_late_delay!=null?(ko?`5분 넘게 늦은 도착의 지연 시간 중앙값: ${localeUtils('ko').minutes(s.typical_late_delay)}`:`Typical delay when late: ${minutes(s.typical_late_delay)}`):'';
 const day=(opts)=>new Date(w.to+'T12:00:00+09:00').toLocaleDateString(ko?'ko-KR':'en-GB',{...opts,timeZone:'Asia/Seoul'}),short=day({weekday:'short',day:'numeric',month:'short'}),fresh=isFresh(w.to);
 if(ko)return period(fresh?`어제 · ${short}`:short,pct(s.share_punctual),'열차의 역별 도착 기록 중 5분 이내에 도착한 비율입니다.',sub,trains.length?trainDotsHTML(trains,locale):'<p class="muted">이 날짜의 열차 자료가 없습니다.</p>');
 return period(fresh?`Yesterday · ${short}`:short,pct(s.share_punctual),`of Korail train stops were on time ${fresh?'yesterday':'on '+day({weekday:'long',day:'numeric',month:'long'})}.`,sub,trains.length?trainDotsHTML(trains):'<p class="muted">Train data is not available for this date.</p>');
}
function monthRow(w,s,days,locale){
 const ko=locale==='ko',localized=localeUtils(locale);
 const inWindow=days.filter(d=>d.date>=w.from&&d.date<=w.to&&d.share_punctual!=null),byDate=new Map(inWindow.map(d=>[d.date,d])),worst=inWindow.length>1?inWindow.reduce((a,b)=>b.share_punctual<a.share_punctual?b:a):null,best=inWindow.length>1?inWindow.reduce((a,b)=>b.share_punctual>a.share_punctual?b:a):null;
 const dates=[];for(let t=new Date(w.from+'T12:00:00Z');t<=new Date(w.to+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+1))dates.push(t.toISOString().slice(0,10));
 const barItems=dates.map(iso=>({iso,d:byDate.get(iso)}));
 // A day with data is a real link, so crawlers and middle-click reach its page; tabindex -1 keeps the chart one keyboard stop, stepped with the arrow keys.
 const bars=barItems.map(({iso,d},i)=>d?`<a class="col link" href="${ko?'ko/':''}day/${iso}/" tabindex="-1" data-i="${i}"><i style="height:${Math.max(.5,d.share_punctual*100)}%"></i></a>`:`<span class="col" data-i="${i}"><i class="uncollected" style="height:6px"></i></span>`).join('');
 const sub=ko?[s.typical_late_delay!=null?`5분 넘게 늦은 도착의 지연 시간 중앙값: ${localeUtils('ko').minutes(s.typical_late_delay)}`:'',best?`5분 이내 도착 비율이 가장 높은 날: ${localized.date(best.date)} (${pct(best.share_punctual)})`:'',worst?`5분 이내 도착 비율이 가장 낮은 날: ${localized.date(worst.date)} (${pct(worst.share_punctual)})`:''].filter(Boolean).join('<br>'):[s.typical_late_delay!=null?`Typical delay when late: ${minutes(s.typical_late_delay)}`:'',best?`Best day: ${esc(best.weekday)} ${date(best.date)} (${pct(best.share_punctual)})`:'',worst?`Worst day: ${esc(worst.weekday)} ${date(worst.date)} (${pct(worst.share_punctual)})`:''].filter(Boolean).join('<br>');
 const fresh=isFresh(w.to),period30=w.days<30?`the ${w.days} days collected so far`:fresh?'the past 30 days':`the 30 days to ${date(w.to)}`;
 if(ko){
  const label=`${localized.range(w.from,w.to)}의 날짜별 5분 이내 도착 비율입니다. 세로축은 0~100%입니다. 방향키로 날짜를 선택하고 Enter 키로 해당 날짜의 페이지를 엽니다.`;
  const vis=`<div class="bars-wrap"><span class="axis-label" style="bottom:100%">100%</span><span class="axis-label" style="bottom:50%">50%</span><span class="axis-label" style="bottom:0">0%</span><div class="bars" tabindex="0" role="img" aria-label="${esc(label)}">${bars}</div></div><div class="bar-dates"><span class="meta">${localized.date(w.from)}</span><span class="meta">${localized.date(w.to)}</span></div>${localized.shareLegend('bar-legend')}<p class="meta dot-read" id="bar-read" aria-live="polite"></p>${hiddenTable('날짜별 5분 이내 도착 비율',['날짜','5분 이내 도착 비율'],inWindow.map(d=>[d.date,pct(d.share_punctual)]))}`;
  const eyebrow=`수집 완료 ${w.days}일 · ${localized.range(w.from,w.to,false)}`;
  return {html:period(eyebrow,pct(s.share_punctual),'열차의 역별 도착 기록 중 5분 이내에 도착한 비율입니다.',sub,vis),barItems};
 }
 const vis=`<div class="bars-wrap"><span class="axis-label" style="bottom:100%">100%</span><span class="axis-label" style="bottom:50%">50%</span><span class="axis-label" style="bottom:0">0%</span><div class="bars" tabindex="0" role="img" aria-label="Share of stops within 5 minutes for each day, on a 0 to 100 percent axis, ${esc(range(w.from,w.to))}. Arrow keys step through the days, and Enter opens the selected day’s page.">${bars}</div></div><div class="bar-dates"><span class="meta">${date(w.from)}</span><span class="meta">${date(w.to)}</span></div>${shareLegend('bar-legend')}<p class="meta dot-read" id="bar-read" aria-live="polite"></p>${hiddenTable('Daily punctuality',['Date','Within 5 min'],inWindow.map(d=>[d.date,pct(d.share_punctual)]))}`;
 return {html:period(fresh?`Past 30 days · ${range(w.from,w.to,false)}`:range(w.from,w.to,false),pct(s.share_punctual),`of stops were on time in ${period30}.`,sub,vis),barItems};
}
// The page's main content, and one item per bar of the past 30 days for start.js to make interactive.
export function renderFront(meta,days,y,m,locale='en'){
 const ko=locale==='ko',localized=localeUtils(locale);
 const ys=y.summary?.all,ms=m.summary?.all;
 if(ko&&(!ys?.stops||!ms?.stops))return {html:empty('집계할 수 있는 도착 기록이 없습니다.',`<p class="muted">${meta.collecting_date?localized.date(meta.collecting_date,true)+' 자료를 수집하고 있습니다. ':''}집계 가능한 도착 기록이 모이면 통계를 표시합니다.</p>`),barItems:[]};
 if(!ys?.stops||!ms?.stops)return {html:empty('No complete days yet.',`<p class="muted">${meta.collecting_date?date(meta.collecting_date,true)+' is still collecting. ':''}Punctuality figures appear after a day is complete.</p>`),barItems:[]};
 const month=monthRow(m,ms,days,locale);
 if(ko)return {html:'<h1 class="sr-only">한국의 열차는 얼마나 제시간에 도착할까요?</h1>'+yesterdayRow(y,ys,locale)+month.html,barItems:month.barItems};
 return {html:`<h1 class="sr-only">How punctual are South Korea’s trains?</h1>`+yesterdayRow(y,ys)+month.html,barItems:month.barItems};
}
