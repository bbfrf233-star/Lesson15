// --- Данные игры ---
const player = {
  level: 1,
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  exp: 0,
  maxExp: 100,
  baseAtk: 15,
  baseDef: 5,
  gold: 50,
  weapon: { name: "Ржавый меч", atk: 5 },
  armor: { name: "Тканевая рубаха", def: 2 }
};

const locations = {
  forest: {
    name: "Тёмный Лес",
    enemies: [
      { name: "Дикий Волк", hp: 40, maxHp: 40, atk: 8, exp: 25, gold: 15, icon: "🐺" },
      { name: "Гоблин-разведчик", hp: 35, maxHp: 35, atk: 10, exp: 30, gold: 20, icon: "👺" }
    ]
  },
  cave: {
    name: "Пещера Гоблинов",
    enemies: [
      { name: "Огр-воин", hp: 80, maxHp: 80, atk: 18, exp: 60, gold: 45, icon: "👹" },
      { name: "Пещерный паук", hp: 60, maxHp: 60, atk: 15, exp: 45, gold: 30, icon: "🕷️" }
    ]
  },
  dungeon: {
    name: "Подземелье Дракона",
    enemies: [
      { name: "Огненный Дракон", hp: 180, maxHp: 180, atk: 30, exp: 150, gold: 120, icon: "🐉" },
      { name: "Рыцарь смерти", hp: 120, maxHp: 120, atk: 25, exp: 100, gold: 80, icon: "💀" }
    ]
  }
};

const shopItems = [
  { id: "potion_hp", name: "Зелье HP", desc: "+50 HP", price: 15, type: "use" },
  { id: "potion_mp", name: "Зелье MP", desc: "+30 MP", price: 15, type: "use" },
  { id: "sword_1", name: "Стальной меч", desc: "+12 к атаке", price: 60, type: "weapon", atk: 12 },
  { id: "sword_2", name: "Магический клинок", desc: "+25 к атаке", price: 150, type: "weapon", atk: 25 },
  { id: "armor_1", name: "Кожаный доспех", desc: "+8 к защите", price: 50, type: "armor", def: 8 },
  { id: "armor_2", name: "Латы Рыцаря", desc: "+18 к защите", price: 140, type: "armor", def: 18 }
];

let inventory = [
  { id: "potion_hp", name: "Зелье HP", desc: "+50 HP", count: 3, type: "use" }
];

let currentLoc = "forest";
let currentEnemy = null;

// --- Инициализация ---
window.onload = () => {
  findNewEnemy();
  updateUI();
  renderInventory();
  renderShop();
};

// --- Игровая логика ---
function getPlayerTotalAtk() {
  return player.baseAtk + (player.weapon ? player.weapon.atk : 0);
}

function getPlayerTotalDef() {
  return player.baseDef + (player.armor ? player.armor.def : 0);
}

function selectLocation(locKey) {
  currentLoc = locKey;
  document.querySelectorAll('.btn-loc').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  addLog(`Вы перешли в локацию: ${locations[locKey].name}`, 'log-system');
  findNewEnemy();
}

function findNewEnemy() {
  const locEnemies = locations[currentLoc].enemies;
  const template = locEnemies[Math.floor(Math.random() * locEnemies.length)];
  currentEnemy = JSON.parse(JSON.stringify(template)); // Клонируем объект
  updateUI();
}

function playerAttack() {
  if (player.hp <= 0 || !currentEnemy) return;

  const damage = Math.max(1, getPlayerTotalAtk() + Math.floor(Math.random() * 5) - 2);
  currentEnemy.hp -= damage;
  if (currentEnemy.hp < 0) currentEnemy.hp = 0;

  addLog(`Вы атаковали ${currentEnemy.name} и нанесли ${damage} урона!`, 'log-player');
  
  if (currentEnemy.hp === 0) {
    winBattle();
  } else {
    enemyAttack();
  }
  updateUI();
}

function playerMagic() {
  if (player.hp <= 0 || !currentEnemy) return;

  const mpCost = 15;
  if (player.mp < mpCost) {
    addLog("Недостаточно маны!", "log-system");
    return;
  }

  player.mp -= mpCost;
  const magicDamage = Math.floor(getPlayerTotalAtk() * 1.8);
  currentEnemy.hp -= magicDamage;
  if (currentEnemy.hp < 0) currentEnemy.hp = 0;

  addLog(`Вы применили заклинание и нанесли ${magicDamage} урона!`, 'log-player');

  if (currentEnemy.hp === 0) {
    winBattle();
  } else {
    enemyAttack();
  }
  updateUI();
}

function playerHeal() {
  const hpItemIndex = inventory.findIndex(item => item.id === "potion_hp");
  if (hpItemIndex !== -1 && inventory[hpItemIndex].count > 0) {
    useItem(hpItemIndex);
    enemyAttack();
    updateUI();
  } else {
    addLog("У вас нет зелий здоровья!", "log-system");
  }
}

function enemyAttack() {
  setTimeout(() => {
    if (!currentEnemy || currentEnemy.hp <= 0) return;

    const rawDamage = currentEnemy.atk + Math.floor(Math.random() * 4) - 2;
    const actualDamage = Math.max(1, rawDamage - Math.floor(getPlayerTotalDef() / 2));
    
    player.hp -= actualDamage;
    if (player.hp < 0) player.hp = 0;

    addLog(`${currentEnemy.name} атакует вас и наносит ${actualDamage} урона!`, 'log-enemy');

    if (player.hp === 0) {
      addLog("💀 Вы погибли в бою! Поражение...", "log-enemy");
      setTimeout(respawnPlayer, 2000);
    }
    updateUI();
  }, 400);
}

function winBattle() {
  addLog(`🎉 Победа! Вы одолели ${currentEnemy.name}!`, 'log-reward');
  addLog(`Получено: +${currentEnemy.exp} EXP, +${currentEnemy.gold} 💰`, 'log-reward');

  player.gold += currentEnemy.gold;
  player.exp += currentEnemy.exp;

  checkLevelUp();

  setTimeout(() => {
    findNewEnemy();
  }, 1500);
}

function checkLevelUp() {
  if (player.exp >= player.maxExp) {
    player.level++;
    player.exp -= player.maxExp;
    player.maxExp = Math.floor(player.maxExp * 1.5);
    
    player.maxHp += 20;
    player.hp = player.maxHp;
    player.maxMp += 10;
    player.mp = player.maxMp;
    player.baseAtk += 4;
    player.baseDef += 2;

    addLog(`✨ Уровень повышен! Теперь вы ${player.level} уровня! Все статы увеличены!`, 'log-system');
  }
}

function respawnPlayer() {
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  addLog("Вы воскресли в городе, полностью восстановив силы.", "log-system");
  findNewEnemy();
  updateUI();
}

// --- Инвентарь и Магазин ---
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  if (tabName === 'inventory') {
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.getElementById('tab-inventory').classList.add('active');
  } else {
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.getElementById('tab-shop').classList.add('active');
  }
}

function renderInventory() {
  const list = document.getElementById('inventory-list');
  list.innerHTML = "";

  if (inventory.length === 0) {
    list.innerHTML = "<li style='color: var(--text-muted); font-size:0.9rem;'>Инвентарь пуст</li>";
    return;
  }

  inventory.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = "item-card";
    
    let actionBtn = "";
    if (item.type === "use") {
      actionBtn = `<button class="btn btn-sm btn-heal" onclick="useItem(${index})">Использовать</button>`;
    } else if (item.type === "weapon" || item.type === "armor") {
      actionBtn = `<button class="btn btn-sm btn-action" onclick="equipItem(${index})">Надеть</button>`;
    }

    li.innerHTML = `
      <div class="item-info">
        <span class="item-name">${item.name} ${item.count ? `(x${item.count})` : ''}</span>
        <span class="item-desc">${item.desc}</span>
      </div>
      ${actionBtn}
    `;
    list.appendChild(li);
  });
}

function renderShop() {
  const list = document.getElementById('shop-list');
  list.innerHTML = "";

  shopItems.forEach((item) => {
    const li = document.createElement('li');
    li.className = "item-card";
    li.innerHTML = `
      <div class="item-info">
        <span class="item-name">${item.name}</span>
        <span class="item-desc">${item.desc}</span>
      </div>
      <button class="btn btn-sm btn-action" onclick="buyItem('${item.id}')">${item.price} 💰</button>
    `;
    list.appendChild(li);
  });
}

function buyItem(itemId) {
  const item = shopItems.find(i => i.id === itemId);
  if (!item) return;

  if (player.gold >= item.price) {
    player.gold -= item.price;
    
    // Добавление в инвентарь
    const existing = inventory.find(i => i.id === item.id);
    if (existing && existing.count) {
      existing.count++;
    } else {
      const newItem = { ...item };
      if (item.type === "use") newItem.count = 1;
      inventory.push(newItem);
    }

    addLog(`Куплено: ${item.name}`, 'log-reward');
    updateUI();
    renderInventory();
  } else {
    addLog("Недостаточно золота!", 'log-system');
  }
}

function useItem(index) {
  const item = inventory[index];
  if (!item) return;

  if (item.id === "potion_hp") {
    player.hp = Math.min(player.maxHp, player.hp + 50);
    addLog("Вы восстановили 50 HP!", "log-player");
  } else if (item.id === "potion_mp") {
    player.mp = Math.min(player.maxMp, player.mp + 30);
    addLog("Вы восстановили 30 MP!", "log-player");
  }

  if (item.count > 1) {
    item.count--;
  } else {
    inventory.splice(index, 1);
  }

  updateUI();
  renderInventory();
}

function equipItem(index) {
  const item = inventory[index];
  if (!item) return;

  if (item.type === "weapon") {
    player.weapon = item;
    addLog(`Вы экипировали: ${item.name}`, 'log-system');
  } else if (item.type === "armor") {
    player.armor = item;
    addLog(`Вы надели: ${item.name}`, 'log-system');
  }

  updateUI();
}

// --- Обновление интерфейса ---
function updateUI() {
  // Игрок
  document.getElementById('player-level').innerText = player.level;
  document.getElementById('hp-text').innerText = `${player.hp} / ${player.maxHp}`;
  document.getElementById('hp-bar').style.width = `${(player.hp / player.maxHp) * 100}%`;
  
  document.getElementById('mp-text').innerText = `${player.mp} / ${player.maxMp}`;
  document.getElementById('mp-bar').style.width = `${(player.mp / player.maxMp) * 100}%`;

  document.getElementById('exp-text').innerText = `${player.exp} / ${player.maxExp}`;
  document.getElementById('exp-bar').style.width = `${(player.exp / player.maxExp) * 100}%`;

  document.getElementById('player-atk').innerText = getPlayerTotalAtk();
  document.getElementById('player-def').innerText = getPlayerTotalDef();
  document.getElementById('player-gold').innerText = player.gold;

  document.getElementById('eq-weapon').innerText = player.weapon ? `${player.weapon.name} (+${player.weapon.atk})` : "Нет";
  document.getElementById('eq-armor').innerText = player.armor ? `${player.armor.name} (+${player.armor.def})` : "Нет";

  // Враг
  if (currentEnemy) {
    document.getElementById('enemy-sprite').innerText = currentEnemy.icon;
    document.getElementById('enemy-name').innerText = currentEnemy.name;
    document.getElementById('enemy-hp-text').innerText = `${currentEnemy.hp} / ${currentEnemy.maxHp}`;
    document.getElementById('enemy-hp-bar').style.width = `${(currentEnemy.hp / currentEnemy.maxHp) * 100}%`;
  }
}

function addLog(message, className = '') {
  const logBox = document.getElementById('combat-log');
  const entry = document.createElement('p');
  entry.className = `log-entry ${className}`;
  entry.innerText = message;
  logBox.appendChild(entry);
  logBox.scrollTop = logBox.scrollHeight;
}