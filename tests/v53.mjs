import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
const w=dom.window; w.D.onboarded=1;

L('[1] Cas « personne ne trouve » (le trou que tu as repéré)');
const t=w.briefText();
ok('règle explicite présente', t.includes('PERSONNE NE TROUVE'));
ok('la réponse est TOUJOURS donnée', t.includes('tu donnes TOUJOURS la réponse'));
ok('avec la même explication brève', t.includes('même explication brève'));
ok('couvre silence / abandon / on passe', t.includes('« on passe »') && t.includes('propositions toutes fausses'));
ok('sans culpabiliser', t.includes('Ne culpabilise pas'));
ok('redescend le niveau si ça se répète', t.includes('redescends légèrement le niveau'));

L('[2] Concision de l\'explication');
ok('consigne de concision renforcée', t.includes('une phrase, deux au grand maximum') && t.includes('une respiration'));
ok('plafond une à deux phrases', t.includes('deux au grand maximum'));

L('[3] Nouveaux animateurs');
ok('13 ambiances au total', w.MICRO_STYLES.length===13);
for(const id of ['sportif','tragedien','inspecteur','susceptible'])
  ok('nouvel animateur : '+id, w.MICRO_STYLES.some(s=>s.id===id));
ok('tous ont une explication visible', w.MICRO_STYLES.filter(s=>s.txt).every(s=>!!s.hint));
ok('tous typés', w.MICRO_STYLES.every(s=>!!s.kind));

L('[4] Incarnation : drapeau au lieu d\'une liste en dur');
const loud=w.MICRO_STYLES.filter(s=>s.loud).map(s=>s.id);
L('        incarnés : '+loud.join(', '));
ok('6 ambiances très incarnées', loud.length===6);
for(const id of ['show','taquin','sportif','tragedien','inspecteur','susceptible']){
  w.setMicroStyle(id);
  ok(id+' → incarnation élevée', w.briefText().includes("NIVEAU D'INCARNATION"));
}
w.setMicroStyle('prof');
ok('Prof sympa → pas d\'exubérance', !w.briefText().includes("NIVEAU D'INCARNATION"));
w.setMicroStyle('classique');
ok('Classique → aucune surcouche', !w.briefText().includes('AMBIANCE SÉLECTIONNÉE'));

L('[5] L\'humour ne touche jamais à l\'arbitrage');
w.setMicroStyle('susceptible'); const s=w.briefText();
ok('rappel explicite dans le style', s.includes('ne modifie jamais un point'));
ok('règle P toujours active', s.includes('mauvaise foi') && s.includes('ARBITRE ne l'));
ok('aucune imitation de personne réelle', s.includes("aucune imitation d'un animateur réel"));

L('[6] Non-régression : rien perdu');
for(const k of ['INVARIANTS',"T'ARRÊTES DE PARLER",'Mélanie +2 → 8','Vol ouvert','QUESTIONS INTERDITES',
                'POINT DE CALIBRAGE','TOUR DÉFI','ESTIMATION','jamais plus de ±1'])
  ok('conservé : '+k, s.includes(k));
ok('thèmes intacts (12 depuis la v61)', w.MICRO_THEMES.length>=9);
ok('diversité app toujours active', /GRAINE_DE_PARTIE=\d+/.test(s));
w.go('quizz'); w.S.qc4=true; w.S.qc5=true; w.render();
const app=w.document.getElementById('app').innerHTML;
ok('les 13 ambiances s\'affichent à l\'écran', w.MICRO_STYLES.every(x=>app.includes(x.id)));
L('\n        taille du prompt : '+Math.round(s.length/1000)+' k caractères');
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
