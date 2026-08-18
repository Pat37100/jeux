import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const A=(w)=>w.document.getElementById('app').innerHTML;
function boot(){const store=new Map();
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  d.window.D.onboarded=1; return d.window;}
const w=boot();

L('[1] Banque de questions');
ok('60 questions embarquées', w.qbankAll().length===60);
ok('7 thèmes', w.qbankThemes().length===7);
ok('chaque question a réponse, thème, niveau', w.QBANK.every(x=>x.q&&x.a&&x.t&&x.n>=1&&x.n<=3));
ok('réponses courtes (quelques mots)', w.QBANK.every(x=>x.a.split(' ').length<=6));
ok('format identique à celui d\'une API', Object.keys(w.QBANK[0]).sort().join(',')==='a,n,q,t');
ok('extensible par D.qbank', (()=>{w.D.qbank=[{q:'Test ?',a:'Oui',t:'Test',n:1}];return w.qbankAll().length===61;})());
w.D.qbank=[];

L('[2] Réglage : facultatif et désactivé par défaut');
w.go('chrono'); w.render();
ok('étape Questions présente', A(w).includes('Questions'));
ok('marquée facultative', A(w).includes('(facultatif)'));
ok('« Les nôtres » par défaut', !w.chSettings().qTheme);
ok('option tous thèmes', A(w).includes("chSetQTheme('*')"));
ok('un filtre par thème avec le compte', A(w).includes('Géographie 16'));
ok('5 étapes numérotées', (A(w).match(/class="stepn"/g)||[]).length===5);

L('[3] En jeu');
w.chSetQTheme('*'); w.chStart(); w.render();
ok('question affichée', A(w).includes('👁 Voir la réponse'));
ok('thème et niveau annoncés', /niveau [123]/.test(A(w)));
ok('réponse cachée au départ', !A(w).includes(w.CH.q.a) || w.CH.qShow===false);
w.qbankReveal(); w.render();
ok('réponse révélée sur demande', A(w).includes(w.CH.q.a));
const q1=w.CH.q.q;
w.qbankNext();
ok('question suivante différente', w.CH.q.q!==q1);
ok('réponse re-cachée', w.CH.qShow===false);
ok('pas de répétition dans la partie', w.CH.qUsed.length===2 && w.CH.qUsed[0]!==w.CH.qUsed[1]);
ok('le chrono reste maître de l\'écran', A(w).includes('Bonne réponse'));

L('[4] Filtre par thème');
w.chSetQTheme('Sciences');
ok('question du bon thème', w.CH.q.t==='Sciences');
for(let i=0;i<5;i++){ w.qbankNext(); if(w.CH.q.t!=='Sciences') break; }
ok('reste dans le thème', w.CH.q.t==='Sciences');
ok('recyclage quand le thème est épuisé', (()=>{ w.CH.qUsed=w.qbankAll().map(x=>x.q); return w.qbankPick()!==null; })());

L('[5] Désactivation propre');
w.chSetQTheme(null); w.render();
ok('plus de bloc question', !A(w).includes('Voir la réponse'));
ok('le jeu fonctionne sans', A(w).includes('Bonne réponse') && A(w).includes('Mauvaise réponse'));

L('[6] Non-régression');
w.chGood();
ok('score compté', w.CH.players.some(p=>p.good===1));
w.chFinishNow(); w.render();
ok('fin de partie intacte', A(w).includes('🥇'));
ok('Mur alimenté', w.D.tictac.length===1);
const w2=boot();
ok('Tic-Tac : écran unique (v78)', (()=>{w2.go('chrono');w2.render();return w2.document.getElementById('nav').innerHTML==='';})());
ok('moteur Micro intact', w2.briefText().includes('A3. CONTRAT DE VOIX'));
ok('poids raisonnable', html.length<300000);
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
