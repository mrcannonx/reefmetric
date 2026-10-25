// Refresh local thumbnails from the retained sourceImageUrl (or original imageUrl).
// No file deletion. Failure leaves an honest diagram/no-photo fallback, never HTML as an image.
// Run: node scripts/cache-product-images.mjs --write
import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const exec=promisify(execFile),write=process.argv.includes('--write');
const names=(await readdir('src/data')).filter(f=>f.endsWith('.json'));
const inputs=new Map();
function walk(v,fn){if(Array.isArray(v))v.forEach(x=>walk(x,fn));else if(v&&typeof v==='object'){fn(v);Object.values(v).forEach(x=>walk(x,fn));}}
for(const file of names){walk(JSON.parse(await readFile('src/data/'+file,'utf8')),v=>{if(v.imageHold)return;const source=v.sourceImageUrl||v.imageUrl;if(typeof source==='string'&&source.startsWith('https://'))inputs.set(source,{source,parents:[...(inputs.get(source)?.parents||[]),file]});});}
await mkdir('public/images/products',{recursive:true});await mkdir('evidence',{recursive:true});
const rows=[...inputs.values()];let next=0;
async function worker(){while(next<rows.length){const row=rows[next++];try{
 const {stdout}=await exec('curl',['-L','--compressed','--silent','--show-error','--max-time','25','--referer','https://reefmetric.com/','-w','\nREEF_META:%{http_code}|%{url_effective}|%{content_type}',row.source],{encoding:'buffer',maxBuffer:8*1024*1024});
 const i=stdout.lastIndexOf(Buffer.from('\nREEF_META:'));if(i<0)throw Error('missing curl status');
 const [status,finalURL,type]=stdout.subarray(i+11).toString().split('|');const bytes=stdout.subarray(0,i);row.status=Number(status);row.finalURL=finalURL;row.contentType=type;row.sourceBytes=bytes.length;
 if(row.status!==200||!type?.startsWith('image/'))throw Error('source did not serve a 200 image');
 const meta=await sharp(bytes).metadata();row.original={width:meta.width,height:meta.height,format:meta.format};
 if(!meta.width||!meta.height)throw Error('image dimensions unreadable');
 const output=await sharp(bytes).rotate().resize({width:256,height:256,fit:'inside',withoutEnlargement:true}).webp({quality:78}).toBuffer();
 const hash=createHash('sha256').update(row.source).digest('hex').slice(0,20);row.local=`/images/products/${hash}.webp`;row.localBytes=output.length;row.localSha256=createHash('sha256').update(output).digest('hex');
 const after=await sharp(output).metadata();row.resized={width:after.width,height:after.height,format:after.format};if(write)await writeFile('public'+row.local,output);
 }catch(e){row.error=e.message.split('\n')[0];row.local=null;}
 console.log(`${row.status||'ERROR'} ${row.local||'fallback'} ${row.source}`);
}}
await Promise.all(Array.from({length:6},worker));
if(write){for(const file of names){const path='src/data/'+file;const data=JSON.parse(await readFile(path,'utf8'));let changed=false;walk(data,v=>{if(v.imageHold)return;const source=v.sourceImageUrl||v.imageUrl;const row=inputs.get(source);if(row){v.sourceImageUrl=source;v.imageUrl=row.local;v.imageCheckedOn='2026-10-25';v.imageStatus=row.local?'local thumbnail':'unavailable; photo omitted';changed=true;}});if(changed)await writeFile(path,JSON.stringify(data,null,2)+'\n');}}
const report={at:new Date().toISOString(),write,method:'curl GET with reefmetric Referer; inspect every image format/dimensions before sharp resize; no runtime vendor image dependency',summary:{sources:rows.length,cached:rows.filter(r=>r.local).length,unavailable:rows.filter(r=>!r.local).length,sourceBytes:rows.reduce((s,r)=>s+(r.sourceBytes||0),0),localBytes:rows.reduce((s,r)=>s+(r.localBytes||0),0)},rows};
await writeFile('evidence/product-images.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary));
