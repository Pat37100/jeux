// AUDIT EXHAUSTIF DES BOUTONS : chaque onclick de chaque écran/état
import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined; w.print=()=>{};
}});
const w=dom.window, doc=w.document;

// méthodes/objets natifs à ignorer (préfixés par un point ou globaux connus)
const NATIVE=new Set(['scrollTo','stopPropagation','preventDefault','focus','remove','then','catch','share','vibrate','writeText','print','cancel','speak','matchMedia','toDataURL','getContext','drawImage','push','filter','map','forEach','join','slice','indexOf','split','replace','trim','toLocaleString','max','min','floor','round','random','stringify','parse','now','getFullYear','toISOString','appendChild','createElement','getElementById','querySelector','addEventListener']);

function collectOnclicks(){
  const nodes=[...doc.querySelectorAll('[onclick]')];
  return nodes.map(n=>({el:n, code:n.getAttribute('onclick'), label:(n.textContent||'').trim().slice(0,30)}));
}
function fnsIn(code){
  // identifiants suivis de '(' non précédés d'un point
  const out=new Set();
  const re=/(^|[^.\w$])([a-zA-Z_$][\w$]*)\s*\(/g; let m;
  while((m=re.exec(code))){ const name=m[2]; if(!NATIVE.has(name)) out.add(name); }
  return [...out];
}

let missing=[], scanned=0, screensSeen=[];
function scan(tag){
  screensSeen.push(tag);
  const items=collectOnclicks();
  for(const it of items){
    scanned++;
    for(const fn of fnsIn(it.code)){
      if(typeof w[fn]!=='function'){
        missing.push({screen:tag, fn, label:it.label, code:it.code.slice(0,60)});
      }
    }
  }
}

// ---- Préparer des données pour peupler tous les états ----
w.D.onboarded=1;
w.go('save'); // pour créer via openSheet plus tard
// bibliothèque déjà remplie par défaut
// Créer une partie avec manches
w.go('points'); w.openSheet(); scan('points:sheet-nouvelle-partie');
doc.getElementById('mn').value='Test'; w.createMatch();
const ids=w.cur().players.map(p=>p.id);
w.S.inputs={[ids[0]]:'10',[ids[1]]:'6'}; w.saveRound();
w.S.inputs={[ids[0]]:'4',[ids[1]]:'9'}; w.saveRound();
// Micro data
w.D.micro=[{id:'q1',date:'2026-08-01',players:[{name:'Léa',score:15},{name:'Tom',score:9}]}];
// Tic-Tac data
w.D.tictac=[{id:'d1',date:'2026-08-02',players:[{name:'Léa',good:5},{name:'Tom',good:3}],winner:'Léa'}];
w.persist();

// ---- ÉCRANS PRINCIPAUX ----
w.go('home'); scan('home');
w.go('points'); scan('points:liste');
w.S.matchId=w.D.matches[0].id; w.go('match');
w.S.tab='rank'; w.render(); scan('match:classement');
w.S.detail=ids[0]; w.render(); scan('match:classement-detail-deplie');
w.S.detail=null; w.S.tab='play'; w.render(); scan('match:saisie');
w.S.tab='hist'; w.render(); scan('match:manches');
w.S.confirm=w.cur().rounds[0].id; w.render(); scan('match:manches-confirmation-suppression');
w.S.confirm=null; w.S.tab='set'; w.render(); scan('match:reglages-partie');
w.go('palmares'); w.PAL.year='d1'; w.render(); scan('palmares:soiree');
w.PAL.year='all'; w.render(); scan('palmares:championnat');
w.go('champions'); w.render(); scan('champions');
w.S.detail='champ'+w.fp('Léa'); w.render(); scan('champions:detail-deplie'); w.S.detail=null;
w.CH=null; w.go('chrono'); w.S.chTab='play'; w.render(); scan('chrono:config');
w.chStart(); scan('chrono:jeu-en-cours');
w.CH.players[1].out=true; w.chAdvance(true); scan('chrono:vainqueur');
w.CH=null; w.S.chTab='pal'; w.go('chrono'); w.S.chTab='pal'; w.render(); scan('chrono:palmares');
w.go('quizz'); w.S.qtab='play'; w.render(); scan('quizz:jouer');
w.S.qtab='pal'; w.render(); scan('quizz:palmares');
w.S.qtab='j'; w.render(); scan('quizz:journal');
w.go('save'); scan('reglages');

// ---- OVERLAYS / FEUILLES (boutons ajoutés au body) ----
w.openAv(w.D.lib[0].id); scan('feuille:avatar'); w.closeAv&&w.closeAv();
w.go('quizz'); w.S.qtab='pal'; w.microSheet=true; w.render(); scan('feuille:enregistrer-resultat-micro'); w.microClose&&w.microClose();
w.whoStart(); scan('feuille:qui-commence'); w.whoClose&&w.whoClose();
w.obReplay(); scan('feuille:onboarding');

console.log('Écrans/états scannés :', screensSeen.length);
console.log('Boutons analysés :', scanned);
if(missing.length===0){
  console.log('\n✅ TOUS LES BOUTONS POINTENT VERS UNE FONCTION EXISTANTE');
}else{
  console.log('\n🐛 BOUTONS MORTS DÉTECTÉS ('+missing.length+') :');
  missing.forEach(m=>console.log('  ✗ ['+m.screen+'] fonction « '+m.fn+' » introuvable — bouton "'+m.label+'" — '+m.code));
}
