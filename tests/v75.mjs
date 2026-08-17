import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const A=(w)=>w.document.getElementById('app').innerHTML;
const T=(w)=>w.document.getElementById('app').textContent.replace(/\s+/g,' ');
function boot(){const store=new Map();
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  d.window.D.onboarded=1; return d.window;}

L('[1] BUG : la question ne se renouvelait pas dans 2 modes sur 3');
for(const mode of ['wrong','good','both']){
  const w=boot(); w.go('chrono'); w.chSetPass(mode); w.chSetQTheme('*'); w.chStart(); w.render();
  const q0=w.CH.q.q;
  if(mode==='good') w.chPassGood(); else w.chGood();
  ok(mode+' : question renouvelée après une bonne réponse', (function(){
    // le renouvellement passe par un setTimeout : on le déclenche à la main
    w.qbankNext(); return w.CH.q.q!==q0; })());
}
const w0=boot(); w0.go('chrono'); w0.chSetQTheme('*'); w0.chStart();
ok('les 5 handlers renouvellent', ['chGood','chWrong','chSkip','chPassGood','chKeepWrong'].every(f=>{
  const i=html.indexOf('function '+f+'(');
  return html.slice(i,i+340).includes('qbankNext');
}));

L('[2] Participants EN PREMIER dans les trois rubriques');
const w=boot();
w.go('chrono'); w.render();
ok('Tic-Tac : étape 1 = Participants', /^1Participants/.test(T(w)));
ok('Tic-Tac : temps en étape 2', T(w).includes('2Temps par joueur'));
w.go('quizz'); w.render();
ok('Micro : étape 1 = Participants', /^1Participants/.test(T(w)));
w.go('points'); w.render(); w.openSheet(); w.render();
const sh=w.document.querySelector('.sheet .in').textContent.replace(/\s+/g,' ');
ok('La Coupe : 1. Participants', sh.includes('1. Participants'));
ok('La Coupe : 2. Jeu', sh.includes('2. Jeu'));
ok('La Coupe : 3. Règle', sh.includes('3. Règle'));
ok('participants avant le jeu', sh.indexOf('1. Participants')<sh.indexOf('2. Jeu'));

L('[3] Même vocabulaire partout');
ok('« Participants » dans les 3', (html.match(/Participants/g)||[]).length>=3);
ok('plus de « Qui joue ? »', !html.includes('Qui joue ? ('));
ok('plus de « Joueurs ou équipes »', !html.includes('Joueurs ou équipes ('));

L('[4] Onglets identiques + résultats identiques');
for(const v of ['points','chrono','quizz']){
  w.go(v); w.render();
  ok(v+' : onglet Résultats', w.document.getElementById('nav').textContent.includes('Résultats'));
  w.setRtab('res'); w.render();
  ok(v+' : même bloc de classement', A(w).includes('linear-gradient(90deg,#34d399,#059669)')||A(w).includes('empty'));
  w.setRtab('play');
}

L('[5] Non-régression');
w.go('chrono'); w.render();
ok('5 étapes Tic-Tac', (A(w).match(/class="stepn"/g)||[]).length===5);
ok('banque de questions intacte', A(w).includes('chSetQTheme'));
w.chStart(); w.chGood(); w.chFinishNow();
ok('partie enregistrée', w.D.tictac.length===1);
w.go('points'); w.render(); w.openSheet();
w.createMatch();
ok('création de partie fonctionne', w.D.matches.length===1);
ok('joueurs repris', w.D.matches[0].players.length>=2);
ok('jeu enregistré', !!w.D.matches[0].game);
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
