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
                
                document.getElementById("boss-action").innerText = "⚠️ 鴨子重量壓頂落地！";
                Tool.createImpactEffect(particles, this.x, 550, "#ff00ff");
                
                // 重量壓頂傷害判斷：在地面近處會被震波重傷
                if (Math.abs(player.x - this.x) < 250 && player.y >= 450) {
                    return 35; // 傳回造成的傷害數值
                }
            }
        }

        // 隨機施放三大神技
        if (this.skillTimer <= 0) {
            this.skillTimer = 160 + Math.random() * 100;
            let rand = Math.random();

            if (rand < 0.33) {
                // 技能 1: 天上隕石
                document.getElementById("boss-action").innerText = "🔮 準備：大鴨鴨召喚隕石！";
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
                // 技能 2: 地上尖刺
                document.getElementById("boss-action").innerText = "🔥 警告：地面即將突起尖刺！快爬上平台！";
                bossAttacks.push({ type: "SPIKES", timer: 180 });
            } 
            else {
                // 技能 3: 重量壓頂跳起
                document.getElementById("boss-action").innerText = "🦘 準備：大鴨鴨使出重量壓頂！";
                this.state = "JUMPING";
                this.vy = -16;
            }
        }
        return 0; // 沒有造成震波傷害
    }

    draw(ctx) {
        // 黃色大身體
        ctx.fillStyle = "#ffcc00";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // 橘色大鴨嘴
        ctx.fillStyle = "#ff6600";
        ctx.fillRect(this.x - 30, this.y + 50, 40, 40);
        // 邪惡的黑白眼睛
        ctx.fillStyle = "#000";
        ctx.fillRect(this.x + 30, this.y + 30, 20, 20);
        ctx.fillStyle = "#fff";
        ctx.fillRect(this.x + 30, this.y + 30, 8, 8);

        ctx.fillStyle = "#fff";
        ctx.font = "bold 20px Arial";
        ctx.fillText("Ohio 巨鴨", this.x + 40, this.y - 10);
    }
}
