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

document.getElementById("btn-defend").addEventListener("touchstart", (e) => { e.preventDefault(); useActiveItem(); });
canvas.addEventListener("mousedown", () => useActiveItem());

function switchSlot(slotNum) {
    currentSlot = slotNum;
    document.querySelectorAll('.slot').forEach(s => s.classList.remove('active'));
    document.getElementById(`slot-${slotNum}`).classList.add('active');
}

// 初始化關卡 1 遊戲環境
function startGame() {
    document.getElementById("overlay").style.display = "none";
    document.getElementById("player-name").innerText = OhioData.getLoginUser();
    gameState = "PARKOUR";
    
    player.reset();

    // 關卡 1 跑酷平台配置
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
    
    document.getElementById("boss-ui").style.display = "none";
    document.getElementById("stage-text").innerText = "任務：尋找黃色鑰匙並前往右側大門";
    
    bossMusic.pause();
    bossMusic.currentTime = 0;

    // 啟動 game.js 的主迴圈
    requestAnimationFrame(gameLoop);
}

// 觸發關卡 1 Boss 戰
function startBossBattle() {
    gameState = "BOSS";
    Tool.showMsg("🔊 OHIO 巨鴨 出現！BOSS 戰開始！");
    document.getElementById("boss-ui").style.display = "block";
    document.getElementById("stage-text").innerText = "手持鍵盤靠近牠會自動進行瘋狂攻擊！";
    
    bossMusic.play().catch(() => console.log("等待手動授權音效播放"));

    // 切換為戰鬥平台
    platforms = [
        {x: 0, y: 550, width: 1000, height: 50}, 
        {x: 150, y: 400, width: 150, height: 20}, 
        {x: 700, y: 400, width: 150, height: 20}
    ];

    player.x = 100;
    player.y = 400;
    boss = new Boss();

    // 關卡 1 物資空投計時器
    const dropInterval = setInterval(() => {
        if(gameState === "BOSS") {
            let type = Math.random() > 0.5 ? "MEDKIT" : "BOMB";
            items.push({ x: 200 + Math.random() * 500, y: 0, width: 25, height: 25, type: type, vy: 0 });
        } else {
            clearInterval(dropInterval);
        }
    }, 4000);
}

// 被 game.js 的 updateEngine 定期呼叫的特定關卡邏輯
function updateGame1Logic() {
    if (gameState === "PARKOUR") {
        if (!player.hasKey && Tool.checkCollision(player, keyItem)) {
            player.hasKey = true;
            keyItem.collected = true;
            Tool.showMsg("🔑 獲得神秘鑰匙！趕快去打開大門！");
        }
        if (player.hasKey && Tool.checkCollision(player, door)) {
            startBossBattle();
        }
    }

    if (gameState === "BOSS" && boss) {
        // Boss 攻擊運算，若是重量壓頂落地，會回傳震波損血
        let shockDamage = boss.update(player, bossAttacks, particles);
        if(shockDamage > 0) damagePlayer(shockDamage);

        // 【自動攻擊】手持鍵盤且在攻擊範圍內時
        if (currentSlot === 1) {
            let hitRange = 160;
            if (player.x < boss.x && (boss.x - player.x) < hitRange && Math.abs(player.y - boss.y) < 250) {
                autoAttackTimer++;
                if (autoAttackTimer % 12 === 0) {
                    damageBoss(85, "⌨️ 鍵盤自動瘋狂暴擊！");
                    Tool.createImpactEffect(particles, boss.x + 20, player.y + 20, "#00ffcc");
                }
            } else { autoAttackTimer = 0; }
        }

        // 更新掉落補給與炸彈
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

// 被 game.js 的 renderEngine 呼叫，用來畫出第 1 關跑酷的鑰匙與大門
function renderGame1Objects(renderCtx) {
    if (gameState === "PARKOUR") {
        if (!keyItem.collected) {
            renderCtx.fillStyle = "#ffff00"; renderCtx.fillRect(keyItem.x, keyItem.y, keyItem.width, keyItem.height);
            renderCtx.font = "12px Arial"; renderCtx.fillText("🔑 鑰匙", keyItem.x - 10, keyItem.y - 5);
        }
        renderCtx.fillStyle = player.hasKey ? "#00ff00" : "#ff3333"; renderCtx.fillRect(door.x, door.y, door.width, door.height);
        renderCtx.fillStyle = "#fff"; renderCtx.font = "14px Arial"; renderCtx.fillText(player.hasKey ? "🚪 開門" : "🔒 鎖住", door.x - 5, door.y - 10);
    }
}

// 點開網頁時，自動執行第 1 關的初始化
startGame();
