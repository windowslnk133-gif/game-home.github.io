/**
 * Ohio Game 1 - 玩家核心邏輯類別 (Player Core Class)
 * 負責：玩家基本屬性設定、AABB預測碰撞與精確站立、跳高推力調整、隱藏自動攻擊 Hitbox 更新與渲染
 */

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

        // 隱藏的自動攻擊感應區塊 (Attack Hitbox) - 負責靠近微軟巨鴨時自動暴擊
        this.attackBox = {
            x: 0,
            y: 0,
            width: 160,  // 往身體前方延伸的感應長度
            height: 200  // 涵蓋跳躍與站立垂直高度的感應高度
        };
        
        // 【除錯開關】若想在測試時用肉眼在畫布上看到隱藏的感應範圍，可改為 true 
        this.showHitboxDebug = false; 
    }

    /**
     * 重置玩家狀態 (用於重新挑戰或開局)
     */
    reset() {
        this.x = 50;
        this.y = 450;
        this.vx = 0;
        this.vy = 0;
        this.hp = 100;
        this.grounded = false;
        this.hasKey = false;
    }

    /**
     * 每幀物理更新引擎 (每秒 60 次由 game.js 呼叫)
     * @param {Object} keys - 全局按鍵狀態 (包含鍵盤與手機虛擬鍵)
     * @param {Array} platforms - 全局關卡地形平台陣列
     */
    update(keys, platforms) {
        // 1. 左右水平移動控制 (支援鍵盤 A/D、方向鍵、以及手機虛擬鍵)
        if (keys["arrowleft"] || keys["a"]) {
            this.vx = -6;
        } else if (keys["arrowright"] || keys["d"]) {
            this.vx = 6;
        } else {
            this.vx = 0;
        }

        // 2. 完美高跳曲線 (精確微調初始向上推力為 -14.5)
        if ((keys["arrowup"] || keys["w"] || keys["space"]) && this.grounded) {
            this.vy = -14.5;
            this.grounded = false;
        }

        // 3. 應用重力加速度
        this.vy += 0.55;

        // 4. 水平 X 軸位移與世界邊界限制
        this.x += this.vx;
        if (this.x < 0) this.x = 0;
        if (this.x > 1000 - this.width) this.x = 1000 - this.width;

        // 5. 垂直 Y 軸位移
        this.y += this.vy;

        // 6. 專業 AABB 平台預測碰撞與精確回推判定 (解決滑落與卡進牆問題)
        this.grounded = false;
        if (platforms && platforms.length > 0) {
            platforms.forEach(p => {
                // 檢查玩家與平台是否有空間矩形交集
                if (this.x < p.x + p.width && this.x + this.width > p.x &&
                    this.y < p.y + p.height && this.y + this.height > p.y) {
                    
                    // 核心站立判定：由上往下落，且扣除移動向量後原本位於平台上方
                    if (this.vy >= 0 && (this.y + this.height - this.vy) <= p.y + 20) {
                        this.grounded = true;
                        this.vy = 0;
                        this.y = p.y - this.height; // 精確回推至平台頂端表面表面，防止陷落
                    }
                }
            });
        }

        // 7. 同步更新隱藏自動攻擊區塊的位置 (使其保持在玩家正前方，高度置中覆蓋)
        this.attackBox.x = this.x + this.width; 
        this.attackBox.y = this.y - (this.attackBox.height / 2) + (this.height / 2);
    }

    /**
     * 玩家圖形渲染引擎
     * @param {CanvasRenderingContext2D} ctx - 畫布上下文
     * @param {number} currentSlot - 目前選中的工具欄單格 (1, 2, 3)
     * @param {string} gameState - 全局遊戲狀態 (PARKOUR, BOSS)
     * @param {number} autoAttackTimer - 自動連擊計時器 (用於控制武器殘影)
     */
    draw(ctx, currentSlot, gameState, autoAttackTimer) {
        ctx.save();

        // 1. 【Debug 模式外觀】若開啟，畫出隱藏自動攻擊範圍的淡紅色半透明方塊
        if (gameState === "BOSS" && currentSlot === 1 && this.showHitboxDebug) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.15)";
            ctx.fillRect(this.attackBox.x, this.attackBox.y, this.attackBox.width, this.attackBox.height);
            ctx.strokeStyle = "rgba(255, 0, 0, 0.4)";
            ctx.lineWidth = 1;
            ctx.strokeRect(this.attackBox.x, this.attackBox.y, this.attackBox.width, this.attackBox.height);
        }

        // 2. 繪製玩家本體 (Ohio 科技青色)
        ctx.fillStyle = "#00ffcc";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 3. 繪製玩家黑眼睛
        ctx.fillStyle = "#000";
        ctx.fillRect(this.x + 18, this.y + 10, 6, 6);

        // 4. 繪製手上拿著的對應工具/武器外觀 (只在對戰 Boss 階段顯示)
        if (gameState === "BOSS") {
            ctx.shadowBlur = 4; // 給手上武器加一點發光感
            
            if (currentSlot === 1) {
                // 1 號：手持機械鍵盤 (白色長方塊加細節)
                ctx.shadowColor = "#ffffff";
                ctx.fillStyle = "#ffffff"; 
                ctx.fillRect(this.x + 22, this.y + 20, 24, 12);
                // 畫出細微鍵盤網格感
                ctx.fillStyle = "#e0e0e0";
                ctx.fillRect(this.x + 24, this.y + 22, 4, 8);
                ctx.fillRect(this.x + 30, this.y + 22, 4, 8);
                ctx.fillRect(this.x + 36, this.y + 22, 8, 8);
            } 
            else if (currentSlot === 2) {
                // 2 號：神聖手雷 (黃色發光球體)
                ctx.shadowColor = "#ffff00";
                ctx.fillStyle = "#ffff00"; 
                ctx.beginPath(); 
                ctx.arc(this.x + 26, this.y + 24, 6, 0, Math.PI * 2); 
                ctx.fill();
                // 手雷拉環
                ctx.strokeStyle = "#ffa500";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(this.x + 26, this.y + 17, 3, 0, Math.PI * 2);
                ctx.stroke();
            } 
            else if (currentSlot === 3) {
                // 3 號：防疫盾 (青色長盾牌外觀)
                ctx.shadowColor = "#00ffcc";
                ctx.fillStyle = "#00ffcc"; 
                ctx.fillRect(this.x + 22, this.y + 14, 8, 24);
                // 盾牌十字條紋
                ctx.fillStyle = "#050c0a";
                ctx.fillRect(this.x + 22, this.y + 24, 8, 3);
            }
        }

        ctx.restore();
    }
}
