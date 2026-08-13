(() => {
  const CARD_POOL = [
    {id:'spark',name:'Искра',cost:1,atk:1,hp:2,icon:'✦',text:'При выходе: 1 урон герою',battlecry:1},
    {id:'hound',name:'Глитч-гончая',cost:2,atk:3,hp:2,icon:'◆',text:'Быстрая атака',charge:true},
    {id:'guard',name:'Страж кэша',cost:3,atk:2,hp:5,icon:'⬢',text:'Прочный защитник'},
    {id:'witch',name:'Ведьма байтов',cost:4,atk:4,hp:4,icon:'☾',text:'При выходе: 2 урона герою',battlecry:2},
    {id:'wyrm',name:'Змей ядра',cost:5,atk:6,hp:5,icon:'♢',text:'Хищник из старого кода'},
    {id:'pulse',name:'Алый импульс',cost:2,spell:true,icon:'⌁',text:'Наносит герою 3 урона',damage:3},
    {id:'repair',name:'Саморемонт',cost:2,spell:true,icon:'✚',text:'Восстанавливает 4 здоровья',heal:4}
  ];
  const $ = id => document.getElementById(id);
  let state, toastTimer;
  const cloneCard = c => ({...c, uid: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36)});
  const shuffledDeck = () => Array.from({length:14},(_,i)=>cloneCard(CARD_POOL[i%CARD_POOL.length])).sort(()=>Math.random()-.5);
  function reset(){state={turn:1,maxEnergy:1,energy:1,playerHp:24,enemyHp:24,playerDeck:shuffledDeck(),enemyDeck:shuffledDeck(),hand:[],enemyHand:[],playerBoard:[],enemyBoard:[],selected:null,locked:false};for(let i=0;i<4;i++){draw('player');draw('enemy')}render()}
  function draw(side){const deck=state[side+'Deck'],hand=state[side==='player'?'hand':'enemyHand'];if(deck.length&&hand.length<7)hand.push(deck.pop())}
  function say(s){const t=$('toast');t.textContent=s;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),1100)}
  function playCard(uid,side='player'){
    if(state.locked||side==='player'&&state.turn!==1)return;
    const hand=side==='player'?state.hand:state.enemyHand, board=side==='player'?state.playerBoard:state.enemyBoard;
    const idx=hand.findIndex(c=>c.uid===uid),card=hand[idx];if(!card)return;
    const energyKey=side==='player'?'energy':'enemyEnergy';if((state[energyKey]??state.maxEnergy)<card.cost){if(side==='player')say('Не хватает энергии');return}
    if(!card.spell&&board.length>=4){if(side==='player')say('Поле заполнено');return}
    state[energyKey]=(state[energyKey]??state.maxEnergy)-card.cost;hand.splice(idx,1);
    if(card.spell){
      if(card.damage){if(side==='player')state.enemyHp-=card.damage;else state.playerHp-=card.damage}
      if(card.heal){if(side==='player')state.playerHp=Math.min(24,state.playerHp+card.heal);else state.enemyHp=Math.min(24,state.enemyHp+card.heal)}
    }
    else{card.canAttack=!!card.charge;board.push(card);if(card.battlecry)(side==='player'?state.enemyHp-=card.battlecry:state.playerHp-=card.battlecry)}
    render();checkEnd()
  }
  function unitClick(uid,side){if(state.locked||state.turn!==1)return;if(side==='player'){const u=state.playerBoard.find(x=>x.uid===uid);if(!u.canAttack)return say('Существо ещё готовится');state.selected=state.selected===uid?null:uid}else if(state.selected){attack(uid)}render()}
  function attack(targetUid=null){const a=state.playerBoard.find(x=>x.uid===state.selected);if(!a||!a.canAttack)return;if(targetUid){const d=state.enemyBoard.find(x=>x.uid===targetUid);d.hp-=a.atk;a.hp-=d.atk}else state.enemyHp-=a.atk;a.canAttack=false;state.selected=null;cleanup();render();checkEnd()}
  function cleanup(){state.playerBoard=state.playerBoard.filter(x=>x.hp>0);state.enemyBoard=state.enemyBoard.filter(x=>x.hp>0)}
  function endTurn(){if(state.locked||state.turn!==1)return;state.turn=2;state.selected=null;state.locked=true;render();setTimeout(enemyTurn,650)}
  async function enemyTurn(){state.enemyEnergy=state.maxEnergy;const affordable=()=>state.enemyHand.filter(c=>c.cost<=state.enemyEnergy&& (c.spell||state.enemyBoard.length<4));let options;while((options=affordable()).length){options.sort((a,b)=>b.cost-a.cost);playCard(options[0].uid,'enemy');await wait(420);if(checkEnd())return}
    for(const a of [...state.enemyBoard]){if(state.playerBoard.length){const d=state.playerBoard[Math.floor(Math.random()*state.playerBoard.length)];d.hp-=a.atk;a.hp-=d.atk}else state.playerHp-=a.atk;cleanup();render();await wait(380);if(checkEnd())return}
    state.maxEnergy=Math.min(8,state.maxEnergy+1);state.energy=state.maxEnergy;state.turn=1;state.locked=false;state.playerBoard.forEach(x=>x.canAttack=true);draw('player');draw('enemy');render()}
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  function checkEnd(){if(state.enemyHp>0&&state.playerHp>0)return false;state.locked=true;const win=state.enemyHp<=0;$('result-title').textContent=win?'ПОБЕДА':'РАЗРЫВ';$('result-copy').textContent=win?'Нокта отключена. Новый фрагмент мира восстановлен.':'Сигнал потерян. Попробуй собрать более сильную последовательность.';$('result').classList.remove('hidden');return true}
  function cardHtml(c){return `<button class="card ${c.cost>state.energy?'disabled':''}" data-card="${c.uid}"><span class="cost">${c.cost}</span><div class="card-art">${c.icon}</div><div class="card-title">${c.name}</div><div class="card-text">${c.text}</div>${c.spell?'':`<div class="stats"><span class="atk">⚔${c.atk}</span><span class="hp">♥${c.hp}</span></div>`}</button>`}
  function unitHtml(c,side){return `<button class="unit ${c.canAttack?'ready':''} ${state.selected===c.uid?'selected':''}" data-unit="${c.uid}" data-side="${side}"><div class="unit-art">${c.icon}</div><div class="unit-name">${c.name}</div><div class="stats"><span class="atk">⚔${c.atk}</span><span class="hp">♥${c.hp}</span></div></button>`}
  function render(){if(!state)return;$('player-hp').textContent=Math.max(0,state.playerHp);$('enemy-hp').textContent=Math.max(0,state.enemyHp);$('energy-label').textContent=`${state.energy}/${state.maxEnergy}`;$('energy-pips').textContent='●'.repeat(state.energy)+'○'.repeat(state.maxEnergy-state.energy);$('turn-label').textContent=state.turn===1?'ВАШ ХОД':'ХОД НОКТЫ';$('hand').innerHTML=state.hand.map(cardHtml).join('');$('player-board').innerHTML=state.playerBoard.map(c=>unitHtml(c,'player')).join('');$('enemy-board').innerHTML=state.enemyBoard.map(c=>unitHtml(c,'enemy')).join('');document.querySelectorAll('[data-card]').forEach(el=>el.onclick=()=>playCard(el.dataset.card));document.querySelectorAll('[data-unit]').forEach(el=>el.onclick=()=>unitClick(el.dataset.unit,el.dataset.side));$('enemy-hp').parentElement.onclick=()=>state.selected&&attack()}
  $('start-btn').onclick=()=>{$('start').classList.add('hidden');$('battle').classList.remove('hidden');reset()};$('end-turn').onclick=endTurn;$('again').onclick=()=>{$('result').classList.add('hidden');reset()};
})();
