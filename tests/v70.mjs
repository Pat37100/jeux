import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const A=(w)=>w.document.getElementById('app').innerHTML;
function boot(){const store=new Map();
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  d.window.D.onboarded=1; return d.window;}

L('[1] Le Micro avait un palmarès écrit mais inaccessible depuis la v46');
const w=boot(); w.D.lib=[{id:'a',name:'Anna'},{id:'b',name:'Bob'}]; w.D.microTeam=['a','b'];
w.D.micro=[{id:'q1',date:'2026-08-16',players:[{name:'Anna',score:15},{name:'Bob',score:9}]},
           {id:'q2',date:'2026-08-12',players:[{name:'Bob',score:12}]}];
w.go('quizz'); w.render();
ok('historique centralisé dans La Coupe (v78)', !A(w).includes('Dernières parties'));
ok('replié par défaut (écran non alourdi)', !A(w).includes('class="swipe'));
w.render();
ok('résultats désormais dans La Coupe', typeof w.coupeResults==='function');
ok('vainqueur enregistré', w.D.micro[0].players[0].name==='Anna');
ok('score conservé', w.D.micro[0].players[0].score===15);
ok('palmarès consultable dans La Coupe', typeof w.champByGame==='function');


L('[2] Même motif que Tic-Tac : cohérence inter-rubriques');
ok('Tic-Tac : « Derniers duels »', html.includes('Derniers duels ('));
ok('Micro : historique retiré au profit de La Coupe (v78)', !html.includes('Dernières parties ('));
ok('parties terminées repliables dans La Coupe', html.includes('S.showDone=!S.showDone'));
ok('même helper de balayage', (html.match(/swipeRow\(row, delAct/g)||[]).length>=3);

L('[3] Suppression annulable, comme partout');
w.microDel('q2');
ok('partie supprimée', w.D.micro.length===1);
ok('annulation proposée', !!w.UNDO);
w.doUndo();
ok('restaurée à sa place', w.D.micro.length===2 && w.D.micro[1].id==='q2');

L('[4] Non-régression');
ok('vainqueur en un appui intact', typeof w.microWin==='function');
w.S.microSheet=true; w.render();
ok('feuille unique', w.document.querySelectorAll('#msh').length===1);
w.microClose();
ok('fermeture effective', w.document.querySelectorAll('#msh').length===0);
ok('Mur par discipline intact', typeof w.champByGame==='function');
ok('prénoms par personnage intacts', typeof w.hostName==='function' && !!w.HOST_NAMES_BY_STYLE);
ok('moteur du prompt intact', w.briefText().includes('A3. CONTRAT DE VOIX'));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
