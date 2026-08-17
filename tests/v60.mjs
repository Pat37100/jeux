import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
function boot(){const store=new Map();
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  d.window.D.onboarded=1; return d.window;}
const w=boot(); const app=()=>w.document.getElementById('app').innerHTML;
const ids=w.D.lib.slice(0,2).map(p=>p.id);

L('[1] Objectif atteint : la partie réagit enfin');
w.D.matches.unshift({id:'m1',name:'Uno',date:'2026-08-16',status:'live',winRule:'high',target:10,
  players:w.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),rounds:[]});
w.openMatch('m1'); w.S.tab='play';
w.S.inputs={[ids[0]]:'12',[ids[1]]:'4'}; w.saveRound();
w.S.tab='rank'; w.render();
ok('bannière 🎯 affichée (mode Grille par défaut)', app().includes('Objectif 10 atteint'));
ok('nomme qui y est', app().includes(w.D.lib[0].name) && app().includes('y est'));
ok('CTA Terminer la partie', app().includes('finishMatch()'));
ok('la partie peut continuer (choix laissé)', app().includes('ou continuer'));
w.S.tab='play'; w.render();
ok('visible aussi sur l\'écran de saisie', app().includes('Objectif 10 atteint'));
w.setResMode('graph'); w.S.tab='rank'; w.render();
ok('visible en mode Courbe', app().includes('Objectif 10 atteint'));
const w2=boot(); const jd=w2.D.lib.slice(0,2).map(p=>p.id);
w2.D.matches.unshift({id:'m2',name:'Golf',date:'2026-08-16',status:'live',winRule:'low',target:10,
  players:w2.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),rounds:[{id:'r',date:'2026-08-16',scores:{[jd[0]]:12,[jd[1]]:4}}]});
w2.openMatch('m2'); w2.S.tab='rank'; w2.render();
ok('pas de bannière en « moins de points » (objectif ambigu)', !w2.document.getElementById('app').innerHTML.includes('🎯 Objectif'));

L('[2] Création : 2 joueurs minimum');
const w3=boot(); w3.go('points'); w3.render(); w3.openSheet();
w3.document.querySelectorAll('#pk .chip.on').forEach((c,i)=>{ if(i>0) c.classList.remove('on'); });
const n0=w3.D.matches.length;
w3.createMatch();
ok('partie solo refusée', w3.D.matches.length===n0);
ok('message clair', html.includes('Il faut au moins 2 joueurs'));

L('[3] Tic-Tac : plafond de temps');
const w4=boot(); w4.go('chrono');
w4.chSetSecs(9999);
ok('9999 s plafonné à 1800', w4.chSettings().secs===1800);
w4.chSetSecs(0);
ok('0 s ramené à 60', w4.chSettings().secs===60);

L('[4] Micro : écran allégé, rien perdu');
const w5=boot(); w5.go('quizz'); w5.render();
const words=()=>w5.document.getElementById('app').innerHTML.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().split(' ').filter(Boolean).length;
const nb=()=>w5.document.querySelectorAll('#app button').length;
L('        replié : '+words()+' mots, '+nb()+' boutons (avant : 367 / 50)');
ok('cartes dépliées par défaut depuis la v61 (cohérence inter-rubriques)', words()>250);
ok('résumé du contexte affiché dans le titre', w5.document.getElementById('app').innerHTML.includes('Standard'));
ok('résumé des mécaniques affiché dans le titre', w5.document.getElementById('app').innerHTML.includes('8/8'));
w5.S.qc4=false; w5.S.qc5=false; w5.render();
ok('repliable à la demande', words()<300);
w5.S.qc4=undefined; w5.S.qc5=undefined; w5.render();
ok('les 3 contextes cliquables', ['express','costaud','voiture'].every(id=>w5.document.getElementById('app').innerHTML.includes("toggleMicroCtx('"+id+"')")));
ok('les 8 mécaniques cliquables', w5.MICRO_MECS.every(m=>w5.document.getElementById('app').innerHTML.includes("toggleMicroMec('"+m.id+"')")));
w5.toggleMicroCtx('voiture'); w5.S.qc4=false; w5.render();
ok('le choix survit au repli et s\'affiche', w5.document.getElementById('app').innerHTML.includes('En voiture'));
ok('et part bien dans le prompt', w5.briefText().includes('CONTEXTE=VOITURE_BRUIT'));

L('[5] Non-régression');
ok('7 étapes toujours là', (w5.document.getElementById('app').innerHTML.match(/class="stepn"/g)||[]).length===7);
const t=w5.briefText();
for(const k of ['MECANIQUES=','INVARIANTS','PERSONNE NE TROUVE','GRAINE_DE_PARTIE']) ok('prompt : '+k, t.includes(k));
w.openMatch('m1'); w.S.tab='rank'; w.render();
ok('classement toujours rendu sous la bannière', app().includes('Par joueur'));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
