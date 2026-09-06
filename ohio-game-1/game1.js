/**
 * Ohio Game 1 - 關卡 1 專屬邏輯控制與事件綁定
 * 負責：跑酷初始化、撿鑰匙開門、觸發Boss戰、按鍵事件、特定關卡物資與渲染
 */

// 監聽鍵盤與手持切換
window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    keys[e.code] = true;
    if(e.key === "1") switchSlot(1);
    if(e.key === "2") switchSlot(2);
    if(e.key === "3") switchSlot(3);
});
window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
    keys[e.code] = false;
});

// 手機虛擬按鍵觸控事件綁定
function bindTouch(btnId, keyName) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener("touchstart", (e) => { e.preventDefault(); keys[keyName] = true; });
    btn.addEventListener("touchend", (e) => { e.preventDefault(); keys[keyName] = false; });
}
bindTouch("btn-left", "a");
bindTouch("btn-right", "d");
bindTouch("btn-jump", "space");

// 副手/防禦功能按鈕點擊綁定
const btnDefend = document.getElementById("btn-defend");
if (btnDefend) {
    btnDefend.addEventListener("touchstart", (e) => { e.preventDefault(); useActiveItem(); });
}
canvas.addEventListener("mousedown", () => useActiveItem());

function switchSlot(slotNum) {
    currentSlot = slotNum;
    document.querySelectorAll('.slot').forEach(s => s.classList.remove('active'));
    const slotEl = document.getElementById(`slot-${slotNum}`);
    if (slotEl) slotEl.classList.add('active');
}

// 初始化關卡 1 遊戲環境
function startGame() {
    // 隱藏結算彈窗與首頁覆蓋層
    const overlay = document.getElementById("overlay");
    if (overlay) overlay.style.display = "none";
    
    const pName = document.getElementById("player-name");
    if (pName) pName.innerText = OhioData.getLoginUser();
    
    gameState = "PARKOUR";
    player.reset();

    // 關卡 1 跑酷平台配置 (讓玩家有階梯可以往上跳)
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
    items = []; 
    projectiles = []; 
    bossAttacks = []; 
    particles = [];
    grenadeCooldown = 0; 
    shieldCooldown = 0; 
    shieldActiveTime = 0; 
    autoAttackTimer = 0;
    
    const bossUi = document.getElementById("boss-ui");
    if (bossUi) bossUi.style.display = "none";
    
    const stageTxt = document.getElementById("stage-text");
    if (stageTxt) stageTxt.innerText = "任務：尋找黃色鑰匙並前往右側大門";
    
    bossMusic.pause();
    bossMusic.currentTime = 0;

    // 啟動 game.js 的核心主迴圈
    requestAnimationFrame(gameLoop);
}

// 觸發關卡 1 Boss 戰
function startBossBattle() {
    gameState = "BOSS";
    Tool.showMsg("🔊 OHIO 巨鴨 出現！BOSS 戰開始！");
    
    const bossUi = document.getElementById("boss-ui");
    if (bossUi) bossUi.style.display = "block";
    
    const stageTxt = document.getElementById("stage-text");
    if (stageTxt) stageTxt.innerText = "手持鍵盤靠近牠會自動進行瘋狂攻擊！";
    
    bossMusic.play().catch(() => console.log("等待手動點擊或授權後播放音效"));

    // 切換為適合戰鬥的平坦 Boss 地形
    platforms = [
        {x: 0, y: 550, width: 1000, height: 50}, // 主地面
        {x: 150, y: 400, width: 150, height: 20},  // 左右避難平台
        {x: 700, y: 400, width: 150, height: 20}
    ];

    player.x = 100;
    player.y = 400;
    boss = new Boss();

    // 關卡 1 物資空投計時器（每 4 秒空投一次）
    const dropInterval = setInterval(() => {
        if (gameState === "BOSS") {
            let type = Math.random() > 0.5 ? "MEDKIT" : "BOMB";
            items.push({ x: 200 + Math.random() * 500, y: 0, width: 25, height: 25, type: type, vy: 0 });
        } else {
            clearInterval(dropInterval);
        }
    }, 4000);
}

// 被 game.js 的 updateEngine() 每幀呼叫的關卡 1 專屬核心邏輯
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
        // 更新 Boss AI 並判定是否有跳躍落地的重量壓頂震波傷害
        let shockDamage = boss.update(player, bossAttacks, particles);
        if (shockDamage > 0) damagePlayer(shockDamage);

        // 【自動攻擊修正優化】手持「1 鍵盤」時拿隱藏範圍與巨鴨做高精度碰撞
        if (currentSlot === 1) {
            if (Tool.checkCollision(player.attackBox, boss)) {
                autoAttackTimer++;
                if (autoAttackTimer % 12 === 0) { // 每 12 幀穩定觸發
                    damageBoss(85, "⌨️ 鍵盤瘋狂暴擊 🦆 綠頭鴨！");
                    Tool.createImpactEffect(particles, boss.x + 20, player.y + 20, "#1e4d2b"); // 擊中噴發微軟綠粒子
                }
            } else { 
                autoAttackTimer = 0; 
            }
        }

        // 更新與拾取掉落補給、自動炸彈
        items.forEach((item, idx) => {
            item.vy += 0.2; 
            item.y += item.vy;
            
            // 落地防穿透
            if (item.y >= 525) { item.y = 525; item.vy = 0; }
            
            // 玩家碰觸自動拾取
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

// 被 game.js 的 renderEngine() 呼叫，用來渲染關卡 1 專屬物件
function renderGame1Objects(renderCtx) {
    if (gameState === "PARKOUR") {
        // 渲染黃色鑰匙
        if (!keyItem.collected) {
            renderCtx.fillStyle = "#ffff00"; 
            renderCtx.fillRect(keyItem.x, keyItem.y, keyItem.width, keyItem.height);
            renderCtx.font = "12px Arial"; 
            renderCtx.fillText("🔑 鑰匙", keyItem.x - 10, keyItem.y - 5);
        }
        // 渲染大門（有鑰匙為綠色，沒鑰匙為紅色）
        renderCtx.fillStyle = player.hasKey ? "#00ff00" : "#ff3333"; 
        renderCtx.fillRect(door.x, door.y, door.width, door.height);
        renderCtx.fillStyle = "#fff"; 
        renderCtx.font = "14px Arial"; 
        renderCtx.fillText(player.hasKey ? "🚪 開門" : "🔒 鎖住", door.x - 5, door.y - 10);
    }
}

// 點開網頁或載入時，直接啟動第一關
startGame();
