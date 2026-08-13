import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined;}});
const w=dom.window, doc=w.document;

L('[A] Photos dans Tic-Tac (référentiel partagé)');
w.go('chrono');
const cfg=doc.getElementById('app').innerHTML;
ok('avatars affichés dans la config', cfg.includes('chAv(0)')&&cfg.includes('class="av'));
ok('mention « partagé avec La Coupe et Le Micro »', cfg.includes('partagé avec La Coupe'));
// assigner une photo/emoji à un joueur Tic-Tac existant (Patrick est dans DEF)
w.chSettings().players[0]='Patrick'; w.persist(); // nom déjà dans le référentiel (DEF)
const nLibBefore=w.D.lib.length;
w.chAv(0);
ok('joueur existant (Patrick) : pas de doublon dans le référentiel', w.D.lib.length===nLibBefore);
w.chooseAv('🐸');
ok('emoji appliqué au joueur (via lib partagée)', w.avFor(w.chSettings().players[0])==='🐸');
// joueur invité inconnu -> création dans le référentiel
w.chSettings().players[0]='Kevin';
const nb=w.D.lib.length; w.chAv(0);
ok('invité inconnu : entrée créée dans le référentiel', w.D.lib.length===nb+1);
w.closeAv();

L('[B] Historique optionnel Tic-Tac');
w.CH=null; w.go('chrono'); w.S.chTab='play';
w.chSettings().players=['Mattéo','Maxime','Patrick']; w.chSettings().secs=60; w.persist();
w.chStart();
// simuler : Maxime et Patrick éliminés, Mattéo gagne
w.CH.players[0].good=5; w.CH.players[1].good=2; w.CH.players[2].good=3;
w.CH.players[1].out=true; w.CH.players[2].out=true; w.CH.active=0;
let win=doc.getElementById('app'); w.render();
ok('enregistrement du duel proposé (facultatif)', doc.getElementById('app').innerHTML.includes('Garder cette manche')||doc.getElementById('app').innerHTML.includes('Enregistrer cette manche'));
const nd=w.D.tictac.length; w.chSaveDuel();
ok('duel enregistré', w.D.tictac.length===nd+1);
ok('vainqueur = Mattéo', w.D.tictac[0].winner==='Mattéo');
ok('bonnes réponses mémorisées', w.D.tictac[0].players.find(p=>p.name==='Mattéo').good===5);
w.render();
ok('après enregistrement : « enregistrée au palmarès »', doc.getElementById('app').innerHTML.includes('enregistrée au palmarès'));
// double-save impossible
w.chSaveDuel(); ok('pas de double enregistrement', w.D.tictac.length===nd+1);

L('[B2] Palmarès Tic-Tac (Roi du chrono)');
w.CH=null; w.S.chTab='pal'; w.go('chrono'); w.S.chTab='pal'; w.render();
const pal=doc.getElementById('app').innerHTML;
ok('écran « Roi du chrono »', pal.includes('Roi du chrono'));
ok('Mattéo champion', pal.includes('👑 Mattéo'));
ok('historique des duels affiché', pal.includes('Historique des duels'));
const agg=w.chAggChrono();
ok('agrégation : Mattéo 1 victoire', agg[0].name==='Mattéo'&&agg[0].wins===1);
// onglets présents
ok('onglets Duel / Palmarès', doc.getElementById('nav').innerHTML.includes('Duel')&&doc.getElementById('nav').innerHTML.includes('Palmarès'));

L('[C] Marketing / visuel accueil');
w.go('home');
const home=doc.getElementById('app').innerHTML;
ok('hero enrichi (pills Soirées/Balade/Vacances)', home.includes('Soirées')&&home.includes('En balade'));
ok('bandeau de confiance (Sans pub / Hors-ligne / Gratuit)', home.includes('Sans pub')&&home.includes('Hors-ligne')&&home.includes('Gratuit'));
ok('tags de catégorie sur les tuiles', home.includes('Scores &amp; palmarès')||home.includes('Scores & palmarès'));
ok('tag Quiz vocal · IA', home.includes('Quiz vocal'));
ok('watermark décoratif présent', home.includes('class="wm"'));
ok('compteur duels visible si historique', home.includes('au palmarès'));
ok('accueil sans carte pépite redondante', !w.document.getElementById('app').innerHTML.includes('La pépite'));

L('[D] Non-régression clés');
ok('prompt Micro intégral intact', w.briefText().includes('RÈGLES NON NÉGOCIABLES'));
ok('palmarès Micro intact', typeof w.microPalmares==='function');
ok('détail joueur Coupe intact', typeof w.libIdForName==='function');

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ECHEC(S) ***');
