#!/usr/bin/env node
// Render every train page from the data folder and check each one: no error, no "undefined", "NaN", or "null"
// in the text, the final stop's dots match the heading's reported count, and each row's share matches its dots.
// Usage: node scripts/check_trains.mjs [data-folder]   (default: data)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..'),data=path.resolve(process.argv[2]||path.join(root,'data'))+'/';
const {renderTrain}=await import(pathToFileURL(path.join(root,'js/train.js')));
const read=file=>JSON.parse(fs.readFileSync(data+file,'utf8')),stations=read('stations/index.json'),days=read('days.json').days;
const problems=[];let pages=0,empty=0;
for(const file of fs.readdirSync(data+'trains')){
 const id=file.replace('.json',''),fail=why=>problems.push(`${id}: ${why}`);
 let html;try{html=renderTrain(read('trains/'+file),days,stations);}catch(error){fail(`error ${error.message}`);continue;}
 pages++;
 const text=html.replace(/<[^>]*>/g,' '),bad=text.match(/undefined|NaN|\bnull\b/);if(bad)fail(`text contains "${bad[0]}"`);
 const rows=html.split('<div class="rail-row"').slice(1);
 if(!rows.length){empty++;continue;}
 const finals=html.match(/On time at [^<]*<\/div><div class="stat-value">\d+ of (\d+)</);
 const dotsIn=row=>[(row.match(/class="rail-dot"/g)||[]).length,(row.match(/class="rail-dot late"/g)||[]).length];
 const lastDots=dotsIn(rows.at(-1)).reduce((a,b)=>a+b);
 if(finals&&+finals[1]!==lastDots)fail(`the heading counts ${finals[1]} final-stop days but the last row has ${lastDots} dots`);
 for(const row of rows){
  const [onTime,late]=dotsIn(row),shown=row.match(/rail-share">([^<]*)</)[1],expected=onTime+late===0?'—':late===0?'100%':`${Math.min(99,Math.round(onTime/(onTime+late)*100))}%`;
  if(shown!==expected)fail(`a row shows ${shown} but its dots give ${expected}`);
 }
}
console.log(`${pages} train pages rendered, ${empty} without a run in the past month, ${problems.length} problems.`);
for(const line of problems.slice(0,20))console.log('  '+line);
if(problems.length>20)console.log(`  and ${problems.length-20} more`);
process.exit(problems.length?1:0);
