export const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const num = n => n == null ? '—' : Number(n).toLocaleString('en-US');
export const pct = n => n == null ? '—' : `${(n*100).toFixed(1)}%`;
export const pct0 = n => n == null ? '—' : n >= 1 ? '100%' : `${Math.min(99,Math.round(n*100))}%`;
export const backBtn = '<a class="back-btn" href="./" aria-label="Back to front page" data-tip="Back to front page"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M13 8H3m5-5L3 8l5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a>';
// A long train table shows this many trains until the reader asks for all of them (js/trains-page.js).
export const ROW_CAP = 40;
// A delay of 100 minutes or more reads as hours and minutes (179 is 2 h 59 min); a shorter one stays in minutes. The month page's delay_text in the backend's exporter/export_site_data.py writes the same.
export const minutes = n => n>=100 ? `${Math.floor(n/60)} h${n%60?` ${n%60} min`:''}` : `${n} min`;
export const delay = n => n == null ? '—' : `${n>0?'+':''}${minutes(n)}`;
export const date = (s,year=false) => s ? new Date(s+'T12:00:00+09:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',...(year?{year:'numeric'}:{}) ,timeZone:'Asia/Seoul'}).replace('Sept','Sep') : '—';
export const range = (a,b,year=true) => a===b ? date(a,year) : `${date(a)} – ${date(b,year)}`;
const stamp = s => s ? new Date(s).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Seoul'})+' KST' : 'Not available';
export const colorDelay = n => `var(--${n<=5?'ontime':n<=10?'d2':n<=20?'d3':n<=30?'d4':'d5'})`;
const DELAY_SCALE=[['ontime','Within 5 min'],['d2','6–10'],['d3','11–20'],['d4','21–30'],['d5','Over 30']];
// A share of stops within 5 minutes is drawn in one green; the rest of its track is the late orange (--d3), so a bar reads as on time against late. shareLegend names both.
// A share needs ten recorded days to show on a list or a station page; a ranking needs twenty.
export const MIN_DAYS = 10;
// A share with its bar, for a list row or a table cell.
export const bar = s => `<span class="v${s==null?' dash':''}">${s==null?'—':pct0(s)}</span><span class="share-bar"><i style="width:${s==null?0:Math.round(s*100)}%"></i></span>`;
export const shareLegend = (cls='') => `<div class="legend${cls?' '+cls:''}"><span class="legend-label">Share of stops:</span><span><i class="swatch" style="background:var(--ontime-mark)"></i>Within 5 min</span><span><i class="swatch" style="background:var(--d3)"></i>More than 5 min late</span></div>`;
export const scaleLegend = (extra='') => `<div class="legend">${DELAY_SCALE.map(([k,t])=>`<span><i class="swatch" style="background:var(--${k})"></i>${t}</span>`).join('')}${extra}</div>`;
export const footer = meta => `<p>Reported arrival delays from Korail, not official statistics. On time means within 5 minutes of schedule.</p><p>Compilation and figures: <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Korail’s rights in its underlying data are unaffected.</p><p>Train list and station positions: Mikołaj Kuranowski’s GTFS (CC BY 4.0) · Updated ${esc(stamp(meta.generated_at))}</p>`;
export const tipText=(title,body='')=>`data-tip="${esc(title+'\n'+body)}"`;
export function markTip(title,body=''){return `tabindex="0" ${tipText(title,body)} aria-label="${esc(title+'. '+body)}"`;}
export function hiddenTable(caption,headers,rows){return `<div class="sr-only"><table><caption>${esc(caption)}</caption><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
export function empty(message,link=''){return `<div class="empty"><h2>${esc(message)}</h2>${link}</div>`;}
export async function getJSON(path,optional=false){const r=await fetch(new URL('../data/'+path,import.meta.url));if(optional&&r.status===404)return null;if(!r.ok)throw Error('Data could not be loaded');return r.json();}
