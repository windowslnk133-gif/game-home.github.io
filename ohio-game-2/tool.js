// tool.js ─ 原生音訊控制、AABB碰撞偵測與視覺特效工具
const localBGM = new Audio('./boss_musin.mp3');
localBGM.loop = true;
localBGM.volume = 0.25; // 設定背景音樂音量

const GameTools = {
    // 播放與停止背景音樂
    playMusic: function() {
        localBGM.play().catch(err => console.log("音樂播放被攔截，請確保先點擊按鈕:", err));
    },
    stopMusic: function() {
        localBGM.pause();
        localBGM.currentTime = 0;
    },
    
    // AABB 矩形碰撞偵測核心演算法
    checkCollision: function(el1, el2) {
        const r1 = el1.getBoundingClientRect();
        const r2 = el2.getBoundingClientRect();
        return !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);
    },

    // 暴打老闆時動態噴出工資💰的特效
    spawnMoney: function(x, y) {
        const stage = document.getElementById('game-stage');
        const money = document.createElement('div');
        money.classList.add('salary-money');
        money.textContent = '💰';
        money.style.left = x + 'px';
        money.style.bottom = y + 'px';
        stage.appendChild(money);
        setTimeout(() => money.remove(), 600);
    },

    // 玩家受傷時的受擊閃爍紅光反饋
    flashElement: function(el) {
        el.style.opacity = '0.3';
        setTimeout(() => el.style.opacity = '1', 150);
    }
};
