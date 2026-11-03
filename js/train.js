import {esc,delay,date,range,colorDelay,scaleLegend,markTip,tipText,hiddenTable,empty,pct0,backBtn} from './utils.js';
import {KOREA} from './korea.js';
const percentile=(xs,p)=>{const a=xs.filter(v=>v!=null).sort((a,b)=>a-b);return a.length?a[Math.min(a.length-1,Math.ceil(a.length*p)-1)]:null;};
// A stop is matched across timetable versions by its station and which visit it is, because a train can call at the same station twice (Hongseong, on the ITX-Maum loop).
const stopKeys=stops=>{const seen=new Map();return stops.map(s=>{const name=s.station_ko||s.station,n=seen.get(name)||0;seen.set(name,n+1);return `${name}#${n}`;});};
const clock=(time,offset)=>time?`${esc(time)}${offset?` (+${offset} day)`:''}`:'—';
const PITCH=5.5,PER_COLUMN=5,GLYPH_HEIGHT=96,LON_SCALE=Math.cos(36.3*Math.PI/180);
const [WEST,EAST,SOUTH,NORTH]=[Math.min(...KOREA.map(p=>p[0])),Math.max(...KOREA.map(p=>p[0])),Math.min(...KOREA.map(p=>p[1])),Math.max(...KOREA.map(p=>p[1]))];
// Decoration beside the heading: South Korea as a grey shape with the route in ink. It is left out unless the station index has coordinates for every stop, so it never shows a partial route.
function glyphHTML(stops,stationIndex){
 const known=new Map((stationIndex?.stations||[]).filter(s=>s.latitude!=null).map(s=>[s.id,s])),route=stops.map(s=>known.get(s.station_id)).filter(Boolean);
 if(route.length<stops.length)return '';
 const k=GLYPH_HEIGHT/(NORTH-SOUTH),point=(lon,lat)=>[((lon-WEST)*LON_SCALE*k).toFixed(1),((NORTH-lat)*k).toFixed(1)],path=points=>points.map(p=>point(...p).join(' ')).join('L'),width=((EAST-WEST)*LON_SCALE*k).toFixed(1);
 const [x1,y1]=point(route[0].longitude,route[0].latitude),[x2,y2]=point(route.at(-1).longitude,route.at(-1).latitude);
 return `<svg class="train-glyph" aria-hidden="true" focusable="false" width="${width}" height="${GLYPH_HEIGHT}" viewBox="0 0 ${width} ${GLYPH_HEIGHT}"><path class="glyph-land" d="M${path(KOREA)}Z"/><path class="glyph-route" d="M${path(route.map(s=>[s.longitude,s.latitude]))}"/><circle class="glyph-end" cx="${x1}" cy="${y1}" r="2.6"/><circle class="glyph-end" cx="${x2}" cy="${y2}" r="2.6"/></svg>`;
}
// One dot per recorded day, placed at its delay in whole minutes. Days with the same delay stack in a small grid centered on that minute.
function dotsHTML(values,x,dates){
 const slots=new Map();values.forEach((v,n)=>{const k=Math.round(v);slots.set(k,[...(slots.get(k)||[]),{v,d:dates[n]}]);});
 return [...slots].map(([k,list])=>{const columns=Math.ceil(list.length/PER_COLUMN);return list.map(({v,d},j)=>{const column=Math.floor(j/PER_COLUMN),inColumn=Math.min(list.length-column*PER_COLUMN,PER_COLUMN);return `<i class="rail-dot${v>5?' late':''}" data-date="${d}" style="left:calc(${x(k)}% + ${(column-(columns-1)/2)*PITCH}px);top:calc(50% + ${((j%PER_COLUMN)-(inColumn-1)/2)*PITCH}px)"></i>`;}).join('');}).join('');
}
// What a search result shows for this page. A train with no run in the past month has an empty page, which is not worth indexing, so it gets null.
export function pageInfo(train){
 const w=train?.windows?.month;if(!train||!w?.runs)return null;
 const name=`${train.type} ${train.number}`,span=`${w.days} ${w.days===1?'day':'days'}`;
 return {title:`${name} ${train.origin} → ${train.destination} · Korean Train Punctuality`,
  description:`${name} from ${train.origin} to ${train.destination}: ${w.share_punctual==null?'reported arrival delays':`${pct0(w.share_punctual)} of stops were within 5 minutes of schedule`} over the past ${span}.`};
}
export function renderTrain(train,allDays=[],stationIndex=null){
 const back='<a class="back-link" href="./">‹ Back</a>';
 if(!train)return back+empty('No recorded runs for this train.',`<p class="muted">A train detail file is not available.</p>`);
 const w=train.windows.month,tmap=new Map(train.timetables.map(t=>[t.id,t])),current=train.timetables.at(-1),stops=current.stops,runs=train.runs.filter(r=>r.date>=w.from&&r.date<=w.to),ok=runs.filter(r=>r.status==='ok'),origin=stops[0],dest=stops.at(-1);
 const keyed=new Map(train.timetables.map(t=>[t.id,stopKeys(t.stops)])),getStops=r=>tmap.get(r.timetable)?.stops||[];
 const valuesFor=(r,key)=>{const s=getStops(r)[keyed.get(r.timetable)?.indexOf(key)];return s?.arrival!=null?r.delays?.[s.ordinal]??null:null;};
 const finalFor=r=>{const s=getStops(r).filter(s=>s.arrival!=null).at(-1);return s?r.delays?.[s.ordinal]??null:null;};
 const head=(stats='')=>`<div class="train-intro train-head"><div class="train-lead">${backBtn}<div><h1>${esc(train.type)} <span class="train-number">${train.number}</span> · ${esc(train.origin)} → ${esc(train.destination)}</h1><p class="meta">${esc(origin.station)} <span class="mono">${clock(origin.departure,origin.departure_day_offset)}</span> → ${esc(dest.station)} <span class="mono">${clock(dest.arrival,dest.arrival_day_offset)}</span> · ${stops.length} stops · Data for ${ok.length} ${ok.length===1?'run':'runs'} from ${range(w.from,w.to)}</p>${stats}</div></div>${glyphHTML(stops,stationIndex)}</div>`;
 if(!ok.length)return head()+empty('No recorded runs in the past month.');
 const finals=ok.map(finalFor).filter(v=>v!=null);
 const currentKeys=stopKeys(stops);
 const byStop=stops.map((s,i)=>{const key=currentKeys[i],pairs=ok.map(r=>[valuesFor(r,key),r.date]).filter(p=>p[0]!=null),values=pairs.map(p=>p[0]),dates=pairs.map(p=>p[1]),within=values.filter(v=>v<=5).length;return {...s,key,values,dates,within,share:values.length?within/values.length:null};});
 const all=byStop.flatMap(s=>s.values),max=Math.max(15,Math.ceil((percentile(all,.97)||15)/5)*5),x=v=>(Math.max(-2,Math.min(max,v))+2)/(max+2)*100;
 const stats=`<p class="meta train-stats"><b>${pct0(w.share_punctual)}</b> of stops within 5 min · <b>${w.final_on_time} of ${w.final_reported??finals.length}</b> days on time at ${esc(dest.station)} · <b>${delay(w.typical_late_delay)}</b> typical delay when late</p>`;
 const timed=byStop.filter(s=>s.arrival!=null);
 // Times are the schedule: the arrival, or the departure at the origin, which has no arrival delay and so no dots. Every row shows its share within 5 minutes, or a dash when no arrival was reported.
 const rows=byStop.map((s,i)=>{const first=s.arrival==null,time=s.arrival??s.departure,offset=first?s.departure_day_offset:s.arrival_day_offset,tip=first?`Departs ${s.departure}; the origin has no arrival delay`:s.values.length?`${s.within} of ${s.values.length} days within 5 min`:'No reported arrival in this window';
  return `<div class="rail-row" ${markTip(s.station,tip)}><span class="rail-time">${time?`${esc(time)}${offset?`<sup>+${offset}</sup>`:''}`:'—'}</span><span class="rail-stop"><svg class="rail-node" viewBox="0 0 14 32" aria-hidden="true"><path d="M7 ${i?0:16}V${i<byStop.length-1?32:16}"/><circle cx="7" cy="16" r="5"/></svg>${esc(s.station)}</span><span class="rail-track${first?' rail-origin':''}"><i class="rail-limit" style="left:${x(5.5)}%"></i>${i===0?`<span class="rail-label" style="left:${x(5.5)}%">5 min</span>`:''}${dotsHTML(s.values,x,s.dates)}</span><span class="rail-share">${first?'':!s.values.length?'—':pct0(s.share)}</span></div>`;}).join('');
 const changes=train.changes.map(c=>c.date),changed=changes.some(c=>c>=w.from&&c<=w.to),runMap=new Map(runs.map(r=>[r.date,r])),completeSet=new Set(allDays.map(d=>d.date)),calendarDays=[];for(let d=new Date(w.from+'T12:00:00Z');d.toISOString().slice(0,10)<=w.to;d.setUTCDate(d.getUTCDate()+1))calendarDays.push(d.toISOString().slice(0,10));
 const days30=calendarDays.map(iso=>{const r=runMap.get(iso),final=r?finalFor(r):null,changedDay=changes.includes(iso),label=!r?(completeSet.has(iso)?'No recorded run':'Not collected'):r.status==='unavailable'?'Unavailable':final==null?'Missing final-stop arrival value':`Final stop: ${delay(final)}`;return {iso,final,changedDay,r,label:label+(changedDay?' · Timetable changed':'')};});
 // The cells are not tab stops: the strip is one, and the arrow keys step through the days (see bindDayStrip in app.js).
 const strip=days30.map(({iso,final,changedDay,r,label})=>`<span data-date="${iso}" class="day-cell ${final==null?(r?'hatch':'uncollected'):''} ${changedDay?'changed':''}" style="${final!=null?'background:'+colorDelay(final):''}" ${tipText(date(iso,true),label)}></span>`).join('');
 return `${head(stats)}<div class="chart-card rail-card"><div class="block-title"><h3>Delay at every stop in the past ${w.days} ${w.days===1?'day':'days'}</h3><span class="meta">Delay in minutes · scheduled arrival times</span></div><div class="rail">${rows}</div><div class="legend"><span><i class="swatch rail-key"></i>Within 5 min</span><span><i class="swatch rail-key late"></i>More than 5 min late</span><span>One dot per recorded day</span></div>${hiddenTable('Reported delays by day and stop',['Date',...timed.map(s=>s.station)],ok.map(r=>[r.date,...timed.map(s=>delay(valuesFor(r,s.key)))]))}<div class="block-title train-days-title"><h3>Day by day</h3><span class="meta">Final-stop delay at ${esc(dest.station)}</span></div><div class="train-days"><div class="day-strip" tabindex="0" role="img" aria-label="Final-stop delay at ${esc(dest.station)} for each day, ${range(w.from,w.to)}. Arrow keys step through the days.">${strip}</div>${hiddenTable('Final-stop delay by day',['Date','Final stop'],days30.map(d=>[d.iso,d.label]))}<div class="strip-dates meta"><span>${date(w.from)}</span><span>${date(w.to)}</span></div></div>${scaleLegend('Final-stop delay:','<span><i class="swatch hatch"></i>Unavailable or missing</span>'+(changed?'<span>│ Timetable changed</span>':''))}</div>`;
}
