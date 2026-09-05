// 遊戲關卡與設定資料
const gameConfig = {
    stage1: {
        name: "第 1 關：尋找鑰匙",
        objective: "任務：點擊沙發/桌子/鞋子尋找鑰匙，避開家人並前往右側大門！",
        familySpeed: { dad: 3, mom: -4, dog: 5 }
    },
    stage2: {
        name: "第 2 關：公路逃亡",
        objective: "任務：躲避來向的大卡車，存活並前進！",
        spawnRate: 60,
        truckSpeed: 6
    },
    stage3: {
        name: "第 3 關：決戰黑心老闆",
        bossHp: 1200,
        bossAttackRate: 120,
        objective: "任務：踩地上生成的炸彈(💣)即可全自動鎖定轟炸！"
    }
};

// 排行榜工具（使用瀏覽器 localStorage）
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

// Google 登入驗證模組
const GoogleAuthModule = {
    currentUser: {
        isLoggedIn: false,
        name: "匿名巨鴨",
        email: "",
        picture: ""
    },
    
    // 請填入你的 Google Client ID (從 Google Cloud Console 取得)
    clientId: "25456804335-lcpbgbludrs2pq25h20pa8dusoabos3s.apps.googleusercontent.com",

    // 初始化 Google Sign-In SDK
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

    // 解析 JWT Token 回傳使用者資料
    handleCredentialResponse: function(response, statusElementId, buttonElementId, onSuccessCallback) {
        try {
            const tokenParts = response.credential.split('.');
            const cleanPayload = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(
                decodeURIComponent(window.atob(cleanPayload).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
            );

            this.currentUser.isLoggedIn = true;
            this.currentUser.name = payload.name || "Google玩家";
            this.currentUser.email = payload.email || "";
            this.currentUser.picture = payload.picture || "";

            const statusEl = document.getElementById(statusElementId);
            const btnEl = document.getElementById(buttonElementId);
            
            if (statusEl) {
                statusEl.innerHTML = `🟢 驗證成功：<b>${this.currentUser.name}</b>`;
                statusEl.style.color = "#00ffcc";
            }
            if (btnEl) btnEl.style.display = 'none';

            if (typeof onSuccessCallback === 'function') {
                onSuccessCallback(this.currentUser);
            }
        } catch (err) {
            console.error("Google Token 解析失敗:", err);
        }
    },

    // 取得當前玩家名稱
    getPlayerName: function() {
        return this.currentUser.name;
    }
};
