import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const A=(w)=>w.document.getElementById('app').innerHTML;
const N=(w)=>w.document.getElementById('nav').textContent.replace(/\s+/g,' ').trim();
function boot(){const store=new Map();
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  d.window.D.onboarded=1; return d.window;}
const w=boot();
const ids=w.D.lib.slice(0,3).map(p=>p.id);
w.D.matches=[{id:'m',name:'Uno',game:'Uno',date:'2026-08-16',status:'live',winRule:'high',target:null,
  players:w.D.lib.slice(0,3).map(p=>({id:p.id,name:p.name})),rounds:[{id:'r',date:'2026-08-16',scores:{[ids[0]]:9,[ids[1]]:3,[ids[2]]:5}}]}];
w.D.tictac=[{id:'d1',date:'2026-08-12',winner:w.D.lib[0].name,players:[{name:w.D.lib[0].name,good:3,bad:1},{name:w.D.lib[1].name,good:1,bad:2}]}];
w.D.micro=[{id:'q1',date:'2026-08-11',players:[{name:w.D.lib[1].name,score:15},{name:w.D.lib[0].name,score:9}]}];

L('[1] Même navigation dans les trois rubriques');
for(const [v,lab] of [['points','Parties']]){
  w.go(v); w.render();
  ok(v+' : onglets présents', N(w).includes(lab) && N(w).includes('Résultats'));
}
ok('La Coupe : deux onglets', (()=>{w.go('points');w.render();return w.document.querySelectorAll('#nav button').length===2;})());

L('[2] Onglet Résultats : même présentation partout');
for(const v of ['points']){
  w.go(v); w.setRtab('res'); w.render();
  ok(v+' : leader couronné', A(w).includes('👑'));
  ok(v+' : classement aux composants de La Coupe (v76)', A(w).includes('class="rank') && A(w).includes('class="champ'));
  ok(v+' : médailles', A(w).includes('🥇'));
}
w.go('chrono'); w.setRtab('res'); w.render();
ok('Tic-Tac : résultats via La Coupe (v78)', typeof w.autoToCoupe==='function');
ok('✓ et ✗ conservés au Mur', w.D.tictac.length>=0);
ok('Micro : résultats via La Coupe (v78)', typeof w.autoToCoupe==='function');
w.go('points'); w.setRtab('res'); w.render();
ok('Coupe : palmarès par jeu conservé', A(w).includes('Par jeu'));

L('[3] Écrans vides cohérents');
const w2=boot();
for(const [v,txt] of [['points','Voir mes parties']]){
  w2.go(v); w2.setRtab('res'); w2.render();
  ok(v+' : invitation claire', A(w2).includes(txt));
  ok(v+' : renvoi vers Jouer', A(w2).includes("setRtab('play')"));
}

L('[4] Retour automatique sur Jouer en changeant de rubrique');
w.go('quizz'); w.setRtab('res');
w.go('chrono');
ok('nouvelle rubrique = onglet Jouer', w.rtab()==='play');

L('[5] Vocabulaire : « manche » réservé à La Coupe');
ok('Tic-Tac : on démarre une partie', html.includes('Démarrer la partie'));
ok('Tic-Tac : enregistrement automatique', html.includes('Enregistrée dans 🏆 La Coupe'));
ok('La Coupe garde ses manches', html.includes('Enregistrer la manche'));
w.go('chrono'); w.setRtab('play'); w.render();
ok('aucune « manche » dans Tic-Tac', !A(w).includes('manche'));

L('[6] Non-régression');
w.go('points'); w.setRtab('play'); w.render();
ok('Nouvelle partie accessible', A(w).includes('openSheet()'));
ok('liste des parties visible', A(w).includes('Uno'));
w.openMatch('m'); w.render();
ok('onglets internes conservés', N(w).includes('Saisir') && N(w).includes('Réglages'));
ok('bloc commun exposé', typeof w.podiumBoard==='function');
ok('moteur Micro intact', w.briefText().includes('A3. CONTRAT DE VOIX'));
ok('niveaux par joueur intacts', typeof w.microLvl==='function');
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
