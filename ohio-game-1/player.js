class Player {
    constructor() {
        this.x = 50;
        this.y = 450;
        this.width = 30;
        this.height = 50;
        this.vx = 0;
        this.vy = 0;
        this.hp = 100;
        this.maxHp = 100;
        this.grounded = false;
        this.hasKey = false;

        // 【新增】隱藏的自動攻擊感應區塊 (Attack Hitbox)
        this.attackBox = {
            x: 0,
            y: 0,
            width: 160,  // 往前方延伸的感應距離
            height: 200  // 涵蓋跳躍與垂直高度的感應範圍
        };
        this.showHitboxDebug = false; // 如果想在畫面上看到這個隱藏區塊，可以改成 true
    }

    reset() {
        this.x = 50;
        this.y = 450;
        this.vx = 0;
        this.vy = 0;
        this.hp = 100;
        this.grounded = false;
        this.hasKey = false;
    }

    update(keys, platforms) {
        // 左右移動控制
        if (keys["arrowleft"] || keys["a"]) this.vx = -6;
        else if (keys["arrowright"] || keys["d"]) this.vx = 6;
        else this.vx = 0;

        // 跳躍
        if ((keys["arrowup"] || keys["w"] || keys["space"]) && this.grounded) {
            this.vy = -12;
            this.grounded = false;
        }

        // 重力與位移
        this.vy += 0.55;
        this.x += this.vx;
        this.y += this.vy;

        // 邊界限制
        if (this.x < 0) this.x = 0;
        if (this.x > 1000 - this.width) this.x = 1000 - this.width;

        // 更新隱藏攻擊區塊的位置：保持在玩家身體前方，且高度居中覆蓋
        this.attackBox.x = this.x + this.width; // 往右手邊延伸
        this.attackBox.y = this.y - (this.attackBox.height / 2) + (this.height / 2);

        // 平台碰撞檢測
        this.grounded = false;
        platforms.forEach(p => {
            if (this.x < p.x + p.width && this.x + this.width > p.x &&
                this.y + this.height > p.y && this.y + this.height - this.vy <= p.y + 15) {
                if (this.vy >= 0) {
                    this.grounded = true;
                    this.vy = 0;
                    this.y = p.y - this.height;
                }
            }
        });
    }

    draw(ctx, currentSlot, gameState, autoAttackTimer) {
        // 1. 【除錯用】如果開啟，會畫出淡紅色的隱藏自動攻擊範圍
        if (gameState === "BOSS" && currentSlot === 1 && this.showHitboxDebug) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.15)";
            ctx.fillRect(this.attackBox.x, this.attackBox.y, this.attackBox.width, this.attackBox.height);
            ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
            ctx.lineWidth = 1;
            ctx.strokeRect(this.attackBox.x, this.attackBox.y, this.attackBox.width, this.attackBox.height);
        }

        // 2. 畫玩家主體
        ctx.fillStyle = "#00ffcc";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 畫眼睛
        ctx.fillStyle = "#000";
        ctx.fillRect(this.x + 18, this.y + 10, 6, 6);

        // 3. 畫手上拿著的武器或道具
        if (gameState === "BOSS") {
            if (currentSlot === 1) {
                ctx.fillStyle = "#ffffff"; // 鍵盤
                ctx.fillRect(this.x + 22, this.y + 20, 22, 12);
            } else if (currentSlot === 2) {
                ctx.fillStyle = "#ffff00"; // 手雷
                ctx.beginPath(); ctx.arc(this.x + 25, this.y + 25, 6, 0, Math.PI*2); ctx.fill();
            } else if (currentSlot === 3) {
                ctx.fillStyle = "#00ffcc"; // 防疫盾
                ctx.fillRect(this.x + 22, this.y + 15, 8, 20);
            }
        }
    }
}
