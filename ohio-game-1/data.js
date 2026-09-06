// 全局資料儲存庫
const OhioData = {
    getLoginUser: function() {
        return localStorage.getItem("ohio_player_name") || "匿名特務";
    },
    setLoginUser: function(name) {
        localStorage.setItem("ohio_player_name", name);
    }
};

// Google 登入成功後的回呼函式 (Callback)
function handleCredentialResponse(response) {
    try {
        // 解析 JWT Token 取得使用者資訊
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const userData = JSON.parse(jsonPayload);
        
        // 自動儲存至本機
        OhioData.setLoginUser(userData.name);
        
        // 更新網頁 UI 顯示
        const welcomeText = document.getElementById("user-welcome");
        if (welcomeText) {
            welcomeText.innerText = `👋 歡迎回來，Ohio 強者：${userData.name}！數據載入成功。`;
        }
    } catch (error) {
        console.error("Google 登入資料解析失敗：", error);
    }
}

// 頁面載入時自動確認是否有儲存好的登入狀態
document.addEventListener("DOMContentLoaded", () => {
    const welcomeText = document.getElementById("user-welcome");
    const nameDisplay = document.getElementById("player-name");
    
    const storedName = localStorage.getItem("ohio_player_name");
    if (storedName) {
        if (welcomeText) welcomeText.innerText = `🟢 已自動載入 Google 特務資料：${storedName}`;
        if (nameDisplay) nameDisplay.innerText = storedName;
    }
});
