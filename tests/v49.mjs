import { JSDOM } from 'jsdom'; import fs from 'fs';
const html=fs.readFileSync('/mnt/user-data/outputs/index.html','utf8');
const L=console.log; let F=0; const ok=(l,c)=>{L((c?'  OK   ':'  ECHEC')+' — '+l); if(!c)F++;};
const store=new Map();
function boot(){
  const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.github.io/',beforeParse(w){
    Object.defineProperty(w,'localStorage',{value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});
    w.navigator.serviceWorker=undefined; w.scrollTo=()=>{};}});
  return dom.window;
}
const w=boot(); w.D.onboarded=1; w.go('home'); w.render();
const app=()=>w.document.getElementById('app').innerHTML;
const first=()=>{const b=w.document.querySelector('#app button');return (b.textContent||'').trim();};

L('[1] Le conseil ne bloque plus la découverte');
ok('les jeux passent avant le conseil', app().indexOf('La Coupe')<app().indexOf("écran d'accueil"));
ok('premier bouton = un jeu, plus « OK »', first().includes('Coupe')||first().includes('🏆'));
ok('ton apaisé (plus une alerte ambre)', !/warn[^>]*>[^<]*📌/.test(app()));

L('[2] Le conseil est mémorisé (il revenait à chaque ouverture)');
ok('conseil visible au départ', app().includes("écran d'accueil"));
w.D.tipOff=1; w.persist(); w.render();
ok('masqué après OK', !app().includes("Ajoute En Jeux à ton écran"));
const w2=boot(); w2.D.onboarded=1; w2.go('home'); w2.render();
ok('toujours masqué au relancement suivant', !w2.document.getElementById('app').innerHTML.includes("Ajoute En Jeux à ton écran"));
L(F? '\n*** '+F+' ECHEC(S) ***' : '\nTOUT PASSE ('+F+' échec)');
