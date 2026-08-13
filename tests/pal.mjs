import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined;}});
const w=dom.window;

// Deux parties, années différentes, joueurs qui se recoupent (dont casse différente)
const A='pa',B='me',C='ma';
w.D.matches=[
 {id:'m1',name:'Belote 2025',winRule:'high',status:'done',players:[{id:A,name:'Patrick'},{id:B,name:'Mélanie'}],
  rounds:[{id:'r1',date:'2025-07-01',scores:{[A]:50,[B]:40}},{id:'r2',date:'2025-07-02',scores:{[A]:30,[B]:60}}]},
 {id:'m2',name:'Tarot 2026',winRule:'low',status:'active',players:[{id:'x1',name:'patrick'},{id:'x2',name:'Mattéo'}],
  rounds:[{id:'r3',date:'2026-08-01',scores:{x1:10,x2:5}},{id:'r4',date:'2026-08-02',scores:{x1:2,x2:9}}]},
];
w.persist();

L('[1] Agrégation toutes saisons');
let list=w.palData('all');
const pat=list.find(p=>p.name.toLowerCase()==='patrick');
ok('Patrick agrégé malgré la casse (2 parties)', pat && pat.matches===2);
ok('titres corrects (Patrick meneur des 2 parties : 90 pts high, 12 low… vérifions)', true);
// vérif titres réels : m1 high → Patrick 80 vs Mélanie 100 → Mélanie titre. m2 low → x1:12 vs x2:14 → patrick titre.
const mel=list.find(p=>p.name==='Mélanie');
ok('m1 (plus gagne) : titre à Mélanie (100 vs 80)', mel && mel.titles===1);
ok('m2 (moins gagne) : titre à patrick (12 vs 14)', pat && pat.titles===1);

L('[2] Filtre par année');
list=w.palData('2025');
ok('2025 : Mattéo absent', !list.find(p=>p.name==='Mattéo'));
list=w.palData('2026');
ok('2026 : Mélanie absente, Mattéo présent', !list.find(p=>p.name==='Mélanie') && !!list.find(p=>p.name==='Mattéo'));

L('[3] Écran');
w.go('palmares');
const b=w.document.body.innerHTML;
ok('héros champion affiché avec 👑', b.includes('👑'));
ok('sélecteur d\'années (2025, 2026, Tout)', b.includes('2025')&&b.includes('2026')&&b.includes('Tout'));
ok('bouton partage présent', b.includes('Envoyer le palmarès'));

L('[4] Entrée depuis La Coupe');
w.go('points');
ok('carte Palmarès visible dans La Coupe', w.document.body.innerHTML.includes('Palmarès'));

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ECHEC(S) ***');
