import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  BUG  ')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  try{Object.defineProperty(w.navigator,'serviceWorker',{get:()=>({register:()=>Promise.resolve(),addEventListener(){},controller:null}),configurable:true});}catch(e){}
}});
const w=dom.window, doc=w.document; w.D.onboarded=1;
const app=()=>doc.getElementById('app').innerHTML;
(async()=>{

L('[BUG 1] Tremblement (animation rejouée en boucle)');
w.CH=null; w.go('chrono'); w.chStart();
const cls1=doc.getElementById('app').className;
w.render(); w.render(); w.render();
ok('animation retirée aux re-rendus successifs (plus de tremblement)', !doc.getElementById('app').classList.contains('anim'));
w.go('home');
ok('animation rejouée au changement d\'écran', doc.getElementById('app').classList.contains('anim'));

L('[BUG 2] Tic-Tac : enregistrer une manche sans aller au bout');
w.CH=null; w.go('chrono'); w.chStart();
ok('bouton « Terminer la manche maintenant » présent', app().includes('Terminer la manche maintenant'));
w.chGood(); w.chPause();
w.chFinishNow();
ok('manche clôturée avec un vainqueur', w.CH.winner!==null);
ok('enregistrement du duel proposé (facultatif)', app().includes('Garder cette manche')||app().includes('Enregistrer cette manche'));
w.chSaveDuel();
ok('manche ENREGISTRÉE au palmarès', w.D.tictac.length===1);
ok('vainqueur = celui qui a le plus de bonnes réponses', w.D.tictac[0].winner===w.CH.players[0].name);

L('[BUG 3] Changer de joueur en touchant sa colonne');
w.CH=null; w.go('chrono'); w.chStart(); (w.CH&&(w.CH.startedOnce=true),w.chRun());
const wasRunning=w.CH.running;
w.chJump(2);
ok('la main passe au joueur touché', w.CH.active===2);
ok('le chrono continue de tourner (pas de pause forcée)', w.CH.running===wasRunning);
w.chPause();
// plus de 3 joueurs
w.CH=null; const s=w.chSettings(); s.players=['A','B','C','D','E','F']; w.persist();
w.go('chrono'); w.chStart();
ok('6 participants : 6 colonnes affichées', (app().match(/class="lane/g)||[]).length===6);
w.chJump(5);
ok('on peut donner la main au 6e', w.CH.active===5);

L('[DEMANDE 1] Vue grille (comme le PDF)');
w.CH=null; w.go('points'); w.openSheet(); doc.getElementById('mn').value='Grille'; w.createMatch();
const ids=w.cur().players.map(p=>p.id);
for(let i=0;i<4;i++){ const sc={}; ids.forEach((id,j)=>sc[id]=String(5+i+j)); w.S.inputs=sc; w.saveRound(); }
w.S.tab='hist'; w.render();
ok('bascule Liste / Grille disponible', app().includes('▦ Grille')&&app().includes('☰ Liste'));
w.S.histGrid=true; w.render();
ok('tableau affiché', app().includes('gtab'));
ok('noms à gauche (colonne figée)', app().includes('stick'));
ok('une colonne par manche (M1..M4)', app().includes('>M1<')&&app().includes('>M4<'));
ok('colonne Total avec cumul', app().includes('class="tot"'));
ok('manches gagnées marquées', app().includes('class="win"'));
w.S.histGrid=false; w.render();
ok('retour à la liste', app().includes('class="hist"'));

L('[DEMANDE 2] Confirmation suppression alignée');
w.S.tab='hist'; w.S.histMode='list'; w.S.confirm=w.cur().rounds[0].id; w.render();
ok('confirmation sur 2 lignes (ne déborde plus)', app().includes('Supprimer cette manche ?</p>'));
ok('boutons pleine largeur', app().includes('class="sm r" style="flex:1"'));

L('[DEMANDE 3] Wording corrigé');
w.S.confirm=null; w.go('home');
ok('plus de référence au « nul »', !app().toLowerCase().includes('nul'));
ok('plus de « pas les écrans » (incohérent sur mobile)', !app().includes('pas les écrans'));
ok('nouvelle accroche couronne', app().includes('décrocher la couronne'));

L('[DEMANDE 4] Photo : input compatible iOS');
w.go('save'); w.openAv(w.D.lib[0].id);
const sheet=doc.getElementById('avsh').innerHTML;
ok('input photo non masqué par display:none', !sheet.includes('style="display:none"'));
ok('input superposé au bouton (technique iOS)', sheet.includes('opacity:0'));
ok('label lié à l\'input (for=avf)', sheet.includes('for="avf"'));
ok('fonction avPhoto branchée', sheet.includes('avPhoto(this)'));
w.closeAv();
w.go('save');
ok('mention photo visible dans Réglages', app().includes('photo'));

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ÉCHEC(S) ***');
})();
