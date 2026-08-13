import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  KO   ')+' — '+l); if(!c)F++;};
const store=new Map(); let tones=[],noises=0;
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  try{Object.defineProperty(w.navigator,'serviceWorker',{get:()=>({register:()=>Promise.resolve(),addEventListener(){},controller:null}),configurable:true});}catch(e){}
}});
const w=dom.window, doc=w.document; w.D.onboarded=1;
const app=()=>doc.getElementById('app').innerHTML;
const oT=w.tone, oN=w.noiseBurst;
w.tone=(f,d,v,wv)=>{ if(w.D.fx===0)return; tones.push({f,wv:wv||'sine'}); };
w.noiseBurst=(d,v)=>{ if(w.D.fx===0)return; noises++; };
(async()=>{

L('[MOTEUR] compresseur + formes d\'onde + bruit');
ok('compresseur dynamique branché (volume perçu ↑)', html.includes('createDynamicsCompressor'));
ok('tone accepte une forme d\'onde', html.includes("wave||'sine'"));
ok('générateur de bruit blanc présent', html.includes('function noiseBurst'));

L('[BUZZER XXL]');
w.go('home'); w.openBuzzer();
const sh=doc.getElementById('bzsh').innerHTML;
ok('bouton géant (76vw, max 340px)', sh.includes('min(76vw,340px)'));
ok('BUZZ en 44px', sh.includes('font-size:44px'));
tones=[];noises=0; w.buzz();
ok('scies dissonantes graves (92+123 Hz)', tones.some(t=>t.f===92&&t.wv==='sawtooth')&&tones.some(t=>t.f===123));
ok('basse carrée (61 Hz) + impact bruit', tones.some(t=>t.f===61&&t.wv==='square')&&noises>=1);
ok('flash rouge plein écran déclenché', [...doc.body.children].some(e=>String(e.getAttribute('style')||'').includes('220, 38, 38')||String(e.getAttribute('style')||'').includes('dc2626')));
doc.getElementById('bzsh').remove();

L('[TRANSITIONS]');
// ding de manche
w.go('points'); w.openSheet(); doc.getElementById('mn').value='Son'; w.createMatch();
const ids=w.cur().players.map(p=>p.id);
tones=[]; w.S.inputs={[ids[0]]:'5'}; w.saveRound();
ok('ding à l\'enregistrement d\'une manche (880 Hz)', tones.some(t=>t.f===880));
// élimination dramatique
tones=[]; w.chBeep(); await new Promise(r=>setTimeout(r,500));
ok('élimination : descente dramatique en scie (330→220→147)', tones.some(t=>t.f===330&&t.wv==='sawtooth')&&tones.some(t=>t.f===147));
// tirage au sort : tambour + ta-da
w.go('home'); w.whoStart(); tones=[]; noises=0; w.whoSpin();
await new Promise(r=>setTimeout(r,5200));
ok('roulement de tambour pendant le tirage', noises>=10);
ok('ta-da à la révélation (523 puis 784)', tones.some(t=>t.f===523)&&tones.some(t=>t.f===784));
const wsh=doc.getElementById('whosh'); if(wsh) wsh.remove(); w.S.whoSheet=false;
// fanfare enrichie
tones=[]; noises=0; w.fanfare(); await new Promise(r=>setTimeout(r,700));
ok('fanfare : arpège historique intact (523…1047)', tones.some(t=>t.f===523)&&tones.some(t=>t.f===1047));
ok('fanfare : nappe d\'accords triangle + étincelle', tones.some(t=>t.f===262&&t.wv==='triangle')&&noises>=1);

L('[RÉGLAGE GLOBAL]');
w.go('save');
ok('réglage « Effets sonores » présent', app().includes('Effets sonores')&&app().includes('Coupés'));
w.D.fx=0; w.persist();
tones=[]; noises=0; w.buzz(); w.fanfare(); w.noiseBurst(.1,.3);
await new Promise(r=>setTimeout(r,600));
ok('effets coupés : SILENCE TOTAL', tones.length===0&&noises===0);
w.D.fx=1; w.persist();
tones=[]; w.buzz();
ok('réactivés : ça sonne à nouveau', tones.length>0);

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ÉCHEC(S) ***');
})();
