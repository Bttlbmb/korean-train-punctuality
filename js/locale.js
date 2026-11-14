import * as en from './utils.js';

export const korean = locale => locale === 'ko';
let stationNames = {};
// Korean names come from the existing station_ko fields, never reverse transliteration.
export const configureKoreanStations = names => { stationNames = names; };
export const stationName = name => stationNames[name] || name;
export function localizeTrain(train) {
 const names = {'ITX-Saemaeul':'ITX-새마을','ITX-Maum':'ITX-마음','ITX-Cheongchun':'ITX-청춘','Mugunghwa':'무궁화호','Other':'기타'};
 return {...train, type:names[train.type] || train.type,
  origin:stationName(train.origin), destination:stationName(train.destination)};
}
const date = (iso, year=false) => iso ? new Date(iso+'T12:00:00+09:00').toLocaleDateString('ko-KR', {
 ...(year ? {year:'numeric'} : {}), month:'long', day:'numeric', timeZone:'Asia/Seoul'
}) : '—';
const range = (a,b,year=true) => a===b ? date(a,year) : `${date(a,year)}–${date(b,year)}`;
const minutes = n => n>=100 ? `${Math.floor(n/60)}시간${n%60?` ${n%60}분`:''}` : `${n}분`;
const delay = n => n == null ? '—' : `${n>0?'+':''}${minutes(n)}`;
const scale = [['ontime','5분 이내'],['d2','6–10분'],['d3','11–20분'],['d4','21–30분'],['d5','30분 초과']];
const scaleLegend = (extra='') => `<div class="legend">${scale.map(([k,t])=>`<span><i class="swatch" style="background:var(--${k})"></i>${t}</span>`).join('')}${extra}</div>`;
const shareLegend = (cls='') => `<div class="legend${cls?' '+cls:''}"><span class="legend-label">도착 기록 중:</span><span><i class="swatch" style="background:var(--ontime-mark)"></i>5분 이내</span><span><i class="swatch" style="background:var(--d3)"></i>5분 넘게 늦음</span></div>`;
const footer = meta => `<p>코레일이 제공한 도착 지연 정보를 바탕으로 집계한 자료이며, 코레일의 공식 통계가 아닙니다.</p><p>5분 이내 도착 비율은 지연 정보가 있는 역별 도착 기록 중 지연 시간이 5분 이내인 기록의 비율입니다. 예정 시각보다 일찍 도착한 경우도 포함하며, 출발역과 지연 정보가 없는 기록은 제외합니다. 이 비율은 코레일이 발표하는 정시율과 집계 기준이 다릅니다. 지연 시간의 중앙값은 5분 넘게 늦은 도착 기록만 대상으로, 5분을 넘은 부분이 아닌 지연 시간 전체를 기준으로 계산하며 분 단위로 반올림합니다.</p><p>자료의 편집·집계 결과: <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. 원자료에 대한 코레일의 권리는 그대로 유지됩니다.</p><p>열차 목록·역 위치: Mikołaj Kuranowski의 GTFS (CC BY 4.0) · 업데이트: ${en.esc(meta.generated_at?new Date(meta.generated_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',hour12:false})+' (한국 시간)':'자료 없음')}</p>`;
export const localeUtils = locale => korean(locale) ? {...en,date,range,delay,minutes,scaleLegend,shareLegend,footer,
 num:n=>n==null?'—':Number(n).toLocaleString('ko-KR'),
 backBtn:en.backBtn.replaceAll('Back to front page','처음으로').replace('href="./"','href="ko/"')
} : en;
