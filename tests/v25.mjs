import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  BUG  ')+' — '+l); if(!c)F++;};
const store=new Map(); let tones=[];
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  try{Object.defineProperty(w.navigator,'serviceWorker',{get:()=>({register:()=>Promise.resolve(),addEventListener(){},controller:null}),configurable:true});}catch(e){}
  w.print=()=>{w.__printed=(w.__printed||0)+1;};
}});
const w=dom.window, doc=w.document; w.D.onboarded=1;
const app=()=>doc.getElementById('app').innerHTML;
const origTone=w.tone; w.tone=(f,d,v)=>{tones.push(f);};
(async()=>{

L('[1] Cérémonie de couronnement');
w.go('points'); w.openSheet(); doc.getElementById('mn').value='Finale'; w.createMatch();
const ids=w.cur().players.map(p=>p.id);
w.S.inputs={[ids[0]]:'20',[ids[1]]:'12'}; w.saveRound();
w.S.tab='set'; w.render();
ok('bouton « Terminer & couronner le champion »', app().includes('couronner le champion'));
tones=[]; w.finishMatch();
ok('partie marquée terminée', w.cur().status==='done');
ok('bascule sur le classement avec cérémonie', w.S.tab==='rank' && app().includes('Champion de la partie'));
const champName=w.D.lib.find(p=>p.id===ids[0]).name;
ok('le bon champion couronné (👑 '+champName+')', app().includes('👑 '+champName));
// (les 4 notes partent en setTimeout — vérifiées après 600 ms ci-dessous)
await new Promise(r=>setTimeout(r,600));
ok('arpège complet (do-mi-sol-do)', tones.includes(523)&&tones.includes(1047));
ok('actions : Partager / PDF / Voir le Mur', app().includes('Voir le Mur'));
// reset en quittant
w.go('home'); w.S.matchId=w.D.matches[0].id; w.go('match');
ok('cérémonie ne réapparaît pas en revenant', !app().includes('Champion de la partie'));

L('[2] PDF harmonisés (3 palmarès + mur + partie)');
w.D.tictac=[{id:'d',date:'2026-08-12',players:[{name:'Léa',good:4},{name:'Tom',good:2}],winner:'Léa'}];
w.D.micro=[{id:'q',date:'2026-08-12',players:[{name:'Léa',score:15},{name:'Tom',score:9}]}]; w.persist();
w.CH=null; w.S.chTab='pal'; w.go('chrono'); w.S.chTab='pal'; w.render();
ok('bouton PDF sur Roi du chrono', app().includes('exportChronoPDF'));
w.__printed=0; w.exportChronoPDF(); await new Promise(r=>setTimeout(r,130));
ok('PDF Roi du chrono généré', w.__printed>0 && doc.getElementById('pdf').innerHTML.includes('Roi du chrono'));
w.go('quizz'); w.S.qtab='pal'; w.render();
ok('bouton PDF sur Maître du Micro', app().includes('exportMicroPDF'));
w.__printed=0; w.exportMicroPDF(); await new Promise(r=>setTimeout(r,130));
ok('PDF Maître du Micro généré', w.__printed>0 && doc.getElementById('pdf').innerHTML.includes('Maître du Micro'));

L('[3] PDF vides refusés proprement');
w.D.tictac=[]; w.D.micro=[]; w.persist();
w.__printed=0; w.exportChronoPDF(); w.exportMicroPDF();
await new Promise(r=>setTimeout(r,130));
ok('rien à exporter → toast, pas d\'impression', w.__printed===0);

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ÉCHEC(S) ***');
})();
