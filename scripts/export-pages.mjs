import { readFile,writeFile,mkdir,readdir,copyFile,rm } from 'node:fs/promises';
import {createHash,randomBytes,pbkdf2Sync} from 'node:crypto';
import assert from 'node:assert/strict';
const output='pages-export',base='/business-wissensplattform/',origin='http://localhost:5173';
const vars=Object.fromEntries((await readFile('.dev.vars','utf8')).split('\n').filter(l=>l.includes('=')).map(l=>l.split(/=(.*)/s).slice(0,2)));
const password=vars.APP_PASSWORD;assert.ok(password);
const login=await fetch(origin+'/api/login',{method:'POST',redirect:'manual',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password})});
assert.equal(login.status,303);const cookie=login.headers.get('set-cookie').split(';')[0];
const catalog=JSON.parse(await readFile('data/catalog.json','utf8'));
await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});
const cssdir='dist/client/_next/static/css';const css=(await readdir(cssdir)).filter(n=>n.endsWith('.css'));await writeFile(output+'/style.css',(await Promise.all(css.map(n=>readFile(cssdir+'/'+n,'utf8')))).join('\n'));
await copyFile('public/favicon.svg',output+'/favicon.svg');
const routes=['/login','/', '/methodik',...catalog.videos.flatMap(v=>['/analysen/'+v.id,'/analysen/'+v.id+'/gegenpruefung']),...catalog.topics.map(t=>'/themen/'+t.id)];
function target(route){if(route==='/login')return 'index.html';if(route==='/')return 'uebersicht/index.html';return route.slice(1)+'/index.html';}
for(const route of routes){
 const res=await fetch(origin+route,{headers:{Cookie:cookie}});assert.equal(res.status,200,route);let html=await res.text();
 html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
 html=html.replace(/(href|src|action)="\/(?!\/)([^\"]*)"/g,(match,attr,path)=>{
  if(path.startsWith('api/original/'))return `${attr}="${base}originals/${path.slice(13)}.html"`;
  if(path==='')return `${attr}="${base}uebersicht/"`;
  if(path==='api/logout')return `${attr}="${base}" data-logout="true"`;
  if(path==='api/login')return `${attr}="${base}uebersicht/" data-login="true"`;
  const [p,fragment]=path.split('#');return `${attr}="${base}${p}/${fragment?'#'+fragment:''}"`;
 });
 html=html.replace('</head>',`<meta name="robots" content="noindex, nofollow, noarchive"><link rel="stylesheet" href="${base}style.css"><link rel="icon" href="${base}favicon.svg"><script src="${base}pages.js" defer></script></head>`);
 const p=output+'/'+target(route);await mkdir(p.slice(0,p.lastIndexOf('/')),{recursive:true});await writeFile(p,html);
}
await mkdir(output+'/originals',{recursive:true});
for(const v of catalog.videos){const bytes=await readFile('data/originals/'+v.originalHash+'.html');assert.equal(createHash('sha256').update(bytes).digest('hex'),v.originalHash);await writeFile(output+'/originals/'+v.id+'.html',bytes);}
const salt=randomBytes(16).toString('hex'),iterations=600000,hash=pbkdf2Sync(password,salt,iterations,32,'sha256').toString('hex');
const records=catalog.videos.map(v=>({id:v.id,categories:v.categories,text:[v.title,v.summary,v.channel,...v.tags].join(' ').toLocaleLowerCase('de'),reviewed:!!v.revisions.length,queued:catalog.reviewQueue.some(q=>q.videoId===v.id)}));
await writeFile(output+'/pages.js',`const BASE=${JSON.stringify(base)},SALT=${JSON.stringify(salt)},HASH=${JSON.stringify(hash)},RECORDS=${JSON.stringify(records)};
const entry=location.pathname===BASE||location.pathname===BASE+'index.html';
if(!entry&&!sessionStorage.getItem('mc-test-access'))location.replace(BASE);
const form=document.querySelector('form[data-login]');
if(form)form.addEventListener('submit',async e=>{e.preventDefault();const button=form.querySelector('button');button.disabled=true;let note=form.querySelector('[role=status]');if(!note){note=document.createElement('p');note.setAttribute('role','status');form.append(note);}try{const pw=form.querySelector('input[type=password]').value;const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(SALT),iterations:${iterations},hash:'SHA-256'},key,256);const hex=Array.from(new Uint8Array(bits),b=>b.toString(16).padStart(2,'0')).join('');if(hex!==HASH){note.textContent='Passwort stimmt nicht.';return;}sessionStorage.setItem('mc-test-access','1');location.assign(BASE+'uebersicht/');}catch{note.textContent='Anmeldung nicht möglich. Bitte erneut versuchen.';}finally{button.disabled=false;}});
for(const f of document.querySelectorAll('form[data-logout]'))f.addEventListener('submit',e=>{e.preventDefault();sessionStorage.removeItem('mc-test-access');location.assign(BASE);});
const controls=document.querySelector('.controls');if(controls){controls.innerHTML='<input type="search" aria-label="Analysen durchsuchen" placeholder="Titel, Thema oder Tool suchen …"><select aria-label="Themenbereich"></select><select aria-label="Prüfstand"></select>';const [cat,status]=controls.querySelectorAll('select');for(const c of ['Alle Bereiche',...new Set(RECORDS.flatMap(v=>v.categories))])cat.add(new Option(c,c));for(const s of ['Alle Prüfstände','Mit Gegenprüfung','Noch ungeprüft','Erneut prüfen'])status.add(new Option(s,s));const filter=()=>{let count=0;for(const row of document.querySelectorAll('.video-row')){const id=row.getAttribute('href').split('/').filter(Boolean).at(-1);const v=RECORDS.find(v=>v.id===id);const show=v&&(cat.value==='Alle Bereiche'||v.categories.includes(cat.value))&&v.text.includes(controls.querySelector('input').value.toLocaleLowerCase('de'))&&(status.value==='Alle Prüfstände'||status.value==='Mit Gegenprüfung'&&v.reviewed||status.value==='Noch ungeprüft'&&!v.reviewed||status.value==='Erneut prüfen'&&v.queued);row.style.display=show?'':'none';if(show)count++;}const counter=document.querySelector('.library [role=status]');if(counter)counter.textContent=count+' Analysen';};controls.addEventListener('input',filter);controls.addEventListener('change',filter);filter();}
`);
await writeFile(output+'/robots.txt','User-agent: *\nDisallow: '+base+'originals/\n');await writeFile(output+'/.nojekyll','');
await writeFile(output+'/style.css',(await readFile(output+'/style.css','utf8'))+'\n.controls input,.controls select{padding:10px;border:1px solid #ccd9df;border-radius:6px;background:white;min-width:0}.controls input{flex:1}');
console.log('GitHub Pages exportiert: '+routes.length+' Seiten, '+catalog.videos.length+' bytegleiche Originale.');
