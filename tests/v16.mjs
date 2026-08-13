import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
function boot(seed){
  const store=new Map(); if(seed) store.set('jeux-famille-v1',JSON.stringify(seed));
  const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined;}});
  return dom.window;
}
(async()=>{
L('[1] Onboarding : nouvel utilisateur');
const w=boot(null);
await new Promise(r=>setTimeout(r,120));
ok('overlay de bienvenue affiché au premier lancement', !!w.document.getElementById('obsh'));
ok('3 étapes pédagogiques', w.document.getElementById('obsh').innerHTML.includes('1️⃣'));
// ajouter un joueur
w.document.getElementById('obn').value='Léa'; w.obAdd();
ok('joueur ajouté depuis l\'onboarding', w.D.lib.some(p=>p.name==='Léa'));
// doublon refusé
w.document.getElementById('obn').value='léa'; w.obAdd();
ok('doublon (insensible casse) refusé', w.D.lib.filter(p=>p.name.toLowerCase()==='léa').length===1);
// retirer un joueur
const rm=w.D.lib[0].id; w.obDel(rm);
ok('joueur retirable', !w.D.lib.some(p=>p.id===rm));
w.obDone();
ok('fermeture : flag onboarded persisté', w.D.onboarded===1 && !w.document.getElementById('obsh'));
w.go('save');
ok('« Revoir la présentation » dans Réglages', w.document.getElementById('app').innerHTML.includes('Revoir la présentation'));
w.obReplay();
ok('replay fonctionne', !!w.document.getElementById('obsh'));
w.obDone();

L('[2] Onboarding : utilisateur existant (Patrick) épargné');
const seed={v:1,lib:[{id:'a',name:'Patrick'}],matches:[{id:'m',name:'X',players:[{id:'a',name:'Patrick'}],rounds:[{id:'r',date:'2026-01-01',scores:{a:5}}],status:'live',winRule:'high'}],journal:[],micro:[],tictac:[]};
const w2=boot(seed);
await new Promise(r=>setTimeout(r,120));
ok('pas d\'overlay si données existantes', !w2.document.getElementById('obsh'));
ok('flag auto-migré', w2.D.onboarded===1);

L('[3] Badge de rivalité');
const w3=boot(null); await new Promise(r=>setTimeout(r,120)); w3.obDone&&w3.obDone();
w3.go('points'); w3.openSheet(); w3.document.getElementById('mn').value='T'; w3.createMatch();
const ids=w3.cur().players.map(p=>p.id);
w3.S.inputs={[ids[0]]:'10',[ids[1]]:'5'}; w3.saveRound();
w3.D.micro=[{id:'q',date:'2026-08-01',players:[{name:w3.D.lib[1].name,score:15},{name:w3.D.lib[0].name,score:9}]}]; w3.persist();
w3.go('champions');
const cw=w3.document.getElementById('app').innerHTML;
ok('badge rivalité affiché (écart ≤3)', cw.includes('à rien')||cw.includes('Égalité parfaite'));
ok('nom du poursuivant cité', cw.includes('💥')||cw.includes('⚡️'));

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ECHEC(S) ***');
})();
