import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  BUG  ')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  try{Object.defineProperty(w.navigator,'serviceWorker',{get:()=>({register:()=>Promise.resolve(),addEventListener(){},controller:null}),configurable:true});}catch(e){}
}});
const w=dom.window, doc=w.document; w.D.onboarded=1;
const app=()=>doc.getElementById('app').innerHTML;

L('[1] Arène côte à côte (effet plateau TV)');
w.CH=null; w.go('chrono'); w.chStart();
ok('colonnes côte à côte (.duel)', app().includes('class="duel'));
ok('grille adaptée au nombre (n3 pour 3 joueurs)', app().includes('duel n3'));
ok('une colonne par joueur', (app().match(/class="lane/g)||[]).length===w.CH.players.length);
ok('barre de remplissage par colonne', app().includes('fillbar'));
ok('joueur actif mis en avant (.live)', app().includes('lane live'));
ok('nom du joueur en gros au-dessus', app().includes('turnbar'));
ok('temps affiché dans chaque colonne', (app().match(/class="tt"/g)||[]).length===w.CH.players.length);
ok('compteur ✓ par colonne', (app().match(/class="gd"/g)||[]).length===w.CH.players.length);
ok('anciennes pastilles supprimées', !app().includes('charena'));

L('[2] Tension visuelle');
w.CH.players[0].left=3; w.render();
ok('sous 5s : colonne en danger (pulsation)', app().includes('lane live danger')||app().includes('danger'));
w.CH.players[0].left=15; w.render();
ok('sous 20s : colonne en alerte', app().includes('warn'));
w.CH.players[1].good=3; w.CH.players[0].good=1; w.render();
ok('couronne sur le meneur', app().includes('crown'));
w.CH.players[1].out=true; w.render();
ok('éliminé grisé avec ❌', app().includes('lane')&&app().includes('ko'));

L('[3] Vocabulaire joueur / équipe');
w.CH=null; w.go('chrono');
ok('Tic-Tac : « Joueurs ou équipes »', app().includes('Joueurs ou équipes'));
ok('Tic-Tac : ajout mentionne l\'équipe', app().includes('ou une équipe'));
w.go('save');
ok('Réglages : « Joueurs & équipes »', app().includes('Joueurs &amp; équipes')||app().includes('Joueurs & équipes'));
ok('Réglages : champ prénom ou équipe', app().includes('équipe'));
ok('Réglages : explication équipe', app().includes('Les Bleus'));
w.go('quizz'); w.S.qtab='play'; w.render();
ok('Micro : participants (pas seulement prénoms)', app().includes('participants'));
w.obReplay();
const sheet=doc.getElementById('obsh').innerHTML;
ok('Onboarding : prénoms ou équipes', sheet.includes('équipes')||sheet.includes('Les Bleus'));
w.obDone();

L('[4] Le duel fonctionne toujours');
w.CH=null; w.go('chrono'); w.chStart();
w.chGood(); ok('bonne réponse comptée', w.CH.players[0].good===1);
w.chPause(); w.chWrong(); ok('main passée', w.CH.active===1);
w.chJump(0); ok('clic sur une colonne donne la main', w.CH.active===0);

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ÉCHEC(S) ***');
