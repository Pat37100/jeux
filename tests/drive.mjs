import { JSDOM } from 'jsdom';
import fs from 'fs';
const html = fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L = console.log;
let FAIL = 0;
const check = (label, ok) => { L((ok?'  OK   ':'  ECHEC')+' — '+label); if(!ok) FAIL++; };

function boot(storeSeed){
  const dom = new JSDOM(html, { runScripts:'dangerously', url:'https://patrickaubert75.github.io/jeux/',
    beforeParse(w){
      const s = storeSeed || new Map();
      w._store = s;
      Object.defineProperty(w,'localStorage',{value:{
        getItem:k=>s.has(k)?s.get(k):null, setItem:(k,v)=>s.set(k,String(v)), removeItem:k=>s.delete(k)}});
      w.navigator.serviceWorker = undefined;
    }});
  return dom;
}

L('================ PARCOURS UTILISATEUR RÉEL ================');
const dom = boot(); const w = dom.window, d = w.document;

L('\n[1] Démarrage');
check('écran accueil rendu (3 outils visibles)', d.body.textContent.includes('Décompte de points') && d.body.textContent.includes('Quizz') && d.body.textContent.includes('Chrono'));
check('indicateur "Sauvegardé sur cet iPhone" présent', d.body.textContent.includes('Sauvegardé sur cet iPhone'));
check('4 joueurs par défaut (Patrick, Mélanie, Mattéo, Maxime)', JSON.stringify(w.D.lib.map(p=>p.name))==='["Patrick","Mélanie","Mattéo","Maxime"]');

L('\n[2] Créer une partie via la feuille "Nouvelle partie"');
w.go('points'); w.openSheet();
check('la feuille s\'affiche', !!d.getElementById('sh'));
w.openSheet(); w.openSheet(); // l'utilisateur tapote plusieurs fois (doigt nerveux)
const sheets = d.querySelectorAll('.sheet').length;
check('pas d\'empilement de feuilles après tapotements multiples (trouvées: '+sheets+')', sheets===1);
d.getElementById('mn').value = 'Belote vacances';
w.createMatch();
check('partie créée et ouverte', w.S.view==='match' && w.cur() && w.cur().name==='Belote vacances');
const sheetGone = !d.getElementById('sh');
check('la feuille a bien disparu après création', sheetGone);

L('\n[3] Annulation : ouvrir puis fermer la feuille');
w.go('points'); w.openSheet(); w.closeSheet();
check('la feuille disparaît après "Annuler"', !d.getElementById('sh'));

L('\n[4] Saisir 3 manches');
w.openMatch(w.D.matches[0].id);
const ids = w.cur().players.map(p=>p.id);
w.S.inputs = {[ids[0]]:'32',[ids[1]]:'28',[ids[2]]:'41',[ids[3]]:'19'}; w.saveRound();
w.S.inputs = {[ids[0]]:'25',[ids[1]]:'44',[ids[2]]:'30',[ids[3]]:'22'}; w.saveRound();
w.S.inputs = {[ids[0]]:'38',[ids[2]]:'35',[ids[3]]:'40'}; w.saveRound(); // Mélanie absente
check('3 manches enregistrées', w.cur().rounds.length===3);
check('retour auto sur Classement après saisie', w.S.tab==='rank');
check('moyenne par manche affichée', d.body.textContent.includes('moy.'));
check('victoire partagée non attribuée à l\'absente à tort', w.rank(w.cur()).byCumul.find(p=>p.name==='Mélanie').played===2);

L('\n[5] Le crash test : FERMER puis ROUVRIR (le problème d\'origine)');
const persisted = w._store.get('jeux-famille-v1');
const dom2 = boot(w._store); const w2 = dom2.window;
check('historique intact après réouverture (parties)', w2.D.matches.length===1);
check('historique intact après réouverture (manches)', w2.D.matches[0].rounds.length===3);

L('\n[6] Filtres de période');
w2.openMatch(w2.D.matches[0].id);
w2.S.period='custom'; w2.S.from='2030-01-01'; w2.S.to=''; w2.render();
check('période vide → message explicite + bouton "Voir tout"', dom2.window.document.body.textContent.includes('Aucune manche sur cette période'));
w2.S.period='all'; w2.render();

L('\n[7] Suppression d\'une manche : confirmation obligatoire');
const rid = w2.cur().rounds[0].id;
w2.S.confirm=rid; w2.render();
check('suppression par balayage + annulation (v61)', dom2.window.document.body.innerHTML.includes('delRound') && dom2.window.document.body.innerHTML.includes('class="swipe"'));
w2.delRound(rid);
check('manche supprimée après confirmation', w2.cur().rounds.length===2);

L('\n[8] Journal quizz');
w2.go('quizz'); w2.S.qtab='j'; w2.render();
const d2=dom2.window.document;
d2.getElementById('jp').value='astronomie — satellite de Neptune\n- Astronomie - Satellite de Neptune\nhistoire — traité de Versailles';
w2.addJournal();
check('dédoublonnage à l\'ajout (2 gardées sur 3)', w2.D.journal.length===2);
check('brief de partie généré avec consigne anti-doublon', w2.briefText().includes('FAITS DÉJÀ CONSOMMÉS') && w2.briefText().includes('On fait un quiz'));

L('\n[9] Restauration de sauvegarde (mauvais texte puis bon)');
w2.go('save');
dom2.window.document.getElementById('imp').value='n\'importe quoi';
w2.restore();
check('texte invalide rejeté sans casser les données', w2.D.matches.length===1);
dom2.window.document.getElementById('imp').value=persisted;
w2.restore();
check('sauvegarde valide restaurée (3 manches de retour)', w2.D.matches[0].rounds.length===3);

L('\n[10] Robustesse noms : apostrophes et caractères spéciaux');
w2.D.lib.push({id:'zz',name:"N'Golo <b>&\"té\""});
w2.go('save');
check('nom avec apostrophe/HTML affiché sans casser la page', dom2.window.document.body.textContent.includes("N'Golo"));
w2.go('points'); w2.openSheet();
check('feuille nouvelle partie survit au nom spécial', !!dom2.window.document.getElementById('sh'));

L('\n============================================');
L(FAIL===0 ? 'TOUT PASSE ('+FAIL+' échec)' : '*** '+FAIL+' ÉCHEC(S) — corrections requises ***');
process.exit(0);
