import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
const w=dom.window; w.D.onboarded=1;
const ids=w.D.lib.slice(0,3).map(p=>p.id);
const sc=(a,b,c)=>({[ids[0]]:a,[ids[1]]:b,[ids[2]]:c});
// 2 manches en 2026 (période courante) + 2 manches en 2024 (hors filtre "cette année")
w.D.matches.unshift({id:'m1',name:'Test',date:'2026-08-14',status:'live',winRule:'high',target:50,
  players:w.D.lib.slice(0,3).map(p=>({id:p.id,name:p.name})),
  rounds:[{id:'r4',date:'2026-08-14',scores:sc(5,3,1)},{id:'r3',date:'2026-08-13',scores:sc(4,6,2)},
          {id:'r2',date:'2024-05-10',scores:sc(100,1,1)},{id:'r1',date:'2024-05-09',scores:sc(100,1,1)}]});
w.openMatch('m1'); w.render();
const app=()=>w.document.getElementById('app').innerHTML;

L('[1] Filtre de période affiché sur les 4 modes (incohérence corrigée)');
for(const m of ['rank','grid','graph','list']){ w.setResMode(m); ok('période visible en '+m, app().includes('Ce mois')&&app().includes('Cette année')); }

L('[2] La période s\'APPLIQUE vraiment dans chaque mode');
w.S.period='year'; // 2026 -> exclut les 2 manches 2024 (100 pts)
for(const m of ['rank','grid','list']){ w.setResMode(m); w.render();
  ok(m+' : les manches 2024 (100 pts) sont exclues', !/>100</.test(app())); }
w.S.period='all'; w.setResMode('grid'); w.render();
ok('grid : en "Tout", les 100 pts réapparaissent', />100</.test(app()));

L('[3] Décompte de manches cohérent avec le filtre');
w.S.period='year'; w.setResMode('grid'); w.render();
ok('affiche 2 manches sur la période', app().includes('2 manches'));
w.S.period='all'; w.render();
ok('affiche 4 manches en "Tout"', app().includes('4 manches'));

L('[4] Courbe masquée quand elle n\'apprend rien (<3 manches)');
const few={id:'m2',name:'Court',date:'2026-08-14',status:'live',winRule:'high',target:20,
  players:w.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),
  rounds:[{id:'x1',date:'2026-08-14',scores:{[ids[0]]:3,[ids[1]]:2}}]};
w.D.matches.unshift(few); w.openMatch('m2'); w.S.period='all'; w.render();
ok('1 manche → pas de chip Courbe', !app().includes('Courbe'));
ok('1 manche → Grille et Liste restent', app().includes('Grille')&&app().includes('Liste'));
w.openMatch('m1'); w.S.period='all'; w.render();
ok('4 manches → chip Courbe présente', app().includes('Courbe'));

L('[5] Accueil allégé');
w.go('home'); w.render();
ok('plus de gros paragraphe explicatif', !app().includes("s'occupe du reste :"));
ok('accroche courte conservée', app().includes('Vos jeux existent déjà'));

L('[6] Tic-Tac : renvoi parasite retiré');
w.D.tictac=[{id:'d1',date:'2026-08-01',winner:'X',players:[]}];
w.go('chrono'); w.render();
ok('plus de « duel au Mur des champions » sur la config', !app().includes('au Mur des champions'));

L('[7] Micro : styles enrichis ET injectés dans le prompt');
ok('9 styles disponibles', w.MICRO_STYLES.length===9);
for(const s of ['famille','express','costaud','voiture','apero']) ok('style « '+s+' » présent', w.MICRO_STYLES.some(x=>x.id===s));
w.setMicroStyle('voiture');
const t=w.briefText();
ok('le style choisi est bien injecté dans le prompt', t.includes("STYLE D'ANIMATION SOUHAITÉ") && t.includes('voiture ou en déplacement'));
ok('le prompt de base reste intact', t.includes('ANTI-DOUBLON ABSOLU') && t.includes('TOURS DÉFI'));
w.D.microCustom='années 90'; ok('touche perso cumulable avec le style', w.briefText().includes('CONSIGNE PERSONNELLE') && w.briefText().includes("STYLE D'ANIMATION"));
w.setMicroStyle('classique');
ok('style Classique = aucune surcouche', !w.briefText().includes("STYLE D'ANIMATION SOUHAITÉ"));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
