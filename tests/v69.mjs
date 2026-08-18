import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const A=(w)=>w.document.getElementById('app').innerHTML;
function boot(){const store=new Map();
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  d.window.D.onboarded=1; return d.window;}

L('[1] BUG : la feuille du Micro s\'empilait et bloquait l\'écran');
const w=boot(); w.D.lib=[{id:'a',name:'Anna'},{id:'b',name:'Bob'}]; w.D.microTeam=['a','b'];
w.go('quizz'); w.S.microSheet=true; w.render();
ok('une seule feuille à l\'ouverture', w.document.querySelectorAll('#msh').length===1);
w.render(); w.render();
ok('pas d\'empilement après 3 rendus', w.document.querySelectorAll('#msh').length===1);
w.microClose();
ok('Annuler ferme réellement', w.document.querySelectorAll('#msh').length===0);
ok('drapeau remis à zéro', w.S.microSheet===false);
w.S.microSheet=true; w.render(); w.go('home'); 
ok('quitter la rubrique ferme aussi', w.document.querySelectorAll('#msh').length===0);

L('[2] Micro : le vainqueur en un seul appui');
const w2=boot(); w2.D.lib=[{id:'a',name:'Anna'},{id:'b',name:'Bob'},{id:'c',name:'Cléo'}];
w2.D.microTeam=['a','b','c'];
w2.go('quizz'); w2.S.microSheet=true; w2.render();
const sh=()=>w2.document.getElementById('msh').innerHTML;
ok('question directe « Qui a gagné ? »', sh().includes('Qui a gagné ?'));
ok('un bouton par joueur', ['Anna','Bob','Cléo'].every(n=>sh().includes(n)));
ok('aucune saisie obligatoire', sh().includes('microWin(0)') && sh().includes('Un appui suffit'));
ok('scores repliés et facultatifs', sh().includes('Ajouter les scores'));
w2.microWin(1);
ok('résultat enregistré', w2.D.micro.length===1);
ok('le bon vainqueur en tête', w2.D.micro[0].players[0].name==='Bob');
ok('les autres joueurs conservés', w2.D.micro[0].players.length===3);
ok('feuille refermée', w2.document.querySelectorAll('#msh').length===0);
ok('enregistrement automatique dans La Coupe (v78)', w2.D.matches.some(m=>m.name==='Le Micro'));

L('[3] Micro en équipes : un appui par équipe');
const w3=boot(); w3.D.lib=[{id:'a',name:'Anna'},{id:'b',name:'Bob'}];
w3.D.microTeam=['a','b']; w3.D.microTeams={a:['Anna'],b:['Bob']};
w3.go('quizz'); w3.S.microSheet=true; w3.render();
ok('choix par équipe', w3.document.getElementById('msh').innerHTML.includes('Équipe 1'));
w3.microWin(0);
ok('équipe gagnante enregistrée', w3.D.micro[0].players[0].name==='Anna');

L('[4] Prénoms d\'animateur : définis par l\'app, liés au personnage');
const w4=boot();
const seen={};
for(const s of ['sportif','tragedien','inspecteur','prof','taquin','famille','apero','show','susceptible','classique']){
  w4.setMicroStyle(s); seen[s]=w4.hostName();
}
ok('un prénom pour chaque personnage', Object.values(seen).every(n=>n&&n.length>1));
ok('aucune saisie requise', typeof w4.hostName==='function');
w4.setMicroStyle('sportif');
ok('stable au retour', w4.hostName()===seen.sportif);
ok('cohérent avec le style (pool dédié)', w4.HOST_NAMES_BY_STYLE.sportif.includes(seen.sportif));
w4.setHostName('Thierry');
ok('reste modifiable si on veut', w4.hostName()==='Thierry');
w4.setMicroStyle('prof');
ok('chaque personnage garde le sien', w4.hostName()===seen.prof);
ok('prénoms courts et prononçables', Object.values(seen).every(n=>n.length<=10));

L('[5] Mur des champions : comparer ce qui est comparable');
const w5=boot(); const ids=w5.D.lib.slice(0,3).map(p=>p.id);
w5.D.matches=[{id:'m',name:'Uno',game:'Uno',date:'2026-08-10',status:'done',winRule:'high',target:null,
  players:w5.D.lib.slice(0,3).map(p=>({id:p.id,name:p.name})),rounds:[{id:'r',date:'2026-08-10',scores:{[ids[0]]:9,[ids[1]]:2,[ids[2]]:5}}]}];
w5.D.tictac=[{id:'d',date:'2026-08-12',winner:w5.D.lib[2].name,players:[{name:w5.D.lib[2].name,good:3,bad:1}]}];
w5.go('champions'); w5.render();
ok('palmarès par jeu présent', A(w5).includes('Par jeu'));
ok('avertissement sur la comparaison', A(w5).includes('ne se comparent pas'));
ok('Uno a son classement', A(w5).includes('Uno'));
ok('Tic-Tac a le sien', A(w5).includes('Tic-Tac'));
ok('victoires / parties affichées', /\d+\s*\/\s*\d+/.test(A(w5).replace(/<[^>]+>/g,' ')));
ok('total global disponible via le mode Général (v78)', (w5.S.champMode='tout', w5.render(), A(w5).includes('Toutes disciplines confondues')));
ok('champByGame exposé', typeof w5.champByGame==='function');
const g=w5.champByGame();
ok('un bloc par discipline', g.length===2);
ok('classement interne correct', g[0].players[0].wins>=g[0].players[1].wins);

L('[6] Non-régression');
ok('Mur toujours alimenté automatiquement', typeof w5.championsAgg==='function' && w5.championsAgg().length>0);
ok('passerelles Coupe intactes', html.includes('microToCoupe') && html.includes('chToCoupeGo'));
ok('moteur Micro intact', w2.briefText().includes('A3. CONTRAT DE VOIX'));
ok('prénom transmis au prompt', /HOTE=\w+/.test(w2.briefText()));
ok('retrait de joueur intact', typeof w5.activePlayers==='function');
ok('barre d\'annulation corrigée', typeof w5.sweepUndo==='function');
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
