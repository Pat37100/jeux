// AUDIT UTILISATEUR À REGARD NEUF — je découvre l'app, écran par écran
import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  try{Object.defineProperty(w.navigator,'serviceWorker',{get:()=>({register:()=>Promise.resolve(),addEventListener(){},controller:null}),configurable:true});}catch(e){}
  w.print=()=>{};
}});
const w=dom.window, doc=w.document;
const strip=s=>s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const L=console.log;
// ─── PREMIÈRE FOIS : onboarding
L('══ DÉCOUVERTE (1ʳᵉ ouverture) ══');
w.D.onboarded=0; w.persist(); w.go('home');
await new Promise(r=>setTimeout(r,150));
const ob=doc.getElementById('obsh');
L('  onboarding auto : '+(ob?'OUI':'NON — BUG'));
if(ob) L('  promesse : « '+strip(ob.innerHTML).slice(0,120)+'… »');
if(ob){ doc.getElementById('obn').value='Léa'; w.obAdd(); doc.getElementById('obn').value='Les Rouges'; w.obAdd(); w.obDone(); }
// ─── ACCUEIL
L('\n══ ACCUEIL ══');
w.go('home');
const home=strip(doc.getElementById('app').innerHTML);
L('  pitch : '+home.slice(0,230));
L('  hiérarchie : Coupe→Tic-Tac→Micro→pépite→Mur→Qui commence→Buzzer : '+
  (home.indexOf('Il compte')<home.indexOf('Il chronomètre')&&home.indexOf('Il anime')<home.indexOf('Mur des champions')&&home.includes('Le Buzzer')?'OK':'À REVOIR'));
// ─── PARCOURS COUPE COMPLET (utilisateur réel)
L('\n══ LA COUPE (partie réelle de 4 manches, objectif 30) ══');
w.go('points'); w.openSheet();
doc.getElementById('mn').value='Uno du soir'; doc.getElementById('mt').value='30'; w.createMatch();
const ids=w.cur().players.map(p=>p.id);
[[5,8],[12,3],[7,9],[10,4]].forEach(([a,b])=>{ w.S.inputs={[ids[0]]:String(a),[ids[1]]:String(b)}; w.saveRound(); });
w.S.tab='rank'; w.render();
const rk=strip(doc.getElementById('app').innerHTML);
L('  objectif détecté : '+(rk.includes('Objectif 30 atteint')?'OUI — bandeau + couronner':'NON'));
L('  je comprends qui gagne en 1 regard : '+(rk.includes('Meilleur cumul')&&doc.getElementById('app').innerHTML.includes('rbar')?'OUI (champions + barres)':'à revoir'));
w.S.tab='hist'; w.S.histMode='graph'; w.render();
L('  la Courbe raconte la partie : '+(doc.getElementById('app').innerHTML.includes('course aux points')?'OUI':'NON'));
w.finishMatch();
L('  cérémonie : '+(strip(doc.getElementById('app').innerHTML).includes('Champion de la partie')?'OUI — couronne+confettis+fanfare':'NON'));
// ─── TIC-TAC (duel réel)
L('\n══ TIC-TAC (duel réel) ══');
w.CH=null; w.go('chrono');
const cfg=strip(doc.getElementById('app').innerHTML);
L('  config claire (temps, joueurs/équipes, handicap, son) : '+(cfg.includes('Temps par défaut')&&cfg.includes('équipe')?'OUI':'à revoir'));
w.chStart(); w.chRun();
L('  3-2-1 au lancement : '+(doc.getElementById('cnt321')?'OUI':'NON'));
await new Promise(r=>setTimeout(r,2700));
const arena=doc.getElementById('app').innerHTML;
L('  arène : colonnes='+(arena.match(/class="lane/g)||[]).length+', live='+arena.includes('lane live')+', consigne bouton='+arena.includes('garde la main'));
w.chPause(); w.chFinishNow();
L('  fin à tout moment : '+(w.CH.winner?'OUI — vainqueur '+w.CH.winner:'NON'));
// ─── MICRO
L('\n══ LE MICRO ══');
w.go('quizz');
const mi=strip(doc.getElementById('app').innerHTML);
L('  1 bouton pour tout lancer : '+(mi.includes('Lancer la partie')?'OUI':'NON'));
L('  équipe visible, styles visibles : '+(mi.includes('Qui joue')&&mi.includes('Grand show')?'OUI':'NON'));
L('  ce que gère l\'animateur expliqué : '+(mi.includes('animateur gère pour vous')?'OUI':'NON'));
// ─── TRANSVERSE
L('\n══ TRANSVERSE ══');
w.go('champions');
L('  Mur des champions : '+(strip(doc.getElementById('app').innerHTML).slice(0,90)));
w.go('save');
const sv=strip(doc.getElementById('app').innerHTML);
L('  Réglages : joueurs/équipes + photo + sons + sauvegarde + avis : '+
  (sv.includes('photo')&&sv.includes('Effets sonores')&&sv.includes('sauvegarde')&&sv.includes('avis')?'TOUT Y EST':'MANQUE'));
L('\n(fin du parcours utilisateur)');
