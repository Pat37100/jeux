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
const ids=w.D.lib.slice(0,3).map(p=>p.id);

L('[1] Nom conservé, formulation corrigée');
w.go('home'); w.S.explain=true; w.render();
ok('ne dit plus « n\'est pas un jeu »', !app().includes("n'est pas un jeu"));
ok('bloc explicatif retiré en v46 (rien ne contredit le nom)', !app().includes("n'est pas un jeu"));

L('[2] Les outils sont regroupés dans leur rubrique (v44)');
w.go('home'); w.render();
ok('carte « Les Outils » sur l\'accueil', app().includes('Les Outils'));
w.go('outils'); w.render();
for(const t of ['Les Dés','Le Buzzer','Qui commence ?']) ok('outil « '+t+' » accessible', app().includes(t));
ok('pas de doublon Qui commence', (app().match(/Qui commence \?/g)||[]).length===1);
w.go('home'); w.render();

L('[3] Les Dés : fonctionnement réel');
ok('openDice exposé', typeof w.openDice==='function');
w.openDice();
ok('feuille ouverte', !!w.document.getElementById('dish'));
ok('propose d6 et d20', body().includes('>d6<') && body().includes('>d20<'));
w.setDiceType(20); ok('type d20 mémorisé', w.D.dice.type===20);
w.setDiceN(3);     ok('3 dés mémorisés', w.D.dice.n===3);
// lancer : on force la résolution du timer
w.rollDice();
await new Promise(r=>setTimeout(r,700));
const last=w.DICE_LAST;
ok('un résultat est produit', !!last && last.vals.length===3);
ok('valeurs dans la plage 1..20', !!last && last.vals.every(v=>v>=1&&v<=20));
ok('total affiché pour plusieurs dés', body().includes('Total'));
ok('passerelle vers « Qui commence ? »', body().includes('Plutôt : qui commence'));
w.setDiceType(6); w.setDiceN(1); w.rollDice();
await new Promise(r=>setTimeout(r,700));
ok('d6 : valeur entre 1 et 6', w.DICE_LAST.vals.every(v=>v>=1&&v<=6));

L('[4] La Coupe : bandeau champions dans les 4 vues');
w.D.matches.unshift({id:'m1',name:'T',date:'2026-08-14',status:'live',winRule:'high',target:99,
  players:w.D.lib.slice(0,3).map(p=>({id:p.id,name:p.name})),
  rounds:[{id:'r3',date:'2026-08-14',scores:{[ids[0]]:5,[ids[1]]:3,[ids[2]]:1}},
          {id:'r2',date:'2026-08-13',scores:{[ids[0]]:4,[ids[1]]:6,[ids[2]]:2}},
          {id:'r1',date:'2026-08-12',scores:{[ids[0]]:7,[ids[1]]:2,[ids[2]]:9}}]});
w.openMatch('m1'); w.S.period='all'; w.render();
for(const m of ['rank','grid','graph','list']){ w.setResMode(m);
  ok(m+' : « Meilleur cumul » présent', app().includes('Meilleur cumul'));
  ok(m+' : « Plus de victoires » présent', app().includes('Plus de victoires')); }
ok('pas de doublon du bandeau en vue Par joueur',
   (function(){w.setResMode('rank');return (app().match(/Meilleur cumul/g)||[]).length===1;})());

L('[5] Tic-Tac : ligne joueur alignée + en-têtes');
w.go('chrono'); w.render();
ok('grille de colonnes appliquée', app().includes('class="chrow"'));
ok('en-têtes Nom / Temps', app().includes('>Nom<') && app().includes('>Temps<'));
ok('unité « s » sur le champ temps', app().includes('secwrap'));

L('[6] Hiérarchie de couleurs : l\'action qui lance est distincte');
ok('Tic-Tac : bouton ambre', app().includes('class="btn tictac"'));
w.go('quizz'); w.render();
ok('Le Micro : bouton violet', app().includes('class="btn micro"'));
ok('CSS des 3 variantes défini', html.includes('button.btn.tictac') && html.includes('button.btn.micro') && html.includes('button.btn.dice'));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
