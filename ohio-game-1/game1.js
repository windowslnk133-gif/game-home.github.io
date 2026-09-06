// 請直接覆蓋 game1.js 裡的 updateGame1Logic 函式：
function updateGame1Logic() {
    if (gameState === "PARKOUR") {
        if (!player.hasKey && Tool.checkCollision(player, keyItem)) {
            player.hasKey = true;
            keyItem.collected = true;
            Tool.showMsg("🔑 獲得神秘鑰匙！趕快去打開大門！");
        }
        if (player.hasKey && Tool.checkCollision(player, door)) {
            startBossBattle();
        }
    }

    if (gameState === "BOSS" && boss) {
        // Boss 攻擊運算，若是重量壓頂落地，會回傳震波損血
        let shockDamage = boss.update(player, bossAttacks, particles);
        if(shockDamage > 0) damagePlayer(shockDamage);

        // 【優化後的自動攻擊】
        // 當手持「1 鍵盤」時，直接拿隱藏的 attackBox 去跟微軟巨鴨(boss)做標準的矩形碰撞檢測
        if (currentSlot === 1) {
            if (Tool.checkCollision(player.attackBox, boss)) {
                autoAttackTimer++;
                if (autoAttackTimer % 12 === 0) { // 每 12 幀穩定觸發一次鍵盤暴擊
                    damageBoss(85, "⌨️ 鍵盤瘋狂暴擊 🦆 綠頭鴨！");
                    Tool.createImpactEffect(particles, boss.x + 20, player.y + 20, "#1e4d2b"); // 微軟綠特效
                }
            } else { 
                autoAttackTimer = 0; 
            }
        }

        // 更新掉落補給與炸彈
        items.forEach((item, idx) => {
            item.vy += 0.2; item.y += item.vy;
            if (item.y >= 525) { item.y = 525; item.vy = 0; }
            if (Tool.checkCollision(player, item)) {
                if (item.type === "MEDKIT") {
                    player.hp = Math.min(player.maxHp, player.hp + 70);
                    Tool.showMsg("💚 吃了老乾媽醫療包，HP +70");
                } else {
                    Tool.showMsg("🚀 自動拾取炸彈！自動投向大鴨鴨！");
                    projectiles.push({ x: player.x, y: player.y, type: "AUTO_BOMB", width: 20, height: 20 });
                }
                items.splice(idx, 1);
            }
        });
    }
}
