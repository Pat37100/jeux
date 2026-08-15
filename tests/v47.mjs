import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
const w=dom.window; w.D.onboarded=1;
const app=()=>w.document.getElementById('app').innerHTML;

L('[1] Interrupteur son maître');
w.go('save'); w.render();
ok('réglage visible dans Réglages', app().includes('Tout couper'));
ok('sndOn exposé', typeof w.sndOn==='function');
ok('activé par défaut', w.sndOn()===true);
w.D.sound=false;
ok('coupé -> sndOn false', w.sndOn()===false);
let played=false;
const AC=function(){ played=true; return {createOscillator:()=>({connect(){},start(){},stop(){},frequency:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}}}),createGain:()=>({connect(){},gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}}}),destination:{},currentTime:0};};
w.AudioContext=AC; w.webkitAudioContext=AC;
try{ w.hit(440,{}); }catch(e){}
try{ w.fanfare(); }catch(e){}
try{ w.speak('test'); }catch(e){}
ok('hit/fanfare/speak muets quand coupé', played===false);
w.D.sound=true;
ok('réactivable', w.sndOn()===true);

L('[2] Lisibilité : plancher de police');
ok('plus aucune taille sous 10px', !/font-size:[89](\.\d+)?px/.test(html));

L('[3] iOS : dvh');
ok('100dvh avec repli 100vh', html.includes('min-height:100vh;min-height:100dvh'));

L('[4] Les réglages fins existants restent');
ok('son Tic-Tac (par manche) conservé', html.includes('chSound'));
ok('annonces vocales conservées', html.includes('setVoice'));
ok('kits de buzzer conservés', html.includes('BUZZ_KITS'));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
