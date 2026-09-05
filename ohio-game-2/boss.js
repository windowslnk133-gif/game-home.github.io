// boss.js ─ ACE公司黑心老闆大腦與技能計時器
const BossAI = {
    bossHp: 1200,
    bossActionTimer: 0,
    indicator: document.getElementById('computer-indicator'),
    compBoss: document.getElementById('computer-boss'),
    bossEl: document.getElementById('boss'),
    stage: document.getElementById('game-stage'),

    reset: function() {
        this.bossHp = 1200;
        this.bossActionTimer = 0;
        this.indicator.style.display = 'none';
        this.compBoss.style.display = 'none';
        this.bossEl.style.transform = 'scale(1)';
        this.bossEl.style.left = ''; // 重置回初始右側位置
    },

    // 每一幀由主循環呼叫更新
    update: function(isPlaying, getPlayerState, takeDamage) {
        if (!isPlaying) return;

        this.bossActionTimer++;
        if (this.bossActionTimer >= 100) {
            this.bossActionTimer = 0;
            // 50% 機率隨機施放招式
            Math.random() > 0.5 ? this.castKeyboardDash() : this.castComputerSlam(isPlaying, getPlayerState, takeDamage);
        }
    },

    // 技能 1：【鍵盤打】─ 老闆手持大鍵盤在畫面上隨機瞬移撞擊
    castKeyboardDash: function() {
        const ann = document.getElementById('announcement');
        ann.textContent = "老闆：給我加班！(鍵盤打)";
        ann.style.display = 'block';
        setTimeout(() => ann.style.display = 'none', 1000);

        // 隨機瞬移到舞台的某個橫向 X 位置
        const randomX = Math.random() * (this.stage.clientWidth - 200) + 50;
        this.bossEl.style.left = randomX + 'px';
        
        // 瞬移衝擊視覺動畫
        this.bossEl.style.transform = 'scale(1.2) rotate(15deg)';
        setTimeout(() => this.bossEl.style.transform = 'scale(1) rotate(0deg)', 300);
    },

    // 技能 2：【電腦攻擊】─ 地上冒出危險紅光，砸下巨型電腦，踩到重傷
    castComputerSlam: function(isPlaying, getPlayerState, takeDamage) {
        if (!isPlaying) return;
        
        // 鎖定玩家當前的橫向位置進行紅光預警
        const targetX = getPlayerState().x;
        this.indicator.style.left = (targetX - 25) + 'px';
        this.indicator.style.width = '100px';
        this.indicator.style.display = 'block';

        setTimeout(() => {
            this.indicator.style.display = 'none';
            if (!isPlaying) return;

            // 電腦從空中砸落
            this.compBoss.style.left = (targetX - 10) + 'px';
            this.compBoss.style.display = 'block';

            // 傷害判定：檢查此時玩家是否依然踩在電腦範圍內且位於地面
            const currentPlayerX = getPlayerState().x;
            if (Math.abs(currentPlayerX - targetX) < 60 && getPlayerState().y < 50) {
                takeDamage(40); // 踩電腦重傷扣 40HP！
                const ann = document.getElementById('announcement');
                ann.textContent = "都說了不要踩電腦！";
                ann.style.display = 'block';
                setTimeout(() => ann.style.display = 'none', 1000);
            }

            // 電腦短暫停留後回收消失
            setTimeout(() => this.compBoss.style.display = 'none', 800);
        }, 1200); // 紅光提前預警 1.2 秒
    }
};
