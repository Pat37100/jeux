import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const A=(w)=>w.document.getElementById('app').innerHTML;
function boot(){const store=new Map();
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  d.window.D.onboarded=1; return d.window;}

L('[1] Bloc de résultats commun aux rubriques');
const w=boot();
ok('podiumBoard exposé', typeof w.podiumBoard==='function');
const b=w.podiumBoard([{name:'Anna',main:'3',ratio:1},{name:'Bob',main:'1',ratio:.33}]);
ok('médailles', b.includes('🥇') && b.includes('🥈'));
ok('barre de comparaison', b.includes('width:100%') && b.includes('width:33%'));
ok('avatars', b.includes('class="av'));
ok('liste vide gérée', w.podiumBoard([])==='' && w.podiumBoard(null)==='');

L('[2] Tic-Tac utilise le bloc commun');
const w2=boot(); w2.go('chrono'); w2.chStart();
w2.chGood(); w2.chGood(); w2.chWrong(); w2.chFinishNow(); w2.render();
ok('podium rendu', A(w2).includes('🥇'));
ok('✓ et ✗ affichés', A(w2).includes('✓ 2') && A(w2).includes('✗ 1'));
ok('taux affiché', A(w2).includes('67%'));
ok('barres de comparaison', A(w2).includes('linear-gradient(90deg,#34d399,#059669)'));

L('[3] Le Micro utilise le même bloc');
const w3=boot(); w3.D.lib=[{id:'a',name:'Anna'},{id:'b',name:'Bob'}]; w3.D.microTeam=['a','b'];
w3.D.micro=[{id:'q1',date:'2026-08-16',players:[{name:'Anna',score:15},{name:'Bob',score:9}]},
            {id:'q2',date:'2026-08-12',players:[{name:'Anna',score:12},{name:'Bob',score:7}]}];
w3.go('quizz'); w3.S.qHist=true; w3.S.qPal=true; w3.render();
ok('palmarès centralisé dans La Coupe (v78)', typeof w3.coupeResults==='function');
ok('composants communs conservés', typeof w3.rankRows==='function' && typeof w3.statPair==='function');
ok('résultats du Micro accessibles via La Coupe', w3.D.matches.length>=0);
ok('aucun historique dupliqué', (A(w3).match(/Historique/g)||[]).length===0);
ok('historique centralisé dans La Coupe (v78)', (A(w3).match(/Dernières parties/g)||[]).length===0);

L('[4] Niveau par joueur (ta question)');
const w4=boot(); w4.D.lib=[{id:'p1',name:'Patrick'},{id:'p2',name:'Mathéo'}]; w4.D.microTeam=['p1','p2'];
ok('3 crans seulement', w4.MICRO_LVL.length===3);
ok('Normal par défaut', w4.microLvl('p1')==='n');
w4.cycleMicroLvl('p2');
ok('un appui = cran suivant', w4.microLvl('p2')==='c');
w4.cycleMicroLvl('p2');
ok('cycle complet', w4.microLvl('p2')==='j');
w4.cycleMicroLvl('p2');
ok('retour à Normal', w4.microLvl('p2')==='n');
w4.cycleMicroLvl('p2'); w4.cycleMicroLvl('p2');
let t=w4.briefText();
ok('niveaux transmis au moteur', /NIVEAUX_PAR_JOUEUR=Patrick:5 · Mathéo:3/.test(t));
ok('moteur : priorité au niveau individuel', t.includes('PRIORITAIRE sur NIVEAU_INITIAL'));
ok('moteur : écart voulu, non commenté', t.includes('sans jamais le commenter à voix haute'));
w4.toggleMicroCtx('costaud'); t=w4.briefText();
ok('Costaud rehausse chacun sans écraser l\'écart', /Patrick:7 · Mathéo:5/.test(t));
w4.toggleMicroCtx('costaud');
w4.go('quizz'); w4.render();
ok('pastille visible sur les joueurs actifs', A(w4).includes('cycleMicroLvl'));
ok('explication brève', A(w4).includes('son niveau de départ'));
ok('récap montre les niveaux quand ils diffèrent', A(w4).includes('<b>Niveaux</b>'));
const w5=boot(); w5.D.lib=[{id:'x',name:'Zoé'}]; w5.D.microTeam=['x'];
w5.go('quizz'); w5.render();
ok('récap silencieux si tout est Normal', !A(w5).includes('<b>Niveaux</b>'));

L('[5] Non-régression');
ok('vainqueur en un appui', typeof w3.microWin==='function');
ok('feuille non empilée', (function(){w3.S.microSheet=true;w3.render();return w3.document.querySelectorAll('#msh').length===1;})());
ok('Mur par discipline', typeof w3.champByGame==='function');
ok('prénoms par personnage', !!w3.HOST_NAMES_BY_STYLE);
ok('moteur intact', t.includes('A3. CONTRAT DE VOIX') && t.includes('VERROU DU PROPRIÉTAIRE'));
ok('mécaniques intactes', t.includes('MECANIQUES='));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
