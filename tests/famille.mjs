import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log;
function boot(fresh){
  const store=new Map();
  const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  if(!fresh) dom.window.D.onboarded=1;
  return dom.window;
}
const txt=w=>w.document.getElementById('app').innerHTML.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const btns=w=>[...w.document.querySelectorAll('#app button')].map(b=>(b.textContent||'').trim()).filter(Boolean);

L('════ SCÉNARIO 1 : Mélanie ouvre l\'app pour la première fois ════');
const w1=boot(true);
w1.go('home'); w1.render();
L('Ce qu\'elle voit (premiers mots) :');
L('  « '+txt(w1).slice(0,150)+' … »');
L('Boutons proposés d\'emblée : '+btns(w1).length);
L('  '+btns(w1).slice(0,8).map(b=>'['+b.slice(0,26)+']').join(' '));
L('Onboarding déclenché : '+(w1.D.onboarded?'oui':'non — écran d\'accueil direct'));

L('\n════ SCÉNARIO 2 : « on joue au Uno, compte les points » (le cas n°1) ════');
const w2=boot();
let taps=0;
w2.go('points'); taps++;  w2.render();
L('Étape 1 — écran La Coupe. Options : '+btns(w2).slice(0,4).map(b=>'['+b.slice(0,24)+']').join(' '));
w2.openSheet(); taps++;
const sheetTxt=w2.document.body.innerHTML.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
L('Étape 2 — création : champs demandés avant de pouvoir jouer ?');
const inputs=[...w2.document.querySelectorAll('.sheet input, .sheet select, .sheet textarea')].length;
L('  '+inputs+' champ(s) de saisie dans la feuille');
try{ w2.createMatch(); taps++; }catch(e){ L('  createMatch → '+e.message); }
L('Après création : vue='+w2.S.view+' onglet='+w2.S.tab);
L('Gestes minimum pour être prêt à saisir : '+taps);
L('Joueurs pré-remplis : '+(w2.cur()? w2.cur().players.length : 0)+' (bibliothèque : '+w2.D.lib.length+')');

L('\n════ SCÉNARIO 3 : saisir une manche à 4, en pleine partie ════');
const m=w2.cur();
if(m){
  w2.S.tab='play'; w2.render();
  const ins=[...w2.document.querySelectorAll('#app input')].length;
  L('champs de saisie affichés : '+ins+' (1 par joueur attendu)');
  L('boutons sur l\'écran de saisie : '+btns(w2).length);
  L('  '+btns(w2).slice(0,6).map(b=>'['+b.slice(0,22)+']').join(' '));
}

L('\n════ SCÉNARIO 4 : les ados lancent Le Micro sans aide ════');
const w4=boot();
w4.go('quizz'); w4.render();
const t4=txt(w4);
L('Nombre de mots à lire avant le bouton : '+t4.split(' ').length);
L('Réglages imposés avant de jouer : ');
L('  étapes numérotées = '+(w4.document.getElementById('app').innerHTML.match(/class="stepn"/g)||[]).length);
L('Le bouton final est-il atteignable sans rien régler ? '+(btns(w4).some(b=>b.includes('Générer'))?'oui (valeurs par défaut)':'NON'));
L('Comprend-on qu\'il faut une app IA ? '+(t4.includes('assistant')||t4.includes('IA')?'oui':'non'));

L('\n════ SCÉNARIO 5 : mamie regarde le Mur des champions ════');
const w5=boot();
w5.go('champions'); w5.render();
L('Écran vide au premier usage ? → « '+txt(w5).slice(0,120)+' »');

L('\n════ SCÉNARIO 6 : on reprend une partie 3 semaines plus tard ════');
const w6=boot();
const ids=w6.D.lib.slice(0,3).map(p=>p.id);
w6.D.matches.unshift({id:'old',name:'Belote des vacances',date:'2026-07-20',status:'live',winRule:'high',target:null,
  players:w6.D.lib.slice(0,3).map(p=>({id:p.id,name:p.name})),
  rounds:[{id:'a',date:'2026-07-20',scores:{[ids[0]]:12,[ids[1]]:8,[ids[2]]:5}}]});
w6.go('home'); w6.render();
L('Reprise proposée depuis l\'accueil : '+(txt(w6).includes('Reprendre')?'OUI ✓':'non'));
L('  → « '+(txt(w6).match(/Reprendre[^·]{0,50}/)||[''])[0].trim()+' »');

L('\n════ SCÉNARIO 7 : le téléphone passe de main en main ════');
const w7=boot();
w7.go('chrono'); w7.render();
L('Tic-Tac — réglages avant de lancer : '+(w7.document.getElementById('app').innerHTML.match(/class="stepn"/g)||[]).length+' étapes');
L('Peut-on lancer sans rien régler ? '+(btns(w7).some(b=>b.includes('Démarrer'))?'oui':'non'));
w7.chStart(); w7.render();
L('Pendant la manche — boutons visibles : '+btns(w7).length);
L('  '+btns(w7).slice(0,7).map(b=>'['+b.slice(0,24)+']').join(' '));
