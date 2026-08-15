import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const sw=fs.readFileSync('/mnt/user-data/outputs/sw.js','utf8');
const L=console.log;
const store=new Map();
function boot(){
  const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  dom.window.D.onboarded=1; return dom.window;
}
const w=boot();
const app=()=>w.document.getElementById('app').innerHTML;

L('━━ RÔLE 1 : INGÉNIEUR iOS (cible App Store) ━━');
L('viewport-fit=cover (encoche iPhone) : '+(html.includes('viewport-fit=cover')?'OUI':'NON'));
L('safe-area-inset utilisé : '+(html.includes('safe-area-inset')?'OUI':'NON'));
L('apple-touch-icon : '+(html.includes('apple-touch-icon')?'OUI':'NON'));
L('apple-mobile-web-app-capable : '+(html.includes('apple-mobile-web-app')?'OUI':'NON'));
L('manifest lié : '+(html.includes('manifest')?'OUI':'NON'));
L('theme-color : '+(html.includes('theme-color')?'OUI':'NON'));
L('font -apple-system : '+(html.includes('-apple-system')?'OUI':'NON'));
L('100vh piège iOS (barre Safari) : '+((html.match(/100vh/g)||[]).length)+' occurrence(s)'+(html.includes('100dvh')?' + dvh présent':''));

L('\n━━ RÔLE 2 : SÉCURITÉ (injection via noms de joueurs) ━━');
try{
  const w2=boot();
  const evil='<img src=x onerror="window.__PWNED=1">';
  w2.D.lib.push({id:'evil1',name:evil});
  w2.go('quizz'); w2.render();
  const pwned=!!w2.__PWNED || w2.document.querySelector('#app img[src="x"]');
  L('nom malveillant dans Micro : '+(pwned?'⚠️ INJECTÉ (XSS)':'échappé ✓'));
  w2.D.matches.unshift({id:'mx',name:evil,date:'2026-08-14',status:'live',winRule:'high',target:null,
    players:[{id:'p1',name:evil}],rounds:[{id:'r1',date:'2026-08-14',scores:{p1:5}}]});
  w2.openMatch('mx'); w2.render();
  const pwned2=!!w2.__PWNED || w2.document.querySelector('#app img[src="x"]');
  L('nom malveillant dans La Coupe : '+(pwned2?'⚠️ INJECTÉ (XSS)':'échappé ✓'));
}catch(e){ L('test sécurité: erreur '+e.message); }

L('\n━━ RÔLE 3 : QA ROBUSTESSE (données extrêmes) ━━');
try{
  const w3=boot();
  const long='Maximilien-Alexandre de la Rochefoucauld-Montmorency';
  w3.D.lib.push({id:'lg',name:long});
  w3.go('chrono'); w3.render();
  L('nom de 52 caractères : rendu sans plantage ✓');
  // 200 manches
  const ids=w3.D.lib.slice(0,2).map(p=>p.id);
  const rounds=[]; for(let i=0;i<200;i++) rounds.push({id:'r'+i,date:'2026-01-01',scores:{[ids[0]]:i%13,[ids[1]]:(i*7)%11}});
  w3.D.matches.unshift({id:'big',name:'Big',date:'2026-08-14',status:'live',winRule:'high',target:null,
    players:w3.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),rounds:rounds});
  const t0=Date.now(); w3.openMatch('big'); w3.setResMode('grid'); w3.render(); const dt=Date.now()-t0;
  L('partie de 200 manches, vue Grille : '+dt+' ms '+(dt<400?'✓':'⚠️ LENT'));
  const t1=Date.now(); w3.setResMode('graph'); w3.render(); L('courbe 200 manches : '+(Date.now()-t1)+' ms');
  // quota localStorage
  L('taille données persistées : '+Math.round((store.get('jeuxFamille')||'').length/1024)+' Ko (quota iOS ~5 Mo)');
}catch(e){ L('QA: plantage → '+e.message); }

L('\n━━ RÔLE 4 : ACCESSIBILITÉ (WCAG) ━━');
const fonts=[...html.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map(m=>parseFloat(m[1]));
const tiny=fonts.filter(f=>f<11).length;
L('tailles <11px : '+tiny+' occurrences (min trouvé : '+Math.min(...fonts)+'px)');
L('prefers-reduced-motion respecté : '+((html.match(/prefers-reduced-motion/g)||[]).length)+' règle(s)');
L('lang="fr" : '+(html.includes('lang="fr"')?'OUI':'NON'));
const w4=boot(); w4.go('home'); w4.render();
const h1=w4.document.querySelectorAll('h1').length;
L('structure de titres (h1 sur accueil) : '+h1);

L('\n━━ RÔLE 5 : SOUND DESIGNER ━━');
L('coupure son globale : '+(html.includes('D.mute')||html.includes('globalMute')?'OUI':'NON — chaque jeu a son réglage isolé'));
L('son Tic-Tac réglable : '+(html.includes('chSound')?'OUI':'NON'));
L('son buzzer réglable : '+(html.includes('BUZZ_KITS')?'kits OUI':'NON')+' | mute buzzer : '+(html.includes('buzzMute')?'OUI':'NON'));
L('annonces vocales désactivables : '+(html.includes('setVoice')?'OUI':'NON'));

L('\n━━ RÔLE 6 : DATA / RÉTENTION ━━');
const w6=boot();
L('export/sauvegarde fichier : '+(html.includes('exportData')||html.includes('backup')||html.includes('télécharge')?'OUI':'à vérifier'));
L('rappel de sauvegarde intelligent : '+(html.includes('lastBackup')||html.includes('saveReminder')?'OUI':'à vérifier'));
L('détection de mise à jour : '+(html.includes('updatefound')?'OUI':'NON'));

L('\n━━ RÔLE 7 : PERF ━━');
L('poids index.html : '+Math.round(html.length/1024)+' Ko | sw.js : '+Math.round(sw.length/1024)+' Ko');
const t2=Date.now(); const w7=boot(); w7.go('home'); w7.render(); L('boot+render accueil (jsdom) : '+(Date.now()-t2)+' ms');
L('images externes : '+((html.match(/https?:\/\/[^"']*\.(png|jpg|webp|svg)/g)||[]).length));
