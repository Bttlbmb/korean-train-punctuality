import {esc,num,delay,colorDelay,tipText,hiddenTable,empty,pct0,backBtn} from './utils.js';
const BUCKETS=[['ontime','Within 5 min'],['d2','6–10 min'],['d3','11–20 min'],['d4','21–30 min'],['d5','Over 30 min']];
// A bucket's share of the day's stops: a whole percent from 10%, one decimal below that, and "<1%" for a sliver.
const slice=n=>n>=.1?`${Math.round(n*100)}%`:n>=.01?`${(n*100).toFixed(1)}%`:'<1%';
const dayName=iso=>new Date(iso+'T12:00:00+09:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Seoul'});
// What a search result shows for this page. A date with no data has an empty page, which is not worth indexing, so it gets null.
export function pageInfo(day,iso){
 if(!day?.trains)return null;
 return {title:`${dayName(iso)} · Korean Train Punctuality`,
  description:`${dayName(iso)}: ${pct0(day.share_punctual)} of Korail train stops were within 5 minutes of schedule, and ${num(day.late_trains)} of ${num(day.trains)} trains had a stop more than 5 minutes late.`};
}
export function renderDay(day,iso){
 const name=dayName(iso);
 if(!day)return `<a class="back-link" href="./">‹ Back</a>`+empty('No data for this day.',`<p class="muted">Reported delays for ${esc(name)} are not available.</p>`);
 const head=`<div class="train-intro train-head"><div class="train-lead">${backBtn}<div><h1>${esc(name)}</h1>${day.trains?`<p class="meta">${num(day.trains)} trains with ${num(day.stops)} stops</p><p class="meta train-stats"><b>${pct0(day.share_punctual)}</b> of stops within 5 min · <b>${num(day.late_trains)} of ${num(day.trains)}</b> trains had a late stop · <b>${delay(day.typical_late_delay)}</b> typical delay when late</p>`:''}</div></div></div>`;
 if(!day.trains)return head+empty('No reported delays for this day.');
 const total=day.buckets.reduce((a,b)=>a+b,0),shown=BUCKETS.map((b,i)=>({key:b[0],label:b[1],n:day.buckets[i],share:day.buckets[i]/total})).filter(b=>b.n),last=shown.at(-1);
 // The labels under the bar are skipped for a segment too narrow to hold one; the legend below lists every bucket and replaces the labels on narrow screens.
 const bar=shown.map(b=>`<i class="seg" style="flex:${b.n};background:var(--${b.key})" ${tipText(b.label,`${num(b.n)} stops`)}></i>`).join(''),
  labels=shown.map(b=>`<span style="flex:${b.n}"${b===last&&b!==shown[0]?' class="end"':''}>${b===shown[0]||b.share>=.08?`<b>${slice(b.share)}</b> ${b.label}`:''}</span>`).join(''),
  legend=shown.map(b=>`<span><i class="swatch" style="background:var(--${b.key})"></i>${b.label} <b>${slice(b.share)}</b></span>`).join('');
 const how=`<div class="chart-card"><div class="block-title"><h3>How late stops were</h3></div><div class="day-bar" role="img" aria-label="Share of stops by delay: ${shown.map(b=>`${slice(b.share)} ${b.label.toLowerCase()}`).join(', ')}.">${bar}</div><div class="day-bar-labels" aria-hidden="true">${labels}</div><div class="day-bar-legend" aria-hidden="true">${legend}</div>${hiddenTable('Stops by delay',['Delay','Stops'],shown.map(b=>[b.label,num(b.n)]))}</div>`;
 // The reported arrival is the scheduled one plus the reported delay; Korail reports no observed arrival time.
 const minutes=clock=>clock.split(':').reduce((h,m)=>h*60+ +m),at=(total,offset)=>`${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}${offset?`<sup>+${offset}</sup>`:''}`;
 const rows=day.most_delayed.map(t=>{const due=minutes(t.scheduled),late=due+t.delay;return `<tr><td><a href="app.html?train=${encodeURIComponent(t.id)}">${esc(t.type)} ${t.number}</a></td><td class="narrow-hide">${t.departure&&t.arrival?`${esc(t.origin)} <span class="mono run-time">${t.departure}</span> → ${esc(t.destination)} <span class="mono run-time">${at(minutes(t.arrival),t.arrival_day_offset)}</span>`:`${esc(t.origin)} → ${esc(t.destination)}`}</td><td class="narrow-hide">${esc(t.station)}</td><td class="mono">${at(due,t.scheduled_day_offset)}</td><td class="mono reported">${at(late,t.scheduled_day_offset+Math.floor(late/1440))}</td><td class="r"><span class="delay-chip${t.delay<=10?' pale':''}" style="background:${colorDelay(t.delay)}">+${t.delay} min</span></td></tr>`;}).join('');
 const biggest=`<div class="chart-card"><div class="block-title"><h3>Biggest delays</h3><span class="meta">Largest delay at any stop</span></div>${rows?`<table class="day-table"><thead><tr><th>Train</th><th class="narrow-hide">Route</th><th class="narrow-hide">Where</th><th>Scheduled</th><th>Reported</th><th class="r">Delay</th></tr></thead><tbody>${rows}</tbody></table>`:'<p class="muted">No stop was more than 5 minutes late.</p>'}</div>`;
 return head+`<div class="day-cards">${how}${biggest}</div>`;
}
