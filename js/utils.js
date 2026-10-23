export const WINDOWS = {yesterday:'Yesterday',month:'Past month',year:'This year'};
// Retired windows still resolve, so older links keep working.
export const WINDOW_ALIASES = {week:'month',all:'year'};
export const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const num = n => n == null ? '—' : Number(n).toLocaleString('en-US');
export const pct = n => n == null ? '—' : `${(n*100).toFixed(1)}%`;
export const delay = n => n == null ? '—' : `${n>0?'+':''}${n} min`;
export const date = (s,year=false) => s ? new Date(s+'T12:00:00+09:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',...(year?{year:'numeric'}:{}) ,timeZone:'Asia/Seoul'}).replace('Sept','Sep') : '—';
export const fullDate = s => s ? new Date(s+'T12:00:00+09:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Seoul'}) : '';
export const range = (a,b,year=true) => a===b ? date(a,year) : `${date(a)} – ${date(b,year)}`;
export const stamp = s => s ? new Date(s).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Seoul'})+' KST' : 'Not available';
export function href(state,patch={}) {const next={...state,...patch};return '?'+new URLSearchParams(Object.entries(next).filter(([,v])=>v!=null&&v!==''));}
export const trainLabel = t => `<span class="train-label"><span class="train-type">${esc(t.type)}</span><span class="train-number">${esc(t.number)}</span></span>`;
export const colorDelay = (n,mark=false) => n==null?'url(#missing)':`var(--${n<=5?(mark?'ontime-mark':'ontime'):n<=10?'d2':n<=20?'d3':n<=30?'d4':'d5'})`;
const SCALES={delay:[['ontime','Within 5 min'],['d2','6–10'],['d3','11–20'],['d4','21–30'],['d5','Over 30 min late']],share:[['ontime','94% or more'],['d1','92–94%'],['d2','88–92%'],['d3','80–88%'],['d4','70–80%'],['d5','Under 70%']]};
export const scaleLegend = (scale,title,extra='',cls='') => `<div class="legend ${cls}"><span class="legend-title">${title}</span>${SCALES[scale].map(([k,t])=>`<span><i class="swatch" style="background:var(--${k})"></i>${t}</span>`).join('')}${extra}</div>`;
export const colorShare = n => n==null?'none':`var(--${n>=.94?'ontime':n>=.92?'d1':n>=.88?'d2':n>=.80?'d3':n>=.70?'d4':'d5'})`;
export function markTip(title,body=''){return `tabindex="0" data-tip="${esc(title+'\n'+body)}" aria-label="${esc(title+'. '+body)}"`;}
export function hiddenTable(caption,headers,rows){return `<div class="sr-only"><table><caption>${esc(caption)}</caption><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
export function figure(label,value,note='',headline=false){return `<div class="figure"><div class="figure-label">${label}</div><div class="${headline?'headline':'figure-value'}">${value}</div>${note?`<div class="meta">${note}</div>`:''}</div>`;}
export function safeBold(text){return esc(text).replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/g,'<b>$1</b>').replace(/&amp;(amp|lt|gt|quot|#x27|#39);/g,'&$1;');}
export function selectedDays(days,window){return days.filter(d=>d.date>=window.from&&d.date<=window.to);}
export function dayValue(day,type){return type==='all'?day:day.by_type?.[type];}
export function summaryFor(window,days,type){
 if(window.summary[type])return window.summary[type];
 const selected=selectedDays(days,window).map(d=>dayValue(d,type)).filter(Boolean);
 if(!selected.length)return null;
 if(selected.length===1)return {...selected[0],comparison:null};
 const result={stops:0,punctual:0,late:0,runs_found:0,missing:0};
 for(const d of selected)for(const key of Object.keys(result))result[key]+=d[key]||0;
 return {...result,share_punctual:result.stops?result.punctual/result.stops:null,korail_measure:null,typical_late_delay:null,unavailable:null,comparison:null};
}
export function dayStrip(values,lastDate,changes=[],completeDates=null){
 const last=new Date(lastDate+'T12:00:00Z');
 return `<div class="day-strip">${values.map((v,i)=>{const d=new Date(last);d.setUTCDate(d.getUTCDate()-values.length+1+i);const iso=d.toISOString().slice(0,10),uncollected=completeDates&&!completeDates.has(iso);return `<span class="day-cell ${v==null?(uncollected?'uncollected':'hatch'):''} ${changes.includes(iso)?'changed':''}" style="${v!=null?`background:${colorDelay(v)}`:''}" ${markTip(date(iso,true),v==null?(uncollected?'Not collected':'Unavailable or missing arrival value'):`Final stop: ${delay(v)}`)}></span>`;}).join('')}</div>`;
}
export function empty(message='No complete days in this window yet.',link=''){return `<div class="empty"><h2>${esc(message)}</h2>${link}</div>`;}
export async function getJSON(path,optional=false){const r=await fetch(new URL('../data/'+path,import.meta.url));if(optional&&r.status===404)return null;if(!r.ok)throw Error('Data could not be loaded');return r.json();}
export function timeTabs(state,exclude=[]){return `<nav class="tabs time-tabs" aria-label="Time window">${Object.entries(WINDOWS).filter(([v])=>!exclude.includes(v)).map(([v,l])=>`<a class="${state.window===v?'active':''}" ${state.window===v?'aria-current="true"':''} href="${esc(href(state,{window:v,day:''}))}">${l}</a>`).join('')}</nav>`;}
