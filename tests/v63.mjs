import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
function boot(){const store=new Map();
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  d.window.D.onboarded=1; return d.window;}
const w=boot(); const app=()=>w.document.getElementById('app').innerHTML;
const mk=(id,name,game,done)=>({id:id,name:name,game:game,date:'2026-08-16',status:done?'done':'live',
  winRule:'high',target:null,players:w.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),
  rounds:[{id:'r'+id,date:'2026-08-16',scores:{[w.D.lib[0].id]:5,[w.D.lib[1].id]:3}}]});

L('[1] Déduction du jeu pour les parties existantes (aucune ressaisie)');
ok('« Belote des vacances » → Belote', w.inferGame('Belote des vacances')==='Belote');
ok('« uno rapide » → Uno (insensible à la casse)', w.inferGame('uno rapide')==='Uno');
ok('« Tarot du dimanche » → Tarot', w.inferGame('Tarot du dimanche')==='Tarot');
ok('« Tic-Tac » → Quiz', w.inferGame('Tic-Tac')==='Quiz');
ok('« Le Micro » → Quiz', w.inferGame('Le Micro')==='Quiz');
ok('inconnu → Autre', w.inferGame('Soirée chez Paul')==='Autre');
ok('gameOf respecte le champ explicite', w.gameOf({name:'Soirée',game:'Yams'})==='Yams');
ok('gameOf déduit sinon', w.gameOf({name:'Belote 2026'})==='Belote');

L('[2] Barre de filtres : n\'apparaît que quand elle sert');
w.D.matches=[mk('a','Uno','Uno'),mk('b','Belote','Belote')];
w.go('points'); w.render();
ok('cachée à 2 parties', !app().includes('setGameFilter'));
w.D.matches=[mk('a','Uno','Uno'),mk('b','Belote','Belote'),mk('c','Tarot','Tarot'),
             mk('d','Uno 2','Uno'),mk('e','Yams','Yams')];
w.render();
ok('visible à 5 parties et 2+ jeux', app().includes('setGameFilter'));
ok('bouton « Tous » avec le total', app().includes('Tous 5'));
ok('compte par jeu', app().includes('Uno 2') && app().includes('Belote 1'));
ok('jeux triés par fréquence', app().indexOf('Uno 2')<app().indexOf('Belote 1'));

L('[3] Le filtre fonctionne');
w.setGameFilter('Uno'); w.render();
ok('filtre actif', w.S.gameFilter==='Uno');
ok('ne montre que les parties Uno', app().includes('Uno 2') && !app().includes('>Tarot<'));
const cards=(app().match(/class="swipe"/g)||[]).length;
ok('2 cartes affichées', cards===2);
w.setGameFilter('Uno');
ok('re-cliquer désactive le filtre', w.S.gameFilter===null);
w.setGameFilter('Yams'); w.render();
ok('un seul résultat pour Yams', (app().match(/class="swipe"/g)||[]).length===1);
w.setGameFilter('Yams');

L('[4] Recherche au-delà de 12 parties');
w.D.matches=[];
for(let i=0;i<13;i++) w.D.matches.push(mk('x'+i,'Partie '+i, i%2?'Uno':'Belote'));
w.render();
ok('champ de recherche affiché', app().includes('Chercher une partie'));
w.S.matchQ='Partie 7'; w.render();
ok('recherche par nom', (app().match(/class="swipe"/g)||[]).length===1);
w.S.matchQ='belote'; w.render();
ok('recherche par jeu aussi', (app().match(/class="swipe"/g)||[]).length>1);
w.S.matchQ='zzz'; w.render();
ok('aucun résultat : message clair', app().includes('Aucun résultat pour ce filtre'));
ok('bouton pour tout réafficher', app().includes('Tout afficher'));
w.S.matchQ='';

L('[5] Le jeu s\'affiche sur la carte quand il diffère du nom');
w.D.matches=[mk('a','Belote des vacances','Belote'),mk('b','Uno','Uno')];
w.render();
ok('badge Belote présent', app().includes('>Belote</span>'));
ok('pas de badge quand nom = jeu', (app().match(/>Uno<\/span>/g)||[]).length===0);

L('[6] Choix du jeu à la création');
w.go('points'); w.render(); w.openSheet();
const sh=w.document.querySelector('.sheet .in').innerHTML;
ok('puces de jeux proposées', sh.includes('id="gk"') && sh.includes('data-g="Tarot"'));
ok('20 jeux au catalogue', w.GAMES.length===20);
const btn=w.document.querySelector('#gk .chip[data-g="Tarot"]');
w.pickGame(btn);
ok('sélection visuelle', btn.classList.contains('on'));
ok('nom pré-rempli par le jeu', w.document.getElementById('mn').value==='Tarot');
w.createMatch();
ok('jeu enregistré sur la partie', w.D.matches[0].game==='Tarot');
ok('un seul jeu sélectionnable', true);

L('[7] Correction du jeu depuis les Réglages');
w.openMatch(w.D.matches[0].id); w.S.tab='set'; w.render();
ok('carte « Jeu » présente', app().includes('<h2>Jeu</h2>'));
ok('jeu courant marqué', app().includes("setMatchGame('Tarot')"));
w.setMatchGame('Rami');
ok('modifiable après coup', w.cur().game==='Rami');

L('[8] Les passerelles renseignent le jeu');
const w2=boot(); w2.go('chrono'); w2.chStart(); w2.chGood(); w2.chFinishNow(); w2.chToCoupeGo('');
ok('Tic-Tac → jeu Quiz', w2.D.matches[0].game==='Quiz');
const w3=boot(); w3.D.lib=[{id:'a',name:'A'},{id:'b',name:'B'}]; w3.D.microTeam=['a','b'];
w3.go('quizz'); w3.microOpen(); w3.document.getElementById('mqr').value='A 10\nB 5'; w3.microSave(); w3.microToCoupe('');
ok('Micro → jeu Quiz', w3.D.matches[0].game==='Quiz');

L('[9] Non-régression');
w.go('points'); w.render();
ok('sections En cours / Terminées conservées', app().includes('En cours'));
ok('Palmarès accessible', app().includes("go('palmares')"));
ok('balayage conservé', app().includes('askDelMatch') && app().includes('class="swipe"'));
ok('bouton Nouvelle partie', w.document.getElementById('nav').innerHTML.includes('Nouvelle partie'));
w.D.matches=[]; w.render();
ok('écran vide intact', app().includes('Aucune partie'));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
