import { CARDS } from '../src/sts/data';
import { chooseNode, chooseReward, createRun, currentEnemyMove, endTurn, eventChoice, leaveShop, playCard, restHeal, restUpgrade } from '../src/sts/engine';
import type { NodeType, RunState } from '../src/sts/types';

function nodeType(run: RunState, id: string): NodeType | null {
  for (const row of run.map) for (const n of row) if (n.id === id) return n.type;
  return null;
}
function incoming(run: RunState): number {
  const m=currentEnemyMove(run); if(!m) return 0;
  let d=(m.damage??0)*(m.hits??1);
  d += (run.combat?.enemy.strength ?? 0) * (m.hits ?? 1);
  if ((run.combat?.weak ?? 0)>0) d=Math.floor(d*0.75);
  if ((run.combat?.vulnerable ?? 0)>0) d=Math.floor(d*1.5);
  return d;
}
function playCombat(run: RunState): void {
  let guard=0;
  while(run.screen==='combat'&&run.combat&&guard++<80){
    let played=true;
    while(played&&run.screen==='combat'&&run.combat){
      played=false;
      const combat=run.combat;
      const inc=incoming(run);
      const cards=[...combat.hand];
      const defs=cards.map(c=>({c,d:CARDS[c.defId]}));
      // choose block first if not enough, otherwise attack, then draw/energy
      defs.sort((a,b)=>{
        const needBlock=combat.block<inc;
        const score=(x:typeof a)=>{
          if(x.d.type==='attack') return needBlock?2:1;
          if(x.d.type==='skill' && x.d.effects.some(e=>e.kind==='block')) return needBlock?0:2;
          if(x.d.effects.some(e=>e.kind==='draw'||e.kind==='energy')) return needBlock?1:0;
          return 3;
        };
        return score(a)-score(b);
      });
      for(const {c} of defs){
        if(run.screen!=='combat') break;
        if(playCard(run,c.uid).ok){played=true;break;}
      }
    }
    if(run.screen==='combat') endTurn(run);
  }
}
function run(seed:number){ const s=createRun(seed); let guard=0;
 while(s.screen!=='victory'&&s.screen!=='defeat'&&guard++<100){
  switch(s.screen){
   case 'map': {
    const types=s.availableIds.map(id=>nodeType(s,id));
    let idx=0; const rest=types.indexOf('rest'), battle=types.indexOf('battle');
    if(s.hp<s.maxHp*0.7 && rest>=0) idx=rest; else if(battle>=0) idx=battle;
    chooseNode(s,s.availableIds[idx]); break;
   }
   case 'combat': playCombat(s); break;
   case 'reward': { const cards=s.reward!.cards.slice().sort((a,b)=>{const rank=(id:string)=>CARDS[id].rarity==='rare'?0:CARDS[id].rarity==='uncommon'?1:CARDS[id].type==='attack'?2:3;return rank(a)-rank(b);}); chooseReward(s,cards[0]); break; }
   case 'rest': if(s.hp<s.maxHp*0.75) restHeal(s); else restUpgrade(s); break;
   case 'shop': leaveShop(s); break;
   case 'event': eventChoice(s,'heal'); break;
  }
 }
 return {won:s.screen==='victory',floor:s.floor,hp:s.hp,deck:s.deck.length};
}
let wins=0,floor=0; for(let i=0;i<100;i++){const r=run(1000+i); if(r.won)wins++; floor+=r.floor;}
console.log('bot wins',wins,'of 100','avg floor',(floor/100).toFixed(1));
