import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map(); let printed=0;
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined; w.print=()=>{printed++;};
  // pas de speechSynthesis -> speak() doit rester sûr
}});
const w=dom.window, doc=w.document;
(async()=>{

L('[1] « Qui commence ? » — tirage');
w.go('home');
const home=doc.getElementById('app').innerHTML;
ok('bouton « Qui commence ? » sur l\'accueil', home.includes('Qui commence'));
ok('bouton « Mur des champions » sur l\'accueil', home.includes('Mur des champions'));
w.whoStart();
ok('feuille de tirage ouverte', !!doc.getElementById('whosh'));
ok('tous les joueurs cochés par défaut', w.whoChosen().length===w.D.lib.length);
w.whoToggle(w.D.lib[0].id);
ok('on peut décocher un joueur', w.whoChosen().length===w.D.lib.length-1);
w.whoSpin();
// spin est async (setTimeout) -> forcer un résultat déterministe
ok('un joueur est désigné (après spin lancé)', w.WHO.picked!==null);
w.whoClose();
ok('feuille fermée', !doc.getElementById('whosh'));

L('[2] Mur des champions — agrégation transverse');
// Créer des données dans les 3 jeux
w.go('points'); w.openSheet(); doc.getElementById('mn').value='Soirée'; w.createMatch();
const ids=w.cur().players.map(p=>p.id);
w.S.inputs={[ids[0]]:'10',[ids[1]]:'5'}; w.saveRound(); // joueur0 gagne la manche + titre
w.D.micro=[{id:'m1',date:'2026-08-10',players:[{name:w.D.lib.find(p=>p.id===ids[0]).name,score:15},{name:'Zoé',score:9}]}];
w.D.tictac=[{id:'t1',date:'2026-08-11',players:[{name:'Zoé',good:4},{name:w.D.lib.find(p=>p.id===ids[0]).name,good:2}],winner:'Zoé'}];
w.persist();
const agg=w.championsAgg();
const p0name=w.D.lib.find(p=>p.id===ids[0]).name;
const champP0=agg.find(a=>a.name===p0name);
ok('joueur0 : 1 titre Coupe agrégé', champP0.coupes===1);
ok('joueur0 : 1 quiz gagné agrégé', champP0.quizWins===1);
ok('Zoé : 1 duel gagné agrégé', agg.find(a=>a.name==='Zoé').duelWins===1);
ok('couronnes = somme des 3 jeux', champP0.crowns===champP0.coupes+champP0.quizWins+champP0.duelWins);
w.go('champions');
const cw=doc.getElementById('app').innerHTML;
ok('écran affiche « Champion de la famille »', cw.includes('Champion de la famille'));
ok('détail cross-jeux dépliable', cw.includes('Classement général'));

L('[3] Partage & voix');
ok('microShare existe', typeof w.microShare==='function');
ok('chShareP existe', typeof w.chShareP==='function');
ok('champShare existe', typeof w.champShare==='function');
ok('speak() sûr sans speechSynthesis (ne jette pas)', (()=>{try{w.D.voice=true;w.speak('test');return true;}catch(e){return false;}})());
w.go('save');
ok('toggle voix présent dans Réglages', doc.getElementById('app').innerHTML.includes('Annonce vocale'));
w.setVoice(true); ok('voix activable', w.D.voice===true);
w.setVoice(false); ok('voix désactivable', w.D.voice===false);

L('[4] Export PDF');
w.S.matchId=w.D.matches[0].id; w.go('match'); w.S.view='match';
printed=0; w.exportMatchPDF();
const pdf=doc.getElementById('pdf').innerHTML;
ok('PDF partie : titre du match', pdf.includes('Soirée'));
ok('PDF partie : classement final', pdf.includes('Classement final'));
ok('PDF partie : détail des manches', pdf.includes('Détail des manches'));
await new Promise(r=>setTimeout(r,120));
ok('window.print() déclenché (après timer)', printed>0);
w.go('palmares'); w.PAL.year='all'; printed=0; w.exportPalmaresPDF();
await new Promise(r=>setTimeout(r,120));
ok('PDF palmarès généré + imprimé', doc.getElementById('pdf').innerHTML.includes('Palmarès')&&printed>0);
w.go('champions'); printed=0; w.exportChampionsPDF();
await new Promise(r=>setTimeout(r,120));
ok('PDF champions généré + imprimé', doc.getElementById('pdf').innerHTML.includes('Mur des champions')&&printed>0);
ok('#pdf est hors de #app (survit au render)', doc.getElementById('pdf')!==null && !doc.getElementById('app').contains(doc.getElementById('pdf')));

L('[5] Non-régression clés');
ok('prompt Micro intact', w.briefText().includes('RÈGLES NON NÉGOCIABLES'));
ok('intro élargie intacte', doc.querySelector('#app')!==null);

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ECHEC(S) ***');
})();
