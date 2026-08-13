import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined;}});
const w=dom.window;

L('[1] Photo d\'avatar (stockage et rendu)');
w.D.lib[0].photo='data:image/jpeg;base64,AAAA'; w.persist();
ok('av() rend la photo en fond', w.av('Patrick').includes('background-image'));
ok('la casse du nom retrouve la photo', w.av('patrick').includes('background-image'));
w.go('save'); w.openAv(w.D.lib[0].id);
const sh=w.document.getElementById('avsh').innerHTML;
ok('feuille : bouton 📷 + Retirer visibles', sh.includes('📷')&&sh.includes('Retirer'));
w.S.avPick=w.D.lib[0].id; w.chooseAv('🦖');
ok('choisir un emoji retire la photo', !w.D.lib[0].photo && w.D.lib[0].emoji==='🦖');

L('[2] Palmarès : périodes flexibles');
const t=new Date().toISOString().slice(0,10);
const old=new Date(Date.now()-40*864e5).toISOString().slice(0,10);
w.D.matches=[{id:'m1',name:'X',winRule:'high',status:'active',
  players:[{id:'a',name:'Patrick'},{id:'b',name:'Maxime'}],
  rounds:[{id:'r1',date:t,scores:{a:10,b:5}},{id:'r2',date:old,scores:{a:1,b:50}}]}];
w.persist();
w.PAL.year='d1'; let l=w.palData();
ok('« Ce soir » : ne compte que la manche du jour (Patrick 1 victoire)', l.find(p=>p.name==='Patrick').wins===1 && l.find(p=>p.name==='Maxime').wins===0);
w.PAL.year='all'; l=w.palData();
ok('« Tout » : les 2 manches comptées', l.find(p=>p.name==='Maxime').wins===1);
w.PAL.year='all'; w.go('palmares');
const b=w.document.getElementById('app').innerHTML;
ok('filtres Soirée / Championnat présents', b.includes('Soirée')&&b.includes('Championnat'));

L('[3] Tic-Tac : arène visuelle');
w.go('chrono'); w.chStart();
const a=w.document.getElementById('app').innerHTML;
ok('arène côte à côte (colonnes)', a.includes('class="duel') && (a.match(/class="lane/g)||[]).length>=2);
ok('joueur actif mis en avant', a.includes('lane live'));
w.chJump(1);
ok('tap sur une pastille donne la main', w.CH.active===1 && w.CH.running===false);
w.CH.players[1].out=true; w.chJump(1); // pas de main à un éliminé
w.CH.active=0; w.chJump(1);
ok('pas de main à un joueur éliminé', w.CH.active===0);
w.render();
ok('éliminé : pastille ❌ grisée', w.document.getElementById('app').innerHTML.includes('ko'));

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ECHEC(S) ***');
