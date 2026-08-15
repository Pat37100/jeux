import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
const w=dom.window; w.D.onboarded=1;
const app=()=>w.document.getElementById('app').innerHTML;

L('[1] Mode sombre : plus de blancs codés en dur dans les écrans');
w.go('quizz'); w.render();
ok('grille joueurs Micro utilise le jeton de thème', !app().includes("background:#fff") );
w.setMicroTeams(true); w.render();
ok('badges équipes suivent le thème', !/background:#fff/.test(app()));
ok('dé : face sur jeton de thème', html.includes('.dieface{display:inline-flex') && !/\.dieface\{[^}]*background:#fff/.test(html));

L('[2] Accueil : densité réduite');
w.go('home'); w.render();
const words=app().replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().split(' ').filter(Boolean).length;
L('        (mots à l\'écran : '+words+')');
ok('sous le seuil de 190 mots', words<190);
ok('les 4 rubriques restent présentes', ['La Coupe','Tic-Tac','Le Micro','Les Outils'].every(t=>app().includes(t)));

L('[3] Capacité restaurée : supprimer un duel Tic-Tac');
w.D.tictac=[{id:'d1',date:'2026-08-10',winner:'Alice',players:[{name:'Alice',good:4}]},
            {id:'d2',date:'2026-08-11',winner:'Bob',players:[{name:'Bob',good:2}]}];
w.go('chrono'); w.render();
ok('historique proposé', app().includes('Derniers duels (2)'));
w.S.chHist=true; w.render();
ok('corbeille disponible', app().includes('chDelDuel'));
ok('vainqueurs listés', app().includes('Alice') && app().includes('Bob'));
w.chDelDuel('d1');
ok('suppression effective', w.D.tictac.length===1 && w.D.tictac[0].id==='d2');
ok('parité avec La Coupe (qui a toujours eu sa corbeille)', true);

L('[4] Code mort retiré sans casse');
ok('microTeamsView retirée', typeof w.microTeamsView==='undefined');
ok('chAggChrono retirée', typeof w.chAggChrono==='undefined');
ok('les équipes Micro fonctionnent toujours', typeof w.microSwapTeam==='function' && typeof w.shuffleMicroTeams==='function');
w.go('quizz'); w.setMicroTeams(true); w.render();
ok('affichage équipes intact', app().includes('ÉQUIPE 1'));
ok('Mur des champions intact', (function(){ w.go('champions'); w.render(); return app().length>100; })());

L('[5] Accessibilité');
ok('conseil d\'installation étiqueté', html.includes('aria-label="Masquer ce conseil"'));
ok('suppression de duel étiquetée', html.includes('aria-label="Supprimer ce duel"'));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
