export const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const num = n => n == null ? '—' : Number(n).toLocaleString('en-US');
export const pct = n => n == null ? '—' : `${(n*100).toFixed(1)}%`;
export const pct0 = n => n == null ? '—' : n >= 1 ? '100%' : `${Math.min(99,Math.round(n*100))}%`;
export const backBtn = '<a class="back-btn" href="./" aria-label="Back to all trains" data-tip="Back to all trains"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M13 8H3m5-5L3 8l5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a>';
export const delay = n => n == null ? '—' : `${n>0?'+':''}${n} min`;
export const date = (s,year=false) => s ? new Date(s+'T12:00:00+09:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',...(year?{year:'numeric'}:{}) ,timeZone:'Asia/Seoul'}).replace('Sept','Sep') : '—';
export const range = (a,b,year=true) => a===b ? date(a,year) : `${date(a)} – ${date(b,year)}`;
const stamp = s => s ? new Date(s).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Seoul'})+' KST' : 'Not available';
export const colorDelay = n => `var(--${n<=5?'ontime':n<=10?'d2':n<=20?'d3':n<=30?'d4':'d5'})`;
const DELAY_SCALE=[['ontime','Within 5 min'],['d2','6–10'],['d3','11–20'],['d4','21–30'],['d5','Over 30 min late']];
export const scaleLegend = (title,extra='') => `<div class="legend"><span class="legend-title">${title}</span>${DELAY_SCALE.map(([k,t])=>`<span><i class="swatch" style="background:var(--${k})"></i>${t}</span>`).join('')}${extra}</div>`;
export const footer = meta => `<p>Reported arrival delays from Korail, not official statistics. On time means within 5 minutes of schedule. Train list: Mikołaj Kuranowski’s GTFS (CC BY 4.0) · Updated ${esc(stamp(meta.generated_at))}</p>`;
export const tipText=(title,body='')=>`data-tip="${esc(title+'\n'+body)}"`;
export function markTip(title,body=''){return `tabindex="0" ${tipText(title,body)} aria-label="${esc(title+'. '+body)}"`;}
export function hiddenTable(caption,headers,rows){return `<div class="sr-only"><table><caption>${esc(caption)}</caption><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
export function empty(message,link=''){return `<div class="empty"><h2>${esc(message)}</h2>${link}</div>`;}
export async function getJSON(path,optional=false){const r=await fetch(new URL('../data/'+path,import.meta.url));if(optional&&r.status===404)return null;if(!r.ok)throw Error('Data could not be loaded');return r.json();}
