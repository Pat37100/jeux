import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/tmp/audit/index59.html','utf8');
const L=console.log;
function boot(){const store=new Map();
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    try{Object.defineProperty(w.navigator,'serviceWorker',{value:{controller:null,addEventListener(){},register:()=>({then:()=>({catch(){}})}),getRegistration:()=>({then(){}})},configurable:true});}catch(e){} w.scrollTo=()=>{};}});
  d.window.D.onboarded=1; return d.window;}
const words=(w)=>w.document.getElementById('app').innerHTML.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().split(' ').filter(Boolean).length;
const btns=(w)=>w.document.querySelectorAll('#app button').length;
const T=(w)=>w.document.getElementById('app').textContent;

L('════ MÉTRIQUES PAR ÉCRAN (mots / boutons) ════');
{const w=boot();
 for(const [v,setup] of [['home',null],['points',null],['chrono',null],['quizz',null],['outils',null],['champions',null],['save',null]]){
   w.go(v); w.render(); L('  '+v.padEnd(10)+' : '+String(words(w)).padStart(4)+' mots, '+String(btns(w)).padStart(3)+' boutons');
 }}

L('\n════ LA COUPE — cas limites ════');
{const w=boot();
 w.go('points'); w.render(); w.openSheet();
 // création sans aucun joueur coché
 w.document.querySelectorAll('#pk .chip.on').forEach(c=>c.classList.remove('on'));
 const before=w.D.matches.length;
 try{ w.createMatch(); }catch(e){}
 L('  création 0 joueur : '+(w.D.matches.length===before?'bloquée proprement ✓':'⚠️ PARTIE VIDE CRÉÉE'));
 const sh=w.document.querySelector('.sheet'); if(sh) sh.remove();
 // partie à 1 joueur ?
 w.openSheet();
 const chips=[...w.document.querySelectorAll('#pk .chip')];
 chips.forEach((c,i)=>{ if(i>0) c.classList.remove('on'); else c.classList.add('on');});
 try{ w.createMatch(); }catch(e){}
 L('  création 1 joueur : '+(w.cur()&&w.cur().players.length===1?'⚠️ ACCEPTÉE (classement solo absurde ?)':'bloquée ✓'));
 // scores décimaux et négatifs
 const w2=boot(); const ids=w2.D.lib.slice(0,2).map(p=>p.id);
 w2.D.matches.unshift({id:'m',name:'T',date:'2026-08-16',status:'live',winRule:'high',target:10,
   players:w2.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),rounds:[]});
 w2.openMatch('m'); w2.S.tab='play';
 w2.S.inputs={[ids[0]]:'-3',[ids[1]]:'2.5'};
 try{ w2.saveRound(); L('  scores négatifs/décimaux : acceptés (belote/tarot ✓) — totaux : '+JSON.stringify(w2.cur().rounds[0].scores)); }
 catch(e){ L('  scores négatifs : ERREUR '+e.message); }
 // objectif atteint → que se passe-t-il ?
 w2.S.inputs={[ids[0]]:'12'};
 w2.saveRound(); w2.S.tab='rank'; w2.render();
 L('  objectif 10 dépassé (12) : bannière/CTA ? '+(T(w2).includes('Terminer')||T(w2).includes('objectif')?'oui ✓':'⚠️ RIEN — le jeu continue en silence'));
 // suppression d une manche ?
 L('  corriger/supprimer une manche saisie : '+(html.includes('delRound')||html.includes('editRound')?'possible ✓':'⚠️ IMPOSSIBLE (erreur de saisie = définitive ?)'));
}

L('\n════ TIC-TAC — cas limites ════');
{const w=boot();
 w.go('chrono'); w.render();
 for(let i=0;i<10 && w.chSettings().players.length>1;i++) w.chDelP(w.chSettings().players.length-1);
 L('  réduction des joueurs : plancher à '+w.chSettings().players.length+' '+(w.chSettings().players.length>=2?'(minimum 2 appliqué ✓)':'⚠️ 1 accepté'));
 if(w.chSettings().players.length===1){ try{ w.chStart(); L('  démarrage à 1 : '+(w.CH?'⚠️ ACCEPTÉ':'bloqué ✓')); w.chStopTick&&w.chStopTick(); }catch(e){ L('  démarrage à 1 : bloqué ✓'); } }
 // temps personnalisé aberrant
 const w3=boot(); w3.go('chrono');
 w3.chSetSecs(0); L('  temps 0s : '+(w3.chSettings().secs>0?'corrigé à '+w3.chSettings().secs+' ✓':'⚠️ ACCEPTÉ'));
 w3.chSetSecs(9999); L('  temps 9999s : '+(w3.chSettings().secs<=3600?'plafonné ✓':'accepté ('+w3.chSettings().secs+'s) — à plafonner ?'));
}

L('\n════ LE MICRO — parcours et poids ════');
{const w=boot();
 w.go('quizz'); w.render();
 L('  écran de config : '+words(w)+' mots, '+btns(w)+' boutons (7 étapes)');
 // générer sans joueur
 w.D.microTeam=[]; w.D.lib=[];
 const t=w.briefText();
 L('  génération 0 joueur : '+(t.includes('(à demander)')?'prompt demande qui joue ✓':'⚠️'));
 // équipes impaires
 const w4=boot(); w4.D.microTeams={a:[w4.D.lib[0].name],b:[w4.D.lib[1].name,w4.D.lib[2].name]};
 L('  équipes 1 vs 2 : '+(w4.briefText().includes('EQUIPE_1')?'transmises telles quelles (au moteur d\'équilibrer)':'')); 
 // taille avec journal plein
 const w5=boot(); w5.D.journal=Array.from({length:120},(_,i)=>({text:'fait numéro '+i+' assez long pour compter des caractères',fp:'f'+i}));
 L('  prompt avec journal plein (120 faits) : '+Math.round(w5.briefText().length/1000)+' k caractères');
}

L('\n════ OUTILS / CHAMPIONS / RÉGLAGES ════');
{const w=boot();
 w.go('outils'); w.render(); L('  Outils : '+words(w)+' mots — 3 outils visibles : '+(T(w).includes('Dés')&&T(w).includes('Buzzer')&&T(w).includes('commence')?'✓':'⚠️'));
 w.openDice&&w.openDice(); w.render();
 // le Mur compte-t-il bien les 3 jeux ?
 const w6=boot();
 w6.D.matches.unshift({id:'m',name:'X',date:'2026-08-10',status:'done',winRule:'high',target:null,champion:w6.D.lib[0].id,
   players:w6.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),rounds:[{id:'r',date:'2026-08-10',scores:{[w6.D.lib[0].id]:5,[w6.D.lib[1].id]:2}}]});
 w6.D.micro=[{id:'q',date:'2026-08-11',players:[{name:w6.D.lib[0].name,pts:15},{name:w6.D.lib[1].name,pts:9}]}];
 w6.D.tictac=[{id:'d',date:'2026-08-12',winner:w6.D.lib[0].name,players:[{name:w6.D.lib[0].name,good:3}]}];
 const agg=w6.championsAgg();
 L('  agrégation 3 jeux : '+w6.D.lib[0].name+' = '+(agg[0]?agg[0].crowns:'?')+' couronnes (attendu 3) '+(agg[0]&&agg[0].crowns===3?'✓':'⚠️ MANQUE UN JEU'));
 w6.go('save'); w6.render();
 L('  Réglages : '+words(w6)+' mots, '+btns(w6)+' boutons '+(words(w6)>200?'⚠️ TOUJOURS DENSE':'✓'));
 // export/import aller-retour
 L('  export/restauration : '+(html.includes('exportData')&&html.includes('importData')?'les deux présents ✓':'⚠️ vérifier restauration'));
}

L('\n════ FORME — cohérence inter-rubriques ════');
{const w=boot();
 // chaque rubrique a-t-elle sa couleur sur l accueil ET dans sa vue ?
 w.go('home'); w.render();
 const home=w.document.getElementById('app').innerHTML;
 L('  couleurs accueil : '+['t-coupe','t-tictac','t-micro','t-outils','t-champ'].map(c=>home.includes(c)?'✓':('⚠️'+c)).join(' '));
 // boutons primaires : chaque rubrique a-t-elle SON bouton coloré ?
 for(const c of ['micro','tictac']) L('  classe .btn.'+c+' définie : '+(html.includes('.btn.'+c)?'✓':'⚠️'));
 // libellés d enregistrement homogènes ?
 const saves=[...html.matchAll(/>([^<>]*Enregistrer[^<>]*)</g)].map(m=>m[1].trim());
 L('  libellés « Enregistrer » : '+JSON.stringify([...new Set(saves)]));
}
