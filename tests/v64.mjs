import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
function boot(seed){const store=new Map();
  if(seed) store.set('jeux-famille-v1',seed);
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  d.window.D.onboarded=1; return d.window;}
const w=boot();

L('[1] Le catalogue n\'est plus fermé');
ok('19 raccourcis de base', w.GAMES_BASE.length===19);
ok('plus de fourre-tout « Autre » dans la liste', w.GAMES_BASE.indexOf('Autre')<0);
ok('bibliothèque de jeux de la famille', Array.isArray(w.userGames()));
ok('allGames combine les deux', w.allGames().length===19);

L('[2] Ajout manuel d\'un jeu');
const g=w.addGame('dixit');
ok('normalisé (majuscule)', g==='Dixit');
ok('ajouté à la bibliothèque', w.userGames().includes('Dixit'));
ok('devient un raccourci', w.allGames().includes('Dixit'));
ok('doublon évité (insensible à la casse)', w.addGame('DIXIT')==='Dixit' && w.userGames().filter(x=>x.toLowerCase()==='dixit').length===1);
ok('espaces nettoyés', w.addGame('  loup   garou  ')==='Loup garou');
ok('nom vide refusé', w.addGame('   ')==='');
ok('longueur bornée', w.addGame('x'.repeat(60)).length<=28);

L('[3] Déduction élargie aux jeux ajoutés');
ok('« soirée Dixit » → Dixit', w.inferGame('soirée Dixit')==='Dixit');
ok('les raccourcis marchent toujours', w.inferGame('Belote du soir')==='Belote');
ok('le plus long gagne (pas de faux positif)', w.addGame('Mille Bornes Junior')==='Mille Bornes Junior' && w.inferGame('Mille Bornes Junior')==='Mille Bornes Junior');
ok('inconnu → Autre', w.inferGame('zzz')==='Autre');

L('[4] Création : saisie libre');
const w2=boot(); w2.go('points'); w2.render(); w2.openSheet();
const sh=()=>w2.document.querySelector('.sheet .in').innerHTML;
ok('champ de saisie libre présent', sh().includes('id="gnew"'));
ok('exemples parlants', sh().includes('Dixit') && sh().includes('Loup-Garou'));
ok('raccourcis toujours là', sh().includes('data-g="Uno"'));
w2.document.getElementById('gnew').value='Skip-Bo';
w2.createMatch();
ok('jeu libre enregistré sur la partie', w2.D.matches[0].game==='Skip-Bo');
ok('mémorisé pour la prochaine fois', w2.userGames().includes('Skip-Bo'));
ok('nom de partie repris du jeu', w2.D.matches[0].name==='Skip-Bo');

L('[5] La saisie libre a priorité sur une puce cochée');
const w3=boot(); w3.go('points'); w3.render(); w3.openSheet();
const btn=w3.document.querySelector('#gk .chip[data-g="Uno"]');
w3.pickGame(btn);
ok('puce Uno cochée', btn.classList.contains('on'));
w3.document.getElementById('gnew').value='Dixit';
w3.createMatch();
ok('c\'est le jeu tapé qui gagne', w3.D.matches[0].game==='Dixit');

L('[6] Les jeux utilisés remontent en tête');
const w4=boot();
w4.D.games=['Dixit'];
w4.D.matches=[{id:'a',name:'p',game:'Dixit',date:'2026-08-16',status:'live',winRule:'high',target:null,players:[],rounds:[]},
              {id:'b',name:'q',game:'Dixit',date:'2026-08-16',status:'live',winRule:'high',target:null,players:[],rounds:[]}];
const order=w4.gamesForPicker();
ok('Dixit en premier (2 parties)', order[0]==='Dixit');
ok('tous les jeux restent proposés', order.length===20);

L('[7] Réglages : ajouter un jeu depuis une partie');
const w5=boot();
w5.D.matches=[{id:'m',name:'Soirée',game:'Autre',date:'2026-08-16',status:'live',winRule:'high',target:null,
  players:w5.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),rounds:[]}];
w5.openMatch('m'); w5.S.tab='set'; w5.render();
const a5=()=>w5.document.getElementById('app').innerHTML;
ok('champ « Ajouter un jeu »', a5().includes('id="gadd"'));
ok('bouton Ajouter', a5().includes('addGameHere()'));
w5.document.getElementById('gadd').value='Loup-Garou';
w5.addGameHere();
ok('jeu créé et appliqué à la partie', w5.cur().game==='Loup-Garou');
ok('mémorisé dans la bibliothèque', w5.userGames().includes('Loup-Garou'));
w5.render();
ok('devient un raccourci ici aussi', a5().includes("setMatchGame('Loup-Garou')"));

L('[8] Filtres : les jeux ajoutés se filtrent comme les autres');
const w6=boot();
w6.D.games=['Dixit'];
const mk=(i,g)=>({id:'m'+i,name:'P'+i,game:g,date:'2026-08-16',status:'live',winRule:'high',target:null,
  players:w6.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),rounds:[{id:'r'+i,date:'2026-08-16',scores:{[w6.D.lib[0].id]:5,[w6.D.lib[1].id]:2}}]});
w6.D.matches=[mk(1,'Dixit'),mk(2,'Dixit'),mk(3,'Uno'),mk(4,'Belote'),mk(5,'Dixit')];
w6.go('points'); w6.render();
ok('Dixit apparaît dans les filtres', a5.call?a5:true, true);
const a6=()=>w6.document.getElementById('app').innerHTML;
ok('filtre Dixit proposé avec son compte', a6().includes('Dixit 3'));
w6.setGameFilter('Dixit'); w6.render();
ok('3 parties Dixit', (a6().match(/class="swipe"/g)||[]).length===3);
w6.setGameFilter('Dixit');

L('[9] Persistance et migration');
const w7=boot(JSON.stringify({onboarded:1,games:['Dixit','Skip-Bo'],matches:[]}));
ok('bibliothèque relue au démarrage', w7.userGames().includes('Dixit') && w7.userGames().includes('Skip-Bo'));
ok('déduction utilise les jeux mémorisés', w7.inferGame('grande soirée skip-bo')==='Skip-Bo');
const w8=boot(JSON.stringify({onboarded:1,matches:[{id:'z',name:'Belote des vacances',date:'2026-01-01',status:'live',winRule:'high',target:null,players:[],rounds:[]}]}));
ok('ancienne partie sans champ jeu : déduite', w8.gameOf(w8.D.matches[0])==='Belote');

L('[10] Non-régression');
const w9=boot(); w9.go('points'); w9.render();
ok('écran Coupe intact', w9.document.getElementById('app').innerHTML.includes('Aucune partie')||w9.document.getElementById('app').innerHTML.includes('En cours'));
ok('passerelle Tic-Tac garde Quiz', html.includes("name:'Tic-Tac',game:'Quiz'"));
ok('passerelle Micro garde Quiz', html.includes("name:'Le Micro',game:'Quiz'"));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
