import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined;}});
const w=dom.window;

L('[1] Le prompt intégral est bien le tien');
const b=w.briefText();
for(const k of ['Qui joue ?','RÈGLES NON NÉGOCIABLES','RÉPONSE OFFICIELLE','Triton','Tour Défi','QUESTION AVEC VOL','QUITTE OU DOUBLE','mort subite','PRINCIPE DIRECTEUR','LANCEMENT'])
  ok('contient « '+k+' »', b.includes(k));
ok('contient le coup d\'envoi + l\'équipe', b.includes('On fait un quiz') && b.includes('Ne demande pas qui joue'));

L('[2] Le journal s\'ajoute au prompt sans l\'écraser');
w.D.journal=[{id:'a',text:'astronomie — satellite Triton',fp:'x',date:'2026-01-01'}];
const b2=w.briefText();
ok('prompt complet TOUJOURS présent avec journal', b2.includes('RÈGLES NON NÉGOCIABLES') && b2.includes('JOURNAL ANTI-DOUBLON') && b2.includes('satellite Triton'));

L('[3] L\'écran ne DÉVOILE pas le prompt');
w.go('quizz'); w.S.qtab='play'; w.render();
const screen=w.document.getElementById('app').innerHTML;
ok('l\'écran n\'affiche PAS le texte du prompt', !screen.includes('RÈGLES NON NÉGOCIABLES') && !screen.includes('PRINCIPE DIRECTEUR'));
ok('l\'écran propose le lancement en un geste + copie seule', screen.includes('Générer et lancer') && screen.includes('Copier'));

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ECHEC(S) ***');
