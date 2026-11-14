#!/usr/bin/env node
// Build both languages from shared renderers and the exported data. No private backend files are needed.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderTrain,pageInfo} from '../js/train.js';
import {renderDay,pageInfo as dayInfo} from '../js/day.js';
import {renderFront} from '../js/front.js';
import {trainRow,renderTrains,pageInfo as trainsInfo} from '../js/trains.js';
import {stationRows,renderStation,pageInfo as stationInfo} from '../js/station.js';
import {stationList,renderStations,pageInfo as stationsInfo} from '../js/stations.js';
import {monthFigures,renderMonth,pageInfo as monthInfo} from '../js/month.js';
import {esc} from '../js/utils.js';
import {localeUtils,configureKoreanStations} from '../js/locale.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.resolve(process.argv[2]||path.join(root,'_site'));
const SITE='https://koreantrainstats.com/',read=file=>JSON.parse(fs.readFileSync(path.join(root,'data',file),'utf8'));
const meta=read('meta.json'),{days}=read('days.json'),stations=read('stations/index.json'),yesterday=read('windows/yesterday.json'),month=read('windows/month.json');
const trainData=new Map(fs.readdirSync(path.join(root,'data/trains')).sort().map(file=>[file.slice(0,-5),read('trains/'+file)]));
const dayData=new Map(fs.readdirSync(path.join(root,'data/days')).sort().map(file=>[file.slice(0,-5),read('days/'+file)]));
const names={};
for(const s of stations.stations)if(s.name_ko)names[s.name]=s.name_ko;
for(const train of trainData.values())for(const t of train.timetables)for(const s of t.stops)if(s.station_ko)names[s.station]=s.station_ko;
// Fail clearly instead of silently publishing untranslated historical station names.
const required=new Set();
for(const t of trainData.values()){required.add(t.origin);required.add(t.destination);}
for(const d of dayData.values())for(const t of d.most_delayed)for(const k of ['origin','destination','station'])required.add(t[k]);
const missing=[...required].filter(name=>!names[name]);
if(missing.length)throw Error('Missing Korean station names: '+missing.join(', '));
configureKoreanStations(names);
const write=(file,html)=>{fs.mkdirSync(path.dirname(path.join(out,file)),{recursive:true});fs.writeFileSync(path.join(out,file),html);};
fs.rmSync(out,{recursive:true,force:true});
const leaveOut=new Set(['_site','artifacts','node_modules','docs','scripts','README.md','AGENTS.md','BUILD_NOTES.md']);
const publish=name=>!name.startsWith('.')&&!leaveOut.has(name);
for(const name of fs.readdirSync(root))if(publish(name)&&path.join(root,name)!==out)fs.cpSync(path.join(root,name),path.join(out,name),{recursive:true,filter:source=>publish(path.basename(source))});
const alternate=address=>`  <link rel="alternate" hreflang="en" href="${SITE}${address}">\n  <link rel="alternate" hreflang="ko" href="${SITE}ko/${address}">\n  <link rel="alternate" hreflang="x-default" href="${SITE}${address}">`;
const preview=(info,address,ko)=>[['og:type','website'],['og:site_name','Korean Train Stats'],['og:locale',ko?'ko_KR':'en_US'],['og:title',info.title],['og:description',info.description],['og:url',SITE+address],['og:image',SITE+'og.png'],['og:image:width','1200'],['og:image:height','630'],['og:image:alt',ko?'Korean Train Stats: 한국의 열차는 얼마나 제시간에 도착할까요?':'Korean Train Stats: How punctual are South Korea’s trains?']]
 .map(([property,content])=>`  <meta property="${property}" content="${esc(content)}">`).join('\n')+'\n  <meta name="twitter:card" content="summary_large_image">';
// One link to the same page in the other language, drawn as two cells. Both names always show; the current one is filled.
const languageSwitch=(address,ko)=>`<a class="language-switch" lang="${ko?'en':'ko'}" hreflang="${ko?'en':'ko'}" href="${ko?(address||'./'):'ko/'+address}" aria-label="${ko?'English':'한국어'}"><span lang="en"${ko?'':' class="on"'}>EN</span><span lang="ko"${ko?' class="on"':''}>한국어</span></a>`;
// The two list pages as header buttons. The front page shows them on every screen; other pages show them above 640 pixels (the .desktop-nav rule in styles.css).
const pagesNav=(ko,address='',front=false,up='')=>`<nav class="header-nav${front?'':' desktop-nav'}" aria-label="${ko?'페이지':'Pages'}">${[['trains/',ko?'전체 열차':'All trains'],['stations/',ko?'전체 역':'All stations']].map(([to,label])=>`<a class="nav-btn" href="${up}${ko?'ko/':''}${to}"${address===to?' aria-current="page"':''}>${label}</a>`).join('')}</nav>`;
const stationJSON=JSON.stringify(names).replaceAll('<','\\u003c');
function page(address,info,main,locale='en',front=false,dataset=null){
 const ko=locale==='ko',local=(ko?'ko/':'')+address,home=ko?'ko/':'./';
 return `<!doctype html>
<html lang="${locale}"><head>
  <meta charset="utf-8"><base href="${'../'.repeat(local.split('/').filter(Boolean).length)||'./'}">
  <meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#f4f4f3">
  <meta name="description" content="${esc(info.description)}"><title>${esc(info.title)}</title>
  <link rel="canonical" href="${SITE}${local}">
${alternate(address)}
${preview(info,local,ko)}
${dataset?`  <script type="application/ld+json">${JSON.stringify(dataset).replaceAll('<','\\u003c')}</script>`:''}
  <link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600${ko?'':'&text=%E2%86%92'}&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="tokens.css"><link rel="stylesheet" href="styles.css">
${front&&ko?`  <script id="korean-stations" type="application/json">${stationJSON}</script>`:''}
  <script type="module" src="js/${front?'start':'app'}.js"></script>
</head><body>
  <a class="skip" href="${local}#main">${ko?'본문으로 바로가기':'Skip to content'}</a>
  <div class="page"><header id="header"><a class="brand" href="${home}"><img src="logo.svg" alt="" width="26" height="26"><span>Korean Train Stats</span></a><div class="header-end">${pagesNav(ko,address,front)}${languageSwitch(address,ko)}</div></header>
  <main id="main" tabindex="-1">${main}</main><footer id="footer">${localeUtils(locale).footer(meta)}</footer></div>
  <div id="tooltip" role="tooltip" hidden></div>
</body></html>\n`;
}
// Retain the verified Naver tag and front-page dataset in the existing English source.
let index=fs.readFileSync(path.join(root,'index.html'),'utf8');
index=index.replace('<main id="main" tabindex="-1" aria-busy="true"><div class="skeleton"></div></main>',`<main id="main" tabindex="-1">${renderFront(meta,days,yesterday,month).html}</main>`)
 .replace('<footer id="footer"></footer>',`<footer id="footer">${localeUtils('en').footer(meta)}</footer>`)
 .replace('<nav class="header-nav"','<div class="header-end"><nav class="header-nav"').replace('</nav></header>','</nav>'+languageSwitch('',false)+'</div></header>').replace('</head>',alternate('')+'\n</head>');
write('index.html',index);
const dataset=JSON.parse(index.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
Object.assign(dataset,{name:'한국 열차 도착 지연 통계',description:'코레일이 제공한 역별 도착 지연 기록을 집계한 자료입니다. 공식 통계가 아닙니다. 5분 이내 도착 비율과 지연 시간을 제공합니다.',url:SITE+'ko/',inLanguage:'ko',variableMeasured:['5분 이내 도착 비율','도착 지연 시간(분)'],keywords:['코레일','KTX','열차 지연','도착 지연 통계','한국']});
write('ko/index.html',page('',{title:'한국 열차 도착 지연 통계 · Korean Train Stats',description:'코레일 열차(KTX 포함)는 얼마나 제시간에 도착할까요? 역별 도착 기록으로 살펴보는 5분 이내 도착 비율과 도착 지연.'},renderFront(meta,days,yesterday,month,'ko').html,'ko',true,dataset));
// Stations with a page, by ID and by English name, so a stop name on a train or day page can link to it.
const callsAt=stationRows(trainData.values()),stationIds=new Map(stations.stations.filter(s=>stationInfo(s,callsAt.get(s.id),month)).map(s=>[s.name,s.id])),pageIds=new Set(stationIds.values());
const addresses=[''],trainPages=new Set(),rows=[];
for(const [id,train] of trainData){
 if(!pageInfo(train))continue;
 const address=`train/${id}/`;
 for(const locale of ['en','ko'])write(`${locale==='ko'?'ko/':''}${address}index.html`,page(address,pageInfo(train,locale),renderTrain(train,days,stations,locale,id=>pageIds.has(id)),locale));
 trainPages.add(id);addresses.push(address);const row=trainRow(train);if(row)rows.push(row);
}
if(trainsInfo(rows,month)){
 for(const locale of ['en','ko'])write(`${locale==='ko'?'ko/':''}trains/index.html`,page('trains/',trainsInfo(rows,month,locale),renderTrains(rows,month,locale),locale));
 addresses.push('trains/');
}
// A station page for each station where a train reported an arrival in the past month.
let stationPages=0;
for(const station of stations.stations){
 const calls=callsAt.get(station.id);
 if(!stationInfo(station,calls,month))continue;
 const address=`station/${station.id}/`;
 for(const locale of ['en','ko'])write(`${locale==='ko'?'ko/':''}${address}index.html`,page(address,stationInfo(station,calls,month,locale),renderStation(station,calls,month,locale),locale));
 stationPages++;addresses.push(address);
}
// The all-stations page lists those stations.
const stationRowsAll=stationList(stations.stations,callsAt);
if(stationsInfo(stationRowsAll,month)){
 for(const locale of ['en','ko'])write(`${locale==='ko'?'ko/':''}stations/index.html`,page('stations/',stationsInfo(stationRowsAll,month,locale),renderStations(stationRowsAll,month,locale),locale));
 addresses.push('stations/');
}
for(const [iso,day] of dayData){
 if(!dayInfo(day,iso))continue;
 const address=`day/${iso}/`;
 for(const locale of ['en','ko'])write(`${locale==='ko'?'ko/':''}${address}index.html`,page(address,dayInfo(day,iso,locale),renderDay(day,iso,id=>trainPages.has(id),locale,name=>stationIds.get(name)),locale));
 addresses.push(address);
}
// The exporter owns English month pages; their archived day files supply the Korean equivalent.
const monthKeys=fs.readdirSync(root).filter(name=>/^\d{4}-\d{2}$/.test(name)&&fs.existsSync(path.join(root,name,'index.html')));
for(const key of monthKeys){
 const figures=monthFigures(key,dayData);if(!figures)throw Error(`Month ${key} is missing a complete archived day`);
 const address=key+'/';
 let english=fs.readFileSync(path.join(out,key,'index.html'),'utf8');
 english=english.replace('</head>',alternate(address)+'\n</head>').replace('</header>',`<div class="header-end">${pagesNav(false,'',false,'../')}${languageSwitch(address,false).replace('href="ko/','href="../ko/')}</div></header>`);
 write(key+'/index.html',english);
 const info=monthInfo(key,figures),monthDataset={...dataset,name:`${key} 한국 열차 도착 지연 통계`,description:info.description,url:SITE+'ko/'+address,temporalCoverage:`${figures.days[0].date}/${figures.days.at(-1).date}`};
 write('ko/'+key+'/index.html',page(address,info,renderMonth(key,figures,id=>trainPages.has(id)),'ko',false,monthDataset));
 addresses.push(address);
}
// GitHub Pages has one fallback document; its script chooses the language from the missing URL.
const errorInfo={title:'페이지를 찾을 수 없습니다 · Korean Train Stats',description:'요청한 페이지를 찾을 수 없습니다.'};
let error=page('404.html',errorInfo,'<div class="empty"><h1>페이지를 찾을 수 없습니다.</h1><p class="muted">주소를 확인하거나 첫 화면에서 열차와 날짜별 기록을 찾아보세요. <a href="ko/">첫 화면으로 이동</a></p></div>','ko');
error=error.replace('<base href="../">','<base href="/">').replace(/  <link rel="canonical"[^\n]*\n/, '').replace(/  <link rel="alternate"[^\n]*\n/g,'').replace('</head>','<meta name="robots" content="noindex"></head>');
write('ko/404.html',error);
let fallback=fs.readFileSync(path.join(root,'404.html'),'utf8');
fallback=fallback.replace('</head>','<script type="module" src="/js/not-found.js"></script></head>').replace('</main>','<p><a href="/ko/">한국어 첫 화면</a></p></main>');
write('404.html',fallback);
write('ko/app.html',fs.readFileSync(path.join(root,'app.html'),'utf8').replace('<html lang="en">','<html lang="ko">').replace('<head>','<head>\n  <base href="../">').replace('`train/${train}/`','`ko/train/${train}/`').replace('`day/${day}/`','`ko/day/${day}/`').replace(":'./'",":'ko/'").replace('href="./"','href="ko/"'));
// Sitemap languages share each page's stable identity. Only addresses actually built are listed.
const stamp=meta.last_complete_date?`<lastmod>${meta.last_complete_date}</lastmod>`:'';
const sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+addresses.flatMap(address=>['', 'ko/'].map(prefix=>`<url><loc>${SITE}${prefix}${address}</loc>${/^day\//.test(address)?`<lastmod>${address.split('/')[1]}</lastmod>`:/^\d{4}-\d{2}\/$/.test(address)?`<lastmod>${[...dayData.keys()].filter(iso=>iso.startsWith(address.slice(0,7))).at(-1)}</lastmod>`:stamp}</url>`)).join('\n')+'\n</urlset>\n';
write('sitemap.xml',sitemap);
console.log(`Built both languages: front page, ${trainPages.size} trains, train list, ${stationPages} stations, station list, ${dayData.size} days, and ${monthKeys.length} months.`);
