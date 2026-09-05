// game1.js ─ 專門處理第 1 關「逃離異變之家」的所有物件與家人移動
const Game1Manager = {
    hasKey: false,
    keyLocation: "",
    familyVel: { dad: 3, mom: -4, dog: 5 },

    // 初始化第 1 關環境與隱藏鑰匙
    init: function(isPlaying, objText) {
        this.hasKey = false;
        objText.textContent = "任務：調查沙發(🛋️)、桌子(🪑)、鞋櫃(👞)找出大門鑰匙！";
        
        // 隨機在家具中生成藏鑰匙地點
        const spots = ["沙發", "桌子", "鞋子"];
        this.keyLocation = spots[Math.floor(Math.random() * spots.length)];

        // 綁定家具點擊調查
        document.querySelectorAll('.solid-obj').forEach(item => {
            if (item.id === 'sofa') item.textContent = '🛋️';
            if (item.id === 'table') item.textContent = '🪑';
            if (item.id === 'shoes') item.textContent = '👞';

            item.onclick = () => {
                if (!isPlaying()) return;
                
                const pEl = document.getElementById('player');
                // 水平距離小於 100 像素內才能翻找
                if (Math.abs(pEl.getBoundingClientRect().left - item.getBoundingClientRect().left) < 100) {
                    const name = item.getAttribute('data-name');
                    if (name === this.keyLocation) {
                        this.hasKey = true;
                        objText.textContent = "🔑 成功在俄亥俄角落撈到大門鑰匙！快前往最右邊的走進大門(🚪)！";
                        item.textContent = '❌'; 
                    } else {
                        objText.textContent = `調查了 ${name}，裡面什麼都沒有...再去別的位置看看！`;
                    }
                } else {
                    objText.textContent = "太遠了！走過去靠近一點才能調查！";
                }
            };
        });
    },

    // 負責在每幀更新家人（爸、媽、狗）的隨機往復移動
    updateFamily: function(stageWidth) {
        this.moveMember('member-dad', 'dad', 200, stageWidth * 0.45);
        this.moveMember('member-mom', 'mom', stageWidth * 0.4, stageWidth * 0.7);
        this.moveMember('member-dog', 'dog', stageWidth * 0.65, stageWidth * 0.9);
    },

    moveMember: function(id, key, minX, maxX) {
        const el = document.getElementById(id);
        if (!el) return;
        let x = parseFloat(el.style.left) || minX; 
        x += this.familyVel[key];
        
        // 碰壁反彈邏輯
        if (x <= minX || x >= maxX) {
            this.familyVel[key] = -this.familyVel[key]; 
        }
        el.style.left = x + 'px';
    }
};
