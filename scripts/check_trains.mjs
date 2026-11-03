#!/usr/bin/env node
// Render every train page, and every day page when the data folder has them, from the data folder and check each one: no error, no "undefined", "NaN", or "null"
// in the text, the final stop's dots match the heading's reported count, each row's share matches its dots, and the page
// has a title and description for search engines (and an empty page has none, so it is not indexed). A day page's delay buckets add
// up to its stops, and its stops and share match days.json.
// Usage: node scripts/check_trains.mjs [data-folder]   (default: data)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..'),data=path.resolve(process.argv[2]||path.join(root,'data'))+'/';
const {renderTrain,pageInfo}=await import(pathToFileURL(path.join(root,'js/train.js')));
const {renderDay,pageInfo:dayInfo}=await import(pathToFileURL(path.join(root,'js/day.js')));
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
 const finals=html.match(/<b>\d+ of (\d+)<\/b> days on time at/);
 const dotsIn=row=>[(row.match(/class="rail-dot"/g)||[]).length,(row.match(/class="rail-dot late"/g)||[]).length];
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
console.log(`${pages} train pages rendered, ${empty} without a run in the past month, ${dayPages} day pages rendered, ${problems.length} problems.`);
for(const line of problems.slice(0,20))console.log('  '+line);
if(problems.length>20)console.log(`  and ${problems.length-20} more`);
process.exit(problems.length?1:0);
