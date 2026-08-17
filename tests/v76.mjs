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
const P=w.D.lib.slice(0,3), N=P.map(p=>p.name), ids=P.map(p=>p.id);
w.D.matches=[{id:'m',name:'Uno',game:'Uno',date:'2026-08-16',status:'live',winRule:'high',target:null,
  players:P.map(p=>({id:p.id,name:p.name})),
  rounds:[{id:'r1',date:'2026-08-16',scores:{[ids[0]]:9,[ids[1]]:3,[ids[2]]:5}},
          {id:'r2',date:'2026-08-15',scores:{[ids[0]]:2,[ids[1]]:8,[ids[2]]:4}}]}];
w.D.tictac=[{id:'d1',date:'2026-08-12',winner:N[0],players:[{name:N[0],good:4,bad:1},{name:N[1],good:2,bad:3}]}];
w.D.micro=[{id:'q1',date:'2026-08-16',players:[{name:N[1],score:18},{name:N[0],score:11}]}];

L('[1] Les trois rubriques utilisent les mêmes briques');
for(const v of ['points','chrono','quizz']){
  w.go(v); w.setRtab('res'); w.render();
  ok(v+' : bandeau à deux cartes', A(w).includes('class="grid2"') && (A(w).match(/class="champ/g)||[]).length===2);
  ok(v+' : lignes de classement identiques', (A(w).match(/class="rank/g)||[]).length>=2);
  ok(v+' : médaille sur le premier', A(w).includes('🥇'));
  ok(v+' : couronne sur le leader', A(w).includes('👑'));
}
ok('helpers partagés exposés', typeof w.statPair==='function' && typeof w.rankRows==='function');

L('[2] Contenu pertinent par rubrique');
w.go('chrono'); w.setRtab('res'); w.render();
ok('Tic-Tac : victoires et bonnes réponses', A(w).includes('Le plus de victoires') && A(w).includes('Le plus de bonnes réponses'));
ok('Tic-Tac : taux de réussite', A(w).includes('% de réussite'));
w.go('quizz'); w.setRtab('res'); w.render();
ok('Micro : victoires et meilleur score', A(w).includes('Le plus de victoires') && A(w).includes('Meilleur score'));
ok('Micro : record par joueur', A(w).includes('record'));
w.go('points'); w.setRtab('res'); w.render();
ok('Coupe : parties et manches gagnées', A(w).includes('parties gagnées') && A(w).includes('manches gagnées'));
ok('Coupe : palmarès par jeu conservé', A(w).includes('Par jeu'));

L('[3] Accords corrects');
w.go('chrono'); w.setRtab('res'); w.render();
ok('« 4 bonnes réponses »', A(w).includes('4 bonnes réponses'));
ok('« 1 victoire » au singulier', A(w).includes('1 victoire<') || A(w).includes('>1 victoire'));

L('[4] Égalités gérées comme dans La Coupe');
const w2=boot();
w2.D.tictac=[{id:'a',date:'2026-08-12',winner:'Ana',players:[{name:'Ana',good:2,bad:0},{name:'Bo',good:2,bad:0}]},
             {id:'b',date:'2026-08-11',winner:'Bo',players:[{name:'Bo',good:2,bad:0},{name:'Ana',good:2,bad:0}]}];
w2.go('chrono'); w2.setRtab('res'); w2.render();
ok('deux noms affichés', A(w2).includes('Ana &amp; Bo')||A(w2).includes('Ana & Bo'));
const w3=boot();
w3.D.tictac=[1,2,3,4].map((i,k)=>({id:'x'+i,date:'2026-08-1'+i,winner:'J'+i,players:[{name:'J'+i,good:1,bad:0}]}));
w3.go('chrono'); w3.setRtab('res'); w3.render();
ok('au-delà de deux : « N ex æquo »', A(w3).includes('ex æquo'));

L('[5] Passerelles vers La Coupe intactes');
const w4=boot(); w4.go('chrono'); w4.chStart(); w4.chGood(); w4.chFinishNow(); w4.render();
ok('Tic-Tac propose La Coupe', A(w4).includes('Compter aussi dans une partie de La Coupe'));
w4.chToCoupe(); w4.chToCoupeGo('');
ok('partie créée', w4.D.matches.length===1 && w4.D.matches[0].game==='Quiz');
const w5=boot(); w5.D.lib=[{id:'a',name:'A'},{id:'b',name:'B'}]; w5.D.microTeam=['a','b'];
w5.go('quizz'); w5.S.microSheet=true; w5.render(); w5.microWin(0);
ok('Micro propose La Coupe', !!w5.document.getElementById('mcsh'));
w5.microToCoupe('');
ok('partie créée', w5.D.matches.length===1);

L('[6] Non-régression');
ok('historique balayable', A(w).length>0 && html.includes('chDelDuel') && html.includes('microDel'));
ok('onglets unifiés', (()=>{w.go('chrono');w.render();return w.document.getElementById('nav').textContent.includes('Résultats');})());
ok('banque de questions', typeof w.qbankAll==='function' && w.qbankAll().length===60);
ok('mise à jour forcée', typeof w.forceUpdate==='function');
ok('moteur Micro intact', w.briefText().includes('A3. CONTRAT DE VOIX'));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
