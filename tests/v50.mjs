import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
const w=dom.window; w.D.onboarded=1;
const ids=w.D.lib.map(p=>p.id);
w.D.matches.unshift({id:'m1',name:'Uno',date:'2026-08-15',status:'live',winRule:'high',target:null,
  players:w.D.lib.map(p=>({id:p.id,name:p.name})),rounds:[]});
w.openMatch('m1'); w.S.tab='play'; w.render();
const app=()=>w.document.getElementById('app').innerHTML;
const nb=()=>w.document.querySelectorAll('#app button').length;

L('[1] Densité réduite');
L('        (boutons sur l\'écran de saisie : '+nb()+' pour '+w.D.lib.length+' joueurs)');
ok('plus de carte « Date de la manche »', !app().includes('Date de la manche'));
ok('plus de ligne « Pas des boutons »', !app().includes('Pas des boutons'));
ok('date repliée en une puce', app().includes("Aujourd'hui"));

L('[2] Rien n\'est perdu : la vitesse de saisie');
ok('boutons − et + toujours là', app().includes('bump(') );
ok('pas ±1 ±5 ±10 conservé', app().includes('±1')&&app().includes('±5')&&app().includes('±10'));
ok('un champ par joueur', w.document.querySelectorAll('#app input[inputmode="decimal"]').length===w.D.lib.length);
w.bump(ids[0],5);
ok('bump fonctionne', parseFloat(w.S.inputs[ids[0]])===5);
w.S.step=10; w.render(); ok('changement de pas actif', app().includes('±10'));

L('[3] La date reste accessible');
w.S.dateOpen=true; w.render();
ok('champ date dépliable', w.document.querySelectorAll('#app input[type="date"]').length===1);
w.S.dateOpen=false; w.S.date='2026-07-04'; w.render();
ok('date non-courante affichée en clair', !app().includes("Aujourd'hui"));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
