import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
const w=dom.window; w.D.onboarded=1; w.go('quizz'); w.render();
const app=()=>w.document.getElementById('app').innerHTML;
const t=w.briefText();

L('[1] L\'app le dit (consigne restaurée après la sur-correction v46)');
ok('rappel du mode vocal sous le bouton', app().includes('mode vocal'));
ok('reste une seule ligne', (app().match(/mode vocal/g)||[]).length===1);

L('[2] Le moteur prévient — SANS bloquer');
ok('phrase d\'ouverture prévue', t.includes('PREMIÈRE PRISE DE PAROLE'));
ok('enchaîne dans le même message', t.includes('ENCHAÎNES IMMÉDIATEMENT'));
ok('aucune confirmation attendue', t.includes("n'attends aucune confirmation"));
ok('ne bloque jamais le démarrage', t.includes('ne bloques jamais le démarrage'));
ok('la partie se joue même à l\'écrit', t.includes("si les joueurs répondent à l'écrit"));

L('[3] Le moteur s\'adapte au mode écrit');
ok('section des deux modes', t.includes('MODE DE JEU, ORAL ET BRUIT'));
ok('à l\'écrit : auteur explicite', t.includes("l'auteur de chaque message est explicite"));
ok('à l\'écrit : vérifier quand même questionOwner', t.includes('bien questionOwner qui répond'));
ok('rappel unique, sans insister', t.includes('une seule fois, sans insister'));
ok('règles orales conservées', t.includes("À L'ORAL") && t.includes('à plusieurs voix'));

L('[4] Non-régression : démarrage toujours immédiat');
ok('pas de préambule réintroduit', t.includes('Aucun rappel de règles'));
ok('ne demande jamais qui joue', t.includes('ne demande jamais qui joue'));
for(const k of ['PRIORITÉS',"T'ARRÊTES DE PARLER",'PERSONNE NE TROUVE','Vol ouvert','POINT DE CALIBRAGE','QUESTIONS INTERDITES'])
  ok('conservé : '+k, t.includes(k));
ok('13 ambiances', w.MICRO_STYLES.length===13);
ok('diversité app active', /GRAINE_DE_PARTIE=\d+/.test(t));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
