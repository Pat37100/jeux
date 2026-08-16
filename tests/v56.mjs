import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
  w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
const w=dom.window; w.D.onboarded=1;
const app=()=>w.document.getElementById('app').innerHTML;

L('[1] Double-tap qui zoome (iOS)');
ok('touch-action:manipulation appliqué', html.includes('touch-action:manipulation'));
ok('champs à 16px (pas de zoom au focus)', /input,select,textarea\{font-size:16px\}/.test(html));
ok('text-size-adjust verrouillé', html.includes('-webkit-text-size-adjust:100%'));

L('[2] Réglages : plus de doublon de suppression');
const ids=w.D.lib.slice(0,2).map(p=>p.id);
w.D.matches.unshift({id:'m1',name:'Uno',date:'2026-08-16',status:'live',winRule:'high',target:null,
  players:w.D.lib.slice(0,2).map(p=>({id:p.id,name:p.name})),rounds:[{id:'r1',date:'2026-08-16',scores:{[ids[0]]:5,[ids[1]]:3}}]});
w.openMatch('m1'); w.S.tab='set'; w.render();
ok('« Zone sensible » retirée', !app().includes('Zone sensible'));
ok('plus de « Supprimer cette partie »', !app().includes('Supprimer cette partie'));
ok('suppression toujours possible ailleurs', typeof w.askDelMatch==='function');
w.go('points'); w.render();
ok('glissement disponible dans la liste', app().includes('askDelMatch'));

L('[3] Libellé simplifié');
w.openMatch('m1'); w.S.tab='set'; w.render();
ok('« Terminer la partie »', app().includes('Terminer la partie'));
ok('plus de « & couronner »', !app().includes('couronner le champion') && !html.includes('Terminer & couronner'));
ok('carte État conservée', app().includes('État'));

L('[4] Tic-Tac : plus de phrase incohérente selon le mode');
w.go('chrono');
for(const mode of ['wrong','good','both']){
  w.chSetPass(mode); w.chStart(); w.render();
  ok(mode+' : pas d\'explication contradictoire', !app().includes('continue et son ✓ grimpe'));
  w.chAbandon&&w.S; w.CH=null;
}
w.chSetPass('good'); w.chStart(); w.render();
ok('mode « bonne réponse passe la main » : libellés cohérents', app().includes('Réussi — au suivant') && app().includes('Raté — il continue'));
w.CH=null; w.chSetPass('wrong'); w.chStart(); w.render();
ok('mode « erreur passe la main » : libellés cohérents', app().includes('garde la main') && app().includes('Au suivant'));
w.CH=null;

L('[5] Accueil : explication claire');
w.go('home'); w.render();
ok('titre explicite', app().includes('Le compagnon de vos jeux'));
ok('dit ce que fait l\'app', app().includes('compte les points') && app().includes('retient qui gagne'));
ok('plus l\'ancienne accroche vague', !app().includes("On s'occupe du reste"));
const words=app().replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().split(' ').filter(Boolean).length;
L('        (mots accueil : '+words+')');
ok('reste raisonnable (<225 mots, explication assumée)', words<225);

L('[6] Micro : deux groupes distincts');
w.go('quizz'); w.S.qc4=true; w.S.qc5=true; w.render();
ok('groupe « Contexte & rythme »', app().includes('Contexte &amp; rythme')||app().includes('Contexte & rythme'));
const perso=w.MICRO_STYLES.filter(s=>s.kind==='personnalite').length;
const autre=w.MICRO_STYLES.filter(s=>s.kind!=='personnalite').length;
L('        personnalités : '+perso+' | contexte/rythme/difficulté : '+autre);
ok('toutes les options restent sélectionnables', w.MICRO_STYLES.every(s=>app().includes("setMicroStyle('"+s.id+"')")||app().includes("toggleMicroCtx('"+s.id+"')")));
ok('13 ambiances conservées', w.MICRO_STYLES.length===13);

L('[7] Consigne libre clarifiée');
ok('intitulé explicite', app().includes('Consigne libre') && app().includes('sur les questions'));
ok('exemples des deux registres', app().includes('parle avec emphase') && app().includes('Bretagne'));
w.D.microCustom='évite le sport';
w.setMicroStyle('taquin');
const t=w.briefText();
ok('prompt : les deux registres', t.includes('CONSIGNE LIBRE') && t.includes('ton de l\'animateur') && t.includes('contenu des questions'));

L('[8] NON-RÉGRESSION du prompt');
for(const k of ['PRIORITÉS',"T'ARRÊTES DE PARLER",'Mélanie +2 → 8','Vol ouvert','PERSONNE NE TROUVE',
                'QUESTIONS INTERDITES','POINT DE CALIBRAGE','±0,5','A0. LECTURE DE CONFIG_APP','sections A à S'])
  ok('conservé : '+k, t.includes(k));
w.toggleMicroCtx('voiture'); ok('En voiture toujours actif', w.briefText().includes('CONTEXTE=VOITURE_BRUIT'));
w.toggleMicroCtx('costaud'); ok('Costaud toujours actif', w.briefText().includes('NIVEAU_INITIAL=7'));
w.setMicroStyle('sportif'); ok('Commentateur sportif incarné', w.briefText().includes("NIVEAU D'INCARNATION"));
ok('9 thèmes', w.MICRO_THEMES.length===9);
ok('diversité app', /GRAINE_DE_PARTIE=\d+/.test(w.briefText()));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
