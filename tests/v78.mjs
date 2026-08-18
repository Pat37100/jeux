import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const A=(w)=>w.document.getElementById('app').innerHTML;
function boot(){const store=new Map();
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  d.window.D.onboarded=1; return d.window;}

L('[1] Tic-Tac : enregistrement automatique dans La Coupe');
const w=boot(); w.go('chrono'); w.chStart(); w.chGood(); w.chGood(); w.chFinishNow();
ok('partie créée dans La Coupe', w.D.matches.length===1);
ok('nommée « Tic-Tac »', w.D.matches[0].name==='Tic-Tac');
ok('catégorie Quiz', w.D.matches[0].game==='Quiz');
ok('scores repris (✓ = points)', Object.values(w.D.matches[0].rounds[0].scores).some(v=>v===2));
ok('Mur alimenté aussi', w.D.tictac.length===1);
w.CH=null; w.chStart(); w.chGood(); w.chFinishNow();
ok('2e partie : même partie Coupe', w.D.matches.length===1);
ok('une manche de plus', w.D.matches[0].rounds.length===2);
w.render();
ok('constat affiché', A(w).includes('Enregistrée dans 🏆 La Coupe'));
ok('plus aucune sélection à faire', !A(w).includes('Compter aussi dans une partie'));

L('[2] Micro : idem');
const w2=boot(); w2.D.lib=[{id:'a',name:'Anna'},{id:'b',name:'Bob'}]; w2.D.microTeam=['a','b'];
w2.go('quizz'); w2.S.microSheet=true; w2.render(); w2.microWin(1);
const m=w2.D.matches.filter(x=>x.name==='Le Micro')[0];
ok('partie « Le Micro » créée', !!m);
ok('catégorie Quiz', m && m.game==='Quiz');
ok('vainqueur en tête du classement', w2.D.micro[0].players[0].name==='Bob');
ok('aucune feuille de choix', !w2.document.getElementById('mcsh'));
w2.S.microSheet=true; w2.render(); w2.microWin(0);
ok('2e partie : même partie Coupe', w2.D.matches.filter(x=>x.name==='Le Micro').length===1);
ok('deux manches', w2.D.matches.filter(x=>x.name==='Le Micro')[0].rounds.length===2);

L('[3] Onglets Résultats retirés de Tic-Tac et Micro');
w.go('chrono'); w.render();
ok('Tic-Tac : plus de barre du bas', w.document.getElementById('nav').innerHTML==='');
w2.go('quizz'); w2.render();
ok('Micro : plus de barre du bas', w2.document.getElementById('nav').innerHTML==='');
ok('Micro : plus d\'historique local', !A(w2).includes('Dernières parties'));
ok('La Coupe garde ses onglets', (()=>{w.go('points');w.render();return w.document.getElementById('nav').textContent.includes('Résultats');})());

L('[4] Mur des champions : modes de lecture');
const w3=boot(); const P=w3.D.lib.slice(0,2), ids=P.map(p=>p.id);
w3.D.matches=[{id:'m',name:'Uno',game:'Uno',date:'2026-08-16',status:'done',winRule:'high',target:null,
  players:P.map(p=>({id:p.id,name:p.name})),rounds:[{id:'r',date:'2026-08-16',scores:{[ids[0]]:9,[ids[1]]:2}}]}];
w3.D.tictac=[{id:'d',date:'2026-08-12',winner:P[0].name,players:[{name:P[0].name,good:3,bad:1}]}];
w3.go('champions'); w3.render();
ok('sélecteur de mode', A(w3).includes('champMode'));
ok('trois modes', ['Par jeu','Général','Tout'].every(t=>A(w3).includes(t)));
ok('par jeu par défaut', A(w3).includes('Par jeu') && A(w3).includes('Uno'));
ok('mode Par jeu : pas de total global', !A(w3).includes('Toutes disciplines'));
w3.S.champMode='global'; w3.render();
ok('mode Général : total seul', A(w3).includes('Toutes disciplines') && !A(w3).includes('<h2>Par jeu</h2>'));
w3.S.champMode='tout'; w3.render();
ok('mode Tout : les deux', A(w3).includes('Toutes disciplines') && A(w3).includes('Par jeu'));

L('[5] La Coupe : parties terminées repliées');
const w4=boot(); const Q=w4.D.lib.slice(0,2), jd=Q.map(p=>p.id);
w4.D.matches=[];
for(let i=0;i<7;i++) w4.D.matches.push({id:'m'+i,name:'P'+i,game:i%2?'Uno':'Belote',date:'2026-08-16',
  status:i<2?'live':'done',winRule:'high',target:null,players:Q.map(p=>({id:p.id,name:p.name})),
  rounds:[{id:'r'+i,date:'2026-08-16',scores:{[jd[0]]:5,[jd[1]]:2}}]});
w4.go('points'); w4.setRtab('play'); w4.render();
ok('section repliée par défaut', A(w4).includes('Parties terminées (5)'));
ok('cartes terminées masquées', (A(w4).match(/class="swipe"/g)||[]).length===2);
ok('vocabulaire « terminées », pas « archivées »', !A(w4).includes('rchivé'));
w4.S.showDone=true; w4.render();
ok('dépliable', (A(w4).match(/class="swipe"/g)||[]).length===7);
ok('parties en cours toujours visibles', A(w4).includes('En cours'));

L('[6] Non-régression');
ok('balayage aligné', html.includes('.swipe.flat{border-radius:0;margin-bottom:0}'));
ok('annulation à 7 s', html.includes('Date.now()+7000'));
ok('banque de questions', w4.qbankAll().length===60);
ok('moteur Micro intact', w2.briefText().includes('A3. CONTRAT DE VOIX'));
ok('résultats Coupe intacts', typeof w4.coupeResults==='function' && typeof w4.statPair==='function');
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
