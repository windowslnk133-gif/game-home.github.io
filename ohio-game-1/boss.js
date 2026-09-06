class Boss {
    constructor() {
        this.x = 750;
        this.y = 250;
        this.width = 180;
        this.height = 300;
        this.hp = 23500;
        this.maxHp = 23500;
        this.state = "IDLE"; // IDLE, JUMPING, FALLING
        this.vy = 0;
        this.skillTimer = 100;
    }

    update(player, bossAttacks, particles) {
        this.skillTimer--;

        // 處理重量壓頂的跳躍與落地
        if (this.state === "JUMPING" || this.state === "FALLING") {
            this.vy += 0.6;
            this.y += this.vy;
            if (this.y >= 250) {
                this.y = 250;
                this.state = "IDLE";
                this.vy = 0;
                
                document.getElementById("boss-action").innerText = "⚠️ 微軟大鴨重量壓頂落地！";
                Tool.createImpactEffect(particles, this.x + this.width/2, 550, "#3a7d44"); // 改為綠色衝擊波
                
                if (Math.abs(player.x - this.x) < 250 && player.y >= 450) {
                    return 35; 
                }
            }
        }

        // 隨機施放神技
        if (this.skillTimer <= 0) {
            this.skillTimer = 160 + Math.random() * 100;
            let rand = Math.random();

            if (rand < 0.33) {
                document.getElementById("boss-action").innerText = "🔮 準備：微軟巨鴨召喚隕石！";
                for(let i=0; i<3; i++) {
                    bossAttacks.push({
                        type: "METEOR",
                        x: 100 + Math.random() * 600,
                        y: 0,
                        timer: 85,
                        width: 60
                    });
                }
            } 
            else if (rand < 0.66) {
                document.getElementById("boss-action").innerText = "🔥 警告：地面即將突起尖刺！快爬上平台！";
                bossAttacks.push({ type: "SPIKES", timer: 180 });
            } 
            else {
                document.getElementById("boss-action").innerText = "🦘 準備：微軟巨鴨使出重量壓頂！";
                this.state = "JUMPING";
                this.vy = -16;
            }
        }
        return 0; 
    }

    draw(ctx) {
        ctx.save();
        
        // 1. 灰色主身體 (微軟 🦆 下半身)
        ctx.fillStyle = "#a1a1a1";
        ctx.fillRect(this.x + 20, this.y + 120, this.width - 20, this.height - 120);

        // 2. 棕色胸膛 (微軟 🦆 特色)
        ctx.fillStyle = "#8a5a36";
        ctx.fillRect(this.x, this.y + 120, 40, this.height - 120);

        // 3. 微軟經典：深綠色大鴨頭 (微軟 3D Fluent 標誌性綠頭)
        ctx.fillStyle = "#1e4d2b";
        ctx.fillRect(this.x - 10, this.y, this.width - 40, 120);

        // 4. 白色頸環
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(this.x - 10, this.y + 112, this.width - 40, 8);

        // 5. 亮橘黃色大鴨嘴
        ctx.fillStyle = "#ffaa00";
        ctx.fillRect(this.x - 60, this.y + 45, 50, 40);

        // 6. 微軟風格大黑眼
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(this.x + 40, this.y + 25, 25, 25);
        ctx.fillStyle = "#000000";
        ctx.fillRect(this.x + 45, this.y + 30, 15, 15);

        // 7. 橘色腳掌
        ctx.fillStyle = "#ff6600";
        ctx.fillRect(this.x + 40, this.y + this.height, 40, 10);
        ctx.fillRect(this.x + 110, this.y + this.height, 40, 10);

        // 頂部標籤
        ctx.fillStyle = "#fff";
        ctx.font = "bold 20px Arial";
        ctx.fillText("Microsoft 巨鴨 🦆", this.x + 10, this.y - 15);
        
        ctx.restore();
    }
}
