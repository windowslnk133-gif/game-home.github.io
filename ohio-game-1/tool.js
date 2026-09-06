const Tool = {
    // RWD 自適應縮放
    resizeGame: function(wrapperElement) {
        const baseWidth = 1000;
        const baseHeight = 600;
        let scale = Math.min(window.innerWidth / baseWidth, window.innerHeight / baseHeight);
        if(scale > 1.2) scale = 1.2;
        wrapperElement.style.transform = `translate(-50%, -50%) scale(${scale})`;
    },

    // 矩形碰撞檢測
    checkCollision: function(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },

    // 彈出黃色警告訊息
    showMsg: function(text, duration = 2000) {
        const msg = document.getElementById("game-msg");
        if (!msg) return;
        msg.innerText = text;
        msg.style.display = "block";
        setTimeout(() => { msg.style.display = "none"; }, duration);
    },

    // 建立爆炸擊中粒子特效
    createImpactEffect: function(particlesArray, x, y, color) {
        for(let i=0; i<12; i++) {
            particlesArray.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                radius: Math.random() * 4 + 2,
                color: color,
                life: 25
            });
        }
    }
};
