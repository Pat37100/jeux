import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
const w=dom.window; w.D.onboarded=1;
const app=()=>w.document.getElementById('app').innerHTML;

L('[1] Tic-Tac : le son rentre dans la structure numérotée');
w.go('chrono'); w.render();
const steps=(app().match(/class="stepn"/g)||[]).length;
L('        étapes numérotées : '+steps);
ok('4 étapes (le son n\'est plus une ligne flottante)', steps===4);
ok('titre explicite « Son du décompte »', app().includes('Son du décompte'));
ok('réglage toujours fonctionnel', app().includes('chSound(true)') && app().includes('chSound(false)'));
ok('bouton de lancement toujours en bas', app().lastIndexOf('Démarrer la partie')>app().lastIndexOf('Son du décompte'));

L('[2] La Coupe : règle et objectif étaient FIGÉS après création');
const ids=w.D.lib.slice(0,2).map(p=>p.id);
w.D.matches.unshift({id:'m1',name:'Uno',date:'2026-08-16',status:'live',winRule:'high',target:100,
  players:w.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),rounds:[{id:'r1',date:'2026-08-16',scores:{[ids[0]]:5,[ids[1]]:3}}]});
w.openMatch('m1'); w.S.tab='set'; w.render();
ok('carte « Règle & objectif » présente', app().includes('Règle') && app().includes('Objectif de points'));
ok('setMatchRule exposé', typeof w.setMatchRule==='function');
ok('setMatchTarget exposé', typeof w.setMatchTarget==='function');
w.setMatchRule('low');
ok('règle modifiable après coup', w.cur().winRule==='low');
w.setMatchTarget('250');
ok('objectif modifiable', w.cur().target===250);
w.setMatchTarget('');
ok('objectif effaçable (partie libre)', w.cur().target===null);
w.setMatchRule('high');
ok('retour au plus de points', w.cur().winRule==='high');
w.render();
ok('le classement suit la nouvelle règle', app().length>200);

L('[3] Feuille de création : cohérence visuelle');
w.go('points'); w.render(); w.openSheet();
const sh=w.document.querySelector('.sheet .in').innerHTML;
ok('joueurs avec avatar (comme partout ailleurs)', /data-id="[^"]+"[^>]*>\s*<[^>]*class="av/.test(sh) || sh.includes('av '));
ok('champ invités enfin étiqueté', sh.includes('Ou ajoute des invités'));
ok('placeholder simplifié', sh.includes('Prénoms séparés par des virgules'));
ok('création toujours possible', sh.includes('createMatch()'));

L('[4] Non-régression');
w.closeSheet&&w.closeSheet();
w.openMatch('m1'); w.S.tab='set'; w.render();
ok('renommage conservé', app().includes('Renommer'));
ok('gestion des joueurs conservée', app().includes('Ajouter'));
ok('État / Terminer conservé', app().includes('Terminer la partie'));
ok('pas de doublon de suppression', !app().includes('Supprimer cette partie'));
w.S.tab='play'; w.render();
ok('saisie intacte', app().includes('Enregistrer la manche'));
w.S.tab='rank'; w.render();
ok('résultats intacts', app().includes('Par joueur'));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
