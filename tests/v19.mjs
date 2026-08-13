import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  BUG   ')+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  try{Object.defineProperty(w.navigator,'serviceWorker',{get:()=>({register:()=>Promise.resolve(),addEventListener(){},controller:null}),configurable:true});}catch(e){}
}});
const w=dom.window,doc=w.document;

L('[A] Numéro de version');
ok('APP_VERSION défini', typeof w.APP_VERSION==='string' && w.APP_VERSION.length>0);
w.D.onboarded=1; w.go('save');
ok('version affichée dans Réglages', doc.getElementById('app').innerHTML.includes('version '+w.APP_VERSION));

L('[B] Bouton recharger');
ok('bouton « Recharger l\'app » présent', doc.getElementById('app').innerHTML.includes('Recharger l')&&doc.getElementById('app').innerHTML.includes('location.reload()'));

L('[C] Feedback tactile (CSS)');
ok(':active dans le CSS', html.includes(':active')&&html.includes('scale(.96)'));
ok('style bannière .updbar présent', html.includes('.updbar'));

L('[D] Bannière de mise à jour');
ok('fonction showUpdateBar présente', typeof w.showUpdateBar==='function');
w.showUpdateBar();
ok('bannière insérée avec bouton', !!doc.getElementById('updbar') && !!doc.getElementById('updbtn'));
w.showUpdateBar();
ok('pas de doublon de bannière', doc.querySelectorAll('#updbar').length===1);

L('[E] Cohérence version index/sw');
const sw=fs.readFileSync('/mnt/user-data/outputs/sw.js','utf8');
const cacheV=(sw.match(/jeux-famille-v(\d+)/)||[])[1];
ok('cache sw = APP_VERSION ('+cacheV+' vs '+w.APP_VERSION+')', cacheV===w.APP_VERSION);

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ÉCHEC(S) ***');
