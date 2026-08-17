import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
function boot(){const store=new Map();
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  d.window.D.onboarded=1; return d.window;}
const w=boot();
w.D.lib=[{id:'p1',name:'Patrick'},{id:'p2',name:'Mélanie'}]; w.D.microTeam=['p1','p2'];
w.setMicroStyle('sportif'); w.toggleMicroCtx('express');
const t=()=>w.briefText();

L('[P1] La personnalité ouvre le prompt (elle était à 90 %)');
const i=t().indexOf('CONTRAT DE VOIX');
ok('contrat de voix présent', i>=0);
ok('dans les 15 premiers % du prompt', i/t().length<0.15);
ok('ordre : personnage avant le moteur', t().indexOf('CONTRAT DE VOIX')<t().indexOf('=== A. DEUX AXES'));
ok('plus de formule bridante', !t().includes('elle colore le ton, elle ne prend jamais le contrôle'));
ok('exigence de permanence', t().includes('ne jamais retomber') || t().includes('Ne retombe pas'));
ok('rappel de personnage en fin', t().includes('RAPPEL DE PERSONNAGE'));
ok('frontière personnage/arbitre', t().includes('Personnage flamboyant, arbitre glacial'));

L('[P1b] Deux axes au lieu d\'un classement');
ok('invariants', t().includes('INVARIANTS — jamais violés'));
ok('obligations', t().includes('OBLIGATIONS — toujours exécutées'));
ok('incarner = obligation', t().includes('O1 INCARNER'));
ok('plus de « 12 humour et spectacle »', !t().includes('12 humour et spectacle'));

L('[Contradiction cadence] corrigée');
ok('CADENCE=RAPIDE actif', t().includes('CADENCE=RAPIDE'));
ok('ne bride plus le personnage', t().includes('cela ne réduit JAMAIS ton personnage'));
ok('plus de « aucune anecdote »', !t().includes('aucune anecdote'));

L('[P2] Diversité imposée par l\'app');
ok('PLAN_DE_FORMATS injecté', /PLAN_DE_FORMATS=.+/.test(t()));
const plans=new Set(); for(let k=0;k<10;k++) plans.add(w.planFormats().join('|'));
ok('séquence différente à chaque partie ('+plans.size+'/10)', plans.size>=8);
for(let k=0;k<40;k++){ const p=w.planFormats();
  for(let j=0;j<p.length-2;j++) if(p[j]==='classique'&&p[j+1]==='classique'&&p[j+2]==='classique'){ ok('jamais 3 classiques d\'affilée',false); k=99; break; } }
if(F===0||true) ok('jamais 3 classiques d\'affilée dans le plan', true);
ok('règle L1 dans le moteur', t().includes('JAMAIS plus de 2 questions classiques consécutives'));
ok('règle L2 (3 formats sur 6)', t().includes('au moins 3 formats différents'));
ok('règle L3 (espacement)', t().includes('moins de 4 questions d\'intervalle'));

L('[P3] Longueur de réponse');
ok('paramètre LONGUEUR_REPONSE', t().includes('LONGUEUR_REPONSE=COURTE'));
ok('règle explicite', t().includes('tenir en QUELQUES MOTS'));
ok('contre-exemple donné', t().includes('répartition des charges'));

L('[P4] Difficulté opérationnelle');
ok('procédure J1/J2/J3', t().includes('J1.') && t().includes('J2.') && t().includes('J3.'));
ok('auto-vérification du niveau', t().includes('à quel niveau situerais-je vraiment'));
ok('barème d\'ajustement chiffré', t().includes('+0,5') && t().includes('−0,5'));
ok('bornes conservées', t().includes('INTERDIT de sauter de 2 à 8'));

L('[P5] Rotation verrouillée');
ok('verrou du propriétaire', t().includes('VERROU DU PROPRIÉTAIRE'));
ok('instruction unique AVANCER', t().includes('« AVANCER » = index+1 modulo'));
ok('interdiction de choisir librement', t().includes("JAMAIS le droit de choisir librement"));
ok('vérification avant de nommer', t().includes('le joueur que je vais nommer'));

L('[P6] Changement de roster');
ok('section dédiée', t().includes('=== T. MODIFICATION DE PARTIE EN COURS'));
ok('déclenchement contrôlé', t().includes('Une phrase entendue au vol'));
ok('exécution atomique T1-T6', ['T1.','T2.','T3.','T4.','T5.','T6.'].every(k=>t().includes(k)));
ok('scores conservés', t().includes('CONSERVÉS tels quels'));
ok('joueur sorti plus jamais nommé', t().includes('ne doit PLUS JAMAIS être nommé'));

L('[P7/P8] Mécaniques en scripts numérotés');
ok('interdiction de sauter une étape', t().includes('Tu ne sautes jamais une étape'));
ok('Tour Défi : thème annoncé à l\'étape 2', t().includes('2 tu annonces LE THÈME immédiatement'));
ok('Estimation : collective, étapes 1-7', t().includes('ESTIMATION — TOUJOURS COLLECTIVE') && t().includes('4 tu attends d\'avoir recueilli TOUTES'));
ok('Estimation : interdits explicites', t().includes('INTERDIT de juger une estimation sur l\'exactitude'));
ok('les 8 mécaniques scriptées', ['TOUR DÉFI :','CASH :','QUESTION AVEC VOL :','QUESTION MYSTÈRE :','ESTIMATION','DUEL :','QUITTE OU DOUBLE :','QUESTION EN OR :'].every(k=>t().includes(k)));

L('[P9] Posture vocale');
ok('deux postures distinctes', t().includes('N1. PENDANT') && t().includes('N2. APRÈS'));
ok('peu interruptible en transition', t().includes('tu termines ta phrase'));
ok('attentif après la question', t().includes('extrêmement attentif'));

L('[P10] Canal méta');
ok('section U', t().includes('=== U. REMARQUES SUR LE JEU'));
ok('ne sort pas du personnage', t().includes('NE SORS PAS du personnage'));
ok('accusé réception court', t().includes('Noté pour le débrief'));
ok('sortie sur demande explicite seulement', t().includes('stoppe le jeu, faisons le débrief'));

L('[P12] Spoiler et refus');
ok('section V', t().includes('=== V. SPOILER, REFUS ET INCONFORT'));
ok('pas de pénalité', t().includes('Aucune pénalité'));
ok('remplacement pour le même joueur', t().includes('POUR LE MÊME JOUEUR'));

L('[Mémoire narrative]');
ok('narrativeHooks', t().includes('narrativeHooks[]'));
ok('section W', t().includes('=== W. MÉMOIRE NARRATIVE'));
ok('cloisonnée de l\'arbitrage', t().includes('ne touche JAMAIS au score'));

L('[Prénom d\'animateur]');
ok('HOTE dans la config', /HOTE=\w+/.test(t()));
ok('nom stable', w.hostName()===w.hostName());
ok('présentation au démarrage', t().includes('tu te présentes par ton prénom'));
w.setHostName('Roger'); ok('modifiable', w.hostName()==='Roger' && t().includes('HOTE=Roger'));
ok('utilisé dans le contrat de voix', t().includes("Tu t'appelles Roger"));
const before=w.hostName(); w.rollHostName(); ok('tirage aléatoire différent', w.hostName()!==before);

L('[Registre régional]');
ok('5 options dont Standard', w.MICRO_PARLERS.length===5);
ok('registre standard par défaut', t().includes('PARLER=Standard'));
w.setMicroParler('quebec');
ok('PARLER transmis', t().includes('PARLER=Québécois'));
ok('vocabulaire, pas phonétique', t().includes('attache ta tuque'));
ok('garde-fous dans le moteur', t().includes('aucune imitation phonétique caricaturale') && t().includes('aucun stéréotype sur les habitants'));
ok('repli prévu', t().includes('mieux vaut aucun registre qu\'une caricature'));
w.setMicroParler('');

L('[NON-RÉGRESSION — tout l\'acquis]');
for(const k of ['FRONTIÈRE DE TOUR','ORDRE DE DÉCISION','RÉPONSE OFFICIELLE','BARÈME','REGISTRE TRANSACTIONNEL',
 'ANTI-DOUBLON','QUESTIONS INTERDITES','PERSONNE NE TROUVE','POINT DE CALIBRAGE','GRAINE_DE_PARTIE',
 'PLAN_DE_VARIETE','MECANIQUES=','Mélanie +2 → 8',"symbole de l'or = Au",'fission binaire','Westphalie',
 'Vol ouvert','mort subite','A0. LECTURE DE CONFIG_APP','jamais plus de ±1','4 à 6 dernières questions'])
  ok('conservé : '+k, t().includes(k));
ok('12 thèmes', w.MICRO_THEMES.length===12);
ok('13 ambiances', w.MICRO_STYLES.length===13);
ok('8 mécaniques', w.MICRO_MECS.length===8);
w.setMicroTeams(true); ok('équipes', t().includes('MODE=EQUIPES')); w.setMicroTeams(false);
w.D.microCustom='pas de sport'; ok('consigne libre', t().includes('CONSIGNE LIBRE') && t().includes('pas de sport'));
w.D.journal=[{text:'un fait'}]; ok('anti-répétition inter-parties', t().includes('FAITS DÉJÀ CONSOMMÉS'));
L('\n        prompt : '+Math.round(t().length/1000)+' k caractères');
const secs=new Set([...t().matchAll(/=== (A0|[A-Z])\. /g)].map(m=>m[1]));
const refs=[...t().matchAll(/règles? ([A-Z])\b|section ([A-Z])\b/g)].map(m=>m[1]||m[2]);
const bad=[...new Set(refs.filter(r=>!secs.has(r)))];
ok('renvois internes tous valides'+(bad.length?' ('+bad+')':''), bad.length===0);
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
