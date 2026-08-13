import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  BUG  ')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  try{Object.defineProperty(w.navigator,'serviceWorker',{get:()=>({register:()=>Promise.resolve(),addEventListener(){},controller:null}),configurable:true});}catch(e){}
}});
const w=dom.window, doc=w.document; w.D.onboarded=1;
const app=()=>doc.getElementById('app').innerHTML;
(async()=>{

L('[1] Tic-Tac : 2 boutons seulement, plus de confusion');
w.go('chrono'); w.chStart();
ok('bouton « Bonne réponse — garde la main »', app().includes('garde la main'));
ok('bouton « Au suivant » unique', app().includes('Au suivant'));
ok('plus de « Raté » ni « Passer »', !app().includes('Raté')&&!app().includes('Passer (sans faute)'));
ok('chSkip supprimé du code', typeof w.chSkip==='undefined');

L('[2] Fin de partie visible');
ok('bandeau « X en course · le dernier debout gagne »', app().includes('en course')&&app().includes('dernier debout gagne'));
w.chGood(); w.chPause(); w.chWrong(); w.chPause();
ok('« Au suivant » fonctionne (main passée)', w.CH.active===1);
// élimination -> annonce
w.CH.players[1].left=0.05; (w.CH&&(w.CH.startedOnce=true),w.chRun());
await new Promise(r=>setTimeout(r,300)); w.chPause();
ok('joueur éliminé à zéro', w.CH.players[1].out===true);
ok('bandeau mis à jour (2 en course)', app().includes('2 en course'));

L('[3] Alignements (règles CSS défensives présentes)');
ok('inputs ne débordent plus (.row>input min-width:0)', html.includes('.row>input')&&html.includes('min-width:0'));
ok('chips en wrap (plus de scroll caché)', html.includes('.chips{display:flex;gap:6px;flex-wrap:wrap}'));
ok('arène en grille régulière', html.includes('repeat(auto-fill,minmax(76px'));
ok('16px sur champs (anti-zoom iOS)', html.includes('font-size:16px'));
ok('cartes contiennent leur contenu (overflow:hidden)', html.includes('.card{overflow:hidden}'));

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ÉCHEC(S) ***');
})();
