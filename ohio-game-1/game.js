/**
 * Ohio Game 1 - 遊戲核心引擎與渲染器 (Core Engine & Renderer)
 * 負責：全局變數定義、主遊戲迴圈 (Game Loop)、通用物理計算、冷卻時間 (CD)、通用物件渲染
 */

// 全局遊戲核心變數與畫布初始化
const wrapper = document.getElementById("game-wrapper");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const bossMusic = document.getElementById("bossMusic");

let gameState = "START";
let keys = {};
let platforms = [];
let keyItem = {};
let door = {};
let items = [];
let projectiles = [];
let bossAttacks = [];
let particles = [];

let currentSlot = 1;
let autoAttackTimer = 0;
let grenadeCooldown = 0;
let shieldCooldown = 0;
let shieldActiveTime = 0;

// 實例化通用玩家，Boss 實例則保留由關卡控制器 (如 game1.js) 動態觸發
const player = new Player();
let boss = null;

// 自動依螢幕調整大小 (自適應 RWD)
window.addEventListener("resize", () => {
    if (typeof Tool !== "undefined" && Tool.resizeGame) {
        Tool.resizeGame(wrapper);
    }
});
if (typeof Tool !== "undefined" && Tool.resizeGame) {
    Tool.resizeGame(wrapper);
}

// 核心主遊戲迴圈 (Game Loop)
function gameLoop() {
    updateEngine();
    renderEngine();
    if (gameState !== "GAMEOVER" && gameState !== "WIN") {
        requestAnimationFrame(gameLoop);
    }
}

// 核心物理與冷卻時間引擎更新
function updateEngine() {
    // 1. 處理道具與技能的冷卻時間 (每秒 60 幀計算)
    if (grenadeCooldown > 0) grenadeCooldown -= 1000/60;
    if (shieldActiveTime > 0) shieldActiveTime -= 1000/60;
    if (shieldCooldown > 0) shieldCooldown -= 1000/60;
    
    // 2. 安全更新冷卻 UI 顯示
    const cdGrenadeEl = document.getElementById("cd-grenade");
    if (cdGrenadeEl) {
        cdGrenadeEl.innerText = grenadeCooldown > 0 ? (grenadeCooldown/1000).toFixed(1) + "s" : "";
    }

    const shieldStatusEl = document.getElementById("shield-status");
    if (shieldStatusEl) {
        shieldStatusEl.innerText = shieldActiveTime > 0 ? `【🛡️ 盾: ${(shieldActiveTime/1000).toFixed(1)}s】` : "";
    }
    
    const cdShieldEl = document.getElementById("cd-shield");
    if (cdShieldEl) {
        if (shieldCooldown > 0) {
            let displayCd = (shieldCooldown / 1000) - 8;
            cdShieldEl.innerText = displayCd > 0 ? displayCd.toFixed(1) + "s" : (shieldActiveTime > 0 ? "使用中" : "");
        } else { 
            cdShieldEl.innerText = ""; 
        }
    }

    // 3. 更新玩家物理位移與平台碰撞 (內部包含自動攻擊 attackBox 的座標同步)
    player.update(keys, platforms);

    // 4. 動態安全呼叫由關卡指令碼 (如 game1.js) 注入的特定關卡邏輯
    if (typeof updateGame1Logic === "function") {
        updateGame1Logic();
    }

    // 5. 更新武器投擲物物理軌跡 (手雷、自動炸彈)
    projectiles.forEach((proj, idx) => {
        if (proj.type === "GRENADE") {
            proj.x += proj.vx; 
            proj.vy += 0.3; // 模擬重力拋物線
            proj.y += proj.vy;

            // 撞擊 Boss 判定
            if (boss && typeof Tool !== "undefined" && Tool.checkCollision(proj, boss)) {
                damageBoss(100, "💣 神聖手雷炸裂！");
                Tool.createImpactEffect(particles, proj.x, proj.y, "#ffff00");
                projectiles.splice(idx, 1);
            } else if (proj.y > 550) {
                projectiles.splice(idx, 1); // 掉出螢幕清除
            }
        } 
        else if (proj.type === "AUTO_BOMB") {
            if (boss) {
                // 自動追蹤導引演算法：飛向 Boss 身體中心
                let dx = (boss.x + boss.width/2) - proj.x;
                let dy = (boss.y + boss.height/2) - proj.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist > 5) { 
                    proj.x += (dx / dist) * 12; 
                    proj.y += (dy / dist) * 12; 
                }
                
                if (typeof Tool !== "undefined" && Tool.checkCollision(proj, boss)) {
                    damageBoss(350, "💥 自動引爆空投炸彈！");
                    Tool.createImpactEffect(particles, proj.x, proj.y, "#ff3300");
                    projectiles.splice(idx, 1);
                }
            }
        }
    });

    // 6. 更新 Boss 技能預警區與大範圍傷害判定
    bossAttacks.forEach((atk, idx) => {
        if (atk.type === "METEOR") {
            atk.timer--;
            if (atk.timer <= 0) {
                atk.y += 11; // 隕石下砸速度
                if (atk.y >= 530) {
                    // 落地爆炸半徑檢查
                    if (Math.abs(player.x - atk.x) < 80 && player.y > 440) {
                        damagePlayer(25);
                    }
                    bossAttacks.splice(idx, 1);
                }
            }
        } 
        else if (atk.type === "SPIKES") {
            atk.timer--;
            // 尖刺突出判定期間 (突起前會有預警時間)
            if (atk.timer < 120 && atk.timer > 0 && player.y >= 500) {
                damagePlayer(2); // 每幀持續扣血傷害
            }
            if (atk.timer <= 0) bossAttacks.splice(idx, 1);
        }
    });

    // 7. 掉落虛空死亡判定
    if (player.y > 600) damagePlayer(100);

    // 8. 刷新頂部所有 UI 即時數值
    const pReplHpText = document.getElementById("player-hp-text");
    if (pReplHpText) pReplHpText.innerText = Math.ceil(player.hp);
    
    const pReplHpBar = document.getElementById("player-hp-bar");
    if (pReplHpBar) pReplHpBar.style.width = (player.hp / player.maxHp) * 100 + "%";
    
    if (boss) {
        const bReplHpText = document.getElementById("boss-hp-text");
        if (bReplHpText) bReplHpText.innerText = boss.hp;
        
        const bReplHpBar = document.getElementById("boss-hp-bar");
        if (bReplHpBar) bReplHpBar.style.width = (boss.hp / boss.maxHp) * 100 + "%";
    }
}

// 核心圖形渲染引擎
function renderEngine() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. 繪製關卡地形平台
    platforms.forEach(p => {
        ctx.fillStyle = (gameState === "BOSS" && p.y === 550) ? "#222" : "#555";
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.strokeStyle = "#888"; 
        ctx.strokeRect(p.x, p.y, p.width, p.height);
    });

    // 2. 動態安全呼叫關卡專屬物件渲染 (如跑酷階段的鑰匙、大門)
    if (typeof renderGame1Objects === "function") {
        renderGame1Objects(ctx);
    }

    // 3. 繪製 Boss 技能效果與預警紅色色塊
    bossAttacks.forEach(atk => {
        if (atk.type === "METEOR") {
            ctx.fillStyle = "rgba(255, 0, 0, 0.4)"; 
            ctx.fillRect(atk.x - 40, 540, 80, 10); // 地面預警
            if (atk.timer <= 0) { 
                ctx.fillStyle = "#ff6600"; 
                ctx.beginPath(); 
                ctx.arc(atk.x, atk.y, 20, 0, Math.PI*2); 
                ctx.fill(); 
            }
        } 
        else if (atk.type === "SPIKES") {
            if (atk.timer > 120) {
                ctx.fillStyle = "rgba(255, 0, 0, 0.3)"; 
                ctx.fillRect(0, 530, 1000, 20); // 全地面預警
            } else {
                ctx.fillStyle = "#990000"; // 畫出紅色尖刺矩陣
                for (let i = 0; i < 1000; i += 20) {
                    ctx.beginPath(); 
                    ctx.moveTo(i, 550); 
                    ctx.lineTo(i+10, 510); 
                    ctx.lineTo(i+20, 550); 
                    ctx.fill();
                }
            }
        }
    });

    // 4. 繪製地圖掉落道具 (醫療包、自動炸彈)
    items.forEach(item => {
        ctx.fillStyle = item.type === "MEDKIT" ? "#00ff00" : "#ffaa00";
        ctx.fillRect(item.x, item.y, item.width, item.height);
        ctx.fillStyle = item.type === "MEDKIT" ? "#fff" : "#000";
        ctx.font = "11px Arial"; 
        ctx.fillText(item.type === "MEDKIT" ? "➕醫" : "💣炸", item.x - 1, item.y + 16);
    });

    // 5. 繪製拋物武器與手雷子彈
    projectiles.forEach(proj => {
        ctx.fillStyle = proj.type === "GRENADE" ? "#ffff00" : "#ff3300";
        ctx.beginPath(); 
        ctx.arc(proj.x, proj.y, proj.width/2, 0, Math.PI*2); 
        ctx.fill();
    });

    // 6. 繪製擊中爆炸粒子特效系統
    particles.forEach((p, idx) => {
        p.x += p.vx; 
        p.y += p.vy; 
        p.life--;
        ctx.fillStyle = p.color; 
        ctx.globalAlpha = p.life / 25; // 隨生命週期逐漸淡出
        ctx.beginPath(); 
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); 
        ctx.fill();
        ctx.globalAlpha = 1;
        if (p.life <= 0) particles.splice(idx, 1);
    });

    // 7. 渲染 Boss 巨鴨與玩家主角本體
    if (gameState === "BOSS" && boss) boss.draw(ctx);
    player.draw(ctx, currentSlot, gameState, autoAttackTimer);

    // 8. 若防疫盾啟動，額外增繪無敵科技光圈特效
    if (shieldActiveTime > 0) {
        ctx.strokeStyle = "rgba(0, 255, 204, 0.6)"; 
        ctx.lineWidth = 4;
        ctx.beginPath(); 
        ctx.arc(player.x + player.width/2, player.y + player.height/2, 45, 0, Math.PI*2); 
        ctx.stroke();
    }
}

// 傷害結算與核心狀態改變機制
function damageBoss(amount, label) {
    if (!boss) return;
    boss.hp -= amount;
    if (boss.hp <= 0) {
        boss.hp = 0;
        gameState = "WIN";
        endGame(true);
    }
    const bActionEl = document.getElementById("boss-action");
    if (bActionEl) bActionEl.innerText = `${label} -${amount}`;
}

function damagePlayer(amount) {
    if (shieldActiveTime > 0) return; // 防疫盾啟用時完全免疫傷害
    player.hp -= amount;
    if (player.hp <= 0) {
        player.hp = 0;
        gameState = "GAMEOVER";
        endGame(false);
    }
}

// 遊戲結束彈出結算視窗
function endGame(isWin) {
    if (bossMusic) bossMusic.pause();
    
    const overlay = document.getElementById("overlay");
    const title = document.getElementById("end-title");
    const sub = document.getElementById("end-sub");
    
    if (overlay) overlay.style.display = "flex";
    
    let uName = "特務";
    if (typeof OhioData !== "undefined" && OhioData.getLoginUser) {
        uName = OhioData.getLoginUser();
    }

    if (isWin) {
        if (title) { title.innerText = "🏆 YOU WIN!"; title.style.color = "#00ffcc"; }
        if (sub) sub.innerText = `${uName} 成功用鍵盤自動連擊終結了 Microsoft 巨鴨 🦆 的統治！`;
    } else {
        if (title) { title.innerText = "💀 GAME OVER"; title.style.color = "#ff3333"; }
        if (sub) sub.innerText = "微軟綠頭鴨太強了，你被無情扣血制裁。";
    }
}
