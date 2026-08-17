import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
const w=dom.window; w.D.onboarded=1;

L('══ NON-RÉGRESSION : chaque fonctionnalité de l\'ancien moteur ══');
const t=w.briefText();
const MUST={
 'rotation joueurs':'currentPlayerIndex','ordre figé':'players[]','scores':'scores{}','objectif':'targetScore',
 'barème 2 points':'2 points','barème 1 point':'1 point','réponse officielle':'réponse officielle',
 'QCM propositions':'A/B/C/D','Tour Défi':'Tour Défi','Cash':'CASH','Question avec vol':'QUESTION AVEC VOL',
 'Question Mystère':'QUESTION MYSTÈRE','Estimation':'ESTIMATION','Duel':'DUEL','Quitte ou double':'QUITTE OU DOUBLE',
 'logique/énigmes':'énigmes','difficulté 1-8':'Échelle 1-8','difficulté par catégorie':'categoryDifficulty',
 'variété domaines':'mythologie','anti-doublon':'ANTI-DOUBLON','arbitrage':'ARBITRAGE','fin de partie':'FIN DE PARTIE',
 'oral et bruit':'BRUIT','rythme':'RYTHME','qualité questions':'=== K. QUALITÉ','démarrage':'DÉMARRAGE',
 'principe directeur':'PRINCIPE DIRECTEUR'};
for(const [k,v] of Object.entries(MUST)) ok('conservé : '+k, t.includes(v));

L('\n══ COUCHES ══');
ok('couche 1 CONFIG_APP en tête', t.startsWith('<CONFIG_APP>'));
ok('config contient MODE/JOUEURS/OBJECTIF', ['MODE=','JOUEURS=','OBJECTIF=','AMBIANCE=','THEME='].every(k=>t.includes(k)));
ok('couche 2 moteur présent', t.includes('=== A. PRIORITÉS'));
ok('couche 3 après le moteur', t.indexOf('COUCHE 3')>t.indexOf('=== S.') || !t.includes('COUCHE 3'));

L('\n══ CORRECTIFS DU TEST RÉEL (problèmes 1→10) ══');
ok('P1 rotation mécanique', t.includes('jamais autrement') && t.includes('retour au premier'));
ok('P2 identité avant exactitude', t.includes("jamais l'exactitude avant l'identité"));
ok('P3 frontière de tour', t.includes('FRONTIÈRE DE TOUR') && t.includes("T'ARRÊTES DE PARLER"));
ok('P4 hésitation non tranchée', t.includes("Ta réponse officielle ?") && t.includes("Newton"));
ok('P5 choicesStarted non rétroactif', t.includes('jamais rétroactivement') && t.includes("Si tu n'as pas énoncé A"));
ok('P6 registre transactionnel', t.includes('REGISTRE TRANSACTIONNEL') && t.includes('Mélanie +2 → 8'));
ok('P7 anti-doublon sur les faits', t.includes("symbole de l'or") && t.includes('question annulée'));
ok('P8 difficulté progressive ±0,5', t.includes('±0,5') && t.includes('INTERDIT de sauter de 2 à 8'));
ok('P9 qualité (mitose/Westphalie)', t.includes('fission binaire') && t.includes('Westphalie'));
ok('P10 mécaniques procédurales', t.includes('Vol ouvert') && t.includes('Jamais notée sur l\'exactitude'));

L('\n══ CAS DE TEST A→K (section 27) ══');
ok('A rotation cyclique', t.includes('modulo') && t.includes('retour au premier'));
ok('B mauvais répondant → 0 point', t.includes('personne ne marque'));
ok('C hésitation → demander', t.includes("Je pense Newton"));
ok('D barème avant/après A', t.includes('choicesStarted = false → 2 points'));
ok('E fait brûlé même si annulée', t.includes('revealedFacts'));
ok('F score non modifiable sur affirmation', t.includes("jamais un score parce qu'un joueur l'affirme"));
ok('G pas de saut 2→8', t.includes('tu montes de 1 au maximum'));
ok('H Tour Défi calibré', t.includes('gravitation universelle'));
ok('I estimation compétitive', t.includes('TOUS les joueurs') && t.includes('plus proche gagne'));
ok('J vol après annonce', t.includes('avant « Vol ouvert » ne rapporte rien'));
ok('K humour sans toucher au score', t.includes('mauvaise foi comique') && t.includes('froid et exact'));

L('\n══ AMBIANCES TYPÉES (section 22) ══');
const kinds={};
w.MICRO_STYLES.forEach(s=>{kinds[s.kind]=(kinds[s.kind]||0)+1;});
ok('les 9 ambiances d\'origine sont conservées', ['classique','show','prof','taquin','famille','express','costaud','voiture','apero'].every(id=>w.MICRO_STYLES.some(s=>s.id===id)) && w.MICRO_STYLES.length>=9);
ok('4 familles typées', Object.keys(kinds).length===4);
L('        '+JSON.stringify(kinds));
w.toggleMicroCtx('costaud'); ok('Costaud → NIVEAU_INITIAL=7', w.briefText().includes('NIVEAU_INITIAL=7'));
w.toggleMicroCtx('voiture'); ok('En voiture → CONTEXTE=VOITURE_BRUIT', w.briefText().includes('CONTEXTE=VOITURE_BRUIT'));
w.toggleMicroCtx('express'); ok('Express → CADENCE=RAPIDE + objectif 8', w.briefText().includes('CADENCE=RAPIDE') && w.briefText().includes('OBJECTIF=8'));
w.setMicroStyle('taquin'); ok('Taquin → incarnation élevée', w.briefText().includes("NIVEAU D'INCARNATION"));
w.setMicroStyle('show');   ok('Grand show → incarnation élevée', w.briefText().includes("NIVEAU D'INCARNATION"));
w.setMicroStyle('classique'); ok('Classique → pas de surcouche perso', !w.briefText().includes("NIVEAU D'INCARNATION"));

L('\n══ OPTIONS EXISTANTES : aucune perte ══');
ok('thèmes conservés (12 depuis la v61)', w.MICRO_THEMES.length>=9);
w.setMicroTheme('8090'); ok('thème injecté', w.briefText().includes('THÈME DOMINANT') && w.briefText().includes('1980'));
w.setMicroGoal(30); ok('objectif personnalisé', w.briefText().includes('OBJECTIF=30'));
w.setMicroTeams(true); const te=w.briefText();
ok('mode équipes', te.includes('MODE=EQUIPES') && te.includes('EQUIPE_1='));
ok('équipes : rotation préservée', te.includes('currentPlayerIndex reste mécanique'));
w.setMicroTeams(false);
w.D.microCustom='années 90'; ok('touche perso', w.briefText().includes('CONSIGNE LIBRE'));
w.D.journal=[{text:'astronomie — Triton'}]; ok('journal chargé dans askedFacts', w.briefText().includes('askedFacts[] (section I)'));
ok('liste des joueurs en fin', w.briefText().trim().endsWith('.'));
L('\n        taille du prompt généré : '+Math.round(w.briefText().length/1000)+' k caractères');
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
