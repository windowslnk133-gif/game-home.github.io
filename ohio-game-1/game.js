// 全局遊戲核心變數
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

// 實例化玩家，Boss 留給關卡初始化
const player = new Player();
let boss = null;

// 自動依螢幕調整大小
window.addEventListener("resize", () => Tool.resizeGame(wrapper));
Tool.resizeGame(wrapper);

// 核心主迴圈
function gameLoop() {
    updateEngine();
    renderEngine();
    if (gameState !== "GAMEOVER" && gameState !== "WIN") {
        requestAnimationFrame(gameLoop);
    }
}

// 核心物理與冷卻引擎更新
function updateEngine() {
    // 處理冷卻時間
    if (grenadeCooldown > 0) grenadeCooldown -= 1000/60;
    if (shieldActiveTime > 0) shieldActiveTime -= 1000/60;
    if (shieldCooldown > 0) shieldCooldown -= 1000/60;
    
    // 更新冷卻 UI
    document.getElementById("cd-grenade").innerText = grenadeCooldown > 0 ? (grenadeCooldown/1000).toFixed(1) + "s" : "";
    document.getElementById("shield-status").innerText = shieldActiveTime > 0 ? `【🛡️ 盾: ${(shieldActiveTime/1000).toFixed(1)}s】` : "";
    
    if (shieldCooldown > 0) {
        let displayCd = (shieldCooldown / 1000) - 8;
        document.getElementById("cd-shield").innerText = displayCd > 0 ? displayCd.toFixed(1) + "s" : (shieldActiveTime > 0 ? "使用中" : "");
    } else { document.getElementById("cd-shield").innerText = ""; }

    // 玩家位移與平台碰撞
    player.update(keys, platforms);

    // 呼叫由 game1.js 處理的特定關卡邏輯
    if (typeof updateGame1Logic === "function") {
        updateGame1Logic();
    }

    // 更新武器投擲物 (手雷、自動炸彈)
    projectiles.forEach((proj, idx) => {
        if (proj.type === "GRENADE") {
            proj.x += proj.vx; proj.vy += 0.3; proj.y += proj.vy;
            if (boss && Tool.checkCollision(proj, boss)) {
                damageBoss(100, "💣 神聖手雷炸裂！");
                Tool.createImpactEffect(particles, proj.x, proj.y, "#ffff00");
                projectiles.splice(idx, 1);
            } else if (proj.y > 550) projectiles.splice(idx, 1);
        } else if (proj.type === "AUTO_BOMB") {
            if (boss) {
                let dx = (boss.x + boss.width/2) - proj.x;
                let dy = (boss.y + boss.height/2) - proj.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 5) { proj.x += (dx / dist) * 12; proj.y += (dy / dist) * 12; }
                if (Tool.checkCollision(proj, boss)) {
                    damageBoss(350, "💥 自動引爆空投炸彈！");
                    Tool.createImpactEffect(particles, proj.x, proj.y, "#ff3300");
                    projectiles.splice(idx, 1);
                }
            }
        }
    });

    // 更新 Boss 技能預警區與判定
    bossAttacks.forEach((atk, idx) => {
        if (atk.type === "METEOR") {
            atk.timer--;
            if (atk.timer <= 0) {
                atk.y += 11;
                if (atk.y >= 530) {
                    if (Math.abs(player.x - atk.x) < 80 && player.y > 440) damagePlayer(25);
                    bossAttacks.splice(idx, 1);
                }
            }
        } else if (atk.type === "SPIKES") {
            atk.timer--;
            if (atk.timer < 120 && atk.timer > 0 && player.y >= 500) damagePlayer(2);
            if (atk.timer <= 0) bossAttacks.splice(idx, 1);
        }
    });

    // 掉落虛空判定
    if (player.y > 600) damagePlayer(100);

    // 刷新頂部 UI 數值
    document.getElementById("player-hp-text").innerText = Math.ceil(player.hp);
    document.getElementById("player-hp-bar").style.width = (player.hp / player.maxHp) * 100 + "%";
    if (boss) {
        document.getElementById("boss-hp-text").innerText = boss.hp;
        document.getElementById("boss-hp-bar").style.width = (boss.hp / boss.maxHp) * 100 + "%";
    }
}

// 核心渲染引擎
function renderEngine() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製平台
    platforms.forEach(p => {
        ctx.fillStyle = (gameState === "BOSS" && p.y === 550) ? "#222" : "#555";
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.strokeStyle = "#888"; ctx.strokeRect(p.x, p.y, p.width, p.height);
    });

    // 呼叫由 game1.js 處理的關卡專屬物件渲染 (鑰匙和大門)
    if (typeof renderGame1Objects === "function") {
        renderGame1Objects(ctx);
    }

    // 繪製 Boss 技能效果
    bossAttacks.forEach(atk => {
        if (atk.type === "METEOR") {
            ctx.fillStyle = "rgba(255, 0, 0, 0.4)"; ctx.fillRect(atk.x - 40, 540, 80, 10);
            if (atk.timer <= 0) { ctx.fillStyle = "#ff6600"; ctx.beginPath(); ctx.arc(atk.x, atk.y, 20, 0, Math.PI*2); ctx.fill(); }
        } else if (atk.type === "SPIKES") {
            if (atk.timer > 120) {
                ctx.fillStyle = "rgba(255, 0, 0, 0.3)"; ctx.fillRect(0, 530, 1000, 20);
            } else {
                ctx.fillStyle = "#990000";
                for(let i=0; i<1000; i+=20) {
                    ctx.beginPath(); ctx.moveTo(i, 550); ctx.lineTo(i+10, 510); ctx.lineTo(i+20, 550); ctx.fill();
                }
            }
        }
    });

    // 繪製掉落道具
    items.forEach(item => {
        ctx.fillStyle = item.type === "MEDKIT" ? "#00ff00" : "#ffaa00";
        ctx.fillRect(item.x, item.y, item.width, item.height);
        ctx.fillStyle = item.type === "MEDKIT" ? "#fff" : "#000";
        ctx.font = "11px Arial"; ctx.fillText(item.type === "MEDKIT" ? "➕醫" : "💣炸", item.x - 1, item.y + 16);
    });

    // 繪製拋物武器
    projectiles.forEach(proj => {
        ctx.fillStyle = proj.type === "GRENADE" ? "#ffff00" : "#ff3300";
        ctx.beginPath(); ctx.arc(proj.x, proj.y, proj.width/2, 0, Math.PI*2); ctx.fill();
    });

    // 繪製爆炸粒子
    particles.forEach((p, idx) => {
        p.x += p.vx; p.y += p.vy; p.life--;
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life / 25;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
        if(p.life <= 0) particles.splice(idx, 1);
    });

    // 渲染 Boss 與玩家
    if (gameState === "BOSS" && boss) boss.draw(ctx);
    player.draw(ctx, currentSlot, gameState, autoAttackTimer);

    // 防疫盾無敵特效圈
    if (shieldActiveTime > 0) {
        ctx.strokeStyle = "rgba(0, 255, 204, 0.6)"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(player.x + player.width/2, player.y + player.height/2, 45, 0, Math.PI*2); ctx.stroke();
    }
}

// 傷害結算機制
function damageBoss(amount, label) {
    if (!boss) return;
    boss.hp -= amount;
    if(boss.hp <= 0) {
        boss.hp = 0;
        gameState = "WIN";
        endGame(true);
    }
    document.getElementById("boss-action").innerText = `${label} -${amount}`;
}

function damagePlayer(amount) {
    if (shieldActiveTime > 0) return; // 無敵盾生效
    player.hp -= amount;
    if (player.hp <= 0) {
        player.hp = 0;
        gameState = "GAMEOVER";
        endGame(false);
    }
}

function endGame(isWin) {
    bossMusic.pause();
    const overlay = document.getElementById("overlay");
    const title = document.getElementById("end-title");
    const sub = document.getElementById("end-sub");
    
    overlay.style.display = "flex";
    if (isWin) {
        title.innerText = "🏆 YOU WIN!"; title.style.color = "#00ffcc";
        sub.innerText = `${OhioData.getLoginUser()} 成功用鍵盤終結了 Ohio 巨鴨的統治！`;
    } else {
        title.innerText = "💀 GAME OVER"; title.style.color = "#ff3333";
        sub.innerText = "大鴨鴨太強了，你被無情扣血制裁。";
    }
}
