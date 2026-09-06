/**
 * Ohio Game 1 - 遊戲通用工具函式庫 (Utility Helper Library)
 * 負責：全局 RWD 縮放、高效矩形碰撞判定、隨機爆炸粒子生成、通用訊息提示
 */

const Tool = {
    /**
     * 自動依螢幕解析度進行等比例自適應縮放 (RWD)
     * @param {HTMLElement} wrapperElement - 遊戲外層的最主要 DOM 容器
     */
    resizeGame: function(wrapperElement) {
        if (!wrapperElement) return; // 安全檢查，防範 DOM 尚未載入完成

        const baseWidth = 1000;
        const baseHeight = 600;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // 計算最適合當前視窗的縮放比例
        let scale = Math.min(windowWidth / baseWidth, windowHeight / baseHeight);
        
        // 限制最大縮放範圍，防止在高解析度螢幕上過度放大導致失真
        if (scale > 1.2) scale = 1.2;
        
        // 利用 CSS 矩陣變形將整個遊戲舞台等比例居中縮放
        wrapperElement.style.transform = `translate(-50%, -50%) scale(${scale})`;
    },

    /**
     * 高精度 AABB 矩形碰撞檢測演算法
     * @param {Object} rect1 - 第一個矩形物件 (需包含 x, y, width, height)
     * @param {Object} rect2 - 第二個矩形物件 (需包含 x, y, width, height)
     * @returns {boolean} - 是否發生碰撞重疊
     */
    checkCollision: function(rect1, rect2) {
        if (!rect1 || !rect2) return false; // 確保兩個物件皆存在，防止跳錯
        
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },

    /**
     * 在畫面上方彈出黃色的遊戲任務或提示訊息
     * @param {string} text - 想要顯示的文字內容
     * @param {number} duration - 顯示持續時間 (毫秒)
     */
    showMsg: function(text, duration = 2000) {
        const msg = document.getElementById("game-msg");
        if (!msg) return; // 防止找不到 DOM 元素
        
        msg.innerText = text;
        msg.style.display = "block";
        
        // 清除上一次可能殘留的定時器 (如果有必要)，這裡使用標準延遲隱藏
        if (msg.timeoutId) clearTimeout(msg.timeoutId);
        
        msg.timeoutId = setTimeout(() => {
            msg.style.display = "none";
        }, duration);
    },

    /**
     * 在指定座標建立向四周噴發的打擊/爆炸粒子系統
     * @param {Array} particlesArray - 存放全局粒子的陣列 (通常是 game.js 裡的 particles)
     * @param {number} x - 爆炸中心的 X 座標
     * @param {number} y - 爆炸中心的 Y 座標
     * @param {string} color - 粒子的顏色 (例如微軟綠色 '#1e4d2b' 或火花黃 '#ffff00')
     */
    createImpactEffect: function(particlesArray, x, y, color) {
        if (!particlesArray) return; // 安全防護
        
        // 一次生成 12 顆隨機軌跡的碎屑粒子
        for (let i = 0; i < 12; i++) {
            particlesArray.push({
                x: x,
                y: y,
                // 產生向四周隨機擴散的速度向量
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                // 隨機微調粒子的大小
                radius: Math.random() * 4 + 2,
                color: color,
                // 粒子的生命週期 (幀數)，每幀遞減，減到 0 時自動被渲染引擎回收
                life: 25 
            });
        }
    }
};
