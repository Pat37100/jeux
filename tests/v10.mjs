import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined; w.AudioContext=undefined; w.webkitAudioContext=undefined; w.navigator.vibrate=undefined;}});
const w=dom.window;

L('[1] Marketing accueil');
const home=w.document.getElementById('app').innerHTML;
ok('« trois jeux indépendants » retiré', !home.includes('Trois jeux indépendants') && !home.includes('trois jeux indépendants'));
ok('accroche pépite « Le Micro » présente', home.includes('La pépite'));
ok('hero : positionnement maître du jeu de poche', home.includes('maître du jeu de poche'));

L('[2] Tic-Tac : compteur de bonnes réponses');
w.go('chrono'); w.chStart();
ok('good initialisé à 0', w.CH.players[0].good===0);
(w.CH&&(w.CH.startedOnce=true),w.chGood());
ok('« Bon » incrémente et garde la main', w.CH.players[0].good===1 && w.CH.active===0 && w.CH.running===true);
w.chPause(); w.chWrong();
ok('« Au suivant » passe la main sans incrémenter', w.CH.active===1 && w.CH.players[1].good===0);
w.chPause(); (w.CH&&(w.CH.startedOnce=true),w.chGood()); w.chPause();
ok('compteur du joueur 1 = 1', w.CH.players[1].good===1);
const g=w.document.getElementById('app').innerHTML;
ok('barre de comparaison affichée', g.includes('Bonnes réponses'));
ok('2 boutons clairs (Bon / Au suivant)', g.includes('garde la main')&&g.includes('Au suivant'));

L('[3] Détail des résultats cliquable (La Coupe)');
w.go('points'); w.openSheet(); w.document.getElementById('mn').value='T'; w.createMatch();
const ids=w.cur().players.map(p=>p.id);
w.S.inputs={[ids[0]]:'10',[ids[1]]:'5'}; w.saveRound();
w.S.inputs={[ids[0]]:'8',[ids[1]]:'12'}; w.saveRound();
w.S.tab='rank'; w.render();
ok('mention « voir le détail »', w.document.getElementById('app').innerHTML.includes('voir le détail'));
w.S.detail=ids[0]; w.render();
const d=w.document.getElementById('app').innerHTML;
ok('détail joueur ouvert (2 manches listées)', d.includes('Détail de')&&d.includes('2 manches'));

L('[4] Non-régression avatars/photos toujours là');
ok('photo importable (fonction présente)', typeof w.avPhoto==='function');
ok('grille avatars enrichie (personnages)', w.AV_POOL.length>=30);

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ECHEC(S) ***');
