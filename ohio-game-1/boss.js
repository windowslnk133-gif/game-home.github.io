// boss.js ─ 專管 Boss 技能大腦
const BossSkills = {
    announcement: document.getElementById('skill-announcement'),
    spikeInd: document.getElementById('spike-indicator'),
    slamInd: document.getElementById('slam-indicator'),
    meteorInd: document.getElementById('meteor-indicator'),
    spikeEff: document.getElementById('spike-effect'),
    meteorEff: document.getElementById('meteor-effect'),
    bossEl: document.getElementById('boss'),
    stage: document.getElementById('game-stage'),

    announce: function(text) {
        this.announcement.textContent = text;
        this.announcement.style.display = 'block';
        setTimeout(() => this.announcement.style.display = 'none', 1000);
    },

    hideAll: function() {
        this.spikeInd.style.display = 'none'; this.slamInd.style.display = 'none'; this.meteorInd.style.display = 'none';
        this.spikeEff.style.display = 'none'; this.meteorEff.style.display = 'none'; this.announcement.style.display = 'none';
    },

    // 招式 1：地上尖刺
    castSpikes: function(getState, takeDamage, onComplete) {
        this.announce("🚨 地上尖刺 🚨");
        this.spikeInd.style.width = '100%'; this.spikeInd.style.height = '40px'; this.spikeInd.style.bottom = '40px'; this.spikeInd.style.left = '0';
        this.spikeInd.style.display = 'block';

        setTimeout(() => {
            if (!getState().isPlaying) return;
            this.spikeInd.style.display = 'none';
            this.spikeEff.style.width = '100%'; this.spikeEff.style.bottom = '40px'; this.spikeEff.style.left = '0';
            this.spikeEff.style.display = 'block';

            if (getState().playerY < 30) takeDamage(22);

            setTimeout(() => { this.spikeEff.style.display = 'none'; onComplete(); }, 600);
        }, 1200);
    },

    // 招式 2：重量壓頂
    castSlam: function(getState, takeDamage, onComplete) {
        this.announce("💥 重量壓頂 💥");
        const stageWidth = this.stage.clientWidth;
        this.slamInd.style.width = '300px'; this.slamInd.style.height = '150px'; this.slamInd.style.bottom = '40px'; this.slamInd.style.right = '40px';
        this.slamInd.style.display = 'block';

        setTimeout(() => {
            if (!getState().isPlaying) return;
            this.slamInd.style.display = 'none';
            this.bossEl.style.transform = 'scale(1.2) translateY(-20px)';
            
            if (getState().playerX > (stageWidth - 340)) takeDamage(32);

            setTimeout(() => { this.bossEl.style.transform = 'scale(1)'; onComplete(); }, 500);
        }, 1200);
    },

    // 招式 3：天上隕石
    castMeteor: function(getState, takeDamage, onComplete) {
        this.announce("☄️ 俄亥俄極限隕石 ☄️");
        const stageWidth = this.stage.clientWidth;
        let safeX = Math.random() * (stageWidth - 200);

        this.meteorInd.style.width = '100%'; this.meteorInd.style.height = '100%'; this.meteorInd.style.top = '0'; this.meteorInd.style.left = '0';
        this.meteorInd.style.background = `linear-gradient(to right, rgba(255,0,0,0.5) 0%, rgba(255,0,0,0.5) ${(safeX/stageWidth*100)}%, rgba(0,0,0,0) ${(safeX/stageWidth*100)}%, rgba(0,0,0,0) ${((safeX+120)/stageWidth*100)}%, rgba(255,0,0,0.5) ${((safeX+120)/stageWidth*100)}%)`;
        this.meteorInd.style.display = 'block';

        setTimeout(() => {
            if (!getState().isPlaying) return;
            this.meteorInd.style.display = 'none';
            this.meteorInd.style.background = 'rgba(255, 0, 0, 0.4)';

            this.meteorEff.style.top = '0'; this.meteorEff.style.left = '0'; this.meteorEff.style.width = '100%'; this.meteorEff.style.height = '100%';
            this.meteorEff.style.display = 'flex';

            if (getState().playerX < safeX || getState().playerX > (safeX + 80)) takeDamage(78);

            setTimeout(() => { this.meteorEff.style.display = 'none'; onComplete(); }, 600);
        }, 1800);
    }
};
