import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};

function boot(opts){
  const store=(opts&&opts.store)||new Map();
  return new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined;
    if(opts&&opts.standalone!==undefined) w.navigator.standalone=opts.standalone;
  }});
}

L('[1] Bannière écran d\'accueil (détection Safari vs icône)');
let w=boot({standalone:false}).window;
ok('hors icône : astuce 📌 visible sur l\'accueil', w.document.body.textContent.includes('Pour garder l\'historique'));
w.go('points');
ok('astuce absente hors accueil (pas envahissante)', !w.document.body.textContent.includes('Pour garder l\'historique'));
let w2=boot({standalone:true}).window;
ok('lancé depuis l\'icône : pas d\'astuce', !w2.document.body.textContent.includes('Pour garder l\'historique'));

L('[2] Avatars automatiques');
ok('avatar stable par nom (2 rendus identiques)', w.avFor('Patrick')===w2.avFor('Patrick'));
ok('avatars différents pour noms différents (pool)', w.avFor('Patrick')!==w.avFor('Maxime') || w.avFor('Mélanie')!==w.avFor('Mattéo'));

L('[3] Choix d\'avatar dans la bibliothèque');
w.go('save');
ok('bouton Avatar visible', w.document.body.innerHTML.includes('>Avatar<'));
const pid=w.D.lib[0].id;
w.openAv(pid);
ok('feuille avatar ouverte', !!w.document.getElementById('avsh'));
w.S.avPick=pid; w.chooseAv('🦖');
ok('emoji choisi persisté', w.D.lib[0].emoji==='🦖' && !w.document.getElementById('avsh'));
ok('avFor renvoie le choix explicite', w.avFor('Patrick')==='🦖' && w.avFor('patrick')==='🦖');

L('[4] Avatars visibles partout');
w.go('points'); w.openSheet(); w.document.getElementById('mn').value='Test'; w.createMatch();
const ids=w.cur().players.map(p=>p.id);
w.S.inputs={[ids[0]]:'10',[ids[1]]:'5'}; w.saveRound();
ok('classement : avatar 🦖 de Patrick affiché', w.document.getElementById('app').innerHTML.includes('🦖'));
w.S.tab='play'; w.render();
ok('saisie : avatars affichés', w.document.getElementById('app').innerHTML.includes('class="av sm"'));
w.go('palmares');
ok('palmarès : avatar champion en grand', w.document.getElementById('app').innerHTML.includes('av big'));
w.go('chrono'); w.chStart();
ok('Tic-Tac : avatar au centre de l\'anneau', w.document.querySelectorAll('.ring .face').length===w.CH.players.length && [...w.document.querySelectorAll('.ring .face')].every(f=>f.innerHTML.trim().length>0));

L('[5] Persistance des avatars après fermeture/réouverture');
const st=new Map(); let wa=boot({store:st}).window;
wa.S.avPick=wa.D.lib[1].id; wa.chooseAv('👽');
let wb=boot({store:st}).window;
ok('avatar retrouvé au relancement', wb.D.lib[1].emoji==='👽');

L(F===0?'\nTOUT PASSE':'\n*** '+F+' ECHEC(S) ***');
