import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
function boot(){const store=new Map();
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  d.window.D.onboarded=1; return d.window;}
const w=boot(); const t=w.briefText();

L('══ COMPRESSION SANS PERTE : les 12 règles critiques ══');
const RULES={
 'priorités numérotées':'PRIORITÉS','état interne':'currentPlayerIndex','frontière de tour':"T'ARRÊTES DE PARLER",
 'ordre de décision':'ORDRE DE DÉCISION','identité avant exactitude':"jamais l'exactitude avant l'identité",
 'réponse officielle':'Ta réponse officielle','choicesStarted non rétroactif':'jamais rétroactivement',
 'registre transactionnel':'Mélanie +2 → 8','anti-doublon sur faits':"symbole de l'or = Au",
 'amplitude ±0,5':'±0,5','interdiction saut 2→8':'INTERDIT de sauter de 2 à 8',
 'estimation collective':'TOUS les joueurs','vol procédural':'Vol ouvert'};
for(const [k,v] of Object.entries(RULES)) ok(k, t.includes(v));

L('\n══ MÉCANIQUES ET FONCTIONS : rien perdu ══');
for(const k of ['TOUR DÉFI','CASH','QUESTION AVEC VOL','QUESTION MYSTÈRE','ESTIMATION','DUEL','QUITTE OU DOUBLE',
                'mythologie','énigmes','categoryDifficulty','revealedFacts','mort subite','FIN DE PARTIE',
                'DÉMARRAGE','PRINCIPE DIRECTEUR','ARBITRAGE','BRUIT','Westphalie','fission binaire'])
  ok('conservé : '+k, t.includes(k));

L('\n══ ANTI-RÉPÉTITION (le vrai problème) ══');
ok('liste de questions interdites', t.includes('QUESTIONS INTERDITES'));
for(const c of ['capitale de l\'Australie','planète rouge','pluriel de cheval','auteur de 1984','badminton'])
  ok('cliché banni : '+c, t.includes(c));
ok('consigne d\'angle latéral', t.includes('le grand classique du genre'));

L('\n══ DIVERSITÉ GÉNÉRÉE PAR L\'APP (le modèle ne peut pas la contourner) ══');
ok('graine de partie injectée', /GRAINE_DE_PARTIE=\d+/.test(t));
ok('plan de variété injecté', /PLAN_DE_VARIETE=\w+/.test(t));
ok('angle dominant injecté', /ANGLE_DOMINANT=\S+/.test(t));
const seeds=new Set(), plans=new Set();
for(let i=0;i<12;i++){ const x=boot().briefText();
  seeds.add((x.match(/GRAINE_DE_PARTIE=(\d+)/)||[])[1]);
  plans.add((x.match(/PLAN_DE_VARIETE=([^\n]+)/)||[])[1]); }
ok('graine différente à chaque partie ('+seeds.size+'/12)', seeds.size>=11);
ok('plan de domaines différent ('+plans.size+'/12)', plans.size>=10);
const plan=(t.match(/PLAN_DE_VARIETE=([^\n]+)/)||[])[1].split(' > ');
ok('8 domaines planifiés, sans doublon', plan.length===8 && new Set(plan).size===8);

L('\n══ CALIBRAGE DE NIVEAU (ta question) ══');
ok('adaptation silencieuse conservée', t.includes('fenêtre de 4 à 6'));
ok('point de calibrage unique en cours de partie', t.includes('POINT DE CALIBRAGE') && t.includes('trop facile, bien, ou trop dur'));
ok('une seule fois, jamais répété', t.includes('sans jamais reposer la question'));

L('\n══ OPTIONS UI : inchangées ══');
ok('les 9 ambiances d\'origine sont conservées', ['classique','show','prof','taquin','famille','express','costaud','voiture','apero'].every(id=>w.MICRO_STYLES.some(s=>s.id===id)) && w.MICRO_STYLES.length>=9);
ok('thèmes conservés (12 depuis la v61)', w.MICRO_THEMES.length>=9);
w.toggleMicroCtx('costaud'); ok('Costaud → niveau 7', w.briefText().includes('NIVEAU_INITIAL=7'));
w.setMicroTeams(true); ok('équipes', w.briefText().includes('MODE=EQUIPES'));
w.setMicroTeams(false);
L('\n        taille du prompt : '+Math.round(w.briefText().length/1000)+' k caractères');
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
