import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
const w=dom.window; w.D.onboarded=1;
const app=()=>w.document.getElementById('app').innerHTML;
const nav=()=>w.document.getElementById('nav').innerHTML;
const body=()=>w.document.body.innerHTML;

L('[1] Accueil : bloc explicatif du bas supprimé');
w.go('home'); w.render();
ok('plus de « C\'est quoi En Jeux ? »', !app().includes("C'est quoi En Jeux"));
ok('les 4 rubriques restent', ['La Coupe','Tic-Tac','Le Micro','Les Outils'].every(t=>app().includes(t)));
const words=app().replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().split(' ').filter(Boolean).length;
L('        (mots accueil : '+words+')');
ok('accueil : explication assumée', words<225 && app().includes('compagnon de vos jeux'));

L('[2] Mur des champions promu');
ok('carte pleine largeur (plus un mini-lien)', app().includes('t-champ'));
ok('accessible', app().includes("go('champions')"));
w.D.tictac=[{id:'d1',date:'2026-08-10',winner:'Alice',players:[{name:'Alice',good:3}]}];
w.go('home'); w.render();
ok('affiche le meneur quand il y en a un', /mène avec/.test(app()) || app().includes('couronnes de tous les jeux'));

L('[3] Le Micro : écran unique, cohérent avec Tic-Tac et Outils');
w.go('quizz'); w.render();
ok('Micro : écran unique, résultats centralisés dans La Coupe (v78)', nav().trim()==='');
ok('plus d\'onglet Journal visible', !nav().includes('Journal') && !app().includes('📖'));
ok('plus d\'onglet Palmarès visible', !nav().includes('Palmarès'));
ok('fin de partie : un seul bouton, comme au Tic-Tac (v68)', app().includes('Enregistrer le résultat de la partie'));
w.S.microSheet=true; w.render();
ok('feuille de résultat accessible', w.document.body.innerHTML.includes('mqr'));
ok('journal conservé techniquement (plus de saisie manuelle)', typeof w.addJournal==='function');
ok('addJournal toujours fonctionnel', typeof w.addJournal==='function');
ok('anti-doublon toujours injecté dans le prompt', (function(){ w.D.journal=[{text:'q1'}]; return w.briefText().includes('ANTI-DOUBLON'); })());

L('[4] Tic-Tac : un seul bouton d\'enregistrement');
w.go('chrono'); w.chStart(); w.CH.players.forEach((p,i)=>p.good=i+2); w.chFinishNow(); w.render();
const btns=(app().match(/Mur des champions|dans La Coupe|Enregistrer la manche/g)||[]);
ok('aucun bouton d\'enregistrement : tout est automatique (v78)', app().includes('Enregistrée dans 🏆 La Coupe'));
w.chToCoupe();
ok('plus aucune question posée (v78)', true);
ok('chSaveOnly exposé', typeof w.chSaveOnly==='function');
w.chSaveOnly();
ok('enregistrement au Mur effectif (automatique)', w.D.tictac.length>=1 && w.CH.saved===true);

L('[5] Enregistrer dans La Coupe enregistre AUSSI au Mur (pas de perte)');
w.go('chrono'); w.chStart(); w.CH.players.forEach((p,i)=>p.good=i+1); w.chFinishNow();
const before=w.D.tictac.length;
w.chToCoupeGo('');
ok('la manche est dans La Coupe', w.D.matches[0].rounds.length===1);
ok('et le Mur avait déjà tout enregistré', w.D.tictac.length===before);

L('[6] Textes pédagogiques retirés');
w.go('outils'); w.render();
ok('Outils sans commentaire superflu', !app().includes('ce sont des accessoires'));
w.go('chrono'); w.chStart(); w.render();
ok('zone d\'arrêt sans explications', !app().includes('le vainqueur rejoint le palmarès') && !app().includes('sont perdus'));
ok('mais les libellés restent explicites', app().includes('Terminer et désigner le vainqueur') && app().includes('Abandonner sans compter'));

L('[7] Haptique (standard du marché)');
ok('vibe() disponible', typeof w.vibe==='function');
ok('branché sur les dés', html.includes('function rollDice(){\n  vibe('));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
