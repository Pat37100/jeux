import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let W=0; const warn=(s)=>{L('  ⚠️  '+s); W++;}; const ok=(s)=>L('  ✓  '+s);
function boot(){const store=new Map();
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  d.window.D.onboarded=1; return d.window;}
const words=w=>w.document.getElementById('app').innerHTML.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().split(' ').filter(Boolean).length;
const nb=w=>w.document.querySelectorAll('#app button').length;

L('═══ 1. POIDS DES ÉCRANS (dérive depuis la v56 ?) ═══');
{const w=boot();
 const ref={home:183,points:61,chrono:82,quizz:367,outils:38,champions:27,save:243};
 for(const v of ['home','points','chrono','quizz','outils','champions','save']){
   w.go(v); w.render();
   const d=words(w)-ref[v];
   L('  '+v.padEnd(10)+String(words(w)).padStart(4)+' mots ('+(d>=0?'+':'')+d+' vs v56), '+nb(w)+' boutons');
   if(words(w)>260) warn(v+' dépasse 260 mots');
 }}

L('\n═══ 2. COHÉRENCE INTER-RUBRIQUES ═══');
{const w=boot();
 // enregistrement : plus aucun choix Mur/Coupe ?
 w.go('chrono'); w.chStart(); w.chGood(); w.chFinishNow(); w.render();
 const a=w.document.getElementById('app').innerHTML;
 a.includes('Ajoutée au 🏅 Mur des champions') ? ok('Tic-Tac : Mur automatique') : warn('Tic-Tac : Mur non automatique');
 !a.includes('Enregistrer la manche') ? ok('Tic-Tac : aucun bouton d\'enregistrement') : warn('Tic-Tac : bouton résiduel');
 const w2=boot(); w2.D.lib=[{id:'a',name:'A'},{id:'b',name:'B'}]; w2.D.microTeam=['a','b'];
 w2.go('quizz'); w2.microOpen(); w2.document.getElementById('mqr').value='A 10\nB 5'; w2.microSave();
 (w2.D.micro.length===1) ? ok('Micro : Mur automatique') : warn('Micro : non enregistré');
 (w2.document.getElementById('mcsh')!==null) ? ok('Micro : question Coupe posée comme au Tic-Tac') : warn('Micro : pas de proposition Coupe');
 // les 3 jeux alimentent-ils le Mur ?
 const w3=boot();
 w3.D.matches=[{id:'m',name:'U',game:'Uno',date:'2026-08-10',status:'done',winRule:'high',target:null,champion:w3.D.lib[0].id,
   players:w3.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),rounds:[{id:'r',date:'2026-08-10',scores:{[w3.D.lib[0].id]:9,[w3.D.lib[1].id]:2}}]}];
 w3.D.micro=[{id:'q',date:'2026-08-11',players:[{name:w3.D.lib[0].name,score:15},{name:w3.D.lib[1].name,score:8}]}];
 w3.D.tictac=[{id:'d',date:'2026-08-12',winner:w3.D.lib[0].name,players:[{name:w3.D.lib[0].name,good:3,bad:1}]}];
 const agg=w3.championsAgg();
 (agg[0]&&agg[0].crowns===3)? ok('Mur agrège bien les 3 rubriques') : warn('Mur : '+(agg[0]?agg[0].crowns:0)+' couronnes au lieu de 3');
 // balayage partout ?
 w3.go('points'); w3.render();
 const p=w3.document.getElementById('app').innerHTML;
 p.includes('class="swipe"')? ok('balayage sur les parties') : warn('parties non balayables');
 w3.openMatch('m'); w3.setResMode('list'); w3.render();
 w3.document.getElementById('app').innerHTML.includes('class="swipe"')? ok('balayage sur les manches') : warn('manches non balayables');
 html.includes('.swipe .front::after')? ok('indice visuel de balayage') : warn('pas d\'indice visuel');
}

L('\n═══ 3. LA COUPE : passage à l\'échelle (le sujet du jour) ═══');
{const w=boot();
 const mk=(i,n,g)=>({id:'m'+i,name:n,game:g,date:'2026-08-16',status:i%4===0?'done':'live',winRule:'high',target:null,
   players:w.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),rounds:[{id:'r'+i,date:'2026-08-16',scores:{[w.D.lib[0].id]:5,[w.D.lib[1].id]:3}}]});
 const games=['Uno','Belote','Tarot','Yams','Skyjo'];
 w.D.matches=[]; for(let i=0;i<200;i++) w.D.matches.push(mk(i,'Partie '+i,games[i%5]));
 const t0=Date.now(); w.go('points'); w.render(); const dt=Date.now()-t0;
 L('  200 parties : rendu en '+dt+' ms, '+words(w)+' mots');
 dt<1500? ok('rendu tenable à 200 parties') : warn('rendu lent ('+dt+' ms)');
 w.document.getElementById('app').innerHTML.includes('setGameFilter')? ok('filtres présents') : warn('pas de filtres');
 w.document.getElementById('app').innerHTML.includes('Chercher une partie')? ok('recherche présente') : warn('pas de recherche');
 w.setGameFilter('Tarot'); w.render();
 const c=(w.document.getElementById('app').innerHTML.match(/class="swipe"/g)||[]).length;
 L('  filtre Tarot : '+c+' parties affichées (attendu 40)');
 c===40? ok('filtre exact') : warn('filtre incohérent');
 const t1=Date.now(); w.render(); L('  re-rendu filtré : '+(Date.now()-t1)+' ms');
 w.setGameFilter('Tarot');
 // le filtre survit-il à la navigation ?
 w.setGameFilter('Uno'); w.go('home'); w.go('points'); w.render();
 (w.S.gameFilter==='Uno')? ok('le filtre persiste dans la session') : warn('filtre perdu à la navigation');
 w.S.gameFilter=null;
}

L('\n═══ 4. PROMPT DU MICRO : intégrité ═══');
{const w=boot();
 w.D.lib=[{id:'a',name:'Patrick'},{id:'b',name:'Mélanie'}]; w.D.microTeam=['a','b'];
 w.setMicroStyle('taquin'); w.toggleMicroCtx('voiture'); w.toggleMicroCtx('apero');
 w.setMicroTheme('voyage'); w.setMicroGoal(20); w.D.microCustom='pas de sport';
 const t=w.briefText();
 const must=['PRIORITÉS','FRONTIÈRE DE TOUR','ORDRE DE DÉCISION','RÉPONSE OFFICIELLE','BARÈME',
  'REGISTRE TRANSACTIONNEL','ANTI-DOUBLON','DIFFICULTÉ','QUALITÉ','QUESTIONS INTERDITES','MÉCANIQUES AUTORISÉES',
  'TOUR DÉFI','CASH','QUESTION AVEC VOL','QUESTION MYSTÈRE','ESTIMATION','DUEL','QUITTE OU DOUBLE','QUESTION EN OR',
  'PERSONNE NE TROUVE','POINT DE CALIBRAGE','A0. LECTURE DE CONFIG_APP','GRAINE_DE_PARTIE','PLAN_DE_VARIETE',
  'MECANIQUES=','CONSIGNE LIBRE','CONTEXTE ET RYTHME','AMBIANCE SÉLECTIONNÉE','THÈME DOMINANT'];
 const miss=must.filter(k=>!t.includes(k));
 miss.length? warn('MANQUANT dans le prompt : '+miss.join(', ')) : ok('les 29 blocs clés sont présents');
 // les choix cumulés passent-ils tous ?
 const checks={'ambiance Taquin':'pince-sans-rire','contexte voiture':'CONTEXTE=VOITURE_BRUIT',
   'contexte apéro':'conviviale','thème voyage':'Varie les continents','objectif 20':'OBJECTIF=20','consigne':'pas de sport'};
 for(const [k,v] of Object.entries(checks)) t.includes(v)? ok('choix transmis : '+k) : warn('choix PERDU : '+k);
 L('  taille du prompt : '+Math.round(t.length/1000)+' k caractères');
 // renvois internes
 const secs=new Set([...t.matchAll(/=== (A0|[A-Z])\. /g)].map(m=>m[1]));
 const refs=[...t.matchAll(/règles? ([A-Z])|section ([A-Z])/g)].map(m=>m[1]||m[2]);
 const bad=refs.filter(r=>!secs.has(r));
 bad.length? warn('renvois vers sections inexistantes : '+[...new Set(bad)]) : ok('tous les renvois internes valides');
}

L('\n═══ 5. CAS LIMITES INTRODUITS DEPUIS LA v56 ═══');
{const w=boot();
 // passer sans compter ne fausse rien
 w.go('chrono'); w.chStart();
 const snap=()=>w.CH.players.map(p=>(p.good||0)+'/'+(p.bad||0)).join(' ');
 w.chGood(); const s1=snap(); w.chSkip(); const s2=snap();
 s1===s2? ok('« Passer sans compter » ne touche aucun compteur') : warn('Passer modifie les compteurs');
 // double enregistrement possible ?
 w.chFinishNow(); const n1=w.D.tictac.length; w.chSaveDuel(); 
 (w.D.tictac.length===n1)? ok('pas de double enregistrement au Mur') : warn('DOUBLON au Mur');
 // navigation
 w.go('home'); (w.CH===null)? ok('manche nettoyée en quittant') : warn('manche persistante');
 // objectif atteint visible partout
 const w2=boot(); const ids=w2.D.lib.slice(0,2).map(p=>p.id);
 w2.D.matches=[{id:'g',name:'U',game:'Uno',date:'2026-08-16',status:'live',winRule:'high',target:10,
   players:w2.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),rounds:[{id:'r',date:'2026-08-16',scores:{[ids[0]]:12,[ids[1]]:3}}]}];
 w2.openMatch('g');
 let seen=0;
 for(const m of ['grid','rank','graph','list']){ w2.setResMode(m); w2.render();
   if((w2.document.getElementById('app').innerHTML.match(/Objectif 10 atteint/g)||[]).length===1) seen++; }
 seen===4? ok('bannière objectif dans les 4 vues, une seule fois') : warn('bannière incohérente ('+seen+'/4)');
 // 2 joueurs minimum
 const w3=boot(); w3.go('points'); w3.render(); w3.openSheet();
 w3.document.querySelectorAll('#pk .chip.on').forEach((c,i)=>{ if(i>0) c.classList.remove('on'); });
 const before=w3.D.matches.length; w3.createMatch();
 (w3.D.matches.length===before)? ok('partie solo refusée') : warn('partie solo créée');
}

L('\n═══ 6. ROBUSTESSE ═══');
{const w=boot();
 // XSS sur le nom de jeu / partie
 const evil='<img src=x onerror="window.__P=1">';
 w.D.matches=[{id:'e',name:evil,game:evil,date:'2026-08-16',status:'live',winRule:'high',target:null,
   players:w.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),rounds:[]}];
 w.go('points'); w.render();
 (!w.__P && !w.document.querySelector('#app img[src="x"]'))? ok('noms malveillants échappés (liste)') : warn('XSS dans la liste');
 // jeu avec apostrophe (échappement JS dans onclick)
 const w2=boot();
 w2.D.matches=[]; for(let i=0;i<6;i++) w2.D.matches.push({id:'a'+i,name:'P'+i,game:i<3?"L'Aut'Jeu":'Uno',date:'2026-08-16',status:'live',winRule:'high',target:null,players:w2.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),rounds:[]});
 w2.go('points'); w2.render();
 try{ const b=[...w2.document.querySelectorAll('#app .chip')].find(x=>x.textContent.includes("Aut")); if(b){ b.click(); ok('jeu avec apostrophe : filtre cliquable'); } else warn('puce introuvable'); }
 catch(e){ warn('apostrophe casse le filtre : '+e.message); }
 // 500 manches
 const w3=boot(); const ids=w3.D.lib.slice(0,2).map(p=>p.id);
 const rounds=[]; for(let i=0;i<500;i++) rounds.push({id:'r'+i,date:'2026-01-01',scores:{[ids[0]]:i%9,[ids[1]]:(i*3)%7}});
 w3.D.matches=[{id:'big',name:'Marathon',game:'Belote',date:'2026-08-16',status:'live',winRule:'high',target:null,
   players:w3.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),rounds:rounds}];
 const t0=Date.now(); w3.openMatch('big'); w3.render(); const dt=Date.now()-t0;
 L('  500 manches : '+dt+' ms');
 dt<2000? ok('tenable à 500 manches') : warn('lent à 500 manches ('+dt+' ms)');
}
L('\n══════ '+(W? W+' POINT(S) À REGARDER' : 'AUCUN DÉFAUT')+' ══════');
