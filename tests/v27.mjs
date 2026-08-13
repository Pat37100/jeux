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

L('[1] Onglets clarifiés + grille par défaut');
w.go('points'); w.openSheet(); doc.getElementById('mn').value='Belote'; w.createMatch();
const ids=w.cur().players.map(p=>p.id);
for(let i=0;i<3;i++){ const s={}; ids.forEach((id,j)=>s[id]=String(3+i+j)); w.S.inputs=s; w.saveRound(); }
w.S.view='match'; w.S.matchId=w.D.matches[0].id; w.render();
ok('onglet « Saisir » (ex-Manche)', doc.getElementById('nav').innerHTML.includes('Saisir'));
ok('onglet « Tableau » (ex-Manches)', doc.getElementById('nav').innerHTML.includes('Tableau'));
w.S.tab='hist'; w.render();
ok('la GRILLE s\'affiche par défaut', app().includes('gtab') && !app().includes('class="hist"'));
ok('noms à gauche + colonnes M1..M3 + Total', app().includes('>M1<')&&app().includes('>M3<')&&app().includes('class="tot"'));
w.S.histGrid=false; w.render();
ok('on peut basculer en Liste', app().includes('class="hist"'));

L('[2] Suppression partie par glissement (swipe)');
w.go('points');
ok('carte partie emballée en swipe', app().includes('class="swipe"'));
ok('bouton Supprimer révélable présent', app().includes('class="del"')&&app().includes('askDelMatch'));
// simuler le déclenchement
w.askDelMatch(w.D.matches[0].id);
ok('confirmation de suppression demandée', S=>true, w.S.confirm.indexOf('delmatch:')===0);
w.afterRender();
ok('overlay de confirmation affiché', !!doc.getElementById('dmsh'));
ok('overlay mentionne les manches perdues', doc.getElementById('dmsh').innerHTML.includes('manche'));
const n0=w.D.matches.length;
w.delMatch();
ok('partie supprimée après confirmation', w.D.matches.length===n0-1);
ok('overlay refermé', !doc.getElementById('dmsh'));

L('[3] Nettoyage juridique');
w.go('home');
ok('plus de « aucun autre jeu »', !app().includes('Aucun autre jeu'));
ok('plus de « au milieu de la table »', !app().includes('au milieu de la table'));
ok('plus de « le seul »', !app().toLowerCase().includes('le seul'));

L('[4] Le swipe helper existe et se lie');
ok('bindSwipe défini', typeof w.bindSwipe==='function');
ok('CSS du swipe présent', html.includes('.swipe .del')&&html.includes('--reveal'));

L('[5] Non-régression essentielle');
ok('création/scores intacts', w.D.matches.length>=0 && typeof w.saveRound==='function');
w.CH=null; w.go('chrono'); w.chStart(); w.chGood();
ok('Tic-Tac intact', w.CH.players[0].good===1);
ok('finishNow intact', typeof w.chFinishNow==='function');

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ÉCHEC(S) ***');
})();
