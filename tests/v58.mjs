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
w.go('quizz'); w.render();

L('[1] Structure : 6 étapes numérotées cohérentes');
const steps=(app().match(/class="stepn"/g)||[]).length;
L('        étapes : '+steps);
ok('6 cartes numérotées', steps===6);
for(const s of ['Qui joue','Ambiance de l','Thème','Contexte','assistant IA','Consigne libre'])
  ok('étape « '+s+' »', app().includes(s));
ok('Consigne libre en dernier avant le bouton',
   app().lastIndexOf('Consigne libre')<app().lastIndexOf('Générer et lancer') &&
   app().lastIndexOf('Consigne libre')>app().lastIndexOf('assistant IA'));

L('[2] LE DÉFAUT CORRIGÉ : personnalité et contexte se cumulent');
w.setMicroStyle('taquin');
w.toggleMicroCtx('voiture');
ok('la personnalité survit au choix du contexte', w.D.microStyle==='taquin');
ok('le contexte est mémorisé', w.microCtx().includes('voiture'));
let t=w.briefText();
ok('prompt : Taquin présent', t.includes('pince-sans-rire'));
ok('prompt : En voiture présent', t.includes('CONTEXTE=VOITURE_BRUIT') && t.includes('énonciation lente'));
ok('prompt : incarnation Taquin conservée', t.includes("NIVEAU D'INCARNATION"));

L('[3] Cumul des trois contextes (ta spec : Taquin + Costaud + En voiture)');
w.toggleMicroCtx('costaud'); w.toggleMicroCtx('express');
t=w.briefText();
ok('3 contextes cumulés', w.microCtx().length===3);
ok('NIVEAU_INITIAL=7 (Costaud)', t.includes('NIVEAU_INITIAL=7'));
ok('CADENCE=RAPIDE (Express)', t.includes('CADENCE=RAPIDE'));
ok('CONTEXTE=VOITURE_BRUIT', t.includes('CONTEXTE=VOITURE_BRUIT'));
ok('objectif ramené à 8 par Express', t.includes('OBJECTIF=8'));
ok('bloc CONTEXTE ET RYTHME listé', t.includes('CONTEXTE ET RYTHME') && (t.match(/\n- /g)||[]).length>=3);
ok('ambiance toujours distincte', t.includes('AMBIANCE SÉLECTIONNÉE') && t.includes('pince-sans-rire'));
ok('les contextes ne remplacent pas l\'ambiance', t.includes("s'ajoutent à l'ambiance sans la remplacer"));

L('[4] Désélection propre');
w.toggleMicroCtx('express');
ok('Express retiré', !w.microCtx().includes('express'));
ok('les autres restent', w.microCtx().includes('costaud') && w.microCtx().includes('voiture'));
t=w.briefText();
ok('CADENCE repasse à NORMALE', t.includes('CADENCE=NORMALE'));
ok('objectif revient à 15', t.includes('OBJECTIF=15'));

L('[5] Migration des anciens réglages (utilisateur qui avait choisi « En voiture »)');
const w2=boot(JSON.stringify({onboarded:1, microStyle:'voiture'}));
w2.go('quizz'); w2.render();
ok('l\'ancien choix bascule en contexte', w2.microCtx().includes('voiture'));
ok('l\'ambiance repasse à Classique', w2.D.microStyle==='classique');
ok('rien n\'est perdu dans le prompt', w2.briefText().includes('CONTEXTE=VOITURE_BRUIT'));

L('[6] Ambiances : un seul choix, contextes : plusieurs');
w.setMicroStyle('sportif');
ok('changer d\'ambiance remplace la précédente', w.D.microStyle==='sportif' && !w.briefText().includes('pince-sans-rire'));
ok('les contextes ne bougent pas', w.microCtx().length===2);
ok('10 personnalités proposées', w.MICRO_STYLES.filter(s=>s.kind==='personnalite').length===10);
ok('3 contextes proposés', w.MICRO_STYLES.filter(s=>s.kind!=='personnalite').length===3);
w.render();
ok('chaque contexte a son explication', ['express','costaud','voiture'].every(id=>{
  const s=w.MICRO_STYLES.find(x=>x.id===id); return s.hint && app().includes(s.hint.slice(0,20));}));

L('[7] Non-régression du prompt');
t=w.briefText();
for(const k of ['PRIORITÉS',"T'ARRÊTES DE PARLER",'Mélanie +2 → 8','Vol ouvert','PERSONNE NE TROUVE',
                'QUESTIONS INTERDITES','POINT DE CALIBRAGE','A0. LECTURE DE CONFIG_APP','GRAINE_DE_PARTIE'])
  ok('conservé : '+k, t.includes(k));
w.D.microCustom='évite le sport';
ok('consigne libre injectée', w.briefText().includes('CONSIGNE LIBRE') && w.briefText().includes('évite le sport'));
w.setMicroTheme('8090'); ok('thème', w.briefText().includes('THÈME DOMINANT'));
w.setMicroTeams(true); ok('équipes', w.briefText().includes('MODE=EQUIPES'));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
