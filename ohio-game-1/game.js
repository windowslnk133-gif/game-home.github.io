// game.js ─ 主核心控制大腦
const stageEl = document.getElementById('game-stage');
const pEl = document.getElementById('player');
const bEl = document.getElementById('boss');
const pHpBar = document.getElementById('player-hp-bar');
const pHpText = document.getElementById('player-hp-text');
const bHpBar = document.getElementById('boss-hp-bar');
const bHpText = document.getElementById('boss-hp-text');
const cdTextEl = document.getElementById('cd-text');
const overlayEl = document.getElementById('overlay');
const overlayTitleEl = document.getElementById('overlay-title');
const overlayDescEl = document.getElementById('overlay-desc');
const startBtnEl = document.getElementById('start-btn');

let playerHp = 100;
let bossHp = 23100;
let isPlayingG = false;

let playerX = 100;
let playerY = 0; 
let playerVelocityY = 0;
let isGrounded = true;
const gravity = 0.6;
const jumpForce = 14;
const moveSpeed = 6;

let grenades = [];
let isGrenadeReady = true;
const grenadeCD = 8000;

let keys = { a: false, d: false, space: false, e: false };
let animationId;
let bossActionTimer = 0;
let medkitTimer = 0;
let currentMedkit = null;

// 提供給 boss.js 隨時獲取最新玩家數據狀態的方法
function getGameState() {
    return { isPlaying: isPlayingG, playerX: playerX, playerY: playerY };
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'a' || e.key === 'A') keys.a = true;
    if (e.key === 'd' || e.key === 'D') keys.d = true;
    if (e.code === 'Space') { keys.space = true; e.preventDefault(); }
    if (e.key === 'e' || e.key === 'E') {
        if (!keys.e && isGrenadeReady && isPlayingG) throwGrenade();
        keys.e = true;
    }
});
window.addEventListener('keyup', (e) => {
    if (e.key === 'a' || e.key === 'A') keys.a = false;
    if (e.key === 'd' || e.key === 'D') keys.d = false;
    if (e.code === 'Space') keys.space = false;
    if (e.key === 'e' || e.key === 'E') keys.e = false;
});

function initGame() {
    playerHp = 100; bossHp = 23100; playerX = 100; playerY = 0; playerVelocityY = 0;
    isGrounded = true; bossActionTimer = 0; medkitTimer = 0; isGrenadeReady = true;
    cdTextEl.textContent = "準備就緒"; cdTextEl.style.color = "#00ffcc";

    if (currentMedkit) { currentMedkit.remove(); currentMedkit = null; }
    grenades.forEach(g => g.el.remove()); grenades = [];
    BossSkills.hideAll(); updateHpUI();

    pEl.style.left = playerX + 'px'; pEl.style.bottom = '40px';
    bEl.style.bottom = '40px'; bEl.style.transform = 'scale(1)';

    GameTools.playBGM();

    if (animationId) cancelAnimationFrame(animationId);
    isPlayingG = true;
    gameLoop();
}

function updateHpUI() {
    pHpBar.style.width = (playerHp / 100) * 100 + '%';
    pHpText.textContent = `${playerHp} / 100`;
    bHpBar.style.width = (bossHp / 23100) * 100 + '%';
    bHpText.textContent = `${Math.floor(bossHp)} / 23100`;
}

function throwGrenade() {
    isGrenadeReady = false;
    let cdTime = grenadeCD / 1000;
    cdTextEl.textContent = `${cdTime}s`; cdTextEl.style.color = "#ff3333";

    let cdInterval = setInterval(() => {
        cdTime--;
        if (cdTime <= 0) {
            clearInterval(cdInterval); isGrenadeReady = true;
            cdTextEl.textContent = "準備就緒"; cdTextEl.style.color = "#00ffcc";
        } else { cdTextEl.textContent = `${cdTime}s`; }
    }, 1000);

    const el = document.createElement('div');
    el.classList.add('grenade'); el.textContent = '🍒';
    stageEl.appendChild(el);
    grenades.push({ el: el, x: playerX + 20, y: playerY + 40, vx: 8, vy: 12, gravity: 0.5 });
}

function gameLoop() {
    if (!isPlayingG) return;

    if (keys.a) playerX = Math.max(0, playerX - moveSpeed);
    if (keys.d) playerX = Math.min(stageEl.clientWidth - 50, playerX + moveSpeed);
    if (keys.space && isGrounded) { playerVelocityY = jumpForce; isGrounded = false; }

    playerVelocityY -= gravity; playerY += playerVelocityY;
    if (playerY <= 0) { playerY = 0; playerVelocityY = 0; isGrounded = true; }

    pEl.style.left = playerX + 'px'; pEl.style.bottom = (40 + playerY) + 'px';

    // 鍵盤近戰敲擊
    const playerRect = pEl.getBoundingClientRect();
    const bossRect = bEl.getBoundingClientRect();
    if (playerRect.right >= bossRect.left - 40 && playerRect.left <= bossRect.right) {
        pEl.classList.add('attacking');
        bossHp = Math.max(0, bossHp - (32 / 5)); updateHpUI();
        if (bossHp <= 0) { gameOver(true); return; }
    } else { pEl.classList.remove('attacking'); }

    // 手雷物理更新
    for (let i = grenades.length - 1; i >= 0; i--) {
        let g = grenades[i]; g.x += g.vx; g.vy -= g.gravity; g.y += g.vy;
        g.el.style.left = g.x + 'px'; g.el.style.bottom = (40 + g.y) + 'px';
        if (g.y <= 0 || g.x >= stageEl.clientWidth - 30) {
            triggerGrenadeExplosion(g.x, 0); g.el.remove(); grenades.splice(i, 1);
        }
    }

    // 隨機補血醫療包
    medkitTimer++;
    if (medkitTimer % 350 === 0 && !currentMedkit) spawnMedkit();
    if (currentMedkit) {
        const medRect = currentMedkit.getBoundingClientRect();
        if (playerRect.right > medRect.left && playerRect.left < medRect.right && playerY < 40) {
            playerHp = Math.min(100, playerHp + 50); updateHpUI();
            currentMedkit.remove(); currentMedkit = null;
        }
    }

    // Boss 招式排程計時器
    bossActionTimer++;
    if (bossActionTimer === 120) {
        let rand = Math.random();
        const resetTimer = () => { bossActionTimer = 0; };

        if (rand < 0.4) BossSkills.castSpikes(getGameState, takeDamage, resetTimer);
        else if (rand < 0.75) BossSkills.castSlam(getGameState, takeDamage, resetTimer);
        else BossSkills.castMeteor(getGameState, takeDamage, resetTimer);
    }

    animationId = requestAnimationFrame(gameLoop);
}

function triggerGrenadeExplosion(x, y) {
    GameTools.playGrenadeSFX();
    const wave = document.createElement('div');
    wave.classList.add('explosion-wave');
    wave.style.left = (x - 60) + 'px'; wave.style.bottom = (40 + y - 60) + 'px';
    stageEl.appendChild(wave);
    setTimeout(() => wave.remove(), 400);

    if (x + 90 >= (stageEl.clientWidth - 220)) {
        bossHp = Math.max(0, bossHp - 1000); updateHpUI();
        bEl.style.transform = 'translateX(25px) scale(0.9)';
        setTimeout(() => bEl.style.transform = 'scale(1)', 200);
        if (bossHp <= 0) gameOver(true);
    }
}

function takeDamage(amount) {
    playerHp = Math.max(0, playerHp - amount); updateHpUI();
    GameTools.flashElement(pEl);
    if (playerHp <= 0) gameOver(false);
}

function spawnMedkit() {
    currentMedkit = document.createElement('div'); currentMedkit.classList.add('medkit'); currentMedkit.textContent = '💊';
    currentMedkit.style.left = (Math.random() * (stageEl.clientWidth * 0.6)) + 'px';
    stageEl.appendChild(currentMedkit);
    setTimeout(() => { if (currentMedkit) { currentMedkit.remove(); currentMedkit = null; } }, 8000);
}

function gameOver(isWin) {
    isPlayingG = false; if (animationId) cancelAnimationFrame(animationId);
    pEl.classList.remove('attacking'); GameTools.stopBGM();
    if (isWin) showOverlay("🏆 史詩級勝利！", "你成功用鍵盤與櫻桃手雷砸碎了 23,100 HP 的俄亥俄巨鴨！", "再戰一次");
    else showOverlay("💀 你被無情超渡了", "在 888 傷害隕石下，你的鍵盤碎了一地...", "復活重來");
}

function showOverlay(title, desc, btnText) {
    overlayTitleEl.textContent = title; overlayDescEl.textContent = desc; startBtnEl.textContent = btnText;
    overlayEl.style.display = 'flex';
}

startBtnEl.addEventListener('click', () => { overlayEl.style.display = 'none'; initGame(); });
