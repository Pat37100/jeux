import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
const w=dom.window; w.D.onboarded=1;

// Créer une partie avec 2 joueurs et 3 manches
const ids=w.D.lib.slice(0,3).map(p=>p.id);
w.D.matches.unshift({id:'m1',name:'Test',date:'2026-08-14',status:'live',winRule:'high',target:20,
  players:w.D.lib.slice(0,3).map(p=>({id:p.id,name:p.name})),
  rounds:[{id:'r3',date:'2026-08-14',scores:{[ids[0]]:5,[ids[1]]:3,[ids[2]]:1}},
          {id:'r2',date:'2026-08-13',scores:{[ids[0]]:4,[ids[1]]:6,[ids[2]]:2}},
          {id:'r1',date:'2026-08-12',scores:{[ids[0]]:7,[ids[1]]:2,[ids[2]]:9}}]});
w.openMatch('m1'); w.render();

const nav=()=>w.document.getElementById('nav').innerHTML;
const app=()=>w.document.getElementById('app').innerHTML;

L('[1] Navigation fusionnée');
ok('onglet « Résultats » présent', nav().includes('Résultats'));
ok('ancien onglet « Tableau » supprimé', !nav().includes('Tableau'));
ok('onglets Saisir + Réglages conservés', nav().includes('Saisir') && nav().includes('Réglages'));

L('[2] Les 4 modes sont dans un seul sélecteur');
for(const m of ['Par joueur','Grille','Courbe','Liste']) ok('mode « '+m+' » proposé', app().includes(m));

L('[3] Chaque mode rend le bon contenu (rendus existants réutilisés)');
w.setResMode('rank');  ok('Par joueur → classement', app().includes('🏅 Classement'));
w.setResMode('grid');  ok('Grille → tableau de la partie', app().includes('Le tableau de la partie'));
w.setResMode('graph'); ok('Courbe → la course aux points', app().includes('La course aux points'));
w.setResMode('list');  ok('Liste → historique des manches', app().includes('hist'));

L('[4] Le sélecteur reste visible dans tous les modes');
for(const m of ['rank','grid','graph','list']){ w.setResMode(m); ok('sélecteur visible en '+m, app().includes('Par joueur')&&app().includes('Courbe')); }

L('[5] Anciens sauts inter-onglets supprimés');
w.setResMode('grid');
ok('plus de « Voir le détail joueur par joueur »', !app().includes('Voir le détail joueur par joueur'));
w.setResMode('rank');
ok('plus de « Voir le tableau de toutes les manches »', !app().includes('Voir le tableau de toutes les manches'));

L('[6] Le détail par joueur (dépliage) fonctionne toujours');
w.S.detail=ids[0]; w.render();
ok('dépliage joueur affiche son détail', app().includes('Détail de'));

L('[7] Saisie + filtres de période intacts');
w.S.tab='play'; w.render(); ok('écran Saisir OK', app().length>200);
w.S.tab='rank'; w.S.period='month'; w.render(); ok('filtre période OK', app().includes('Ce mois'));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
