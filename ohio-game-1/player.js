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

        // 隱藏的自動攻擊感應區塊 (Attack Hitbox)
        this.attackBox = {
            x: 0,
            y: 0,
            width: 160,  
            height: 200  
        };
        this.showHitboxDebug = false; // 改成 true 即可在畫面上顯示淡紅色感應區塊
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

        // 【跳高一點點】將原本的 -12 微調到 -14.5，跳躍曲線更完美
        if ((keys["arrowup"] || keys["w"] || keys["space"]) && this.grounded) {
            this.vy = -14.5;
            this.grounded = false;
        }

        // 應用重力
        this.vy += 0.55;

        // 先進行 X 軸移動與碰撞防止
        this.x += this.vx;
        if (this.x < 0) this.x = 0;
        if (this.x > 1000 - this.width) this.x = 1000 - this.width;

        // 再進行 Y 軸移動
        this.y += this.vy;

        // 【專業碰撞修復】精確重置地面站立狀態
        this.grounded = false;

        platforms.forEach(p => {
            // 檢查玩家與平台是否有矩形重疊
            if (this.x < p.x + p.width && this.x + this.width > p.x &&
                this.y < p.y + p.height && this.y + this.height > p.y) {
                
                // 檢查是否是「由上往下落」踩在平台上 (最關鍵的站立判定)
                // 這裡加入了 vy 的移動補償與 20 像素的合理誤差容許範圍
                if (this.vy >= 0 && (this.y + this.height - this.vy) <= p.y + 20) {
                    this.grounded = true;
                    this.vy = 0;
                    this.y = p.y - this.height; // 精確回推到平台頂端表面，防止陷下去
                }
            }
        });

        // 同步更新隱藏自動攻擊區塊的位置（保持在玩家前方）
        this.attackBox.x = this.x + this.width; 
        this.attackBox.y = this.y - (this.attackBox.height / 2) + (this.height / 2);
    }

    draw(ctx, currentSlot, gameState, autoAttackTimer) {
        // 除錯用：畫出淡紅色的隱藏自動攻擊範圍
        if (gameState === "BOSS" && currentSlot === 1 && this.showHitboxDebug) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.15)";
            ctx.fillRect(this.attackBox.x, this.attackBox.y, this.attackBox.width, this.attackBox.height);
            ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
            ctx.lineWidth = 1;
            ctx.strokeRect(this.attackBox.x, this.attackBox.y, this.attackBox.width, this.attackBox.height);
        }

        // 畫玩家主體
        ctx.fillStyle = "#00ffcc";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 畫眼睛
        ctx.fillStyle = "#000";
        ctx.fillRect(this.x + 18, this.y + 10, 6, 6);

        // 畫手上拿著的武器或道具
        if (gameState === "BOSS") {
            if (currentSlot === 1) {
                ctx.fillStyle = "#ffffff"; 
                ctx.fillRect(this.x + 22, this.y + 20, 22, 12);
            } else if (currentSlot === 2) {
                ctx.fillStyle = "#ffff00"; 
                ctx.beginPath(); ctx.arc(this.x + 25, this.y + 25, 6, 0, Math.PI*2); ctx.fill();
            } else if (currentSlot === 3) {
                ctx.fillStyle = "#00ffcc"; 
                ctx.fillRect(this.x + 22, this.y + 15, 8, 20);
            }
        }
    }
}
