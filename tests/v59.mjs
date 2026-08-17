import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
function boot(seed){const store=new Map();
  if(seed) store.set('jeux-famille-v1', seed);
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  d.window.D.onboarded=1; return d.window;}
const w=boot(); const app=()=>w.document.getElementById('app').innerHTML;
w.go('quizz'); w.S.qc4=true; w.S.qc5=true; w.render();

L('[1] Les mécaniques deviennent choisissables');
ok('carte « Mécaniques du jeu »', app().includes('Mécaniques du jeu'));
ok('8 mécaniques proposées', w.MICRO_MECS.length===8);
for(const m of ['Tour Défi','Cash','vol','Mystère','Estimation','Duel','Quitte ou double','Question en or'])
  ok('mécanique « '+m+' »', app().includes(m));
ok('chacune est expliquée', w.MICRO_MECS.every(m=>app().includes(m.hint.slice(0,22))));
ok('7 étapes numérotées', (app().match(/class="stepn"/g)||[]).length===7);

L('[2] Par défaut : TOUT activé (aucune régression)');
ok('les 8 actives au départ', w.microMecs().length===8);
let t=w.briefText();
ok('CONFIG_APP liste les mécaniques', /MECANIQUES=.+/.test(t));
for(const m of ['Tour Défi','Cash','Question avec vol','Question Mystère','Estimation','Duel','Quitte ou double','Question en or'])
  ok('« '+m+' » transmise', t.includes(m));

L('[3] Désactivation réellement transmise au prompt');
w.toggleMicroMec('quitte'); w.toggleMicroMec('duel');
ok('2 retirées', w.microMecs().length===6);
t=w.briefText();
const line=(t.match(/MECANIQUES=([^\n]+)/)||[])[1];
ok('la liste ne contient plus Duel', !line.includes('Duel'));
ok('ni Quitte ou double', !line.includes('Quitte'));
ok('mais garde Cash et vol', line.includes('Cash') && line.includes('vol'));
ok('règle de filtrage dans le moteur', t.includes('Tu n\'utilises QUE les mécaniques listées') && t.includes('sont interdites'));
ok('rappel dans la lecture de config', t.includes('liste EXHAUSTIVE des mécaniques autorisées'));

L('[4] Cas extrême : aucune mécanique');
w.setAllMecs(false);
ok('liste vide', w.microMecs().length===0);
t=w.briefText();
ok('config explicite', t.includes('AUCUNE — questions classiques uniquement'));
ok('consigne de repli', t.includes('questions classiques uniquement'));
w.setAllMecs(true);
ok('tout réactivable', w.microMecs().length===8);

L('[5] Nouvelle mécanique « Question en or »');
t=w.briefText();
ok('décrite dans le moteur', t.includes('QUESTION EN OR'));
ok('barème doublé', t.includes('4 points sans propositions, 2 après'));
ok('annoncée avant', t.includes('AVANT de poser'));
ok('usage limité', t.includes('2 fois maximum par partie'));

L('[6] Les 7 mécaniques d\'origine sont intactes dans le moteur');
for(const k of ['TOUR DÉFI','CASH','QUESTION AVEC VOL','QUESTION MYSTÈRE','ESTIMATION','DUEL','QUITTE OU DOUBLE'])
  ok('moteur : '+k, t.includes(k));
ok('procédure de vol intacte', t.includes('Vol ouvert') && t.includes('avant « Vol ouvert » ne rapporte rien'));
ok('estimation collective intacte', t.includes('tu demandes une valeur à CHAQUE joueur'));
ok('Tour Défi calibré intact', t.includes('un 5/5 doit être nettement plus dur'));

L('[7] Non-régression générale');
for(const k of ['INVARIANTS',"T'ARRÊTES DE PARLER",'Mélanie +2 → 8','PERSONNE NE TROUVE','QUESTIONS INTERDITES',
                'POINT DE CALIBRAGE','GRAINE_DE_PARTIE','A0. LECTURE DE CONFIG_APP'])
  ok('conservé : '+k, t.includes(k));
w.setMicroStyle('taquin'); w.toggleMicroCtx('voiture'); w.D.microCustom='évite le sport';
t=w.briefText();
ok('ambiance + contexte + consigne cumulés', ['RAPPEL DE PERSONNAGE','CONTEXTE ET RYTHME','CONSIGNE LIBRE'].every(k=>t.includes(k)));
ok('mécaniques dans CONFIG_APP', t.indexOf('MECANIQUES=')<t.indexOf('</CONFIG_APP>'));

L('[8] Migration : ancien utilisateur sans réglage de mécaniques');
const w2=boot(JSON.stringify({onboarded:1, microStyle:'taquin'}));
w2.go('quizz'); w2.S.qc4=true; w2.S.qc5=true; w2.render();
ok('toutes actives par défaut', w2.microMecs().length===8);
ok('prompt complet', w2.briefText().includes('MECANIQUES=') && w2.briefText().includes('Tour Défi'));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
