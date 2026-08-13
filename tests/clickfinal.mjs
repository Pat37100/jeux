import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
process.on('uncaughtException',()=>{}); process.on('unhandledRejection',()=>{});
const OUT=[];
function fresh(){
  const store=new Map();
  const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    try{Object.defineProperty(w.navigator,'serviceWorker',{get:()=>({register:()=>Promise.resolve()}),configurable:true});}catch(e){}
    w.print=()=>{}; w.alert=()=>{}; w.confirm=()=>true;
    try{Object.defineProperty(w.navigator,'share',{value:()=>Promise.resolve(),configurable:true});}catch(e){}
    try{Object.defineProperty(w.navigator,'clipboard',{value:{writeText:()=>Promise.resolve()},configurable:true});}catch(e){}
  }});
  const w=dom.window; w.D.onboarded=1;
  w.go('points'); w.openSheet(); w.document.getElementById('mn').value='Test'; w.createMatch();
  const ids=w.cur().players.map(p=>p.id);
  w.S.inputs={[ids[0]]:'10',[ids[1]]:'6'}; w.saveRound();
  w.S.inputs={[ids[0]]:'4',[ids[1]]:'9'}; w.saveRound();
  w.D.micro=[{id:'q1',date:'2026-08-01',players:[{name:'Léa',score:15},{name:'Tom',score:9}]}];
  w.D.tictac=[{id:'d1',date:'2026-08-02',players:[{name:'Léa',good:5},{name:'Tom',good:3}],winner:'Léa'}];
  w.persist(); return w;
}
let clicked=0; const errors=[];
function fill(doc){ doc.querySelectorAll('input,textarea').forEach(i=>{
  if(i.type==='file')return;
  try{ if(i.type==='date')i.value='2026-08-12'; else if(i.type==='number')i.value='7';
  else if(!i.value)i.value=(i.id==='mqr')?'Léa 15\nTom 8':'Zoé'; }catch(e){} }); }
function screen(setup,tag){
  let w; try{ w=fresh(); setup(w); }catch(e){ errors.push({tag,label:'(setup)',err:e.message}); return; }
  const doc=w.document; 
  let btns; try{ fill(doc); btns=[...doc.querySelectorAll('button[onclick]')]; }catch(e){ errors.push({tag,label:'(collect)',err:e.message}); return; }
  for(const b of btns){
    const label=(b.textContent||'').trim().slice(0,24); const code=b.getAttribute('onclick');
    try{ w.event={stopPropagation(){},preventDefault(){},target:b}; w.eval(code); }
    catch(e){ errors.push({tag,label,code:code.slice(0,50),err:(e&&e.message)||String(e)}); }
    clicked++;
    try{ setup(w); fill(doc); }catch(e){}
  }
  OUT.push('  scanné: '+tag+' ('+btns.length+' boutons)');
}
screen(w=>w.go('home'),'home');
screen(w=>w.go('points'),'points:liste');
screen(w=>{w.S.matchId=w.D.matches[0].id;w.go('match');w.S.tab='rank';w.render();},'match:classement');
screen(w=>{w.S.matchId=w.D.matches[0].id;w.go('match');w.S.tab='play';w.render();},'match:saisie');
screen(w=>{w.S.matchId=w.D.matches[0].id;w.go('match');w.S.tab='hist';w.render();},'match:manches');
screen(w=>{w.S.matchId=w.D.matches[0].id;w.go('match');w.S.tab='set';w.render();},'match:reglages-partie');
screen(w=>{w.go('palmares');w.PAL.year='all';w.render();},'palmares');
screen(w=>{w.go('champions');w.render();},'champions');
screen(w=>{w.CH=null;w.go('chrono');w.S.chTab='play';w.render();},'chrono:config');
screen(w=>{w.CH=null;w.go('chrono');w.chStart();},'chrono:jeu');
screen(w=>{w.CH=null;w.S.chTab='pal';w.go('chrono');w.S.chTab='pal';w.render();},'chrono:palmares');
screen(w=>{w.go('quizz');w.S.qtab='play';w.render();},'quizz:jouer');
screen(w=>{w.go('quizz');w.S.qtab='pal';w.render();},'quizz:palmares');
screen(w=>{w.go('quizz');w.S.qtab='j';w.render();},'quizz:journal');
screen(w=>w.go('save'),'reglages');
screen(w=>{w.go('save');w.openAv(w.D.lib[0].id);},'feuille:avatar');
screen(w=>{w.go('quizz');w.S.qtab='pal';w.microSheet=true;w.render();},'feuille:micro');
screen(w=>{w.go('home');w.whoStart();},'feuille:qui-commence');
screen(w=>{w.go('home');w.obReplay();},'feuille:onboarding');
console.log(OUT.join('\n'));
console.log('\nVrais boutons exécutés :',clicked);
if(!errors.length) console.log('\n✅ AUCUN BOUTON MORT — tous les handlers s\'exécutent sans erreur');
else { console.log('\n🐛 '+errors.length+' PROBLÈME(S) :'); errors.forEach(e=>console.log('  ✗ ['+e.tag+'] "'+e.label+'" '+(e.code||'')+' → '+e.err)); }
