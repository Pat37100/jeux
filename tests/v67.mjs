import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
function boot(){const store=new Map();
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  d.window.D.onboarded=1; return d.window;}
const w=boot();
w.D.lib=[{id:'p1',name:'Patrick'},{id:'p2',name:'Mathéo'}]; w.D.microTeam=['p1','p2'];
w.setMicroStyle('sportif'); w.toggleMicroCtx('express'); w.setMicroGoal(8);
const t=w.briefText();

L('[1] Contrat de voix (le défaut n°1 du test réel)');
ok('section A3 présente', t.includes('A3. CONTRAT DE VOIX'));
ok('personnalité = voix permanente', t.includes('voix permanente') && t.includes('vernis'));
ok('où vit le personnage', t.includes('vit dans les TRANSITIONS'));
ok('au moins une action par prise de parole', t.includes('À CHAQUE prise de parole'));
ok('échec caractérisé nommé', t.includes('ÉCHEC CARACTÉRISÉ'));
ok('anti-motif explicite', t.includes('« Prénom, catégorie, question »'));
ok('auto-correction demandée', t.includes('reprends ta voix au tour suivant'));
ok('placé tôt dans le prompt', t.indexOf('A3. CONTRAT DE VOIX')/t.length < 0.25);
ok('n\'empiète pas sur l\'arbitrage', t.includes('jamais dans l\'arbitrage'));

L('[2] Les 12 problèmes du test restent couverts');
const cov={'P1 obligations':'A2. OBLIGATIONS','P2 formats':'PLAN_DE_FORMATS','P2 règle dure':'classiques consécutives',
 'P3 réponse courte':'QUELQUES MOTS','P4 difficulté procédurale':'J2','P5 verrou':'VERROU DU PROPRIÉTAIRE',
 'P6 roster atomique':'EXÉCUTION ATOMIQUE','P7 estimation collective':'TOUJOURS COLLECTIVE',
 'P8 scripts':'MÉCANIQUES — SCRIPTS','P9 posture vocale':"ne t'arrêtent pas",'P10 canal méta':'metaNotes',
 'P11 mauvaise foi':'mauvaise foi','P12 spoiler':'SPOILER','prénom':'HOTE','narratif':'narrativeHooks'};
for(const [k,v] of Object.entries(cov)) ok('conservé : '+k, t.includes(v));

L('[3] Invariants du moteur historique');
for(const k of ['FRONTIÈRE DE TOUR','Mélanie +2 → 8','Vol ouvert','QUESTIONS INTERDITES','PERSONNE NE TROUVE',
                'POINT DE CALIBRAGE','TOUR DÉFI','QUITTE OU DOUBLE','QUESTION EN OR','GRAINE_DE_PARTIE'])
  ok('conservé : '+k, t.includes(k));

L('[4] Renvois internes valides');
const secs=new Set([...t.matchAll(/=== ([A-Z0-9]+)\. /g)].map(m=>m[1]));
const refs=[...t.matchAll(/(?:voir|règles?|section)s? ([A-Z])\b/g)].map(m=>m[1]);
const bad=refs.filter(r=>!secs.has(r));
ok('aucun renvoi vers une section inexistante', bad.length===0);

L('[5] Personnalisation : prénom et parler');
ok('prénom dans la config', /HOTE=\w+/.test(t));
ok('prénom stable entre deux générations', (w.briefText().match(/HOTE=(\w+)/)||[])[1]===(t.match(/HOTE=(\w+)/)||[])[1]);
w.setHostName('Thierry');
ok('prénom modifiable', w.briefText().includes('HOTE=Thierry'));
ok('rappel de personnage nommé en fin', w.briefText().includes('Tu es Thierry'));
w.setMicroParler&&w.setMicroParler('qc');
const t2=w.briefText();
ok('parler injecté', t2.includes('québécois')||t2.includes('PARLER'));
ok('garde-fou anti-moquerie', t2.includes('aucune moquerie')||t2.includes('aucun stéréotype'));
ok('interdiction phonétique', t2.includes('phonétique'));

L('[6] Taille');
L('        prompt total : '+Math.round(t.length/1000)+' k caractères');
ok('reste sous 30 k', t.length<30000);
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
