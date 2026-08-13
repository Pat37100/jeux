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

L('[C] Durée individuelle par joueur (handicap)');
w.CH=null; w.go('chrono'); w.S.chTab='play'; w.render();
ok('champ de durée par joueur présent', app().includes('chSetPlayerSecs'));
const s=w.chSettings(); s.players=['Papa','Enfant']; s.secs=60; w.persist();
w.chSetPlayerSecs(0,'90'); // Papa a plus dur : en fait moins de temps = handicap. ici 90s
w.chSetPlayerSecs(1,'');   // enfant garde le défaut
ok('durée custom enregistrée pour le joueur 0', w.chSettings().custom[0]===90);
ok('joueur 1 sans custom (défaut)', !w.chSettings().custom[1]);
w.chStart();
ok('joueur 0 démarre à sa durée custom (90s)', w.CH.players[0].left===90 && w.CH.players[0].start===90);
ok('joueur 1 démarre au défaut (60s)', w.CH.players[1].left===60);
// barre de remplissage juste (chacun sur sa base)
w.CH.players[0].left=45; w.render();
ok('barre calculée sur la base du joueur', app().includes('fillbar'));

L('[A] Enregistrement allégé et découplé');
w.go('quizz'); w.S.qtab='play'; w.render();
ok('fin de partie Micro : plus de gros bloc « 2 réflexes »', !app().includes('2 réflexes'));
ok('renvoi discret vers Palmarès et Journal', app().includes('onglet')&&app().includes('Palmarès'));
w.S.qtab='pal'; w.render();
ok('Palmarès Micro : bouton d\'enregistrement présent', app().includes('Enregistrer un résultat')||app().includes('Enregistrer le classement'));
// Tic-Tac : bouton discret en fin
w.CH=null; w.go('chrono'); w.chStart(); w.CH.players[1].out=true; w.chAdvance(true);
ok('fin duel : enregistrement en bouton secondaire (facultatif)', app().includes('facultatif'));
ok('enregistrement toujours fonctionnel', (()=>{const n=w.D.tictac.length;w.chSaveDuel();return w.D.tictac.length===n+1;})());

L('[B] Photo robuste');
ok('avPhoto gère type non-image', w.avPhoto.toString().includes('pas une image'));
ok('fallback PNG si JPEG échoue', w.avPhoto.toString().includes("toDataURL('image/png')"));
ok('messages d\'erreur par étape', w.avPhoto.toString().includes('illisible')&&w.avPhoto.toString().includes('Lecture'));

L('[D] Waouh visuel + accroche');
w.go('home');
ok('hero : halo lumineux (::before)', html.includes('.hero::before'));
ok('dé animé (diceFloat)', html.includes('diceFloat'));
ok('respect animations réduites', html.includes('prefers-reduced-motion') && html.includes('diceFloat'));
ok('accroche « en famille ou entre amis »', app().includes('entre amis'));
ok('provoc couronne conservée', app().includes('décrocher la couronne'));
ok('toujours aucune allégation « le seul »', !app().toLowerCase().includes('le seul'));

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ÉCHEC(S) ***');
})();
