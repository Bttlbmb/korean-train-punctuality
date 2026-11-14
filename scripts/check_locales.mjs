#!/usr/bin/env node
// Check the built bilingual site, its links, and reconstructed calendar-month figures.
// Usage: node scripts/check_locales.mjs [output-folder] (default: _site)
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {monthFigures,renderMonth,pageInfo as monthInfo} from '../js/month.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.resolve(process.argv[2]||path.join(root,'_site')),SITE='https://koreantrainstats.com/';
const problems=[],fail=(where,why)=>problems.push(`${where}: ${why}`);
const decode=s=>s.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi,s=>({amp:'&',quot:'"',apos:"'",lt:'<',gt:'>'}[s.slice(1,-1).toLowerCase()]??String.fromCodePoint(parseInt(s.slice(s[2]?.toLowerCase()==='x'?3:2,-1),s[2]?.toLowerCase()==='x'?16:10))));
// The build writes quoted attributes. Ignore '<1%' text when reading its markup.
const tags=html=>[...html.matchAll(/<([a-z][\w:-]*)(?=\s|\/?>)([^>]*?)>/gi)].map(m=>({tag:m[1].toLowerCase(),a:Object.fromEntries([...m[2].matchAll(/([^\s=<>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(a=>[a[1],decode(a[2]??a[3])]))}));
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const built=new Map(files(out).filter(f=>f.endsWith('.html')).map(f=>[path.relative(out,f).split(path.sep).join('/'),fs.readFileSync(f,'utf8')]));
const address=file=>SITE+(file.endsWith('index.html')?file.slice(0,-10):file);
const local=url=>{const p=decodeURIComponent(new URL(url).pathname).slice(1);return p+(p===''||p.endsWith('/')?'index.html':'');};
const exists=file=>fs.existsSync(path.join(out,file));
const ids=file=>new Set([...built.get(file).matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]));
const hasClass=(a,name)=>(a.class||'').split(/\s+/).includes(name);
const canonicalURLs=new Set();let pages=0,links=0,resources=0,alternates=0,pairs=0;
for(const [file,html] of built){
 const parsed=tags(html),url=address(file),base=new URL(parsed.find(t=>t.tag==='base')?.a.href||url,url);
 const lang=parsed.find(t=>t.tag==='html')?.a.lang;
 const noindex=parsed.some(t=>t.tag==='meta'&&t.a.name==='robots'&&/\bnoindex\b/.test(t.a.content||''));
 const canonical=parsed.filter(t=>t.tag==='link'&&t.a.rel==='canonical').map(t=>new URL(t.a.href,base).href);
 if(!noindex){
  pages++;for(const u of canonical)canonicalURLs.add(u);
  if(canonical.length!==1||canonical[0]!==url)fail(file,'canonical does not name this page');
  const identity=url.slice(SITE.length).replace(/^ko\//,'');
  const expected={en:SITE+identity,ko:SITE+'ko/'+identity,'x-default':SITE+identity};
  const found=Object.fromEntries(parsed.filter(t=>t.tag==='link'&&t.a.rel==='alternate').map(t=>[t.a.hreflang,new URL(t.a.href,base).href]));
  if(Object.keys(found).length!==3||Object.entries(expected).some(([k,v])=>found[k]!==v))fail(file,'language alternates do not pair equivalent pages');
  alternates+=Object.keys(found).length;
  const switches=parsed.filter(t=>t.tag==='a'&&hasClass(t.a,'language-switch')).map(t=>new URL(t.a.href,base).href);
  if(switches.length!==1||switches[0]!==expected[lang==='ko'?'en':'ko'])fail(file,'language switch does not open equivalent page');
 }
 const visible=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
 if(/\b(?:undefined|NaN|null)\b/.test(visible))fail(file,'invalid value in rendered markup');
 for(const {tag,a} of parsed){
  const attr=['script','img','iframe','source'].includes(tag)?'src':['a','link'].includes(tag)?'href':null;
  if(!attr||!a[attr])continue;
  let target;try{target=new URL(a[attr],base);}catch{fail(file,`invalid ${attr}: ${a[attr]}`);continue;}
  if(target.origin!==new URL(SITE).origin)continue;
  const dest=local(target);if(tag==='a')links++;else resources++;
  if(!exists(dest))fail(file,`missing local target ${a[attr]} (resolves to ${dest})`);
  if(tag==='a'&&lang==='ko'&&!hasClass(a,'language-switch')&&!target.pathname.startsWith('/ko/'))fail(file,`Korean navigation leaves /ko/: ${a[attr]}`);
  if(tag==='a'&&target.hash&&built.has(dest)&&!ids(dest).has(decodeURIComponent(target.hash.slice(1))))fail(file,`missing fragment ${a[attr]}`);
 }
 // Compare language-independent chart geometry across each published language pair.
 if(file.startsWith('ko/')&&!noindex){
  const en=built.get(file.slice(3));if(!en){fail(file,'missing English equivalent');continue;}
  pairs++;
  for(const [label,pattern] of [['train dots',/<i class="rail-dot(?: late)?"[^>]*>/g],['delay buckets',/class="seg" style="flex:[^";]+;background:[^"]+/g]]){
   if(JSON.stringify(html.match(pattern)||[])!==JSON.stringify(en.match(pattern)||[]))fail(file,`${label} differ between languages`);
  }
  const headline=markup=>markup.match(/class="meta train-stats">.*?<b>([^<]+)<\/b>/s)?.[1];
  if(headline(html)!==headline(en))fail(file,'headline figure differs between languages');
 }
}
const sitemap=fs.readFileSync(path.join(out,'sitemap.xml'),'utf8'),listed=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>decode(m[1])),urls=new Set(listed);
if(urls.size!==listed.length)fail('sitemap','duplicate URL');
for(const u of canonicalURLs)if(!urls.has(u))fail('sitemap',`missing canonical ${u}`);
for(const u of urls){
 if(!canonicalURLs.has(u))fail('sitemap',`URL has no indexable built page: ${u}`);
 const p=u.slice(SITE.length),other=SITE+(p.startsWith('ko/')?p.slice(3):'ko/'+p);
 if(!urls.has(other))fail('sitemap',`missing language equivalent for ${u}`);
}

const dayFiles=fs.readdirSync(path.join(root,'data/days')).filter(f=>f.endsWith('.json'));
const documents=new Map(dayFiles.map(f=>[f.slice(0,-5),JSON.parse(fs.readFileSync(path.join(root,'data/days',f),'utf8'))]));
const lexical=(a,b)=>a<b?-1:a>b?1:0;
let months=0;
for(const [file,html] of built){
 const key=file.match(/^ko\/(\d{4}-\d{2})\/index\.html$/)?.[1];if(!key)continue;
 try{
  const f=monthFigures(key,documents);assert(f,'missing complete month');
  const source=[...documents.entries()].filter(([iso])=>iso.startsWith(key+'-')).map(([,d])=>d);
  const buckets=Array.from({length:5},(_,i)=>source.reduce((n,d)=>n+d.buckets[i],0));
  const stops=source.reduce((n,d)=>n+d.stops,0),share=stops?buckets[0]/stops:null;
  const top=source.flatMap(d=>d.most_delayed.map(t=>({...t,date:d.date}))).sort((a,b)=>b.delay-a.delay||lexical(a.date,b.date)||lexical(a.departure,b.departure)||a.number-b.number||lexical(a.type,b.type)).slice(0,10);
  assert.deepEqual(f.buckets,buckets);assert.equal(f.stops,stops);assert.equal(f.share_punctual,share);assert.deepEqual(f.most_delayed,top);
  for(const [language,markup] of [['Korean',html],['English',built.get(key+'/index.html')]]){
   const segments=[...markup.matchAll(/class="seg" style="flex:(\d+)/g)].map(m=>+m[1]);
   assert.deepEqual(segments,buckets.filter(n=>n),`${language} month buckets`);
   const table=[...markup.matchAll(/<tbody>(.*?)<\/tbody>/gs)].at(-1)?.[1]||'';
   const delays=[...table.matchAll(/\+(\d+)(?:분| min)/g)].map(m=>+m[1]);assert.deepEqual(delays,top.map(t=>t.delay),`${language} largest delays`);
   const dates=[...table.matchAll(/href="[^"]*day\/(\d{4}-\d{2}-\d{2})\//g)].map(m=>m[1]);assert.deepEqual(dates,top.map(t=>t.date),`${language} largest-delay dates`);
   const linked=[...table.matchAll(/href="[^"]*train\/([^/]+)\//g)].map(m=>m[1]);assert.deepEqual(linked,top.filter(t=>exists(`train/${t.id}/index.html`)).map(t=>t.id),`${language} largest-delay train identities`);
   const headline=markup.match(/class="meta train-stats">.*?<b>([^<]+)<\/b>/s)?.[1],expected=share==null?'—':`${share>=1?100:Math.min(99,Math.round(share*100))}%`;
   assert.equal(headline,expected,`${language} month headline`);
  }
  months++;
 }catch(e){fail(key,e.message);}
}

// A missing date differs from a completed date without any countable arrivals.
try{
 const key='2026-01',fixture=new Map(Array.from({length:31},(_,i)=>{
  const date=`${key}-${String(i+1).padStart(2,'0')}`,buckets=i?[0,1,0,0,0]:[99,1,0,0,0],stops=buckets[0]+buckets[1];
  return [date,{date,stops,buckets,share_punctual:buckets[0]/stops,most_delayed:[]}];
 }));
 const f=monthFigures(key,fixture);assert.equal(f.share_punctual,99/130,'month must pool arrivals rather than average daily shares');
 const absent=new Map(fixture);absent.delete(key+'-01');assert.equal(monthFigures(key,absent),null);
 const zero={...fixture.get(key+'-01'),stops:0,buckets:[0,0,0,0,0],share_punctual:null};
 const oneZero=new Map(fixture);oneZero.set(key+'-01',zero);
 const sparse=monthFigures(key,oneZero),sparseHTML=renderMonth(key,sparse);
 assert.equal(sparse.days.length,31);assert.equal(sparse.share_punctual,0);
 assert(!/NaN|undefined|\bnull\b/.test(sparseHTML));assert(!sparseHTML.includes('href="ko/day/2026-01-01/"'));assert(sparseHTML.includes('집계할 수 있는 도착 기록 없음'));
 const allZero=new Map([...fixture].map(([date])=>[date,{...zero,date}])),emptyMonth=monthFigures(key,allZero),emptyHTML=renderMonth(key,emptyMonth);
 assert.equal(emptyMonth.share_punctual,null);assert(emptyHTML.includes('5분 이내 도착 비율 <b>—</b>'));assert(emptyHTML.includes('집계할 수 있는 도착 기록이 없습니다'));assert(!/NaN|undefined|\bnull\b/.test(emptyHTML));assert(!emptyHTML.includes('가장 높은 날'));assert(monthInfo(key,emptyMonth).description.includes('집계 가능한 도착 기록이 없습니다'));
}catch(e){fail('synthetic month cases',e.message);}
console.log(`${pages} indexable pages, ${pairs} language pairs, ${links} local navigation links, ${resources} local resources and metadata links, ${alternates} alternates, ${months} calendar months checked; ${problems.length} problems.`);
for(const p of problems.slice(0,20))console.log('  '+p);
if(problems.length>20)console.log(`  and ${problems.length-20} more`);
process.exit(problems.length?1:0);
