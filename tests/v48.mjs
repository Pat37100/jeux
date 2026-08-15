import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
const w=dom.window; w.D.onboarded=1;
const app=()=>w.document.getElementById('app').innerHTML;
const ids=w.D.lib.slice(0,2).map(p=>p.id);
const sc=(a,b)=>({[ids[0]]:a,[ids[1]]:b});
// rounds: plus récent en premier. J1 gagne les 3 dernières, J2 avait gagné avant.
w.D.matches.unshift({id:'m1',name:'T',date:'2026-08-15',status:'live',winRule:'high',target:null,
  players:w.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),
  rounds:[{id:'r4',date:'2026-08-15',scores:sc(9,1)},{id:'r3',date:'2026-08-14',scores:sc(8,2)},
          {id:'r2',date:'2026-08-13',scores:sc(7,3)},{id:'r1',date:'2026-08-12',scores:sc(1,9)}]});
w.openMatch('m1'); w.S.period='all'; w.setResMode('rank'); w.render();

L('[1] Calcul des séries (données existantes, zéro saisie)');
ok('curStreak exposé', typeof w.curStreak==='function');
ok('J1 : série de 3', w.curStreak(w.cur(),ids[0])===3);
ok('J2 : série de 0 (interrompue)', w.curStreak(w.cur(),ids[1])===0);
ok('badge 🔥 affiché pour J1', app().includes("3 d'affilée"));
ok('pas de badge pour J2 (série <2)', (app().match(/d'affilée/g)||[]).length===1);

L('[2] Cas limites');
const m=w.cur();
m.rounds.unshift({id:'r5',date:'2026-08-15',scores:{[ids[1]]:5}}); // manche où J1 absent, J2 gagne seul
ok('absence à une manche casse la série', w.curStreak(m,ids[0])===0);
ok('J2 repart à 1', w.curStreak(m,ids[1])===1);
m.rounds.shift();

L('[3] Célébration à la saisie');
ok('toast branché sur les séries ≥3', html.includes("victoires d\\'affilée !"));

L('[4] Signature de partage');
let shared='';
w.navigator.share=(o)=>{shared=o.text;return Promise.resolve();};
w.share();
ok('résultats partagés avec le lien', shared.includes('pat37100.github.io/jeux'));
ok('signature discrète en fin de texte', shared.trim().endsWith('jeux'));
shared=''; w.champShare();
ok('Mur des champions signé aussi', shared.includes('En Jeux') && shared.includes('pat37100.github.io/jeux'));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
