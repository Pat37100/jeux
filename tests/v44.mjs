import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
const w=dom.window; w.D.onboarded=1;
const app=()=>w.document.getElementById('app').innerHTML;
const body=()=>w.document.body.innerHTML;
const cls=()=>w.document.getElementById('app').className;

L('[1] Tic-Tac : presets sur une ligne');
w.go('chrono'); w.render();
ok('grille 5 colonnes', app().includes('repeat(5,1fr)'));
ok('plus de « 3 min » (débordait)', !app().includes('3 min'));
ok('45 s ajouté (plus pertinent)', app().includes('45s'));
ok('les presets restent cliquables', app().includes('chSetSecs(45)'));

L('[2] Tic-Tac : hiérarchie des actions pendant la manche');
w.chStart(); w.render();
ok('zone de sortie regroupée', app().includes('Arrêter cette manche'));
ok('« Terminer » explicite', app().includes('Terminer et désigner le vainqueur'));
ok('« Abandonner » explicite', app().includes('Abandonner sans compter'));
ok('doublon « Nouvelle manche » supprimé', !app().includes('⟲ Nouvelle manche'));
ok('les actions de jeu restent en haut', app().indexOf('Bonne réponse')<app().indexOf('Arrêter cette manche'));

L('[3] Passerelle Tic-Tac → La Coupe');
ok('chToCoupe exposé', typeof w.chToCoupe==='function');
w.CH.players.forEach((p,i)=>{p.good=3+i;});
w.chFinishNow(); w.render();
ok('bouton proposé en fin de manche', app().includes('Compter cette manche dans La Coupe'));
w.chToCoupe();
ok('feuille de choix ouverte', !!w.document.getElementById('tcsh'));
ok('option nouvelle partie', body().includes('Nouvelle partie'));
const before=w.D.matches.length;
w.chToCoupeGo('');
ok('une partie a été créée', w.D.matches.length===before+1);
const m=w.D.matches[0];
ok('la manche contient les ✓ comme points', m.rounds.length===1 && Object.values(m.rounds[0].scores).some(v=>v>=3));
ok('les joueurs sont repris', m.players.length===w.CH.players.length);
ok('on atterrit dans La Coupe', w.S.view==='match' && w.S.matchId===m.id);

L('[4] Micro : équipes simples (toucher pour changer)');
w.go('quizz'); w.setMicroTeams(true); w.render();
ok('microSwapTeam exposé', typeof w.microSwapTeam==='function');
ok('badges ÉQUIPE 1 / 2 affichés', app().includes('ÉQUIPE 1') && app().includes('ÉQUIPE 2'));
ok('consigne de manipulation claire', app().includes('Touche un joueur pour changer'));
const n0=w.microTeam()[0];
const wasA=w.D.microTeams.a.includes(n0);
w.microSwapTeam(n0);
ok('le joueur a changé d\'équipe', w.D.microTeams.a.includes(n0)!==wasA);
const tot=w.D.microTeams.a.length+w.D.microTeams.b.length;
ok('aucun joueur perdu ni dupliqué', tot===w.microTeam().length && new Set([...w.D.microTeams.a,...w.D.microTeams.b]).size===tot);
ok('tirage au sort toujours possible', app().includes('Tirer au sort'));

L('[5] Micro : on sait ce que fait chaque ambiance');
ok('tous les styles ont une explication', w.MICRO_STYLES.filter(s=>s.txt).every(s=>!!s.hint));
w.setMicroStyle('voiture'); w.render();
ok('explication « En voiture » visible', app().includes('énonciation lente'));
w.setMicroStyle('apero'); w.render();
ok('explication « Apéro » visible', app().includes('ambiance détendue'));
w.setMicroStyle('classique'); w.render();
ok('Classique explicité aussi', app().includes('Animation standard'));

L('[6] Identité couleur par rubrique');
w.go('chrono'); w.render(); ok('Tic-Tac → classe ambre', cls().includes('sc-tictac'));
w.go('quizz');  w.render(); ok('Micro → classe violette', cls().includes('sc-micro'));
w.go('outils'); w.render(); ok('Outils → classe teal', cls().includes('sc-outils'));
w.go('points'); w.render(); ok('La Coupe → classe verte', cls().includes('sc-coupe'));
ok('CSS scopé défini', html.includes('.sc-micro  .chip.on') && html.includes('.sc-tictac .stepn'));

L('[7] Les Outils : vraie rubrique');
w.go('home'); w.render();
ok('carte « Les Outils » sur l\'accueil', app().includes('Les Outils'));
ok('accessible comme les 3 jeux', app().includes("go('outils')"));
ok('plus de liste d\'outils en vrac', !app().includes('Les outils de table'));
w.go('outils'); w.render();
for(const t of ['Les Dés','Le Buzzer','Qui commence ?']) ok('rubrique contient « '+t+' »', app().includes(t));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
