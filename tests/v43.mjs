import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
const w=dom.window; w.D.onboarded=1;
const app=()=>w.document.getElementById('app').innerHTML;
w.go('quizz'); w.render();
const BASE=w.MICRO_PROMPT;

L('[1] Les 4 étapes du Micro');
for(const s of ['Qui joue','Ambiance','Thème &amp; objectif','Ton assistant IA']) ok('étape « '+s+' »', app().includes(s));

L('[2] Thèmes disponibles et injectés');
ok('9 thèmes', w.MICRO_THEMES.length===9);
for(const t of ['8090','ados','sport','fete']) ok('thème '+t, w.MICRO_THEMES.some(x=>x.id===t));
w.setMicroTheme('8090');
ok('thème injecté dans le prompt', w.briefText().includes('THÈME DOMINANT') && w.briefText().includes('1980'));
w.setMicroTheme('libre');
ok('« Tous sujets » = aucune surcouche thème', !w.briefText().includes('THÈME DOMINANT'));

L('[3] Objectif en points');
w.setMicroGoal(15);
ok('15 pts = pas de surcharge (déjà le défaut du prompt)', !w.briefText().includes('OBJECTIF (prioritaire'));
w.setMicroGoal(8);
ok('8 pts injecté et prioritaire', w.briefText().includes('OBJECTIF (prioritaire') && w.briefText().includes('8 points'));
w.setMicroGoal(30);
ok('30 pts injecté', w.briefText().includes('30 points'));

L('[4] Mode équipes');
w.setMicroTeams(true);
ok('deux équipes constituées', w.D.microTeams.a.length>0 && w.D.microTeams.b.length>0);
const total=w.D.microTeams.a.length+w.D.microTeams.b.length;
ok('tous les joueurs répartis, sans doublon', total===w.microTeam().length &&
   new Set([...w.D.microTeams.a,...w.D.microTeams.b]).size===total);
const t=w.briefText();
ok('règles équipes injectées', t.includes('MODE ÉQUIPES') && t.includes('Équipe 1') && t.includes('Équipe 2'));
ok('points attribués à l\'équipe', t.includes("points vont à l'équipe"));
ok('anti-souffleur prévu', t.includes('souffler'));
w.render(); ok('équipes affichées à l\'écran', app().includes('ÉQUIPE 1'));
w.shuffleMicroTeams(); ok('re-tirage possible', w.D.microTeams.a.length>0);
w.setMicroTeams(false);
ok('retour chacun pour soi', !w.D.microTeams && !w.briefText().includes('MODE ÉQUIPES'));

L('[5] Le prompt initial reste INTACT (sanctuarisé)');
const full=w.briefText();
ok('moteur complet présent après la config (couche 1 en tête, v51)', full.includes(BASE) && full.startsWith('<CONFIG_APP>'));
for(const s of ['ANTI-DOUBLON','TOUR DÉFI','QUITTE OU DOUBLE','PRINCIPE DIRECTEUR','BARÈME'])
  ok('section « '+s+' » préservée', full.includes(s));

L('[6] Les 3 axes se cumulent sans se contredire');
w.setMicroStyle('famille'); w.setMicroTheme('ados'); w.setMicroGoal(8); w.setMicroTeams(true); w.D.microCustom='spécial vacances';
const all=w.briefText();
ok('style + thème + objectif + équipes + perso', ["AMBIANCE SÉLECTIONNÉE","THÈME DOMINANT","OBJECTIF (prioritaire","MODE ÉQUIPES","CONSIGNE LIBRE"].every(k=>all.includes(k)));
ok('objectif placé après le style (il tranche)', all.indexOf('OBJECTIF (prioritaire')>all.indexOf("AMBIANCE SÉLECTIONNÉE"));
ok('la consigne joueurs reste en dernier', all.indexOf('CONSIGNE LIBRE')>all.indexOf('MODE ÉQUIPES'));
ok('la liste des joueurs clôt le texte', all.trim().endsWith('.') && all.includes('Les joueurs sont'));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
