// tool.js ─ 負責本機 MP3 音效工具與基礎公用方法

// 建立 HTML5 原生音訊物件，指向你資料夾底下的 boss_musin.mp3
const localBGM = new Audio('./boss_musin.mp3');
localBGM.loop = true;      // 設為循環播放
localBGM.volume = 0.3;     // 設定背景音樂音量 (30%)

let sfxPlayer;
// 保留 sfxPlayer 給櫻桃手雷的哈利路亞音效 (維持 YouTube 確保音效檔不用另外下載)
window.onYouTubeIframeAPIReady = function() {
    sfxPlayer = new YT.Player('sfx-player', {
        height: '1', width: '1', videoId: '78T0coZ-b68',
        events: { 'onReady': (e) => e.target.setVolume(80) }
    });
};

// 封裝全域音效與視覺控制工具
const GameTools = {
    playBGM: function() {
        // 原生音訊需要使用者互動後才能播放，initGame 呼叫時已符合條件
        localBGM.play().catch(err => console.log("音樂播放被瀏覽器攔截，請確保有先點擊按鈕:", err));
    },
    stopBGM: function() {
        localBGM.pause();
        localBGM.currentTime = 0; // 重設時間軸回開頭
    },
    playGrenadeSFX: function() {
        if (sfxPlayer && sfxPlayer.seekTo && sfxPlayer.playVideo) {
            sfxPlayer.seekTo(0); sfxPlayer.playVideo();
        }
    },
    // 受傷畫面閃爍工具
    flashElement: function(el) {
        el.style.opacity = '0.3';
        setTimeout(() => el.style.opacity = '1', 150);
    }
};
