import { JSDOM } from 'jsdom';
import fs from 'fs';
const html = fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let FAIL=0;
const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)FAIL++;};

const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://pat37100.github.io/jeux/',
  beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined;
    w.AudioContext=undefined; w.webkitAudioContext=undefined;   // pas de son en test
    w.navigator.vibrate=undefined;
  }});
const w=dom.window;

L('[1] Config par défaut');
w.go('chrono');
ok('écran config affiché (3 joueurs, 60 s)', w.chSettings().players.length===3 && w.chSettings().secs===60);
w.chSetSecs(30); w.chAddP();
ok('réglages modifiables (30 s, 4 joueurs)', w.chSettings().secs===30 && w.chSettings().players.length===4);
w.chDelP(3);

L('[2] Démarrage d\'une manche');
w.chStart();
ok('manche démarrée, joueur actif = 0', w.CH && w.CH.active===0 && w.CH.players[0].left===30);
ok('tous en pause au départ', w.CH.running===false);

L('[3] Bonne réponse : garde la main');
const before=w.CH.active; (w.CH&&(w.CH.startedOnce=true),w.chGood()); // lance le run
ok('après "Bon", le joueur garde la main', w.CH.active===before);
ok('timer en cours après "Bon"', w.CH.running===true);
w.chPause();

L('[4] Mauvaise réponse : passe au suivant');
w.chWrong();
ok('après "Faux", joueur actif = suivant (1)', w.CH.active===1);
w.chPause();

L('[5] Décompte réel du temps (simulation 32 × 100ms)');
// on force le temps du joueur actif proche de 0 et on laisse tourner
w.CH.players[w.CH.active].left = 0.25;
(w.CH&&(w.CH.startedOnce=true),w.chRun());
await new Promise(r=>setTimeout(r,600)); // laisse l'intervalle s'exécuter
ok('joueur éliminé quand le temps atteint 0', w.CH.players[1].out===true);
ok('on est passé à un joueur encore en course', w.CH.players[w.CH.active].out===false);

L('[6] Fin de manche : dernier debout = vainqueur');
// éliminer tout le monde sauf le joueur 2 (index 2)
w.CH.players[0].out=true; w.CH.players[w.CH.active===2?0:2]; 
w.CH.players.forEach((p,i)=>{ if(i!==2) p.out=true; });
w.chAdvance(true);
ok('vainqueur désigné = le dernier en course', w.CH.winner===w.CH.players[2].name);
const g=w.document.getElementById('app').innerHTML;
ok('écran vainqueur affiche le trophée + nom', g.includes('🏆') && g.includes(w.CH.players[2].name));

L('[7] Rejouer réinitialise les temps');
w.chStart();
ok('après "Rejouer", plus de vainqueur et temps pleins', w.CH.winner===null && w.CH.players[0].left===30 && w.CH.players[0].out===false);

L(FAIL===0?'\nTOUT PASSE ('+FAIL+' échec)':'\n*** '+FAIL+' ECHEC(S) ***');
process.exit(0);
