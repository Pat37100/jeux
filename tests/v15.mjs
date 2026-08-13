import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined;}});
const w=dom.window, doc=w.document;
const app=()=>doc.getElementById('app').innerHTML;

L('[FIX 1] Micro : rituel de fin de partie complet');
w.go('quizz');
ok('fin de partie Micro allégée (renvoi discret vers Palmarès/Journal)', app().includes('Palmarès')&&app().includes('Journal'));
ok('enregistrement déplacé dans l\'onglet Palmarès', (function(){w.S.qtab='pal';w.render();return app().includes('microOpen()');})());
w.S.qtab='j'; w.render(); ok('onglet Journal : saisie des questions présente', app().includes('Ajouter les questions')&&app().includes('addJournal'));

L('[FIX 2] Historique paginé');
w.go('points'); w.openSheet(); doc.getElementById('mn').value='Marathon'; w.createMatch();
const ids=w.cur().players.map(p=>p.id);
for(let i=0;i<30;i++){ const s={}; ids.forEach((id,j)=>s[id]=String(5+((i+j)%20))); w.S.inputs=s; w.saveRound(); }
w.S.tab='hist'; w.S.histMode='list'; w.render();
ok('30 manches : affichage tronqué à 20', (app().match(/class="hist"/g)||[]).length===20);
ok('bouton « Afficher les 30 manches »', app().includes('Afficher les 30 manches'));
ok('renvoi vers l\'export PDF', app().includes('Exporter en PDF'));
w.S.histAll=true; w.render();
ok('tout afficher fonctionne (30 visibles)', (app().match(/class="hist"/g)||[]).length===30);
w.go('home'); w.go('points'); w.S.matchId=w.D.matches[0].id; w.S.view='match'; w.S.tab='hist'; w.S.histMode='list'; w.render();
ok('histAll réinitialisé en quittant', (app().match(/class="hist"/g)||[]).length===20);
// petite partie : pas de pagination parasite
w.S.tab='play'; w.render();

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ECHEC(S) ***');
