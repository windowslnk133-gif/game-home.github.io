// === 1. 補齊 OhioStagesManager (ohio-js2.js) ===
// 補上原本缺失的 updateStage2ProgressAndTrucks 函式，避免第 2 關執行時報錯[cite: 1]
OhioStagesManager.updateStage2ProgressAndTrucks = function() {
    // 留空或擴充公路特殊機制
};

// === 2. 完整整合與修復後的程式碼 ===
function gameLoop() {
    if (!isBlocked) playerX = nextX;
    if ((keys.w || keys.space) && isGrounded) { 
        playerVy = jumpForce; 
        isGrounded = false; 
    }
    
    playerVy -= gravity; 
    playerY += playerVy;
    
    if (playerY <= 0) { 
        playerY = 0; 
        playerVy = 0; 
        isGrounded = true; 
    }
    
    pEl.style.left = playerX + 'px'; 
    pEl.style.bottom = (40 + playerY) + 'px';

    // 關卡循環分流
    if (currentStage === 1) {
        // 呼叫家人隨機移動[cite: 1]
        OhioStagesManager.updateStage1Family(stageEl.clientWidth, familyVel);
        document.querySelectorAll('.family-member').forEach(m => { 
            if (GameTools.checkCollision(pEl, m)) takeDamage(15); 
        });
        if (window.hasKey && playerX >= stageEl.clientWidth - 90) setupStage2();

    } else if (currentStage === 2) {
        // 呼叫公路卡車跟前進進度[cite: 1]
        OhioStagesManager.updateStage2ProgressAndTrucks();
        stage2Progress += 0.2; 
        
        // 修正 Template Literals (補上反引號 `)
        objText.textContent = `公路逃亡進度: ${Math.floor(stage2Progress)}% | 躲避卡車(🚚)！`;
        
        if (stage2Progress >= 100) setupStage3();
        
        truckTimer++;
        if (truckTimer % stageConfigData.stage2.spawnRate === 0) {
            const t = document.createElement('div'); 
            t.classList.add('truck'); 
            t.textContent = '🚚';
            t.style.left = stageEl.clientWidth + 'px'; 
            document.getElementById('stage2-elements').appendChild(t);
        }
        
        document.querySelectorAll('.truck').forEach(t => {
            let tx = parseFloat(t.style.left) - stageConfigData.stage2.truckSpeed; 
            t.style.left = tx + 'px';
            if (GameTools.checkCollision(pEl, t)) { 
                takeDamage(25); 
                t.remove(); 
            }
            if (tx < -80) t.remove();
        });

    } else if (currentStage === 3) {
        bossActionTimer++;
        if (bossActionTimer >= stageConfigData.stage3.bossAttackRate) {
            bossActionTimer = 0;
            // 修正傳參方式，改以 Getter 函式傳遞 parameters[cite: 1]
            Math.random() > 0.5 
                ? OhioStagesManager.castKeyboardDash(stageEl.clientWidth) 
                : OhioStagesManager.castComputerSlam(
                    () => isPlayingG, 
                    () => playerX, 
                    () => playerY, 
                    takeDamage
                );
        }
        if (GameTools.checkCollision(pEl, document.getElementById('boss'))) takeDamage(10);
    }

    updateHpUI(); 
    animationId = requestAnimationFrame(gameLoop);
}

function takeDamage(amount) {
    if (isShieldActive) return; 
    playerHp = Math.max(0, playerHp - amount);
    GameTools.flashElement(pEl); 
    if (playerHp <= 0) gameOver();
}

function updateHpUI() {
    // 修正 Template Literals 語法[cite: 1]
    pHpBar.style.width = (playerHp / 120) * 100 + '%'; 
    pHpText.textContent = `${Math.floor(playerHp)} / 120`;
    bHpBar.style.width = (bossHp / 1200) * 100 + '%'; 
    bHpText.textContent = `${Math.floor(bossHp)} / 1200`;
}

// 排行榜 JSON
const JSONLeaderboard = {
    getScores: function() { 
        const data = localStorage.getItem('ohio2_scores_json'); 
        return data ? JSON.parse(data) : []; 
    },
    saveScore: function(name, seconds) {
        let scores = this.getScores(); 
        scores.push({ name: name, time: parseFloat(seconds.toFixed(1)) });
        scores.sort((a, b) => a.time - b.time); 
        scores = scores.slice(0, 5);
        localStorage.setItem('ohio2_scores_json', JSON.stringify(scores));
    },
    renderUI: function() {
        leaderboardList.innerHTML = ''; 
        const scores = this.getScores();
        if (scores.length === 0) { 
            leaderboardList.innerHTML = '目前暫無紀錄！'; 
            return; 
        }
        scores.forEach((entry, i) => {
            const li = document.createElement('li'); 
            // 修正 Template Literals 語法[cite: 1]
            li.innerHTML = `第 ${i + 1} 名: <b>${entry.name}</b> <span>⏱️ ${entry.time} 秒</span>`;
            leaderboardList.appendChild(li);
        });
    }
};

function gameOver() {
    isPlayingG = false; 
    cancelAnimationFrame(animationId); 
    GameTools.stopMusic();
    showOverlay("💀 巨鴨慘遭逮捕", "你沒能熬過加班的折磨...", "再次重來");
    JSONLeaderboard.renderUI(); 
    leaderboardArea.style.display = 'block';
}

function gameWin() {
    isPlayingG = false; 
    cancelAnimationFrame(animationId); 
    GameTools.stopMusic();
    let name = googlePlayerName;
    if (name === "匿名巨鴨") {
        // 修正 Template Literals 語法[cite: 1]
        let ask = prompt(`🎉 逆襲成功！你花了 ${totalElapsedSeconds.toFixed(1)} 秒！\n請輸入你的大名：`, "未登入巨鴨");
        if (ask && ask.trim() !== "") name = ask;
    }
    JSONLeaderboard.saveScore(name, totalElapsedSeconds);
    // 修正 Template Literals 語法[cite: 1]
    showOverlay("🏆 俄亥俄勞動節大勝利！", `總共耗時：${totalElapsedSeconds.toFixed(1)} 秒！`, "再玩一次");
    JSONLeaderboard.renderUI(); 
    leaderboardArea.style.display = 'block';
}

function showOverlay(title, desc, btnText) { 
    overlayTitle.textContent = title; 
    overlayDesc.textContent = desc; 
    overlayBtn.textContent = btnText; 
    overlay.style.display = 'flex'; 
}