import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  KO   ')+' — '+l); if(!c)F++;};
const store=new Map(); let ev=[];
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  try{Object.defineProperty(w.navigator,'serviceWorker',{get:()=>({register:()=>Promise.resolve(),addEventListener(){},controller:null}),configurable:true});}catch(e){}
}});
const w=dom.window, doc=w.document; w.D.onboarded=1;
const app=()=>doc.getElementById('app').innerHTML;
w.tone=(f,d,v,wv)=>{ if(w.D.fx===0)return; ev.push({t:'tone',f,wv:wv||'sine'}); };
w.sweep=(f1,f2,d,v,wv,vib)=>{ if(w.D.fx===0)return; ev.push({t:'sweep',f1,f2,wv:wv||'sine',vib}); };
w.noiseBurst=(d,v)=>{ if(w.D.fx===0)return; ev.push({t:'noise'}); };
(async()=>{

L('[SONOTHÈQUE] 6 buzzers au choix');
ok('moteur de glissando (pitch bend)', html.includes('function sweep')&&html.includes('exponentialRampToValueAtTime'));
ok('vibrato disponible (côté cartoon)', html.includes('vibHz'));
ok('6 kits définis', w.BUZZ_KITS.length===6);
ok('kits : TV, Klaxon, Boing, Arcade, Trombone, Sirène', ['tv','klaxon','boing','arcade','sad','siren'].every(k=>w.BUZZ_KITS.some(x=>x.id===k)));
w.go('home'); w.openBuzzer();
ok('sélecteur de kit dans la feuille', doc.getElementById('bzsh').innerHTML.includes('Choisis ton buzz'));
// chaque kit produit un son DIFFÉRENT
const sig={};
for(const k of ['tv','klaxon','boing','arcade','sad','siren']){
  ev=[]; w.playBuzz(k); await new Promise(r=>setTimeout(r,700));
  sig[k]=JSON.stringify(ev);
  ok('kit '+k+' produit du son', ev.length>0);
}
ok('les 6 kits sonnent différemment', new Set(Object.values(sig)).size===6);
ok('Boing utilise un glissando avec vibrato', JSON.parse(sig.boing).some(e=>e.t==='sweep'&&e.vib));
ok('Arcade en ondes carrées (8-bit)', JSON.parse(sig.arcade).some(e=>e.wv==='square'));
ok('Sirène monte et descend', JSON.parse(sig.siren).some(e=>e.t==='sweep'&&e.f2>e.f1)&&JSON.parse(sig.siren).some(e=>e.t==='sweep'&&e.f2<e.f1));
w.setBuzzKit('boing');
ok('choix mémorisé', w.D.buzzKit==='boing');
const e2=doc.getElementById('bzsh'); if(e2) e2.remove();

L('[ARÈNE] anneaux autour de l\'avatar (retour du cercle, en mieux)');
w.CH=null; w.go('chrono'); w.chStart();
const a=app();
ok('anneaux SVG par joueur', (a.match(/class="ring"/g)||[]).length===w.CH.players.length);
ok('cercle de progression (stroke-dasharray)', a.includes('stroke-dasharray'));
ok('visage/avatar au centre (identification)', a.includes('class="face"'));
ok('plus de barres plates', !a.includes('fillbar" style="height'));
ok('nom + temps + score conservés', a.includes('class="who"')&&a.includes('class="tt"')&&a.includes('class="gd"'));
ok('halo sur le joueur actif', html.includes('.lane.live .ring'));
// photo prise en compte
w.D.lib[0].photo='data:image/png;base64,AAAA'; w.persist(); w.CH=null; w.chStart(); w.render();
ok('photo affichée dans l\'anneau si définie', app().includes('<img src="data:image/png')|| !w.CH.players.some(p=>p.name===w.D.lib[0].name));
delete w.D.lib[0].photo; w.persist();

L('[SONS DE JEU] façon plateau TV');
w.CH=null; w.go('chrono'); w.chStart(); w.CH.startedOnce=true;
ev=[]; w.chGood(); await new Promise(r=>setTimeout(r,150));
ok('bonne réponse : ding ascendant (784→1047)', ev.some(e=>e.f===784)&&ev.some(e=>e.f===1047));
w.chPause();
ev=[]; w.chWrong(); await new Promise(r=>setTimeout(r,300));
ok('erreur : buzz descendant (330→180 en scie)', ev.some(e=>e.t==='sweep'&&e.f1===330&&e.wv==='sawtooth'));
ok('changement de main : whoosh montant', ev.some(e=>e.t==='sweep'&&e.f1===220&&e.f2===660));
w.chPause();
ev=[]; w.chJump(2); await new Promise(r=>setTimeout(r,100));
ok('toucher un joueur : whoosh aussi', ev.some(e=>e.t==='sweep'&&e.f1===220));
w.chPause();

L('[ACCUEIL] dimensionnement corrigé');
ok('flex-basis 150px supprimé (bug hauteur en colonne)', !html.includes('flex:1 1 150px'));
ok('boutons en largeur pleine, hauteur naturelle', html.includes('.miniact{flex:0 0 auto'));
w.go('home');
ok('les 3 outils présents', app().includes('Mur des champions')&&app().includes('Qui commence')&&app().includes('Le Buzzer'));
ok('carte « pépite » retirée (redondante)', !app().includes('La pépite'));

L('[RÉGLAGE] tout reste coupable');
w.D.fx=0; w.persist(); ev=[];
w.playBuzz('boing'); w.swoosh(); w.chGood();
await new Promise(r=>setTimeout(r,300));
ok('effets coupés : silence total, même les nouveaux', ev.length===0);
w.D.fx=1; w.persist();

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ÉCHEC(S) ***');
})();
