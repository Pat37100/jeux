import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
function boot(seed){const store=new Map();
  if(seed) store.set('jeux-famille-v1',seed);
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  d.window.D.onboarded=1; return d.window;}
const w=boot(); const app=()=>w.document.getElementById('app').innerHTML;

L('[1] BUG débordement horizontal (2 boutons à 100% dans une ligne)');
ok('correctif CSS global', html.includes('.row>.btn{width:auto;flex:1 1 0;min-width:0}'));
w.go('points'); w.render(); w.openSheet();
ok('feuille Nouvelle partie corrigée', w.document.querySelector('.sheet .row .btn')!==null);
const sh=w.document.querySelector('.sheet'); if(sh) sh.remove();

L('[2] Tic-Tac : les fautes sont comptées');
w.go('chrono'); w.chStart();
w.chGood(); w.chGood(); w.chWrong();
const p0=w.CH.players[0];
ok('bonnes réponses comptées', p0.good===2);
ok('fautes comptées', (p0.bad||0)===1);
w.render();
ok('affichage ✓ et ✗', app().includes('✓ 2') && app().includes('✗ 1'));
ok('taux de réussite affiché', app().includes('67%'));
ok('titre neutre « Réponses »', app().includes('<h2>Réponses</h2>'));
w.chFinishNow(); w.chSaveDuel();
ok('les fautes sont enregistrées au Mur', (w.D.tictac[0].players[0].bad||0)>=0 && 'bad' in w.D.tictac[0].players[0]);

L('[3] Tic-Tac : un seul geste pour enregistrer');
w.render();
ok('enregistrement automatique au Mur (v62)', app().includes('Ajoutée au 🏅 Mur des champions'));
ok('La Coupe devient secondaire et optionnelle', app().includes('Compter aussi dans une partie de La Coupe'));
ok('plus de choix confus : le Mur est implicite', !app().includes('Au Mur des champions seulement'));

L('[4] Libellés simplifiés');
ok('« Rejouer » sans précision', app().includes('>Rejouer<'));
ok('« Modifier les réglages »', app().includes('Modifier les réglages'));

L('[5] BUG navigation : la manche terminée collait à l\'écran');
ok('manche encore là avant de sortir', w.CH!==null);
w.go('home');
ok('nettoyée en quittant', w.CH===null);
w.go('chrono'); w.render();
ok('retour sur les réglages, pas sur les résultats', app().includes('Temps par joueur') && !app().includes('Rejouer'));

L('[6] Micro : Apéro devient un contexte');
const w2=boot();
ok('Apéro typé contexte', w2.MICRO_STYLES.find(s=>s.id==='apero').kind==='contexte');
ok('9 personnalités restantes', w2.MICRO_STYLES.filter(s=>s.kind==='personnalite').length===9);
ok('4 contextes cumulables', w2.MICRO_STYLES.filter(s=>s.kind!=='personnalite').length===4);
const w3=boot(JSON.stringify({onboarded:1,microStyle:'apero',microCtx:['voiture']}));
w3.go('quizz'); w3.render();
ok('migration : Apéro rejoint les contextes', w3.microCtx().includes('apero'));
ok('sans écraser le contexte existant', w3.microCtx().includes('voiture'));
ok('ambiance revenue à Classique', w3.D.microStyle==='classique');
ok('les deux partent dans le prompt', w3.briefText().includes('CONTEXTE ET RYTHME') && w3.briefText().includes('conviviale'));

L('[7] Micro : plus de thèmes');
ok('12 thèmes', w2.MICRO_THEMES.length===12);
for(const id of ['voyage','animaux','web']) ok('nouveau thème '+id, w2.MICRO_THEMES.some(t=>t.id===id));
w2.setMicroTheme('voyage');
ok('thème injecté', w2.briefText().includes('Varie les continents'));

L('[8] Micro : cartes dépliées par défaut (cohérence)');
w2.go('quizz'); w2.render();
ok('Contexte déplié d\'emblée', app.call(null)!==undefined && w2.document.getElementById('app').innerHTML.includes("toggleMicroCtx('voiture')"));
ok('Mécaniques dépliées d\'emblée', w2.MICRO_MECS.every(m=>w2.document.getElementById('app').innerHTML.includes("toggleMicroMec('"+m.id+"')")));
w2.S.qc4=false; w2.render();
ok('repliable quand même', !w2.document.getElementById('app').innerHTML.includes("toggleMicroCtx('voiture')"));

L('[9] Micro : récapitulatif des choix');
w2.S.qc4=undefined; w2.render();
const a2=()=>w2.document.getElementById('app').innerHTML;
ok('carte « Ce que tu as choisi »', a2().includes('Ce que tu as choisi'));
for(const k of ['Joueurs','Animateur','Thème','Contexte','Mécaniques']) ok('récap : '+k, a2().includes('<b>'+k+'</b>'));
w2.D.microCustom='évite le sport'; w2.render();
ok('la consigne libre y figure', a2().includes('évite le sport'));

L('[10] Micro : classement final pré-rempli');
w2.D.lib=[{id:'a',name:'Patrick'},{id:'b',name:'Mélanie'}]; w2.D.microTeam=['a','b'];
w2.S.microSheet=true; w2.S.microDetail=true; w2.render();
const ta=w2.document.getElementById('mqr');
ok('joueurs déjà inscrits dans les scores facultatifs (v69)', ta && ta.value.includes('Patrick') && ta.value.includes('Mélanie'));
ok('vainqueur en un appui, scores facultatifs (v69)', w2.document.body.innerHTML.includes('Un appui suffit') && w2.document.body.innerHTML.includes('Ajouter les scores'));

L('[11] La Coupe : balayage pour supprimer une manche');
const w4=boot(); const ids=w4.D.lib.slice(0,2).map(p=>p.id);
w4.D.matches.unshift({id:'m',name:'U',date:'2026-08-16',status:'live',winRule:'high',target:null,
  players:w4.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),
  rounds:[{id:'r1',date:'2026-08-16',scores:{[ids[0]]:5,[ids[1]]:3}},{id:'r2',date:'2026-08-15',scores:{[ids[0]]:2,[ids[1]]:7}}]});
w4.openMatch('m'); w4.setResMode('list'); w4.render();
const a4=()=>w4.document.getElementById('app').innerHTML;
ok('lignes balayables', (a4().match(/class="swipe"/g)||[]).length===2);
ok('action Corriger', a4().includes('editRound'));
ok('action Supprimer', a4().includes('delRound'));
ok('plus de confirmation en ligne', !a4().includes('Supprimer cette manche ?'));
w4.delRound('r1');
ok('manche supprimée', w4.cur().rounds.length===1);
ok('annulation proposée', typeof w4.UNDO==='object' || html.includes("offerUndo('Manche supprimée'"));

L('[12] Non-régression');
const t=w2.briefText();
for(const k of ['INVARIANTS','MECANIQUES=','GRAINE_DE_PARTIE','PERSONNE NE TROUVE','A0. LECTURE']) ok('prompt : '+k, t.includes(k));
ok('7 étapes Micro', (a2().match(/class="stepn"/g)||[]).length===7);
w4.setResMode('rank'); w4.render();
ok('classement intact', a4().includes('Classement'));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
