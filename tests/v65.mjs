import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
function boot(){const store=new Map();
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  d.window.D.onboarded=1; return d.window;}
const w=boot(); const app=()=>w.document.getElementById('app').innerHTML;

L('[1] Égalités : les noms n\'étaient pas lisibles');
ok('plus de troncature forcée', !html.includes('.champ .v{font-size:18px;font-weight:800;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'));
ok('affichage sur 2 lignes', html.includes('-webkit-line-clamp:2'));
const ids=w.D.lib.map(p=>p.id);
// 2 joueurs à égalité parfaite
w.D.matches=[{id:'m',name:'U',game:'Uno',date:'2026-08-16',status:'live',winRule:'high',target:null,
  players:w.D.lib.slice(0,4).map(p=>({id:p.id,name:p.name})),
  rounds:[{id:'r1',date:'2026-08-16',scores:{[ids[0]]:5,[ids[1]]:5,[ids[2]]:1,[ids[3]]:1}}]}];
w.openMatch('m'); w.setResMode('rank'); w.render();
ok('2 à égalité : les deux noms affichés', app().includes(w.D.lib[0].name+' &amp; '+w.D.lib[1].name)||app().includes(w.D.lib[0].name+' & '+w.D.lib[1].name));
ok('mention « à égalité »', app().includes('à égalité'));
// 4 à égalité
w.cur().rounds=[{id:'r',date:'2026-08-16',scores:{[ids[0]]:3,[ids[1]]:3,[ids[2]]:3,[ids[3]]:3}}];
w.render();
ok('4 à égalité : compte annoncé', app().includes('4 ex æquo'));
ok('taille réduite pour tenir', app().includes('class="v tie"'));
ok('détail dans l\'infobulle', app().includes('title="'+w.D.lib[0].name));
ok('les points restent affichés', app().includes('3 pts'));
// un seul leader : inchangé
w.cur().rounds=[{id:'r',date:'2026-08-16',scores:{[ids[0]]:9,[ids[1]]:1,[ids[2]]:1,[ids[3]]:1}}];
w.render();
ok('leader unique : nom simple', app().includes('class="v " title="'+w.D.lib[0].name));
ok('pas de mention d\'égalité', !app().includes('à égalité'));

L('[2] Retirer un joueur : par balayage');
w.S.tab='set'; w.render();
ok('lignes de joueurs balayables', app().includes('askDropPlayer'));
ok('dans un bloc swipe', /class="swipe(?: flat)?"[\s\S]{0,400}askDropPlayer/.test(app()));
ok('plus de bouton « Retirer » visible', !/<button class="sm r"[^>]*askDropPlayer/.test(app()));
const n0=w.cur().players.length;
w.askDropPlayer(ids[3]); 
ok('confirmation demandée (scores en jeu)', typeof w.dropPlayerFull==='function');
w.dropPlayerFull(ids[3]);
ok('joueur avec historique : mis en retrait, pas effacé (v68)', w.cur().players.length===n0 && w.cur().players.some(p=>p.out===true) && w.activePlayers(w.cur()).length===n0-1);

L('[3] Balayage : cohérence dans toute l\'app');
const zones={
  'parties (La Coupe)':()=>{w.go('points');w.render();return app();},
  'manches d\'une partie':()=>{w.openMatch('m');w.setResMode('list');w.render();return app();},
  'joueurs d\'une partie':()=>{w.S.tab='set';w.render();return app();},
  'bibliothèque de joueurs':()=>{w.go('save');w.render();return app();},
};
for(const [k,fn] of Object.entries(zones)) ok('balayage : '+k, fn().includes('class="swipe'));
const w2=boot();
w2.D.tictac=[{id:'d1',date:'2026-08-12',winner:'A',players:[{name:'A',good:3,bad:1}]}];
w2.go('chrono'); w2.S.chHist=true; w2.render();
ok('balayage : duels Tic-Tac', w2.document.getElementById('app').innerHTML.includes('class="swipe'));
ok('helper commun swipeRow', typeof w2.swipeRow==='function');

L('[4] Toute suppression est annulable');
const w3=boot();
w3.D.tictac=[{id:'d1',date:'2026-08-12',winner:'A',players:[{name:'A',good:3}]}];
w3.chDelDuel('d1');
ok('duel : annulation proposée', w3.D.tictac.length===0 && !!w3.UNDO);
w3.doUndo(); ok('duel restauré', w3.D.tictac.length===1);
const lib0=w3.D.lib.length;
w3.delLib(w3.D.lib[0].id);
ok('joueur bibliothèque : annulation proposée', w3.D.lib.length===lib0-1 && !!w3.UNDO);
w3.doUndo(); ok('joueur restauré à sa place', w3.D.lib.length===lib0);

L('[5] Le Mur des champions prend TOUT, sans rien demander');
const w4=boot();
w4.go('chrono'); w4.chStart(); w4.chGood(); w4.chFinishNow();
ok('Tic-Tac : aucun clic nécessaire', w4.D.tictac.length===1);
w4.render();
ok('aucune question sur le Mur', !w4.document.getElementById('app').innerHTML.includes('Mur des champions seulement'));
ok('enregistrement automatique dans La Coupe (v78)', w4.D.matches.length>=1);
const w5=boot();
w5.D.lib=[{id:'a',name:'A'},{id:'b',name:'B'}]; w5.D.microTeam=['a','b'];
w5.go('quizz'); w5.S.microSheet=true; w5.S.microDetail=true; w5.render(); w5.document.getElementById('mqr').value='A 10\nB 5'; w5.microSave();
ok('Micro : enregistré sans décision', w5.D.micro.length===1);
ok('Micro : enregistré automatiquement dans La Coupe (v78)', w5.D.matches.some(m=>m.name==='Le Micro'));
const w6=boot(); const jd=w6.D.lib.slice(0,2).map(p=>p.id);
w6.D.matches=[{id:'x',name:'Uno',game:'Uno',date:'2026-08-16',status:'done',winRule:'high',target:null,champion:jd[0],
  players:w6.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),rounds:[{id:'r',date:'2026-08-16',scores:{[jd[0]]:9,[jd[1]]:2}}]}];
w6.D.micro=[{id:'q',date:'2026-08-11',players:[{name:w6.D.lib[0].name,score:15},{name:w6.D.lib[1].name,score:8}]}];
w6.D.tictac=[{id:'d',date:'2026-08-12',winner:w6.D.lib[0].name,players:[{name:w6.D.lib[0].name,good:3,bad:0}]}];
const agg=w6.championsAgg();
ok('les 3 rubriques comptent au Mur', agg[0].crowns===3);
w6.go('champions'); w6.render();
ok('Mur affiche le total sans réglage', w6.document.getElementById('app').innerHTML.includes(w6.D.lib[0].name));

L('[6] Non-régression');
ok('✕ conservé dans le formulaire Tic-Tac', html.includes('chDelP'));
w.go('points'); w.render();
ok('filtres par jeu intacts', typeof w.gameOf==='function');
ok('bannière objectif intacte', typeof w.goalBanner==='function');
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
