// game2.js ─ 專門處理第 2 關「極限生死公路」的卡車生成、移動與進度條
const Game2Manager = {
    truckTimer: 0,
    stage2Progress: 0,

    init: function() {
        this.truckTimer = 0;
        this.stage2Progress = 0;
        document.getElementById('current-stage-text').textContent = "第 2 關 - 極限生死公路";
        document.getElementById('stage1-elements').style.display = 'none';
        document.getElementById('stage2-elements').style.display = 'block';
        document.getElementById('stage2-elements').innerHTML = ''; // 清空上一局殘留卡車
    },

    // 每一幀由 game.js 主循環呼叫更新
    update: function(stageWidth, pEl, takeDamage, setupStage3, objText) {
        // 1. 計算公路逃亡進度
        this.stage2Progress += 0.2;
        objText.textContent = `公路逃亡進度: ${Math.floor(this.stage2Progress)}% | 躲避泥頭卡車(🚚)！`;
        
        // 進度達 100% 自動進入第三關
        if (this.stage2Progress >= 100) {
            setupStage3();
            return;
        }

        // 2. 定時隨機刷出全速前進的卡車
        this.truckTimer++;
        if (this.truckTimer % 50 === 0) {
            this.spawnTruck(stageWidth);
        }

        // 3. 移動公路上的所有卡車並判定碰撞
        const trucks = document.querySelectorAll('.truck');
        trucks.forEach(t => {
            let tx = parseFloat(t.style.left);
            tx -= 8; // 卡車行駛速度
            t.style.left = tx + 'px';

            // 檢查卡車有沒有撞到玩家巨鴨
            if (GameTools.checkCollision(pEl, t)) {
                takeDamage(25); // 被卡車撞到重扣 25HP！
                t.remove();
            }
            // 超出螢幕左邊界自動回收
            if (tx < -80) t.remove();
        });
    },

    // 產生卡車 DOM
    spawnTruck: function(stageWidth) {
        const t = document.createElement('div');
        t.classList.add('truck');
        t.textContent = '🚚';
        t.style.left = stageWidth + 'px';
        document.getElementById('stage2-elements').appendChild(t);
    }
};
