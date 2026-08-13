import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  BUG  ')+' — '+l); if(!c)F++;};
const store=new Map(); let tones=[];
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  try{Object.defineProperty(w.navigator,'serviceWorker',{get:()=>({register:()=>Promise.resolve(),addEventListener(){},controller:null}),configurable:true});}catch(e){}
}});
const w=dom.window, doc=w.document; w.D.onboarded=1;
const app=()=>doc.getElementById('app').innerHTML;
// espionner tone()
const origTone=w.tone; w.tone=(f,d,v)=>{tones.push(f); try{origTone(f,d,v);}catch(e){}};
(async()=>{

L('[1] Nettoyage code mort');
ok('anneau SVG géant supprimé du code', !html.includes('width:210px;height:210px'));
ok('chGame fonctionne toujours', (()=>{w.go('chrono');w.chStart();return app().includes('class="duel');})());

L('[2] Header Réglages cohérent');
w.CH=null; w.go('save');
ok('titre « Joueurs & équipes »', doc.getElementById('hd').innerHTML.includes('Joueurs & équipes')||doc.getElementById('hd').innerHTML.includes('Joueurs &amp; équipes'));

L('[3] Son de tension (tic-tac sous 10 s)');
w.CH=null; w.go('chrono'); w.chStart();
w.CH.sound=true; w.CH.players[0].left=11.2; tones=[];
(w.CH&&(w.CH.startedOnce=true),w.chRun()); await new Promise(r=>setTimeout(r,2600)); w.chPause();
ok('tic grave émis sous 10 s (760 Hz)', tones.includes(760));
w.CH.players[0].left=5.2; tones=[];
(w.CH&&(w.CH.startedOnce=true),w.chRun()); await new Promise(r=>setTimeout(r,1600)); w.chPause();
ok('tic aigu pressant sous 5 s (1180 Hz)', tones.includes(1180));
// silence si son coupé
w.CH.sound=false; w.CH.players[0].left=8; tones=[];
(w.CH&&(w.CH.startedOnce=true),w.chRun()); await new Promise(r=>setTimeout(r,1300)); w.chPause();
ok('silencieux quand le son est coupé', tones.length===0);

L('[4] Reprise rapide sur l\'accueil');
w.CH=null;
w.go('points'); w.openSheet(); doc.getElementById('mn').value='Rami du soir'; w.createMatch();
const ids=w.cur().players.map(p=>p.id); w.S.inputs={[ids[0]]:'9',[ids[1]]:'4'}; w.saveRound();
w.go('home');
ok('bouton « Reprendre : Rami du soir » affiché', app().includes('Reprendre : Rami du soir'));
// clic → retour dans la partie
const b=[...doc.querySelectorAll('button[onclick]')].find(x=>(x.textContent||'').includes('Reprendre'));
w.event={stopPropagation(){},preventDefault(){}}; w.eval(b.getAttribute('onclick'));
ok('clic → rouvre la partie', w.S.view==='match' && w.cur().name==='Rami du soir');
// partie terminée → plus de bouton
w.cur().status='done'; w.persist(); w.go('home');
ok('partie terminée : pas de bouton reprise', !app().includes('Reprendre :'));

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ÉCHEC(S) ***');
})();
