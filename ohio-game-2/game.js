// game.js ─ 遊戲核心控制大腦與玩家鴨子物理 (多關卡串接版)
let currentStage = 1; 
let playerHp = 120;
let isPlayingG = false;

// 巨鴨物理與位置變數
let playerX = 50;
let playerY = 0;
let playerVy = 0;
let isGrounded = true;
const gravity = 0.6;
const jumpForce = 13;
const moveSpeed = 5;

// 技能防禦狀態
let isShieldActive = false;
let isShieldReady = true;

// 鍵盤監聽狀態
let keys = { w: false, a: false, s: false, d: false, space: false };

// 關卡 2 的卡車重生計時
let truckTimer = 0;
let stage2Progress = 0;

const pEl = document.getElementById('player');
const shieldEff = document.getElementById('shield-effect');
const stageEl = document.getElementById('game-stage');
const pHpBar = document.getElementById('player-hp-bar');
const pHpText = document.getElementById('player-hp-text');
const bHpBar = document.getElementById('boss-hp-bar');
const bHpText = document.getElementById('boss-hp-text');
const cdShieldEl = document.getElementById('cd-shield');
const objText = document.getElementById('objective-text');

const overlay = document.getElementById('game-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayDesc = document.getElementById('overlay-desc');
const overlayBtn = document.getElementById('game-overlay-btn');

// 初始化首頁選單與玩法介紹
window.addEventListener('load', () => {
    showOverlay("ONLY IN OHIO 2：巨鴨逆襲", "你是一隻尊貴的俄亥俄巨鴨，受夠了在公司無薪加班。今晚，你必須逃離充滿家人的異變之家，穿過瘋狂高速公路，殺進 ACE 公司找黑心老闆拿回屬於你的血汗工資！\n\n控制：W/A/S/D 或 方向鍵控制移動，[W] 或 [空白鍵] 皆可跳躍。\n技能：[R] 開啟神聖防禦（0.5秒無敵），[E] 揮擊翅膀暴打老闆。", "拿起翅膀，開戰！");
});

overlayBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
    if (playerHp <= 0 || currentStage > 3) {
        currentStage = 1;
        playerHp = 120;
        setupStage1();
    }
    isPlayingG = true;
    GameTools.playMusic(); 
    gameLoop();
});

// 鍵盤按下與放開監聽
window.addEventListener('keydown', (e) => {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.a = true;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.d = true;
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.w = true;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.s = true;
    if (e.code === 'Space') { keys.space = true; e.preventDefault(); }
    
    if (e.key === 'r' || e.key === 'R') triggerShield();
    if (e.key === 'e' || e.key === 'E') triggerAttack();
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.a = false;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.d = false;
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.w = false;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.s = false;
    if (e.code === 'Space') keys.space = false;
});

function setupStage1() {
    playerX = 50; playerY = 0;
    document.getElementById('current-stage-text').textContent = "第 1 關 - 逃離異變之家";
    document.getElementById('stage1-elements').style.display = 'block';
    document.getElementById('stage2-elements').style.display = 'none';
    document.getElementById('stage3-elements').style.display = 'none';
    document.getElementById('boss-hud').style.display = 'none';

    // 呼叫 game1.js 的初始化方法
    Game1Manager.init(() => isPlayingG, objText);
}

function setupStage2() {
    currentStage = 2; playerX = 50; playerY = 0; stage2Progress = 0;
    document.getElementById('current-stage-text').textContent = "第 2 關 - 極限生死公路";
    document.getElementById('stage1-elements').style.display = 'none';
    document.getElementById('stage2-elements').style.display = 'block';
    document.getElementById('stage2-elements').innerHTML = ''; 
}

function setupStage3() {
    currentStage = 3; playerX = 100; playerY = 0;
    document.getElementById('current-stage-text').textContent = "第 3 關 - 決戰 ACE 公司";
    objText.textContent = "任務：靠近黑心老闆按 [E] 揮翅暴打，逼他噴工資！千萬不要踩電腦！";
    document.getElementById('stage2-elements').style.display = 'none';
    document.getElementById('stage3-elements').style.display = 'block';
    document.getElementById('boss-hud').style.display = 'block';
    BossAI.reset();
    updateHpUI();
}

function triggerShield() {
    if (!isShieldReady || !isPlayingG) return;
    isShieldReady = false;
    isShieldActive = true;
    shieldEff.style.display = 'block';
    cdShieldEl.innerHTML = `神聖防禦 [R]: <span style="color:#ff3333">CD中</span>`;

    setTimeout(() => {
        isShieldActive = false;
        shieldEff.style.display = 'none';
    }, 4000);

    setTimeout(() => {
        isShieldReady = true;
        if (isPlayingG) cdShieldEl.innerHTML = `神聖防禦 [R]: <span style="color:#00ffcc">準備就緒</span>`;
    }, 3000);
}

function triggerAttack() {
    if (currentStage !== 3 || !isPlayingG) return;
    const pRect = pEl.getBoundingClientRect();
    const bRect = document.getElementById('boss').getBoundingClientRect();

    if (pRect.right >= bRect.left - 50 && pRect.left <= bRect.right + 50) {
        BossAI.bossHp = Math.max(0, BossAI.bossHp - 15);
        updateHpUI();
        
        GameTools.spawnMoney(bRect.left - stageEl.getBoundingClientRect().left + 40, 150);

        const bEl = document.getElementById('boss');
        bEl.style.transform = 'scale(0.9) translateX(10px)';
        setTimeout(() => bEl.style.transform = 'scale(1)', 100);

        if (BossAI.bossHp <= 0) gameWin();
    }
}

function gameLoop() {
    if (!isPlayingG) return;

    // 1. 玩家橫向 WASD 移動
    let nextX = playerX;
    if (keys.a) nextX -= moveSpeed;
    if (keys.d) nextX += moveSpeed;

    if (nextX < 0) nextX = 0;
    if (nextX > stageEl.clientWidth - 50) nextX = stageEl.clientWidth - 50;

    // 關卡 1 的固體障礙碰撞阻擋判定
    let isBlocked = false;
    if (currentStage === 1) {
        pEl.style.left = nextX + 'px'; 
        document.querySelectorAll('.solid-block').forEach(b => {
            if (GameTools.checkCollision(pEl, b)) isBlocked = true;
        });
    }
    if (!isBlocked) playerX = nextX;

    // 2. 縱向跳躍
    if ((keys.w || keys.space) && isGrounded) {
        playerVy = jumpForce;
        isGrounded = false;
    }
    playerVy -= gravity; playerY += playerVy;
    if (playerY <= 0) { playerY = 0; playerVy = 0; isGrounded = true; }

    pEl.style.left = playerX + 'px';
    pEl.style.bottom = (40 + playerY) + 'px';

    // ================= 關卡分流核心 =================
    if (currentStage === 1) {
        // 呼叫由 game1.js 更新家人位置
        Game1Manager.updateFamily(stageEl.clientWidth);

        document.querySelectorAll('.family-member').forEach(m => {
            if (GameTools.checkCollision(pEl, m)) takeDamage(15); 
        });

        // 檢查是否拿到了鑰匙並走到最右邊
        if (Game1Manager.hasKey && playerX >= stageEl.clientWidth - 90) setupStage2();

    } else if (currentStage === 2) {
        stage2Progress += 0.2;
        objText.textContent = `公路逃亡進度: ${Math.floor(stage2Progress)}% | 躲避迎面而來的泥頭卡車(🚚)！`;
        if (stage2Progress >= 100) setupStage3();

        truckTimer++;
        if (truckTimer % 50 === 0) spawnTruck();

        document.querySelectorAll('.truck').forEach(t => {
            let tx = parseFloat(t.style.left); tx -= 8; t.style.left = tx + 'px';
            if (GameTools.checkCollision(pEl, t)) { takeDamage(25); t.remove(); }
            if (tx < -80) t.remove();
        });

    } else if (currentStage === 3) {
        const getPState = () => ({ x: playerX, y: playerY });
        BossAI.update(isPlayingG, getPState, takeDamage);

        if (GameTools.checkCollision(pEl, document.getElementById('boss'))) takeDamage(10); 
    }

    updateHpUI();
    animationId = requestAnimationFrame(gameLoop);
}

function spawnTruck() {
    const t = document.createElement('div'); t.classList.add('truck'); t.textContent = '🚚';
    t.style.left = stageEl.clientWidth + 'px';
    document.getElementById('stage2-elements').appendChild(t);
}

function takeDamage(amount) {
    if (isShieldActive) return; 
    playerHp = Math.max(0, playerHp - amount);
    GameTools.flashElement(pEl);
    if (playerHp <= 0) gameOver();
}

function updateHpUI() {
    pHpBar.style.width = (playerHp / 120) * 100 + '%';
    pHpText.textContent = `${Math.floor(playerHp)} / 120`;
    bHpBar.style.width = (BossAI.bossHp / 1200) * 100 + '%';
    bHpText.textContent = `${Math.floor(BossAI.bossHp)} / 1200`;
}

function gameOver() {
    isPlayingG = false; cancelAnimationFrame(animationId); GameTools.stopMusic();
    showOverlay("💀 巨鴨慘遭逮捕", "你沒能熬過黑心老闆或瘋狂家人的折磨，被抓回去無薪加班到天亮，變成了沒有靈魂的美味烤鴨...", "再次不服輸重來");
}

function gameWin() {
    isPlayingG = false; cancelAnimationFrame(animationId); GameTools.stopMusic();
    showOverlay("🏆 俄亥俄勞動節大勝利！", "你用巨翅徹底拍碎了黑心老闆的尊嚴！漫天飛舞的工資全被你收入囊中，你帶著捷運上所有的乘客，正式接管了 ACE 公司！", "功成名就再玩一次");
}

function showOverlay(title, desc, btnText) {
    overlayTitle.textContent = title; overlayDesc.textContent = desc; overlayBtn.textContent = btnText;
    overlay.style.display = 'flex';
}
