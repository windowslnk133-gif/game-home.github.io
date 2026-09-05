// 🎮 遊戲關卡完整資料庫
const GameStages = {
    currentStageIndex: 1, // 預設從第 1 關開始
    
    stages: {
        1: {
            id: 1,
            name: "第 1 關：尋找鑰匙",
            bgGradient: "linear-gradient(#221100, #4d2600)",
            objective: "任務：避開家人搜查，尋找大門鑰匙並成功逃脫！",
            playerHp: 100,
            enemyType: "family",
            config: {
                dadSpeed: 3,
                momSpeed: -4,
                keySpawnPoint: "sofa"
            }
        },
        2: {
            id: 2,
            name: "第 2 關：公路逃亡",
            bgGradient: "linear-gradient(#001122, #002b4d)",
            objective: "任務：躲避高速來向的大卡車，存活並持續前進！",
            playerHp: 120,
            enemyType: "trucks",
            config: {
                spawnInterval: 60,
                truckSpeed: 7
            }
        },
        3: {
            id: 3,
            name: "第 3 關：決戰黑心老闆",
            bgGradient: "linear-gradient(#110022, #2d004d)",
            objective: "任務：踩踏地面生成的炸彈(💣)，鎖定轟炸黑心老闆！",
            playerHp: 150,
            bossHp: 1200,
            enemyType: "boss",
            config: {
                bossAttackRate: 100,
                bombDamage: 120
            }
        }
    },

    // 取得當前關卡資料
    getCurrentStage: function() {
        return this.stages[this.currentStageIndex];
    },

    // 推進至下一關
    nextStage: function() {
        if (this.stages[this.currentStageIndex + 1]) {
            this.currentStageIndex++;
            return true;
        }
        return false; // 已通關最後一關
    },

    // 重設回第一關
    reset: function() {
        this.currentStageIndex = 1;
    }
};

// 🏆 排行榜模組 (localStorage)
const LeaderboardData = {
    storageKey: 'ohio2_local_leaderboard',

    get: function() {
        const data = localStorage.getItem(this.storageKey);
        if (!data) {
            return [
                { name: "快腿巨鴨", time: 18.5 },
                { name: "飛天鴨", time: 22.1 },
                { name: "烤鴨狂魔", time: 25.8 }
            ];
        }
        return JSON.parse(data);
    },

    add: function(playerName, timeInSeconds) {
        let list = this.get();
        list.push({ name: playerName, time: parseFloat(timeInSeconds.toFixed(1)) });
        list.sort((a, b) => a.time - b.time);
        list = list.slice(0, 5);
        localStorage.setItem(this.storageKey, JSON.stringify(list));
        return list;
    }
};

// 🔑 Google 登入驗證模組
const GoogleAuthModule = {
    currentUser: { isLoggedIn: false, name: "匿名巨鴨" },
    clientId: "25456804335-lcpbgbludrs2pq25h20pa8dusoabos3s.apps.googleusercontent.com",

    init: function(statusElementId, buttonElementId, onSuccessCallback) {
        if (typeof google === 'undefined') {
            setTimeout(() => this.init(statusElementId, buttonElementId, onSuccessCallback), 200);
            return;
        }

        google.accounts.id.initialize({
            client_id: this.clientId,
            callback: (response) => {
                this.handleCredentialResponse(response, statusElementId, buttonElementId, onSuccessCallback);
            }
        });

        google.accounts.id.renderButton(
            document.getElementById(buttonElementId),
            { theme: "dark", size: "medium", shape: "pill" }
        );
    },

    handleCredentialResponse: function(response, statusElementId, buttonElementId, onSuccessCallback) {
        try {
            const tokenParts = response.credential.split('.');
            const cleanPayload = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(decodeURIComponent(window.atob(cleanPayload).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));

            this.currentUser.isLoggedIn = true;
            this.currentUser.name = payload.name || "Google玩家";

            const statusEl = document.getElementById(statusElementId);
            const btnEl = document.getElementById(buttonElementId);
            if (statusEl) {
                statusEl.innerHTML = `🟢 驗證成功：<b>${this.currentUser.name}</b>`;
                statusEl.style.color = "#00ffcc";
            }
            if (btnEl) btnEl.style.display = 'none';

            if (typeof onSuccessCallback === 'function') onSuccessCallback(this.currentUser);
        } catch (err) {
            console.error("Google 驗證失敗:", err);
        }
    },

    getPlayerName: function() {
        return this.currentUser.name;
    }
};
