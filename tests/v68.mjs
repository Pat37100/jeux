import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
function boot(){const store=new Map();
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  d.window.D.onboarded=1; return d.window;}
const A=(win)=>win.document.getElementById('app').innerHTML;
const w=boot(); const app=()=>A(w);

L('[1] BUG barre d\'annulation (gel des minuteurs iOS)');
ok('échéance mémorisée', /UNDO\.until=Date\.now\(\)\+\d+/.test(html));
ok('sweepUndo existe', typeof w.sweepUndo==='function');
ok('vérifiée à chaque rendu', html.includes('function render(){\n  sweepUndo();'));
const ids=w.D.lib.slice(0,3).map(p=>p.id);
w.D.matches=[{id:'m',name:'U',game:'Uno',date:'2026-08-16',status:'live',winRule:'high',target:null,
  players:w.D.lib.slice(0,3).map(p=>({id:p.id,name:p.name})),
  rounds:[{id:'r1',date:'2026-08-16',scores:{[ids[0]]:5,[ids[1]]:3,[ids[2]]:1}}]}];
w.S.matchId='m'; w.delMatch();
ok('barre affichée', !!w.document.getElementById('undobar'));
w.UNDO.until=Date.now()-1;   // simule un retour d'arrière-plan après expiration
w.render();
ok('barre balayée au rendu suivant, sans attendre le minuteur', !w.document.getElementById('undobar'));
ok('annulation désarmée', w.UNDO===null);
w.doUndo();
ok('doUndo ne plante pas après expiration', true);

L('[2] Joueur ajouté par erreur : suppression franche');
const w2=boot(); const jd=w2.D.lib.slice(0,3).map(p=>p.id);
w2.D.matches=[{id:'m',name:'U',game:'Uno',date:'2026-08-16',status:'live',winRule:'high',target:null,
  players:w2.D.lib.slice(0,3).map(p=>({id:p.id,name:p.name})),
  rounds:[{id:'r1',date:'2026-08-16',scores:{[jd[0]]:5,[jd[1]]:3}}]}];
w2.openMatch('m'); w2.S.tab='set'; w2.render();
ok('balayage proposé', A(w2).includes('askDropPlayer'));
w2.askDropPlayer(jd[2]); w2.render();
ok('confirmation annonce une suppression', A(w2).includes('il sera simplement supprimé'));
w2.dropPlayerFull(jd[2]);
ok('joueur sans score : réellement supprimé', w2.cur().players.length===2);

L('[3] Joueur avec historique : mis en retrait, historique conservé');
const w3=boot(); const kd=w3.D.lib.slice(0,3).map(p=>p.id);
w3.D.matches=[{id:'m',name:'U',game:'Uno',date:'2026-08-16',status:'live',winRule:'high',target:null,
  players:w3.D.lib.slice(0,3).map(p=>({id:p.id,name:p.name})),
  rounds:[{id:'r1',date:'2026-08-16',scores:{[kd[0]]:5,[kd[1]]:3,[kd[2]]:7}}]}];
w3.openMatch('m'); w3.S.tab='set'; w3.render();
w3.askDropPlayer(kd[2]); w3.render();
ok('confirmation annonce un retrait', A(w3).includes('restent visibles dans l\'historique'));
w3.dropPlayerFull(kd[2]);
ok('joueur conservé dans la partie', w3.cur().players.length===3);
ok('marqué en retrait', w3.cur().players[2].out===true);
ok('ses scores sont intacts', w3.cur().rounds[0].scores[kd[2]]===7);
ok('activePlayers l\'exclut', w3.activePlayers(w3.cur()).length===2);
w3.S.tab='play'; w3.render();
ok('absent de la saisie des manches suivantes', !A(w3).includes('id="i_'+kd[2]+'"') && (A(w3).match(/inputmode="decimal"/g)||[]).length===2);
w3.S.tab='rank'; w3.setResMode('grid'); w3.render();
ok('toujours visible dans la grille', A(w3).includes(w3.D.lib[2].name));
ok('marqué « retiré »', A(w3).includes('retiré</span>'));
ok('son cumul reste compté', w3.rank(w3.cur()).byCumul.some(p=>p.points===7));
w3.S.tab='set'; w3.render();
ok('réintégration possible', A(w3).includes('rejoinPlayer'));
w3.rejoinPlayer(kd[2]);
ok('réintégré', !w3.cur().players[2].out && w3.activePlayers(w3.cur()).length===3);

L('[4] Tic-Tac : libellés cohérents avec le mode');
const w4=boot();
w4.go('chrono'); w4.chSetPass('wrong'); w4.chStart(); w4.render();
ok('erreur passe la main : précisions utiles', A(w4).includes('garde la main') && A(w4).includes('au suivant'));
w4.CH=null; w4.chSetPass('both'); w4.chStart(); w4.render();
ok('les deux font tourner : aucune précision redondante', !A(w4).includes('— au suivant'));
ok('mais les deux boutons restent explicites', A(w4).includes('✓ Bonne réponse') && A(w4).includes('✗ Mauvaise réponse'));
w4.CH=null; w4.chSetPass('good'); w4.chStart(); w4.render();
ok('bonne réponse passe la main : précisions inversées', A(w4).includes('au suivant') && A(w4).includes('il continue'));

L('[5] Tic-Tac : écran de fin plus attractif');
const w5=boot(); w5.go('chrono'); w5.chStart();
w5.chGood(); w5.chGood(); w5.chWrong(); w5.chFinishNow(); w5.render();
ok('podium affiché', A(w5).includes('🏆') && A(w5).includes('🥇'));
ok('vainqueur mis en avant', A(w5).includes(w5.CH.winner));
ok('total de questions annoncé', /questions? en tout/.test(A(w5)));
ok('statistiques comparées ✓/✗/%', A(w5).includes('✗ 1') && A(w5).includes('67%'));
ok('podium à 3 places', A(w5).includes('🥇') && A(w5).includes('🥈') && A(w5).includes('🥉'));

L('[6] Micro : fin de partie alignée sur le Tic-Tac');
const w6=boot(); w6.D.lib=[{id:'a',name:'A'},{id:'b',name:'B'}]; w6.D.microTeam=['a','b'];
w6.go('quizz'); w6.render();
ok('un seul bouton de fin', A(w6).includes('Enregistrer le résultat de la partie'));
ok('plus de saisie manuelle des questions', !A(w6).includes('Colle ici les questions'));
ok('plus de bloc « Après la partie »', !A(w6).includes('Après la partie'));
w6.S.microSheet=true; w6.render();
ok('la feuille de résultat s\'ouvre', w6.document.body.innerHTML.includes('Résultat'));

L('[7] Non-régression');
ok('balayage partout', ['askDelMatch','delRound','askDropPlayer','delLib','chDelDuel'].every(f=>html.includes(f)));
ok('passerelles Coupe intactes', html.includes('chToCoupeGo') && html.includes('microToCoupe'));
ok('moteur Micro intact', w6.briefText().includes('A3. CONTRAT DE VOIX') && w6.briefText().includes('VERROU DU PROPRIÉTAIRE'));
ok('journal conservé techniquement', typeof w6.addJournal==='function');
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
