import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  BUG  ')+' — '+l); if(!c)F++;};
const store=new Map(); let opened=[];
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  try{Object.defineProperty(w.navigator,'serviceWorker',{get:()=>({register:()=>Promise.resolve(),addEventListener(){},controller:null}),configurable:true});}catch(e){}
  try{Object.defineProperty(w.navigator,'clipboard',{value:{writeText:()=>Promise.resolve()},configurable:true});}catch(e){}
  w.open=(u)=>{opened.push(u);return {};};
  w.URL.createObjectURL=()=>'blob:x'; w.URL.revokeObjectURL=()=>{};
}});
const w=dom.window, doc=w.document; w.D.onboarded=1;
const app=()=>doc.getElementById('app').innerHTML;
(async()=>{

L('[1] Micro : équipe embarquée (plus de « Qui joue ? »)');
w.go('quizz'); w.S.qtab='play'; w.render();
ok('sélecteur « Qui joue ? » affiché', app().includes('Qui joue ?'));
ok('tous les joueurs sélectionnés par défaut', w.microTeam().length===w.D.lib.length);
const bt=w.briefText();
ok('le lancement contient les prénoms', bt.includes(w.D.lib[0].name));
ok('consigne « ne demande pas qui joue »', bt.includes('Ne demande pas qui joue'));
ok('démarre avec le 1er joueur nommé', bt.includes('démarre directement avec '+w.D.lib[0].name));
// désélection
w.microToggleP(w.D.lib[0].id);
ok('on peut retirer un joueur', w.microTeam().length===w.D.lib.length-1);
ok('lancement mis à jour sans lui', !w.briefText().includes('ordre : '+w.D.lib[0].name));
// garde-fou : au moins un
const solo=w.D.lib.slice(1).map(p=>p.id); w.D.microTeam=[solo[0]]; w.persist();
w.microToggleP(solo[0]);
ok('impossible de tout désélectionner', w.microTeam().length>=1);
w.D.microTeam=null; w.persist();

L('[2] Micro : lancement en UN geste');
ok('bouton « Lancer la partie »', app().includes('Lancer la partie'));
ok('parcours réduit à 2 étapes', app().includes('<b>2.</b>')&&!app().includes('<b>3.</b>'));
opened=[]; w.briefGo();
await new Promise(r=>setTimeout(r,60));
ok('Claude s\'ouvre automatiquement', opened.some(u=>String(u).includes('claude.ai')));
ok('prompt intégral conservé', w.briefText().includes('RÈGLES NON NÉGOCIABLES'));

L('[3] Sauvegarde par fichier');
w.go('save');
ok('bouton « Télécharger le fichier »', app().includes('Télécharger le fichier'));
ok('restauration par fichier proposée', app().includes('Restaurer depuis un fichier'));
w.backupFile();
ok('sauvegarde datée enregistrée', !!w.D.lastBackup);
w.render();
ok('date de dernière sauvegarde affichée', app().includes('Dernière sauvegarde'));
// rappel si beaucoup de données et jamais sauvegardé
w.D.lastBackup=null; w.D.matches=[{id:'a'},{id:'b'},{id:'c'}]; w.persist(); w.render();
ok('rappel affiché quand rien n\'est sauvegardé', app().includes('Pense à sauvegarder'));

L('[4] Polish visuel');
ok('animation d\'apparition des écrans', html.includes('@keyframes fadeUp'));
ok('respect de « animations réduites » (accessibilité)', html.includes('prefers-reduced-motion'));
ok('trophée animé sur la victoire', html.includes('.winbig'));

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ÉCHEC(S) ***');
})();
