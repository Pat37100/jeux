import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
process.on('uncaughtException',()=>{}); process.on('unhandledRejection',()=>{});
function fresh(){
  const store=new Map();
  const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    try{Object.defineProperty(w.navigator,'serviceWorker',{get:()=>({register:()=>Promise.resolve()}),configurable:true});}catch(e){}
    w.print=()=>{w.__printed=(w.__printed||0)+1;};
    try{Object.defineProperty(w.navigator,'share',{value:()=>Promise.resolve(),configurable:true});}catch(e){}
    try{Object.defineProperty(w.navigator,'clipboard',{value:{writeText:()=>Promise.resolve()},configurable:true});}catch(e){}
  }});
  return dom.window;
}
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  BUG   ')+l); if(!c)F++;};
// clic par texte exact sur un vrai bouton
function clic(w,txt){ const b=[...w.document.querySelectorAll('button[onclick]')].find(x=>(x.textContent||'').includes(txt)); if(!b)return 'ABSENT'; w.event={stopPropagation(){},preventDefault(){}}; try{w.eval(b.getAttribute('onclick'));}catch(e){return 'ERR:'+e.message;} return 'OK'; }

(async()=>{
L('=== EFFETS VISIBLES : le bouton produit-il bien quelque chose ? ===');
let w=fresh(); w.D.onboarded=1;

// navigation depuis l'accueil
w.go('home');
clic(w,'La Coupe'); // tuile
ok('tuile « La Coupe » → écran points', w.S.view==='points');
w.go('home'); clic(w,'Tic-Tac'); ok('tuile « Tic-Tac » → écran chrono', w.S.view==='chrono');
w.go('home'); clic(w,'Le Micro'); ok('tuile « Le Micro » → écran quizz', w.S.view==='quizz');
w.go('home'); clic(w,'Mur des champions'); ok('bouton « Mur des champions » → écran champions', w.S.view==='champions');

// créer une partie via le bouton
w=fresh(); w.D.onboarded=1; w.go('points'); clic(w,'Nouvelle partie');
ok('« Nouvelle partie » ouvre la feuille de création', !!w.document.getElementById('mn'));
w.document.getElementById('mn').value='Belote'; clic(w,'Créer');
ok('« Créer » crée et ouvre la partie', w.S.view==='match' && w.cur() && w.cur().name==='Belote');

// saisir une manche via +/-  puis Enregistrer
w.S.tab='play'; w.render();
const before=w.cur().rounds.length;
const ids=w.cur().players.map(p=>p.id);
w.S.inputs={[ids[0]]:'12',[ids[1]]:'8'};
clic(w,'Enregistrer la manche');
ok('« Enregistrer la manche » ajoute une manche', w.cur().rounds.length===before+1);

// navigation par la barre du bas (onglets match)
w.S.tab='rank'; w.render();
clic(w,'Manches'); ok('onglet « Manches » bascule la vue', w.S.tab==='hist');
clic(w,'Classement'); ok('onglet « Classement » bascule la vue', w.S.tab==='rank');

// Tic-Tac : démarrer
w=fresh(); w.D.onboarded=1; w.go('chrono');
clic(w,'Démarrer la manche'); ok('« Démarrer la manche » lance le duel', !!w.CH);
clic(w,'Bonne réponse'); ok('« Bonne réponse » incrémente le compteur', w.CH.players[0].good===1);

// Micro : copier le lancement (clipboard)
w=fresh(); w.D.onboarded=1; w.go('quizz');
const r=clic(w,'Copier le lancement'); ok('« Copier le lancement » s\'exécute sans erreur', r==='OK');

// retour accueil via la flèche
w=fresh(); w.D.onboarded=1; w.go('save');
clic(w,'‹'); ok('flèche retour ramène à l\'accueil', w.S.view==='home');

// palmarès : bascule Soirée / Championnat
w=fresh(); w.D.onboarded=1;
w.go('points'); w.openSheet(); w.document.getElementById('mn').value='P'; w.createMatch();
const id2=w.cur().players.map(p=>p.id); w.S.inputs={[id2[0]]:'5',[id2[1]]:'3'}; w.saveRound();
w.go('palmares'); clic(w,'Soirée'); ok('bascule « Soirée »', w.PAL.year==='d1');
clic(w,'Championnat'); ok('bascule « Championnat »', w.PAL.year!=='d1');

// PDF
w.__printed=0; clic(w,'Exporter le palmarès en PDF');
await new Promise(r=>setTimeout(r,120));
ok('« Exporter le palmarès en PDF » déclenche l\'impression', w.__printed>0);

L(F===0?'\n✅ TOUS LES BOUTONS PRODUISENT L\'EFFET ATTENDU':'\n*** '+F+' BOUTON(S) SANS EFFET ***');
})();
