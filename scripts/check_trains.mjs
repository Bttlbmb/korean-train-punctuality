#!/usr/bin/env node
// Render every train and day page from the data folder and check each one: no error; no "undefined", "NaN", or "null" in the text;
// the final stop's dots match the heading's count; each row's share matches its dots; and a title and description for search
// engines (an empty page has none, so it is not indexed). A day page's delay buckets add up to its stops, and its stops and share match days.json.
// The all-trains page has one row for each train page, each linking to it, with the share its train file gives.
// A train page with fewer than 10 runs says why the lists show no share for it, and no other does.
// A station page has a row for each call of each train (and counts each train once, though a loop train calls twice), each linking to its train page and showing the share its figures give, and every reported arrival
// in the train files lands on exactly one station page. The all-stations page has one row for each station page, each linking to it, with the share its figures give.
// The all-journeys page has one row for each journey that at least 40 trains make, with the trains, arrivals, and share that the train files give when counted again directly,
// and the panel for a pair of stations gives the same figures.
// Usage: node scripts/check_trains.mjs [data-folder]   (default: data)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..'),data=path.resolve(process.argv[2]||path.join(root,'data'))+'/';
const {renderTrain,pageInfo}=await import(pathToFileURL(path.join(root,'js/train.js')));
const {renderDay,pageInfo:dayInfo}=await import(pathToFileURL(path.join(root,'js/day.js')));
const {trainRow,renderTrains,pageInfo:trainsInfo}=await import(pathToFileURL(path.join(root,'js/trains.js')));
const {stationRows,renderStation,pageInfo:stationInfo}=await import(pathToFileURL(path.join(root,'js/station.js')));
const {stationList,renderStations,pageInfo:stationsInfo}=await import(pathToFileURL(path.join(root,'js/stations.js')));
const {ROW_CAP}=await import(pathToFileURL(path.join(root,'js/utils.js')));
const {journeyData,journeyList,journeysAt,journeyCount:pairCount,pairStats,resultHTML,renderJourneys,pageInfo:journeysInfo,MIN_TRAINS}=await import(pathToFileURL(path.join(root,'js/journeys.js')));
const read=file=>JSON.parse(fs.readFileSync(data+file,'utf8')),stations=read('stations/index.json'),days=read('days.json').days;
const problems=[];let pages=0,empty=0;
for(const file of fs.readdirSync(data+'trains')){
 const id=file.replace('.json',''),fail=why=>problems.push(`${id}: ${why}`);
 let train,html;try{train=read('trains/'+file);html=renderTrain(train,days,stations);}catch(error){fail(`error ${error.message}`);continue;}
 pages++;
 const text=html.replace(/<[^>]*>/g,' '),bad=text.match(/undefined|NaN|\bnull\b/);if(bad)fail(`text contains "${bad[0]}"`);
 const rows=html.split('<div class="rail-row"').slice(1);
 const info=pageInfo(train);
 if(!rows.length){empty++;if(info)fail('an empty page has a title and description, so it would be indexed');continue;}
 if(!info)fail('no title and description');
 else if(info.title.length>80||info.description.length>160||/undefined|NaN|null/.test(info.title+info.description))fail(`title or description is too long or has bad text: ${info.title} / ${info.description}`);
 const runCount=html.match(/Data for (\d+) runs?/),noted=html.includes('too few to show a share in the train and station lists');
 if(runCount&&(+runCount[1]<10)!==noted)fail(`${runCount[1]} runs but the short-record note is ${noted?'shown':'missing'}`);
 const finals=html.match(/<b>\d+ of (\d+)<\/b> days on time at/);
 const dotsIn=row=>[(row.match(/class="rail-dot"/g)||[]).length,(row.match(/class="rail-dot late( out)?"/g)||[]).length];
 const lastDots=dotsIn(rows.at(-1)).reduce((a,b)=>a+b);
 if(finals&&+finals[1]!==lastDots)fail(`the heading counts ${finals[1]} final-stop days but the last row has ${lastDots} dots`);
 for(const row of rows){
  const [onTime,late]=dotsIn(row),shown=row.match(/rail-share">([^<]*)</)[1],expected=row.includes('rail-origin')?'':onTime+late===0?'—':late===0?'100%':`${Math.min(99,Math.round(onTime/(onTime+late)*100))}%`;
  if(shown!==expected)fail(`a row shows ${shown} but its dots give ${expected}`);
 }
}
let dayPages=0;
if(fs.existsSync(data+'days'))for(const file of fs.readdirSync(data+'days')){
 const iso=file.replace('.json',''),fail=why=>problems.push(`${iso}: ${why}`),day=read('days/'+file),html=renderDay(day,iso),info=dayInfo(day,iso),listed=days.find(d=>d.date===iso);
 dayPages++;
 const bad=html.replace(/<[^>]*>/g,' ').match(/undefined|NaN|\bnull\b/);if(bad)fail(`text contains "${bad[0]}"`);
 if(day.buckets.reduce((a,b)=>a+b,0)!==day.stops)fail('the delay buckets do not add up to the stops');
 if(!listed)fail('the date is not in days.json');else if(listed.stops!==day.stops||listed.share_punctual!==day.share_punctual)fail('the stops or share differ from days.json');
 if(day.late_trains!==day.most_delayed.length&&day.most_delayed.length!==10)fail('the list of biggest delays is shorter than the late trains and not full');
 if(day.trains&&(!info||info.title.length>80||info.description.length>200))fail('no title and description, or they are too long');
 if(!day.trains&&info)fail('an empty page has a title and description, so it would be indexed');
}
{
 const fail=why=>problems.push(`all-trains page: ${why}`),month=read('windows/month.json');
 const trainRows=fs.readdirSync(data+'trains').map(file=>[file,trainRow(read('trains/'+file))]).filter(([,row])=>row),html=renderTrains(trainRows.map(([,row])=>row),month),info=trainsInfo(trainRows.map(([,row])=>row),month);
 const bad=html.replace(/<[^>]*>/g,' ').match(/undefined|NaN|\bnull\b/);if(bad)fail(`text contains "${bad[0]}"`);
 const links=[...html.matchAll(/<tr data-[^>]*data-share="([^"]*)"><td class="t"><a href="train\/([^"]+)\/"/g)].map(m=>[decodeURIComponent(m[2]),m[1]]);
 if(links.length!==trainRows.length||new Set(links.map(l=>l[0])).size!==links.length)fail(`${links.length} rows for ${trainRows.length} train pages, or a train twice`);
 const share=new Map(links);
 for(const [file,row] of trainRows){const expected=row.runs>=10&&row.share!=null?String(row.share):'';if(share.get(row.id)!==expected)fail(`${row.id} shows share "${share.get(row.id)}" but its file gives "${expected}"`);}
 if(!info||info.title.length>80||info.description.length>200)fail('no title and description, or they are too long');
}
let stationPages=0;
{
 const month=read('windows/month.json'),trains=fs.readdirSync(data+'trains').map(file=>read('trains/'+file)),calls=stationRows(trains);
 // Count every reported arrival straight from the train files, matching each stop in its own run's timetable, to compare with the station pages. A stop the current timetable no longer has is left out, as on the train page.
 let expected=0,found=0;
 for(const train of trains){const w=train.windows?.month;if(!w?.runs)continue;const tmap=new Map(train.timetables.map(t=>[t.id,t])),current=new Set(train.timetables.at(-1).stops.map(s=>s.station_id));
  for(const r of train.runs)if(r.status==='ok'&&r.date>=w.from&&r.date<=w.to)for(const s of tmap.get(r.timetable).stops)if(s.arrival!=null&&r.delays?.[s.ordinal]!=null&&current.has(s.station_id))expected++;}
 for(const station of stations.stations){
  const rows=calls.get(station.id),fail=why=>problems.push(`station ${station.id}: ${why}`),info=stationInfo(station,rows,month);
  const html=renderStation(station,rows,month);
  const bad=html.replace(/<[^>]*>/g,' ').match(/undefined|NaN|\bnull\b/);if(bad)fail(`text contains "${bad[0]}"`);
  found+=(rows||[]).reduce((a,r)=>a+r.reported,0);
  if(!info){if(rows?.some(r=>r.reported))fail('has arrivals but no title and description');continue;}
  stationPages++;
  if(info.title.length>80||info.description.length>200)fail('title or description is too long');
  const shown=[...html.matchAll(/<tr data-[^>]*data-share="([^"]*)"><td class="arr">[\s\S]*?<a href="train\/([^"]+)\/"/g)];
  if(shown.length!==rows.length)fail(`${shown.length} table rows for ${rows.length} calls`);
  const trainsHere=new Set(rows.map(r=>r.id)).size;
  if(!new RegExp(`>${trainsHere.toLocaleString('en')} trains? stops? here`).test(html))fail(`the header does not count ${trainsHere} trains`);
  shown.forEach(([,share],i)=>{const r=rows[i],want=r.reported>=10?String(r.within/r.reported):'';if(share!==want||decodeURIComponent(shown[i][2])!==r.id)fail(`row ${i} (${r.id}) shows share "${share}" but its figures give "${want}"`);});
 }
 if(found!==expected)problems.push(`the station pages count ${found} reported arrivals but the train files have ${expected}`);
 {
  const fail=why=>problems.push(`all-stations page: ${why}`),list=stationList(stations.stations,calls),html=renderStations(list,month),info=stationsInfo(list,month);
  const bad=html.replace(/<[^>]*>/g,' ').match(/undefined|NaN|\bnull\b/);if(bad)fail(`text contains "${bad[0]}"`);
  const links=[...html.matchAll(/<tr data-[^>]*data-share="([^"]*)"><td class="t"><a href="station\/([^"]+)\/"/g)].map(m=>[decodeURIComponent(m[2]),m[1]]);
  if(links.length!==list.length||new Set(links.map(l=>l[0])).size!==links.length)fail(`${links.length} rows for ${list.length} stations, or a station twice`);
  if(list.length!==stationPages)fail(`${list.length} rows for ${stationPages} station pages`);
  const share=new Map(links);
  for(const r of list){const want=r.arrivals>=10?String(r.share):'';if(share.get(r.id)!==want)fail(`${r.id} shows share "${share.get(r.id)}" but its figures give "${want}"`);}
  if(list.reduce((a,r)=>a+r.arrivals,0)!==found)fail('its arrivals differ from the station pages');
  for(const r of list)if(r.trains!==new Set(calls.get(r.id).map(c=>c.id)).size)fail(`${r.id} counts ${r.trains} trains, not its distinct trains`);
  if(!info||info.title.length>80||info.description.length>200)fail('no title and description, or they are too long');
 }
}

let journeyCount=0;
{
 const fail=why=>problems.push(`all-journeys page: ${why}`),month=read('windows/month.json'),trains=fs.readdirSync(data+'trains').map(file=>read('trains/'+file));
 const stops=journeyData(trains,stations.stations),list=journeyList(stops);journeyCount=list.length;
 // Count each pair again straight from the train files: the trains that call at both stations in the current timetable, and the reported arrivals at the second one, each matched in its own run's timetable.
 const pairs=new Map();
 for(const train of trains){
  const w=train.windows?.month;if(!w?.runs)continue;
  const current=train.timetables.at(-1).stops,ids=current.map(s=>s.station_id);if(new Set(ids).size!==ids.length)continue;
  const tmap=new Map(train.timetables.map(t=>[t.id,t])),runs=train.runs.filter(r=>r.status==='ok'&&r.date>=w.from&&r.date<=w.to);
  for(let j=1;j<current.length;j++){
   if(current[j].arrival==null)continue;
   let reported=0,within=0;
   for(const r of runs){const stop=tmap.get(r.timetable).stops.find(x=>x.station_id===ids[j]),d=stop?.arrival!=null?r.delays?.[stop.ordinal]??null:null;if(d!=null){reported++;if(d<=5)within++;}}
   for(let i=0;i<j;i++){
    if(current[i].departure==null)continue;
    const k=ids[i]+'|'+ids[j],p=pairs.get(k)||pairs.set(k,{ids:new Set(),reported:0,within:0}).get(k);
    p.ids.add(train.id);p.reported+=reported;p.within+=within;
   }
  }
 }
 const byName=new Map(stations.stations.map(s=>[s.name,s.id]));
 // Every journey the page can build for a chosen station: the same pairs, trains, and arrivals as the direct count, a share only from 10 trains, and the same rows when narrowed to one station.
 const every=journeysAt(stops,null,null);
 if(every.length!==pairs.size||pairCount(stops)!==pairs.size)fail(`${every.length} journeys built for all stations but the train files have ${pairs.size} pairs`);
 let wrong=0;
 for(const r of every){const p=pairs.get(byName.get(r.from)+'|'+byName.get(r.to));if(!p||p.ids.size!==r.trains||p.reported!==r.arrivals||(r.share==null)!==(r.trains<10||!p.reported)||(r.share!=null&&Math.abs(p.within/p.reported-r.share)>1e-9))wrong++;}
 if(wrong)fail(`${wrong} of the ${every.length} journeys built for all stations differ from the train files`);
 {const idx=new Map(stops.stations.map((s,i)=>[s[0],i]));
  for(const name of ['Seoul','Gangneung']){const i=idx.get(name);
   if(journeysAt(stops,i,null).length!==every.filter(r=>r.from===name).length||journeysAt(stops,null,i).length!==every.filter(r=>r.to===name).length)fail(`${name}: the journeys built for one station differ from those among all`);}}
 const wanted=[...pairs.entries()].filter(([,p])=>p.ids.size>=MIN_TRAINS&&p.reported);
 if(wanted.length!==list.length)fail(`${list.length} journeys listed but the train files give ${wanted.length} with ${MIN_TRAINS} or more trains`);
 for(const r of list){
  const p=pairs.get(byName.get(r.from)+'|'+byName.get(r.to));
  if(!p){fail(`${r.from} → ${r.to} is not in the train files`);continue;}
  if(p.ids.size!==r.trains||p.reported!==r.arrivals||Math.abs(p.within/p.reported-r.share)>1e-9)fail(`${r.from} → ${r.to}: ${r.trains} trains, ${r.arrivals} arrivals, share ${r.share} but the train files give ${p.ids.size}, ${p.reported}, ${p.within/p.reported}`);
  const index=new Map(stops.stations.map((s,i)=>[s[0],i])),stats=pairStats(stops,index.get(r.from),index.get(r.to));
  if(stats.trains.length!==r.trains||stats.reported!==r.arrivals)fail(`${r.from} → ${r.to}: the search panel counts ${stats.trains.length} trains and ${stats.reported} arrivals`);
  const panel=resultHTML(stats,stops.stations[index.get(r.from)],stops.stations[index.get(r.to)],'en'),shown=(panel.match(/class="rank-row[ "]/g)||[]).length;
  if(shown!==r.trains||(r.trains>ROW_CAP)!==panel.includes('trains-more'))fail(`${r.from} → ${r.to}: the panel has ${shown} train rows for ${r.trains} trains, or the Show all button is wrong`);
  if(stats.typical!==r.mins)fail(`${r.from} → ${r.to}: the search panel gives a typical time of ${stats.typical} minutes, the table ${r.mins}`);
 }
 for(const locale of ['en','ko']){
  const html=renderJourneys(list,month,locale),info=journeysInfo(list,month,locale);
  const bad=html.replace(/<[^>]*>/g,' ').match(/undefined|NaN|\bnull\b/);if(bad)fail(`${locale} text contains "${bad[0]}"`);
  const links=[...html.matchAll(/<tr data-from="([^"]*)" data-to="([^"]*)"[^>]*data-share="([^"]*)"/g)];
  if(links.length!==list.length)fail(`${locale}: ${links.length} rows for ${list.length} journeys`);
  list.forEach((r,i)=>{if(links[i]&&(links[i][1]!==r.from||links[i][2]!==r.to||Number(links[i][3])!==r.share))fail(`${locale}: row ${i} does not match ${r.from} → ${r.to}`);});
  if(!info||info.title.length>90||info.description.length>220)fail(`${locale}: no title and description, or they are too long`);
  const panel=resultHTML(pairStats(stops,0,1),stops.stations[0],stops.stations[1],locale).replace(/<[^>]*>/g,' ').match(/undefined|NaN|\bnull\b/);if(panel)fail(`${locale} panel contains "${panel[0]}"`);
 }
}
console.log(`${pages} train pages rendered, ${empty} without a run in the past month, ${dayPages} day pages rendered, ${stationPages} station pages rendered, ${journeyCount} journeys listed, ${problems.length} problems.`);
for(const line of problems.slice(0,20))console.log('  '+line);
if(problems.length>20)console.log(`  and ${problems.length-20} more`);
process.exit(problems.length?1:0);
