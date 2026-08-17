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

L('[1] Alignement des actions de balayage');
ok('classe « flat » définie', html.includes('.swipe.flat{border-radius:0;margin-bottom:0}'));
ok('ombre adaptée en flat', html.includes('.swipe.flat .front::after{border-radius:0}'));
ok('swipeRow accepte le mode flat', html.includes('function swipeRow(inner, actions, reveal, flat)'));
const calls=[...html.matchAll(/swipeRow\(row,[^;]{0,120}/g)].map(m=>m[0]);
ok('toutes les listes internes sont en flat', calls.every(c=>c.includes('true')));
ok('les cartes autonomes gardent leur arrondi', html.includes('.swipe{position:relative;overflow:hidden;border-radius:16px'));

L('[2] Rendu réel dans chaque liste');
w.D.tictac=[{id:'d1',date:'2026-08-12',winner:N[0],players:[{name:N[0],good:4,bad:1}]}];
w.D.micro=[{id:'q1',date:'2026-08-16',players:[{name:N[1],score:18}]}];
w.D.matches=[{id:'m',name:'Uno',game:'Uno',date:'2026-08-16',status:'live',winRule:'high',target:null,
  players:P.map(p=>({id:p.id,name:p.name})),rounds:[{id:'r1',date:'2026-08-16',scores:{[ids[0]]:9,[ids[1]]:3,[ids[2]]:5}}]}];
w.go('chrono'); w.setRtab('res'); w.render();
ok('historique Tic-Tac aligné', A(w).includes('class="swipe flat"'));
w.go('quizz'); w.setRtab('res'); w.render();
ok('historique Micro aligné', A(w).includes('class="swipe flat"'));
w.openMatch('m'); w.setResMode('list'); w.render();
ok('manches alignées', A(w).includes('class="swipe flat"'));
w.S.tab='set'; w.render();
ok('joueurs alignés', A(w).includes('class="swipe flat"'));
w.go('save'); w.render();
ok('bibliothèque alignée', A(w).includes('class="swipe flat"'));
w.go('points'); w.setRtab('play'); w.render();
ok('cartes de parties : arrondi conservé', /class="swipe"[^>]*data-reveal/.test(A(w)));

L('[3] Durée d\'annulation raccourcie');
ok('7 secondes au lieu de 15', html.includes('Date.now()+7000') && html.includes('setTimeout(sweepUndo,7000)'));
ok('plus aucun 15000 résiduel', !html.includes('15000'));
ok('texte mis à jour', !html.includes('15 secondes pour annuler'));
w.D.tictac=[{id:'z',date:'2026-08-12',winner:'A',players:[{name:'A',good:1}]}];
w.chDelDuel('z');
ok('barre affichée', !!w.document.getElementById('undobar'));
ok('échéance à 7 s', w.UNDO.until-Date.now()<=7000 && w.UNDO.until-Date.now()>5000);
w.UNDO.until=Date.now()-1; w.render();
ok('effacée au rendu suivant', !w.document.getElementById('undobar'));

L('[4] Non-régression');
const w2=boot();
ok('suppression toujours annulable', (()=>{w2.D.micro=[{id:'q',date:'2026-08-16',players:[{name:'A',score:5}]}];w2.microDel('q');return w2.D.micro.length===0 && !!w2.UNDO;})());
w2.doUndo();
ok('restauration OK', w2.D.micro.length===1);
ok('résultats aux composants de La Coupe', typeof w2.statPair==='function' && typeof w2.rankRows==='function');
ok('onglets unifiés', (()=>{w2.go('quizz');w2.render();return w2.document.getElementById('nav').textContent.includes('Résultats');})());
ok('banque de questions', w2.qbankAll().length===60);
ok('moteur Micro intact', w2.briefText().includes('A3. CONTRAT DE VOIX'));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
