/**
 * Ohio Game 1 - 關卡 1 專屬邏輯控制與事件綁定 (E鍵手雷獨立版)
 */

// 監聽鍵盤與手持切換
window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    keys[e.code] = true;
    
    // 工具欄快捷切換
    if(e.key === "1") switchSlot(1);
    if(e.key === "2") switchSlot(2);
    if(e.key === "3") switchSlot(3);
    
    // 【新需求】電腦端按下「E 鍵」，直接觸發丟手雷功能
    if(e.key === "e") {
        throwGrenadeDirectly();
    }
});
window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
    keys[e.code] = false;
});

// 手機與平板端虛擬按鍵觸控事件綁定
function bindTouch(btnId, keyName) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener("touchstart", (e) => { 
        e.preventDefault(); 
        keys[keyName] = true; 
    }, { passive: false });
    btn.addEventListener("touchend", (e) => { 
        e.preventDefault(); 
        keys[keyName] = false; 
    }, { passive: false });
}

bindTouch("btn-left", "a");
bindTouch("btn-right", "d");
bindTouch("btn-jump", "space");

// 【新需求】平板行動端點擊「E 按鈕」，直接丟出手雷
const btnGrenadeE = document.getElementById("btn-grenade-e");
if (btnGrenadeE) {
    btnGrenadeE.addEventListener("touchstart", (e) => {
        e.preventDefault();
        throwGrenadeDirectly();
    }, { passive: false });
}

// 平板行動端點擊「防疫盾」按鈕，專門用來開啟防禦盾
const btnDefend = document.getElementById("btn-defend");
if (btnDefend) {
    btnDefend.addEventListener("touchstart", (e) => { 
        e.preventDefault(); 
        activateShieldDirectly();
    }, { passive: false });
}

// 獨立呼叫：隨時直接丟手雷邏輯
function throwGrenadeDirectly() {
    if(gameState !== "BOSS") return;
    
    if (grenadeCooldown <= 0) {
        projectiles.push({ x: player.x + 20, y: player.y + 10, vx: 12, vy: -6, type: "GRENADE", width: 15, height: 15 });
        grenadeCooldown = 5000; // 5秒 CD
    } else {
        Tool.showMsg("⏳ 神聖手雷冷卻中！");
    }
}

// 獨立呼叫：隨時直接開防禦盾邏輯
function activateShieldDirectly() {
    if(gameState !== "BOSS") return;
    
    if (shieldCooldown <= 0 && shieldActiveTime <= 0) {
        shieldActiveTime = 8000; 
        shieldCooldown = 12000; 
        Tool.showMsg("🛡️ 防疫盾已啟動！持續 8 秒免疫傷害");
    } else {
        Tool.showMsg("⏳ 防疫盾冷卻中！");
    }
}

// 電腦滑鼠點擊畫布做為彈性副武觸發（觸發當前選中道具，如手雷或防疫盾）
canvas.addEventListener("mousedown", () => {
    if (typeof useActiveItem === "function") {
        useActiveItem();
    }
});

function switchSlot(slotNum) {
    currentSlot = slotNum;
    document.querySelectorAll('.slot').forEach(s => s.classList.remove('active'));
    const slotEl = document.getElementById(`slot-${slotNum}`);
    if (slotEl) slotEl.classList.add('active');
}

// 初始化關卡 1 遊戲環境
function startGame() {
    const overlay = document.getElementById("overlay");
    if (overlay) overlay.style.display = "none";
    
    const pName = document.getElementById("player-name");
    if (pName) pName.innerText = OhioData.getLoginUser();
    
    gameState = "PARKOUR";
    player.reset();

    platforms = [
        {x: 0, y: 550, width: 300, height: 50},
        {x: 400, y: 450, width: 200, height: 30},
        {x: 150, y: 350, width: 180, height: 30},
        {x: 450, y: 250, width: 150, height: 30},
        {x: 700, y: 330, width: 150, height: 30},
        {x: 850, y: 500, width: 150, height: 100}
    ];

    keyItem = {x: 520, y: 210, width: 20, height: 20, collected: false};
    door = {x: 930, y: 400, width: 40, height: 100};

    boss = null;
    items = []; projectiles = []; bossAttacks = []; particles = [];
    grenadeCooldown = 0; shieldCooldown = 0; shieldActiveTime = 0; autoAttackTimer = 0;
    
    const bossUi = document.getElementById("boss-ui");
    if (bossUi) bossUi.style.display = "none";
    
    const stageTxt = document.getElementById("stage-text");
    if (stageTxt) stageTxt.innerText = "任務：尋找黃色鑰匙並前往右側大門";
    
    bossMusic.pause();
    bossMusic.currentTime = 0;

    requestAnimationFrame(gameLoop);
}

function startBossBattle() {
    gameState = "BOSS";
    Tool.showMsg("🔊 OHIO 巨鴨 出現！BOSS 戰開始！");
    
    const bossUi = document.getElementById("boss-ui");
    if (bossUi) bossUi.style.display = "block";
    
    const stageTxt = document.getElementById("stage-text");
    if (stageTxt) stageTxt.innerText = "手持鍵盤靠近牠會自動進行瘋狂攻擊！按 E 丟手雷！";
    
    bossMusic.play().catch(() => console.log("等待授權後播放音效"));

    platforms = [
        {x: 0, y: 550, width: 1000, height: 50}, 
        {x: 150, y: 400, width: 150, height: 20},  
        {x: 700, y: 400, width: 150, height: 20}
    ];

    player.x = 100;
    player.y = 400;
    boss = new Boss();

    const dropInterval = setInterval(() => {
        if (gameState === "BOSS") {
            let type = Math.random() > 0.5 ? "MEDKIT" : "BOMB";
            items.push({ x: 200 + Math.random() * 500, y: 0, width: 25, height: 25, type: type, vy: 0 });
        } else {
            clearInterval(dropInterval);
        }
    }, 4000);
}

function updateGame1Logic() {
    if (gameState === "PARKOUR") {
        if (!keyItem.collected && Tool.checkCollision(player, keyItem)) {
            player.hasKey = true;
            keyItem.collected = true;
            Tool.showMsg("🔑 獲得神秘鑰匙！趕快去打開大門！");
        }
        if (player.hasKey && Tool.checkCollision(player, door)) {
            startBossBattle();
        }
    }

    if (gameState === "BOSS" && boss) {
        let shockDamage = boss.update(player, bossAttacks, particles);
        if (shockDamage > 0) damagePlayer(shockDamage);

        // 鍵盤隱藏感應區自動攻擊
        if (currentSlot === 1) {
            if (Tool.checkCollision(player.attackBox, boss)) {
                autoAttackTimer++;
                if (autoAttackTimer % 12 === 0) { 
                    damageBoss(85, "⌨️ 鍵盤瘋狂暴擊 🦆 綠頭鴨！");
                    Tool.createImpactEffect(particles, boss.x + 20, player.y + 20, "#1e4d2b"); 
                }
            } else { 
                autoAttackTimer = 0; 
            }
        }

        items.forEach((item, idx) => {
            item.vy += 0.2; item.y += item.vy;
            if (item.y >= 525) { item.y = 525; item.vy = 0; }
            
            if (Tool.checkCollision(player, item)) {
                if (item.type === "MEDKIT") {
                    player.hp = Math.min(player.maxHp, player.hp + 70);
                    Tool.showMsg("💚 吃了老乾媽醫療包，HP +70");
                } else {
                    Tool.showMsg("🚀 自動拾取炸彈！自動投向大鴨鴨！");
                    projectiles.push({ x: player.x, y: player.y, type: "AUTO_BOMB", width: 20, height: 20 });
                }
                items.splice(idx, 1);
            }
        });
    }
}

function renderGame1Objects(renderCtx) {
    if (gameState === "PARKOUR") {
        if (!keyItem.collected) {
            renderCtx.fillStyle = "#ffff00"; 
            renderCtx.fillRect(keyItem.x, keyItem.y, keyItem.width, keyItem.height);
            renderCtx.font = "12px Arial"; 
            renderCtx.fillText("🔑 鑰匙", keyItem.x - 10, keyItem.y - 5);
        }
        renderCtx.fillStyle = player.hasKey ? "#00ff00" : "#ff3333"; 
        renderCtx.fillRect(door.x, door.y, door.width, door.height);
        renderCtx.fillStyle = "#fff"; renderCtx.font = "14px Arial"; renderCtx.fillText(player.hasKey ? "🚪 開門" : "🔒 鎖住", door.x - 5, door.y - 10);
    }
}

startGame();
