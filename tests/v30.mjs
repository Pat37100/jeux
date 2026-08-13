import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  KO   ')+' — '+l); if(!c)F++;};
const store=new Map(); let tones=[];
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  try{Object.defineProperty(w.navigator,'serviceWorker',{get:()=>({register:()=>Promise.resolve(),addEventListener(){},controller:null}),configurable:true});}catch(e){}
}});
const w=dom.window, doc=w.document; w.D.onboarded=1;
const app=()=>doc.getElementById('app').innerHTML;
const origTone=w.tone; w.tone=(f,d,v)=>{tones.push(f);};
(async()=>{

L('[SAISIE] Cumul visible + pas ±1/±5/±10');
w.go('points'); w.openSheet(); doc.getElementById('mn').value='Tarot'; w.createMatch();
const ids=w.cur().players.map(p=>p.id);
w.S.inputs={[ids[0]]:'25',[ids[1]]:'10'}; w.saveRound();
w.S.tab='play'; w.render();
ok('total et manches sous chaque joueur', app().includes('total 25')&&app().includes('1 manche'));
ok('sélecteur de pas ±1 ±5 ±10', app().includes('±1')&&app().includes('±5')&&app().includes('±10'));
w.S.step=10; w.render();
ok('boutons affichent le pas (−10/+10)', app().includes('>−10<')&&app().includes('>+10<'));
w.bump(ids[0],10); w.bump(ids[0],10);
ok('deux taps +10 = 20', w.S.inputs[ids[0]]==='20');
w.S.step=1; w.S.inputs={};

L('[CLASSEMENT] Barre d\'écart vs leader');
w.S.tab='rank'; w.render();
ok('barres de progression présentes', app().includes('class="rbar"'));
ok('leader à 100 %', app().includes('width:100%'));
// règle "moins gagne" : barre inversée sans crash
w.cur().winRule='low'; w.render();
ok('règle « moins gagne » : barres calculées sans crash', app().includes('class="rbar"'));
w.cur().winRule='high'; w.persist();

L('[ARÈNE] Compte à rebours 3-2-1-GO');
w.CH=null; w.go('chrono'); w.chStart();
w.CH.sound=true; tones=[];
w.chRun();
ok('overlay 3-2-1 affiché', !!doc.getElementById('cnt321'));
ok('chrono PAS encore lancé pendant le décompte', w.CH.running===false);
await new Promise(r=>setTimeout(r,2600));
ok('après le décompte : GO a sonné (1180 Hz)', tones.includes(1180));
ok('overlay retiré', !doc.getElementById('cnt321'));
ok('chrono lancé après GO', w.CH.running===true);
w.chPause();
tones=[]; w.chRun();
ok('reprise : pas de nouveau décompte', !doc.getElementById('cnt321') && w.CH.running===true);
w.chPause();

L('[OUTILS] Le Buzzer');
w.go('home');
ok('Buzzer sur l\'accueil', app().includes('Le Buzzer'));
w.openBuzzer();
ok('feuille buzzer ouverte', !!doc.getElementById('bzsh'));
tones=[]; w.buzz();
ok('le buzz sonne (grave 160 Hz)', tones.includes(160));
doc.getElementById('bzsh').remove();

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ÉCHEC(S) ***');
})();
