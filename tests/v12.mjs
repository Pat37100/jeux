import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined;}});
const w=dom.window, doc=w.document;

L('[1] Palmarès : filtres Soirée / Championnat');
w.go('points'); w.openSheet(); doc.getElementById('mn').value='P'; w.createMatch();
const ids=w.cur().players.map(p=>p.id);
w.S.inputs={[ids[0]]:'10',[ids[1]]:'5'}; w.saveRound();
w.go('palmares'); w.PAL.year='d1'; w.render();
let ph=doc.getElementById('app').innerHTML;
ok('bouton « 🥂 Soirée » présent', ph.includes('Soirée'));
ok('bouton « 🏆 Championnat » présent', ph.includes('Championnat'));
ok('mode Soirée : sous-filtres masqués', !ph.includes('7 jours'));
w.PAL.year=String(new Date().getFullYear()); w.render();
ph=doc.getElementById('app').innerHTML;
ok('mode Championnat : sous-filtres visibles (7j/30j/saison)', ph.includes('7 jours')&&ph.includes('Saison'));

L('[2] Micro : enregistrer un résultat (parsing)');
w.go('quizz'); w.S.qtab='pal'; w.S.microSheet=true; w.render();
ok('feuille de saisie présente dans le DOM', !!doc.getElementById('mqd'));
doc.getElementById('mqd').value='2026-08-12';
doc.getElementById('mqr').value='Mattéo 15\nPatrick 12\nMélanie 9';
w.microSave();
ok('1 partie enregistrée', w.D.micro.length===1);
const g=w.D.micro[0];
ok('vainqueur = plus haut score, trié (Mattéo 15)', g.players[0].name==='Mattéo' && g.players[0].score===15);
ok('scores parsés correctement', g.players[1].score===12 && g.players[2].score===9);

L('[3] Micro : parsing tolérant (formats variés)');
w.S.microSheet=true; w.render();
doc.getElementById('mqr').value='1. Patrick : 15 pts\nMélanie - 8\nMattéo 20';
doc.getElementById('mqd').value='2026-08-13';
w.microSave();
const g2=w.D.micro[0];
ok('« Prénom : 15 pts » et « - 8 » parsés', g2.players[0].name==='Mattéo'&&g2.players[0].score===20 && g2.players.some(p=>p.name==='Patrick'&&p.score===15));

L('[4] Micro : agrégation du palmarès (Maître du Micro)');
// Mattéo a gagné les 2 parties -> 2 victoires
const agg=w.microAgg();
ok('Mattéo en tête avec 2 victoires', agg[0].name==='Mattéo' && agg[0].wins===2);
ok('record de points suivi', agg[0].best===20);
w.S.qtab='pal'; w.render();
const pal=doc.getElementById('app').innerHTML;
ok('écran affiche « Maître du Micro »', pal.includes('Maître du Micro'));
ok('historique des parties affiché', pal.includes('Historique des parties'));

L('[5] Suppression d\'un résultat');
const n0=w.D.micro.length; w.microDel(w.D.micro[0].id);
ok('résultat supprimé', w.D.micro.length===n0-1);

L('[6] Le prompt Micro reste intact et invisible');
ok('prompt intégral toujours embarqué', w.briefText().includes('RÈGLES NON NÉGOCIABLES'));
w.S.qtab='play'; w.render();
ok('écran Jouer ne divulgue pas le prompt', !doc.getElementById('app').innerHTML.includes('PRINCIPE DIRECTEUR'));

L('[7] Tic-Tac toujours éphémère (aucun historique)');
ok('pas de stockage de duels Tic-Tac', w.D.chrono===undefined || w.D.chrono===null || (typeof w.D.chrono==='object'&&!Array.isArray(w.D.chrono)));

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ECHEC(S) ***');
