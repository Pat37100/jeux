import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  KO   ')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  try{Object.defineProperty(w.navigator,'serviceWorker',{get:()=>({register:()=>Promise.resolve(),addEventListener(){},controller:null}),configurable:true});}catch(e){}
}});
const w=dom.window, doc=w.document; w.D.onboarded=1;
const app=()=>doc.getElementById('app').innerHTML;
(async()=>{

L('[1] Initiales pour les équipes');
w.D.lib.push({id:'t1',name:'Les Bleus'}); w.persist();
ok('équipe 2 mots → initiales LB', w.av('Les Bleus').includes('>LB<'));
ok('personne 1 mot → personnage conservé', !w.av('Patrick').includes('<b style'));
w.D.lib=w.D.lib.filter(p=>p.id!=='t1'); w.persist();

L('[2] Accueil réorganisé + clarté');
w.go('home');
ok('Mur des champions en pleine largeur (plus coupé)', app().includes('Les couronnes de tous les jeux'));
ok('Coupe explicitée (compte + exemples de jeux)', app().includes('Il compte.')&&app().includes('belote'));
ok('Micro honnête (app Claude mentionnée)', app().includes('app Claude'));

L('[3] Swipe 2 actions : Terminer + Supprimer');
w.go('points'); w.openSheet(); doc.getElementById('mn').value='Active'; w.createMatch();
const ids=w.cur().players.map(p=>p.id); w.S.inputs={[ids[0]]:'8',[ids[1]]:'3'}; w.saveRound();
w.go('points');
ok('partie active : bouton Terminer révélable', app().includes('archMatch')&&app().includes('🏁')&&app().includes('data-reveal="168"'));
ok('bouton Supprimer toujours là', app().includes('askDelMatch'));
w.archMatch(w.D.matches[0].id);
ok('Terminer → partie close + cérémonie', w.D.matches[0].status==='done' && app().includes('Champion de la partie'));
w.go('points');
ok('partie terminée : Supprimer seul (96px)', app().includes('data-reveal="96"'));

L('[4] Graphique de progression');
w.openSheet(); doc.getElementById('mn').value='Course'; w.createMatch();
const ids2=w.cur().players.map(p=>p.id);
for(let i=0;i<4;i++){ const s={}; ids2.forEach((id,j)=>s[id]=String((j+1)*(i+1))); w.S.inputs=s; w.saveRound(); }
w.S.tab='hist'; w.render();
ok('3 modes : Grille / Courbe / Liste', app().includes('▦ Grille')&&app().includes('📈 Courbe')&&app().includes('☰ Liste'));
w.S.histMode='graph'; w.render();
ok('SVG de courbes affiché', app().includes('<svg viewBox="0 0 320'));
ok('une ligne par joueur', (app().match(/<path d="M/g)||[]).length===w.cur().players.length);
ok('légende avec cumuls et couronne', app().includes('👑')&&app().includes('La course aux points'));
// 1 seule manche → message d'attente
w.go('points'); w.openSheet(); doc.getElementById('mn').value='Courte'; w.createMatch();
const ids3=w.cur().players.map(p=>p.id); w.S.inputs={[ids3[0]]:'5'}; w.saveRound();
w.S.tab='hist'; w.S.histMode='graph'; w.render();
ok('moins de 2 manches → invitation à jouer', app().includes('Encore un peu de jeu'));

L('[5] Joueur qui rejoint en cours de partie');
w.S.tab='set'; w.render();
ok('champ « un invité arrive »', app().includes('Un invité arrive'));
doc.getElementById('addp').value='Tonton Rémi';
const nb=w.cur().players.length;
w.addPlayerToMatch();
ok('joueur ajouté à la partie', w.cur().players.length===nb+1);
ok('relié à la bibliothèque commune', w.D.lib.some(p=>p.name==='Tonton Rémi'));
doc.getElementById('addp').value='Tonton Rémi';
w.addPlayerToMatch();
ok('doublon refusé', w.cur().players.length===nb+1);
// il apparaît dans la saisie et la grille
w.S.tab='play'; w.render();
ok('présent dans la saisie de manche', app().includes('Tonton Rémi'));
w.S.tab='hist'; w.S.histMode='grid'; w.render();
ok('présent dans la grille (manches passées à ·)', app().includes('Tonton Rémi'));

L('[6] Espace avis + hook App Store');
w.go('save');
ok('carte « Ton avis compte »', app().includes('Ton avis compte'));
ok('mailto prêt', app().includes('mailto:'));
ok('hook reviewMoment posé au couronnement', w.finishMatch.toString().includes('reviewMoment'));

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ÉCHEC(S) ***');
})();
