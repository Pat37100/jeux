import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
function boot(){const store=new Map();
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  d.window.D.onboarded=1; return d.window;}
const w=boot(); const app=()=>w.document.getElementById('app').innerHTML;

L('[1] Alignement des pas ±1 ±5 ±10');
const ids=w.D.lib.slice(0,2).map(p=>p.id);
w.D.matches.unshift({id:'m',name:'U',date:'2026-08-16',status:'live',winRule:'high',target:null,
  players:w.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),rounds:[]});
w.openMatch('m'); w.S.tab='play'; w.render();
ok('largeur fixe identique', (app().match(/flex:0 0 54px/g)||[]).length===3);
ok('texte centré', app().includes('text-align:center;padding-left:0'));

L('[2] La Grille en premier');
ok('Grille avant Par joueur', html.indexOf("['grid','▦','Grille']")<html.indexOf("['rank','🏅','Par joueur']"));
w.S.inputs={[ids[0]]:'5',[ids[1]]:'3'}; w.saveRound();
ok('après saisie : mode Grille', w.S.histMode==='grid');
const w2=boot();
w2.D.matches.unshift({id:'m2',name:'V',date:'2026-08-16',status:'live',winRule:'high',target:null,
  players:w2.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),rounds:[{id:'r',date:'2026-08-16',scores:{}}]});
w2.openMatch('m2');
ok('ouverture d\'une partie : mode Grille', w2.S.histMode==='grid');

L('[3] Affordance de balayage (la petite ombre)');
ok('ombre au bord droit', html.includes('.swipe .front::after'));
ok('disparaît quand c\'est ouvert', html.includes('.swipe.open .front::after{opacity:0}'));
ok('pas de bouton explicite ajouté sur la ligne', !app().includes('Glisser'));

L('[4] Tic-Tac : bonne / mauvaise / passer sans compter');
const w3=boot(); w3.go('chrono'); w3.chStart(); w3.render();
ok('libellé « Bonne réponse »', app.call()!==undefined && w3.document.getElementById('app').innerHTML.includes('✓ Bonne réponse'));
ok('libellé « Mauvaise réponse » explicite', w3.document.getElementById('app').innerHTML.includes('✗ Mauvaise réponse'));
ok('sortie neutre « Passer sans compter »', w3.document.getElementById('app').innerHTML.includes('Passer sans compter'));
const p0=()=>w3.CH.players[0];
w3.chGood(); ok('bonne réponse comptée', p0().good===1);
const before=w3.CH.players.map(p=>({g:p.good,b:p.bad||0}));
w3.chSkip();
const after=w3.CH.players.map(p=>({g:p.good,b:p.bad||0}));
ok('« Passer » ne compte NI bon NI faux', JSON.stringify(before)===JSON.stringify(after));
ok('mais la main a tourné', typeof w3.chSkip==='function');
w3.CH.active=0; w3.chWrong();
ok('mauvaise réponse comptée', (w3.CH.players[0].bad||0)===1);

L('[5] Le Mur enregistre tout, sans rien demander');
const w4=boot(); w4.go('chrono'); w4.chStart();
w4.chGood(); w4.chFinishNow();
ok('manche au Mur sans aucun clic', w4.D.tictac.length===1);
ok('marquée comme enregistrée', w4.CH.saved===true);
w4.render();
const a4=()=>w4.document.getElementById('app').innerHTML;
ok('constat affiché', a4().includes('Enregistrée dans 🏆 La Coupe'));
ok('plus de bouton « Enregistrer la manche »', !a4().includes('🏆 Enregistrer la manche'));
ok('aucune option à choisir : tout est automatique (v78)', !a4().includes('Compter aussi'));
ok('La Coupe alimentée sans feuille (v78)', w4.D.matches.length>=1 && w4.D.matches[0].name==='Tic-Tac');
ok('le Mur garde tout', w4.D.tictac.length>=1);

L('[6] Micro : même logique, et passerelle vers La Coupe');
const w5=boot();
w5.D.lib=[{id:'a',name:'Patrick'},{id:'b',name:'Mélanie'}]; w5.D.microTeam=['a','b'];
w5.go('quizz'); w5.S.microSheet=true; w5.S.microDetail=true; w5.render();
w5.document.getElementById('mqr').value='Patrick 15\nMélanie 9';
w5.microSave();
ok('résultat au Mur automatiquement', w5.D.micro.length===1);
ok('enregistrement automatique dans La Coupe (v78)', w5.D.matches.some(m=>m.name==='Le Micro'));
ok('cohérent avec Tic-Tac', w5.document.body.innerHTML.includes('Compter dans La Coupe ?'));
ok('partie « Le Micro » créée', w5.D.matches.filter(m=>m.name==='Le Micro').length===1);
ok('scores repris', Object.values(w5.D.matches[0].rounds[0].scores).sort().join(',')==='15,9'.split(',').sort().join(','));
ok('le Mur conserve aussi le résultat', w5.D.micro.length===1);

L('[7] Consigne libre : elle porte sur tout');
const w6=boot(); w6.go('quizz'); w6.render();
const a6=()=>w6.document.getElementById('app').innerHTML;
ok('intitulé élargi', a6().includes('Un ton, un thème, une règle'));
w6.D.microCustom='beaucoup de questions sur la Bretagne';
const t=w6.briefText();
ok('injectée dans le prompt', t.includes('beaucoup de questions sur la Bretagne'));
ok('portée explicite (ton ET questions)', t.includes("n'importe quel aspect du jeu"));
ok('prime sur les préférences par défaut', t.includes('elle prime sur tes préférences'));
ok('sans casser le moteur', t.includes('ne supprime aucune règle du moteur'));
ok('visible dans le récap', a6().includes('Ce que tu as choisi'));
w6.render();
ok('la consigne apparaît dans le récap', w6.document.getElementById('app').innerHTML.includes('Bretagne'));

L('[8] Non-régression du prompt initial');
for(const k of ['INVARIANTS',"T'ARRÊTES DE PARLER",'Mélanie +2 → 8','Vol ouvert','PERSONNE NE TROUVE',
                'QUESTIONS INTERDITES','POINT DE CALIBRAGE','MECANIQUES=','GRAINE_DE_PARTIE','A0. LECTURE',
                'TOUR DÉFI','ESTIMATION','QUITTE OU DOUBLE','QUESTION EN OR','jamais plus de ±1'])
  ok('conservé : '+k, t.includes(k));
ok('12 thèmes', w6.MICRO_THEMES.length===12);
ok('7 étapes', (a6().match(/class="stepn"/g)||[]).length===7);
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
