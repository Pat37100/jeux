import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  KO   ')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  try{Object.defineProperty(w.navigator,'serviceWorker',{get:()=>({register:()=>Promise.resolve(),addEventListener(){},controller:null}),configurable:true});}catch(e){}
}});
const w=dom.window, doc=w.document; w.D.onboarded=1;
const app=()=>doc.getElementById('app').innerHTML;
(async()=>{

L('[PROMPT SANCTUARISÉ] — la contrainte absolue de Patrick');
const sections=['DÉMARRAGE','RÈGLES NON NÉGOCIABLES','BARÈME CLASSIQUE','RÉPONSE OFFICIELLE','FORMAT DES QUESTIONS','DIFFICULTÉ','VARIÉTÉ','ANTI-DOUBLON','QUALITÉ DES QUESTIONS','TOURS DÉFI','MÉCANIQUES SPÉCIALES','LOGIQUE','ORAL ET BRUIT','CORRECTION','SCORE','ARBITRAGE','RYTHME','STYLE','FIN DE PARTIE','PRINCIPE DIRECTEUR','LANCEMENT'];
const b0=w.briefText();
ok('les 21 sections intactes', sections.every(s=>b0.includes(s)));
ok('le prompt commence toujours pareil', b0.startsWith("Tu es l'animateur d'un quiz oral"));
ok('style Classique par défaut : AUCUN ajout de style', !b0.includes('STYLE D\'ANIMATION SOUHAITÉ'));

L('[STYLES D\'ANIMATEUR]');
w.go('quizz'); w.S.qtab='play'; w.render();
ok('4 styles proposés', app().includes('Grand show')&&app().includes('Prof sympa')&&app().includes('Taquin')&&app().includes('Classique'));
w.setMicroStyle('show');
const b1=w.briefText();
ok('style Grand show ajouté APRÈS le prompt', b1.includes('STYLE D\'ANIMATION SOUHAITÉ')&&b1.includes('grand show télévisé'));
ok('avec la mention « ne change aucune règle »', b1.includes('ne change aucune règle'));
ok('les 21 sections toujours intactes avec style', sections.every(s=>b1.includes(s)));
w.D.microCustom='thème années 90'; w.persist();
ok('consigne perso ajoutée', w.briefText().includes('thème années 90'));
w.setMicroStyle('classique'); w.D.microCustom=''; w.persist();
ok('retour Classique : plus aucun ajout', !w.briefText().includes('STYLE D\'ANIMATION'));
ok('carte « ce que l\'animateur gère »', app().includes('animateur gère pour vous'));

L('[OBJECTIF DE POINTS] — différents décomptes');
w.go('points'); w.openSheet();
ok('champ objectif dans la création', !!doc.getElementById('mt'));
doc.getElementById('mn').value='Tarot 500'; doc.getElementById('mt').value='50'; w.createMatch();
ok('objectif enregistré', w.cur().target===50);
const ids=w.cur().players.map(p=>p.id);
w.S.inputs={[ids[0]]:'30',[ids[1]]:'20'}; w.saveRound();
w.S.tab='rank'; w.render();
ok('progression vers l\'objectif affichée', app().includes('Objectif : <b>50')&&app().includes('en est à 30'));
w.S.tab='play'; w.render(); w.S.inputs={[ids[0]]:'25'}; w.saveRound();
ok('objectif atteint → bandeau + bouton couronner', app().includes('Objectif 50 atteint')&&app().includes('Terminer &amp; couronner'));
// partie libre : aucun bandeau
w.go('points'); w.openSheet(); doc.getElementById('mn').value='Libre'; w.createMatch();
const ids2=w.cur().players.map(p=>p.id); w.S.inputs={[ids2[0]]:'99'}; w.saveRound();
ok('partie sans objectif : aucun bandeau', !app().includes('Objectif'));

L('[NOMS VERBE-D\'ABORD]');
w.go('home');
ok('Il compte / Il chronomètre / Il anime', app().includes('Il compte.')&&app().includes('Il chronomètre.')&&app().includes('Il anime.'));
ok('exemples concrets (belote, tarot…)', app().includes('belote'));

L('[STRATÉGIE AVIS] — compteur de joie');
const j0=w.D.joy||0;
w.S.matchId=w.D.matches.filter(m=>m.status!=='done')[0].id; w.S.view='match'; w.finishMatch();
ok('couronnement compte un pic de joie', (w.D.joy||0)===j0+1);
w.D.tictac=[]; w.CH=null; w.go('chrono'); w.chStart(); w.CH.players[1].out=true; w.CH.players[2].out=true; w.chAdvance(true);
const j1=w.D.joy; w.chSaveDuel();
ok('duel enregistré compte un pic', w.D.joy===j1+1);

L('[ICÔNES] — nouveaux fichiers');
const fs2=await import('fs');
ok('icon-180 régénérée', fs2.statSync('/mnt/user-data/outputs/icon-180.png').size>3000);
ok('icon-512 régénérée', fs2.statSync('/mnt/user-data/outputs/icon-512.png').size>10000);
ok('icon-1024 régénérée', fs2.statSync('/mnt/user-data/outputs/icon-1024.png').size>8000);

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ÉCHEC(S) ***');
})();
