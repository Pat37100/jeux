import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; const findings=[];
const flag=(angle,sev,msg)=>findings.push({angle,sev,msg});
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
const w=dom.window; w.D.onboarded=1;
const VIEWS=['home','points','chrono','quizz','outils','champions','palmares','save'];
const screens={};
for(const v of VIEWS){ try{ w.go(v); w.render(); screens[v]=w.document.getElementById('app').innerHTML; }catch(e){ flag('1.Robustesse','BLOQUANT','vue '+v+' plante : '+e.message); screens[v]=''; } }

// --- 1. VOLUME DE TEXTE (obsession de Patrick) ---
for(const [v,h] of Object.entries(screens)){
  const txt=h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  const words=txt.split(' ').filter(Boolean).length;
  if(words>190) flag('2.Densité','MOYEN',v+' : '+words+' mots à l\'écran');
}
// --- 2. ACCESSIBILITÉ : boutons sans libellé lisible ---
let noLabel=0, iconOnly=[];
for(const [v,h] of Object.entries(screens)){
  const d=new JSDOM('<div>'+h+'</div>');
  d.window.document.querySelectorAll('button').forEach(b=>{
    const t=(b.textContent||'').replace(/\s/g,'');
    const al=b.getAttribute('aria-label')||b.getAttribute('title');
    if(!t && !al){ noLabel++; }
    else if(t.length<=2 && !al){ iconOnly.push(v+':'+t); }
  });
}
if(noLabel) flag('3.Accessibilité','FORT',noLabel+' bouton(s) sans texte ni aria-label');
if(iconOnly.length) flag('3.Accessibilité','MOYEN',iconOnly.length+' bouton(s) icône seule sans aria-label ('+[...new Set(iconOnly)].slice(0,6).join(', ')+')');
// --- 3. CIBLES TACTILES trop petites ---
const small=(html.match(/padding:\s*[0-3]px/g)||[]).length;
if(small>6) flag('4.Ergonomie mobile','MOYEN',small+' règles padding ≤3px (risque de cible <44px)');
// --- 4. COHÉRENCE DE NAVIGATION : chaque vue a-t-elle un retour ? ---
for(const v of VIEWS.filter(x=>x!=='home')){
  w.go(v); w.render();
  const hd=w.document.getElementById('hd').innerHTML;
  if(!/back\(|←|‹|retour/i.test(hd) && !hd.includes('icobtn')) flag('5.Navigation','FORT','vue '+v+' sans retour visible');
}
// --- 5. FONCTIONS ORPHELINES / handlers manquants ---
const fns=[...html.matchAll(/function\s+([a-zA-Z_$][\w$]*)\s*\(/g)].map(m=>m[1]);
const used=new Set([...html.matchAll(/([a-zA-Z_$][\w$]*)\s*\(/g)].map(m=>m[1]));
const orphans=fns.filter(f=>(html.split(f).length-1)<2);
if(orphans.length) flag('6.Dette technique','MOYEN','fonctions jamais appelées : '+orphans.join(', '));
// --- 6. DOUBLONS DE LIBELLÉS (confusion utilisateur) ---
const labels={};
for(const [v,h] of Object.entries(screens)){
  const d=new JSDOM('<div>'+h+'</div>');
  d.window.document.querySelectorAll('button').forEach(b=>{
    const t=(b.textContent||'').trim();
    if(t.length>4){ labels[t]=labels[t]||new Set(); labels[t].add(v); }
  });
}
const dup=Object.entries(labels).filter(([t,s])=>s.size>2);
if(dup.length) flag('7.Cohérence','FAIBLE','libellés présents sur >2 écrans : '+dup.slice(0,3).map(d=>'"'+d[0].slice(0,28)+'"').join(', '));
// --- 7. PERSISTANCE : que se passe-t-il si le stockage est plein ? ---
try{
  const big={...w.D}; w.persist();
  flag('8.Résilience','INFO','persist() sans try/catch visible ? '+(html.includes('function persist')&&/persist[\s\S]{0,200}catch/.test(html)?'protégé':'NON PROTÉGÉ'));
}catch(e){ flag('8.Résilience','FORT','persist() lève une exception'); }
// --- 8. HORS-LIGNE : le SW cache-t-il tout le nécessaire ? ---
const sw=fs.readFileSync('/mnt/user-data/outputs/sw.js','utf8');
const assets=[...html.matchAll(/(?:src|href)="([^"h][^"]*)"/g)].map(m=>m[1]).filter(a=>!a.startsWith('#')&&!a.startsWith('data:'));
const missing=[...new Set(assets)].filter(a=>!sw.includes(a.replace('./','')));
if(missing.length) flag('9.Hors-ligne','MOYEN','ressources non listées dans sw.js : '+missing.slice(0,4).join(', '));
// --- 9. DONNÉES : intégrité après passerelle Tic-Tac -> Coupe ---
w.go('chrono'); w.chStart(); w.CH.players.forEach((p,i)=>p.good=i+1); w.chFinishNow(); w.chToCoupeGo('');
const m=w.D.matches[0];
const sum=Object.values(m.rounds[0].scores).reduce((a,b)=>a+b,0);
const expect=w.CH.players.reduce((a,p)=>a+p.good,0);
if(sum!==expect) flag('10.Intégrité','BLOQUANT','points transférés ('+sum+') ≠ ✓ réels ('+expect+')');
// doublon si on renvoie deux fois
w.chToCoupeGo(m.id);
if(m.rounds.length!==2) flag('10.Intégrité','MOYEN','second envoi non enregistré');
if(m.players.length!==w.CH.players.length) flag('10.Intégrité','FORT','joueurs dupliqués au 2e envoi : '+m.players.length);
// --- 10. PERFORMANCE ---
const kb=Math.round(html.length/1024);
if(kb>200) flag('11.Performance','MOYEN','index.html = '+kb+' Ko (monolithe)');
else flag('11.Performance','INFO','index.html = '+kb+' Ko');
// --- 11. MODE SOMBRE : les couleurs codées en dur ---
const hard=(html.match(/background:#fff\b/g)||[]).length;
if(hard>4) flag('12.Mode sombre','FORT',hard+' fonds #fff codés en dur (invisibles/éblouissants en sombre)');

L('══════ AUDIT v44 ══════');
const order={BLOQUANT:0,FORT:1,MOYEN:2,FAIBLE:3,INFO:4};
findings.sort((a,b)=>order[a.sev]-order[b.sev]);
findings.forEach(f=>L('['+f.sev+'] '+f.angle+' — '+f.msg));
L('\nTotal : '+findings.length+' constats');
